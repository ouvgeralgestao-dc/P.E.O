/**
 * Rotas de Órgãos
 */
import express from 'express';
import {
    getAllOrgaos,
    createOrgao,
    updateOrgao,
    deleteOrgao
} from '../controllers/orgaosController.js';
import { authenticateToken, requireAdmin, checkSectorAccess } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/orgaos - Listar todos os órgãos
// Admins veem todos, usuários comuns veem apenas do seu setor
router.get('/', getAllOrgaos);

// POST /api/orgaos - Criar novo órgão (apenas admin)
router.post('/', requireAdmin, createOrgao);

// PUT /api/orgaos/:id - Atualizar órgão (apenas admin)
router.put('/:id', requireAdmin, updateOrgao);

// DELETE /api/orgaos/:id - Deletar órgão (apenas admin)
router.delete('/:id', requireAdmin, deleteOrgao);

export default router;
