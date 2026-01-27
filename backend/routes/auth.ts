import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { client } from '../src/db/index.js';
import crypto from 'crypto';

const router = express.Router();


// Rota de login
router.post('/login', [
    body('matricula').notEmpty().withMessage('Matrícula é obrigatória'),
    body('senha').notEmpty().withMessage('Senha é obrigatória')
], async (req: any, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: errors.array() 
            });
        }

        const { matricula, senha } = req.body;

        // Buscar usuário no banco
        const user = client.prepare(`
            SELECT id, matricula, email, senha, nome, setor, cargo, tipo 
            FROM usuarios 
            WHERE matricula = ?
        `).get(matricula);

        if (!user) {
            return res.status(401).json({ error: 'Matrícula ou senha incorretos' });
        }

        // Verificar senha (compatível com hash SHA256 atual e bcrypt futuro)
        let senhaValida = false;
        
        const hashSha256 = crypto.createHash('sha256').update(senha).digest('hex');
        senhaValida = user.senha === hashSha256;

        // Se não funcionar com SHA256, tentar bcrypt (para senhas futuras)
        if (!senhaValida && user.senha.startsWith('$2')) {
            senhaValida = await bcrypt.compare(senha, user.senha);
        }

        if (!senhaValida) {
            return res.status(401).json({ error: 'Matrícula ou senha incorretos' });
        }

        // Gerar token JWT
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET não configurado no backend!');
        }

        const token = jwt.sign(
            { 
                userId: user.id,
                matricula: user.matricula,
                tipo: user.tipo
            },
            secret,
            { expiresIn: '24h' }
        );

        // Remover senha do objeto de resposta
        const { senha: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para verificar token e obter dados do usuário atual
router.get('/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const secret = process.env.JWT_SECRET || 'default_fallback_inseguro'; // Fallback para dev (não deve acontecer se .env carregar)

    jwt.verify(token, secret, async (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        try {
            const user = client.prepare(`
                SELECT id, matricula, email, nome, setor, cargo, tipo 
                FROM usuarios 
                WHERE id = ?
            `).get(decoded.userId);

            if (!user) {
                return res.status(403).json({ error: 'Usuário não encontrado' });
            }

            res.json({ user });
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });
});

export default router;
