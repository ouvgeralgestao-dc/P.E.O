import express from 'express';
import * as setoresController from '../controllers/setoresController.js';

const router = express.Router();

router.get('/', setoresController.listSetores);
router.put('/', setoresController.updateSetor);
router.delete('/:name', setoresController.deleteSetor);

// Configuração (Dicionário de Setores)
router.get('/config', setoresController.listConfig);
router.post('/config', setoresController.upsertConfig);
router.put('/config/:id', setoresController.upsertConfig);
router.delete('/config/:id', setoresController.deleteConfig);

export default router;
