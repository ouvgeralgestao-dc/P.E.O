import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as sandboxController from '../controllers/sandboxController.js';

const router = Router();

// Todas as rotas protegidas por autenticação
router.use(authenticateToken);

// ========================================
// GERENCIAMENTO DE ÓRGÃOS SANDBOX
// ========================================

// Listar órgãos sandbox do usuário
router.get('/orgaos', sandboxController.listSandboxOrgaos);

// Criar novo órgão sandbox
router.post('/orgaos', sandboxController.createSandboxOrgao);

// Deletar órgão sandbox
router.delete('/orgaos/:id', sandboxController.deleteSandboxOrgao);

// ========================================
// ORGANOGRAMA ESTRUTURAL SANDBOX
// ========================================

// Buscar organograma estrutural sandbox
router.get('/estrutural/:orgaoId', sandboxController.getSandboxEstrutural);

// Salvar organograma estrutural sandbox
router.post('/estrutural/:orgaoId', sandboxController.saveSandboxEstrutural);

// ========================================
// ORGANOGRAMA FUNCIONAL SANDBOX
// ========================================

// Buscar organograma funcional sandbox
router.get('/funcional/:orgaoId', sandboxController.getSandboxFuncional);

// Salvar organograma funcional sandbox
router.post('/funcional/:orgaoId', sandboxController.saveSandboxFuncional);

// ========================================
// POSIÇÕES CUSTOMIZADAS
// ========================================

// Salvar posições customizadas
router.post('/positions/:orgaoId', sandboxController.saveSandboxPositions);

export default router;
