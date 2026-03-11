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
            SELECT u.id, u.matricula, u.email, u.setor, u.cargo, u.tipo, u.created_at, u.updated_at,
                   u.nome, u.ativo, u.orgao_id, o.nome as orgao_nome
            FROM usuarios u
            LEFT JOIN orgaos o ON u.orgao_id = o.id
            ORDER BY u.nome ASC
        `).all();

        res.json({ usuarios });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ... (GET by ID mantido ou atualizado se precisar, mas o foco é listagem)

// Criar novo usuário (apenas admin)
router.post('/', [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('matricula').notEmpty().withMessage('Matrícula é obrigatória'),
    body('orgao_id').notEmpty().withMessage('Órgão é obrigatório'),
    body('tipo').optional().isIn(['admin', 'user']),
    body('setor').optional(),
    body('cargo').optional()
], async (req: AuthRequest, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nome, email, senha, matricula, orgao_id, tipo, setor, cargo } = req.body;

        // Verificar duplicidade
        const existing = client.prepare('SELECT id FROM usuarios WHERE email = ? OR matricula = ?').get(email, matricula);
        if (existing) {
            return res.status(400).json({ error: 'Email ou matrícula já cadastrados' });
        }

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const result = client.prepare(`
            INSERT INTO usuarios (nome, email, senha, matricula, orgao_id, tipo, setor, cargo, ativo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(nome, email, senhaHash, matricula, orgao_id, tipo || 'user', setor || '', cargo || '');

        res.status(201).json({ 
            message: 'Usuário criado com sucesso', 
            id: result.lastInsertRowid 
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
    body('nome').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('orgao_id').optional().notEmpty().withMessage('Órgão é obrigatório'),
    body('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano'),
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
        const { email, senha, setor, cargo, tipo, nome, orgao_id, ativo } = req.body;

        // Verificar permissões
        if (req.user!.tipo !== 'admin' && req.user!.id !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Usuários comuns não podem alterar próprio tipo ou status ativo
        if (req.user!.tipo !== 'admin') {
            if (tipo && tipo !== req.user!.tipo) return res.status(403).json({ error: 'Você não pode alterar seu próprio tipo' });
            if (ativo !== undefined) return res.status(403).json({ error: 'Você não pode alterar seu próprio status' });
        }

        // Verificar se usuário existe
        const existingUser = client.prepare(`
            SELECT id FROM usuarios WHERE id = ?
        `).get(userId);

        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar duplicidade de email
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

        if (email !== undefined) { updates.push('email = ?'); values.push(email); }
        if (nome !== undefined) { updates.push('nome = ?'); values.push(nome); }
        if (setor !== undefined) { updates.push('setor = ?'); values.push(setor); }
        if (cargo !== undefined) { updates.push('cargo = ?'); values.push(cargo); }
        if (orgao_id !== undefined) { updates.push('orgao_id = ?'); values.push(orgao_id); }
        if (ativo !== undefined) { updates.push('ativo = ?'); values.push(ativo ? 1 : 0); }
        
        if (senha !== undefined) {
            const saltRounds = 10;
            const senhaHash = await bcrypt.hash(senha, saltRounds);
            updates.push('senha = ?');
            values.push(senhaHash);
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
            SELECT id, matricula, email, setor, cargo, tipo, nome, ativo, orgao_id, created_at, updated_at
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
