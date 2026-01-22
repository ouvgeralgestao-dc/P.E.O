import express from 'express';
import * as organogramaController from '../controllers/organogramaController.js';
import {
    validateOrganogramaEstrutural,
    validateUpdateOrganogramaEstrutural,
    validateOrganogramaFuncoes,
    validateUpdateOrganogramaFuncoes
} from '../middleware/validator.js';

const router = express.Router();

// Rotas especiais devem vir ANTES das rotas com parâmetros dinâmicos
router.get('/geral', organogramaController.getOrganogramaGeral);
router.post('/geral-funcional/ocupantes', organogramaController.updateGeneralFuncionalOccupants);
router.get('/geral-funcional', organogramaController.getOrganogramaGeralFuncional);

// Listar todos os organogramas
router.get('/', organogramaController.getAllOrganogramas);

// Buscar organograma por nome do órgão (ATENÇÃO: deve vir DEPOIS das rotas estáticas)
router.get('/:nomeOrgao', organogramaController.getOrganogramaByName);

// Criar organograma estrutural
router.post('/estrutural', validateOrganogramaEstrutural, organogramaController.createOrganogramaEstrutural);

// Criar organograma de funções
router.post('/funcoes', validateOrganogramaFuncoes, organogramaController.createOrganogramaFuncoes);

// Editar organograma estrutural
router.put('/:nomeOrgao/estrutura', validateUpdateOrganogramaEstrutural, organogramaController.updateOrganogramaEstrutural);

// Editar organograma de funções
router.put('/:nomeOrgao/funcoes', validateUpdateOrganogramaFuncoes, organogramaController.updateOrganogramaFuncoes);

// Deletar organograma
router.delete('/:nomeOrgao', organogramaController.deleteOrganograma);

// Verificar senha de órgão
router.post('/:orgaoId/verify-password', organogramaController.verifyPassword);

// Atualizar senha de órgão
router.put('/:orgaoId/update-password', organogramaController.updatePassword);


// Salvar posições customizadas
router.post('/:organogramaId/positions', organogramaController.saveCustomPositions);

// Deletar posições customizadas (volta ao layout automático)
router.delete('/:organogramaId/positions', organogramaController.deleteCustomPositions);

export default router;
