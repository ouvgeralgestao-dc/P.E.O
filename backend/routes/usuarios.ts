import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { client } from '../src/db/index.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Listar todos os usuários (apenas admin)
router.get('/', requireAdmin, (req: AuthRequest, res) => {
    try {
        const usuarios = client.prepare(`
            SELECT id, matricula, email, setor, cargo, tipo, created_at, updated_at
            FROM usuarios
            ORDER BY created_at DESC
        `).all();

        res.json({ usuarios });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter usuário por ID
router.get('/:id', (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = Number(req.params.id);

        // Usuários só podem ver seus próprios dados, admins podem ver qualquer um
        if (req.user!.tipo !== 'admin' && req.user!.id !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const usuario = client.prepare(`
            SELECT id, matricula, email, setor, cargo, tipo, created_at, updated_at
            FROM usuarios
            WHERE id = ?
        `).get(userId);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ usuario });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar novo usuário (apenas admin)
router.post('/', requireAdmin, [
    body('matricula').notEmpty().withMessage('Matrícula é obrigatória'),
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('setor').notEmpty().withMessage('Setor é obrigatório'),
    body('cargo').notEmpty().withMessage('Cargo é obrigatório'),
    body('tipo').isIn(['admin', 'user']).withMessage('Tipo deve ser admin ou user')
], async (req: AuthRequest, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: errors.array() 
            });
        }

        const { matricula, email, senha, setor, cargo, tipo } = req.body;

        // Verificar se matrícula ou email já existem
        const existingUser = client.prepare(`
            SELECT id FROM usuarios WHERE matricula = ? OR email = ?
        `).get(matricula, email);

        if (existingUser) {
            return res.status(400).json({ 
                error: 'Matrícula ou email já cadastrados' 
            });
        }

        // Hash da senha com bcrypt
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const result = client.prepare(`
            INSERT INTO usuarios (matricula, email, senha, setor, cargo, tipo)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(matricula, email, senhaHash, setor, cargo, tipo);

        const newUser = client.prepare(`
            SELECT id, matricula, email, setor, cargo, tipo, created_at, updated_at
            FROM usuarios
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({ 
            message: 'Usuário criado com sucesso',
            usuario: newUser 
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar usuário
router.put('/:id', [
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('senha').optional().isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('setor').optional().notEmpty().withMessage('Setor não pode ser vazio'),
    body('cargo').optional().notEmpty().withMessage('Cargo não pode ser vazio'),
    body('tipo').optional().isIn(['admin', 'user']).withMessage('Tipo deve ser admin ou user')
], async (req: AuthRequest, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: errors.array() 
            });
        }

        const { id } = req.params;
        const userId = Number(req.params.id);
        const { email, senha, setor, cargo, tipo } = req.body;

        // Verificar permissões
        if (req.user!.tipo !== 'admin' && req.user!.id !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Usuários comuns não podem alterar próprio tipo
        if (req.user!.tipo !== 'admin' && tipo && tipo !== req.user!.tipo) {
            return res.status(403).json({ error: 'Você não pode alterar seu próprio tipo de usuário' });
        }

        // Verificar se usuário existe
        const existingUser = client.prepare(`
            SELECT id FROM usuarios WHERE id = ?
        `).get(userId);

        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar duplicidade de email (se estiver alterando)
        if (email) {
            const emailCheck = client.prepare(`
                SELECT id FROM usuarios WHERE email = ? AND id != ?
            `).get(email, userId);

            if (emailCheck) {
                return res.status(400).json({ error: 'Email já está em uso por outro usuário' });
            }
        }

        // Construir query dinâmica
        const updates = [];
        const values = [];

        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (senha !== undefined) {
            const saltRounds = 10;
            const senhaHash = await bcrypt.hash(senha, saltRounds);
            updates.push('senha = ?');
            values.push(senhaHash);
        }
        if (setor !== undefined) {
            updates.push('setor = ?');
            values.push(setor);
        }
        if (cargo !== undefined) {
            updates.push('cargo = ?');
            values.push(cargo);
        }
        if (tipo !== undefined && req.user!.tipo === 'admin') {
            updates.push('tipo = ?');
            values.push(tipo);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
        client.prepare(sql).run(...values);

        const updatedUser = client.prepare(`
            SELECT id, matricula, email, setor, cargo, tipo, created_at, updated_at
            FROM usuarios
            WHERE id = ?
        `).get(userId);

        res.json({ 
            message: 'Usuário atualizado com sucesso',
            usuario: updatedUser 
        });

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Excluir usuário (apenas admin)
router.delete('/:id', requireAdmin, (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = Number(req.params.id);

        // Impedir autoexclusão
        if (req.user!.id === userId) {
            return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
        }

        // Verificar se usuário existe
        const existingUser = client.prepare(`
            SELECT id FROM usuarios WHERE id = ?
        `).get(userId);

        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        client.prepare('DELETE FROM usuarios WHERE id = ?').run(userId);

        res.json({ message: 'Usuário excluído com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
