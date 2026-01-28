import express from 'express';
import * as sandboxController from '../controllers/sandboxController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// CRUD de Projetos
router.get('/', sandboxController.listProjects);
router.post('/', sandboxController.createProject);
router.get('/:id', sandboxController.getProject);
router.put('/:id', sandboxController.updateProject);
router.delete('/:id', sandboxController.deleteProject);

// Sincronização de Itens (Save Canvas)
router.post('/:id/items', sandboxController.syncItems);

export default router;
