import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as sandboxController from '../controllers/sandboxController.js';

const router = Router();

// Todas as rotas protegidas por autenticação
router.use(authenticateToken);

// ========================================
// LISTAGEM
// ========================================
router.get('/list', sandboxController.listSandboxes);

// ========================================
// ORGANOGRAMA ESTRUTURAL SANDBOX
// ========================================

// Buscar organograma estrutural sandbox
router.get('/estrutural/:orgaoId', sandboxController.getSandboxEstrutural);

// Salvar organograma estrutural sandbox
router.post('/estrutural/:orgaoId', sandboxController.saveSandboxEstrutural);

// Deletar organograma estrutural sandbox
router.delete('/estrutural/:orgaoId', sandboxController.deleteSandboxEstrutural);

// ========================================
// ORGANOGRAMA FUNCIONAL SANDBOX
// ========================================

// Buscar organograma funcional sandbox
router.get('/funcional/:orgaoId', sandboxController.getSandboxFuncional);

// Salvar organograma funcional sandbox
router.post('/funcional/:orgaoId', sandboxController.saveSandboxFuncional);

// Deletar organograma funcional sandbox
router.delete('/funcional/:orgaoId', sandboxController.deleteSandboxFuncional);

// ========================================
// POSIÇÕES CUSTOMIZADAS
// ========================================

// Salvar posições customizadas
router.post('/positions/:orgaoId', sandboxController.saveSandboxPositions);

export default router;
