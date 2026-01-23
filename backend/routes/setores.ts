import express from 'express';
import * as setoresController from '../controllers/setoresController.js';
import { authenticateToken, requireAdmin, checkSectorAccess } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/setores - Listar todos os setores
router.get('/', setoresController.listSetores);
router.put('/', requireAdmin, setoresController.updateSetor);
router.delete('/:name', requireAdmin, setoresController.deleteSetor);

// Configuração (Dicionário de Setores) - apenas admins podem modificar
router.get('/config', checkSectorAccess, setoresController.listConfig);
router.post('/config', requireAdmin, setoresController.upsertConfig);
router.put('/config/:id', requireAdmin, setoresController.upsertConfig);
router.delete('/config/:id', requireAdmin, setoresController.deleteConfig);

export default router;
