import express from 'express';
import * as setoresController from '../controllers/setoresController.js';
import { authenticateToken, requireAdmin, checkSectorAccess } from '../middleware/auth.js';

const router = express.Router();

// Rota de configuração (Dicionário de Setores) - GET Público para permitir carregamento na tela de aprovação
// Sem checkSectorAccess aqui pois não há perigo em ver os nomes das categorias
router.get('/config', setoresController.listConfig);

// Middleware de autenticação para todas as outras rotas
router.use(authenticateToken);

// GET /api/setores - Listar todos os setores (Exige login)
router.get('/', setoresController.listSetores);
router.put('/', requireAdmin, setoresController.updateSetor);
router.delete('/:name', requireAdmin, setoresController.deleteSetor);

// Configuração (Dicionário de Setores) - apenas admins podem modificar
router.post('/config', requireAdmin, setoresController.upsertConfig);
router.put('/config/:id', requireAdmin, setoresController.upsertConfig);
router.delete('/config/:id', requireAdmin, setoresController.deleteConfig);

export default router;
