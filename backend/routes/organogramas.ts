import express from 'express';
import * as organogramaController from '../controllers/organogramaController.js';
import {
    validateOrganogramaEstrutural,
    validateUpdateOrganogramaEstrutural,
    validateOrganogramaFuncoes,
    validateUpdateOrganogramaFuncoes
} from '../middleware/validator.js';
import { authenticateToken, requireAdmin, checkSectorAccess } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Rotas especiais devem vir ANTES das rotas com parâmetros dinâmicos
router.get('/geral', organogramaController.getOrganogramaGeral);
router.post('/geral-funcional/ocupantes', requireAdmin, organogramaController.updateGeneralFuncionalOccupants);
router.get('/geral-funcional', organogramaController.getOrganogramaGeralFuncional);

// Listar todos os organogramas
router.get('/', organogramaController.getAllOrganogramas);

// Buscar organograma por nome do órgão (ATENÇÃO: deve vir DEPOIS das rotas estáticas)
router.get('/:nomeOrgao', organogramaController.getOrganogramaByName);

// Criar organograma estrutural (usuários autenticados podem criar para seu setor)
router.post('/estrutural', validateOrganogramaEstrutural, organogramaController.createOrganogramaEstrutural);

// Criar organograma de funções (usuários autenticados podem criar para seu setor)
router.post('/funcoes', validateOrganogramaFuncoes, organogramaController.createOrganogramaFuncoes);

// Editar organograma estrutural (apenas admin)
router.put('/:nomeOrgao/estrutura', requireAdmin, validateUpdateOrganogramaEstrutural, organogramaController.updateOrganogramaEstrutural);

// Editar organograma de funções (apenas admin)
router.put('/:nomeOrgao/funcoes', requireAdmin, validateUpdateOrganogramaFuncoes, organogramaController.updateOrganogramaFuncoes);

// Deletar organograma ESTRUTURAL (deleta estrutural + funcional, mantém órgão na config)
router.delete('/:nomeOrgao/estrutura', requireAdmin, organogramaController.deleteOrganogramaEstrutural);

// Deletar organograma FUNCIONAL (só deleta funcional, mantém estrutural e config)
router.delete('/:nomeOrgao/funcoes', requireAdmin, organogramaController.deleteOrganogramaFuncional);

// Deletar organograma (rota legada - mesmo comportamento que estrutural)
router.delete('/:nomeOrgao', requireAdmin, organogramaController.deleteOrganograma);

// Salvar posições customizadas (apenas admin)
router.post('/:organogramaId/positions', requireAdmin, organogramaController.saveCustomPositions);

// Deletar posições customizadas (apenas admin)
router.delete('/:organogramaId/positions', requireAdmin, organogramaController.deleteCustomPositions);

export default router;
