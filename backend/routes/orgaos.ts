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

const router = express.Router();

// GET /api/orgaos - Listar todos os órgãos
router.get('/', getAllOrgaos);

// POST /api/orgaos - Criar novo órgão
router.post('/', createOrgao);

// PUT /api/orgaos/:id - Atualizar órgão
router.put('/:id', updateOrgao);

// DELETE /api/orgaos/:id - Deletar órgão
router.delete('/:id', deleteOrgao);

export default router;
