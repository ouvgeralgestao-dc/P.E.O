import express from 'express';
import { getPrefixos, createPrefixo, updatePrefixo, deletePrefixo } from '../controllers/prefixosController.js';

const router = express.Router();

router.get('/', getPrefixos);
router.post('/', createPrefixo);
router.put('/:id', updatePrefixo);
router.delete('/:id', deletePrefixo);

export default router;
