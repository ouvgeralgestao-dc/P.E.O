import * as storageService from '../services/sqliteStorageService.js';

// --- TIPOS DE SETOR --- (Já existia, mas vamos consolidar aqui futuramente se necessário)
// Por enquanto, o organogramaController lida com setores, mas idealmente moveríamos para cá.

// --- TIPOS DE CARGO ---

export const getTiposCargo = async (req, res, next) => {
    try {
        const tipos = await storageService.listTiposCargo();
        res.json({ success: true, data: tipos });
    } catch (error) {
        next(error);
    }
};

export const createTipoCargo = async (req, res, next) => {
    try {
        const { nome, hierarquia_padrao, simbolo, ordem } = req.body;
        if (!nome) {
            return res.status(400).json({ success: false, message: 'Nome do cargo é obrigatório' });
        }

        const novo = await storageService.createTipoCargo({ nome, hierarquia_padrao, simbolo, ordem });
        res.json({ success: true, data: novo });
    } catch (error) {
        next(error);
    }
};

export const updateTipoCargo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const atualizado = await storageService.updateTipoCargo(id, data);
        res.json({ success: true, data: atualizado });
    } catch (error) {
        next(error);
    }
};

export const deleteTipoCargo = async (req, res, next) => {
    try {
        const { id } = req.params;
        await storageService.deleteTipoCargo(id);
        res.json({ success: true, message: 'Tipo de cargo removido com sucesso' });
    } catch (error) {
        next(error);
    }
};
