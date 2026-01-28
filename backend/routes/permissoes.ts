import express from 'express';
import { client } from '../src/db/index.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação
router.use(authenticateToken);

// Consultar minhas próprias permissões (qualquer usuário autenticado)
router.get('/me', (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const permissoes = client.prepare(`
            SELECT modulo, permitido
            FROM permissoes_usuario
            WHERE user_id = ?
        `).all(userId);

        res.json({ permissoes });
    } catch (error) {
        console.error('Erro ao buscar minhas permissões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar permissões de um usuário (apenas admin)
router.get('/:userId', requireAdmin, (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;

        const permissoes = client.prepare(`
            SELECT modulo, permitido
            FROM permissoes_usuario
            WHERE user_id = ?
        `).all(userId);

        res.json({ permissoes });
    } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar permissões de um usuário (apenas admin)
router.put('/:userId', requireAdmin, (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const { permissoes } = req.body; // Array de {modulo, permitido}

        // Verificar se usuário existe e não é admin
        const user = client.prepare('SELECT id, tipo FROM usuarios WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        if ((user as any).tipo === 'admin') {
            return res.status(400).json({ error: 'Não é possível configurar permissões para administradores' });
        }

        // Atualizar permissões
        const stmt = client.prepare(`
            INSERT INTO permissoes_usuario (user_id, modulo, permitido, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, modulo) 
            DO UPDATE SET permitido = excluded.permitido, updated_at = CURRENT_TIMESTAMP
        `);

        const transaction = client.transaction((perms: any[]) => {
            for (const perm of perms) {
                stmt.run(userId, perm.modulo, perm.permitido ? 1 : 0);
            }
        });

        transaction(permissoes);

        res.json({ message: 'Permissões atualizadas com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar permissões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
