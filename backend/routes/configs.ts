import express from 'express';
import * as configsController from '../controllers/configsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rotas de Tipos de Cargo
// GET /api/configs/cargos -> Lista todos
router.get('/cargos', authenticateToken, configsController.getTiposCargo);

// POST /api/configs/cargos -> Cria novo (Admin Only)
router.post('/cargos', authenticateToken, requireAdmin, configsController.createTipoCargo);

// PUT /api/configs/cargos/:id -> Atualiza (Admin Only)
router.put('/cargos/:id', authenticateToken, requireAdmin, configsController.updateTipoCargo);

// DELETE /api/configs/cargos/:id -> Deleta (Admin Only)
router.delete('/cargos/:id', authenticateToken, requireAdmin, configsController.deleteTipoCargo);

export default router;
