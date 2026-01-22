import { listPrefixos, addPrefixo, updatePrefixo as dbUpdatePrefixo, deletePrefixo as dbDeletePrefixo } from '../services/sqliteStorageService.js';

export const getPrefixos = async (req, res, next) => {
    try {
        const prefixos = await listPrefixos();
        res.status(200).json({
            success: true,
            data: prefixos
        });
    } catch (error) {
        next(error);
    }
};

export const createPrefixo = async (req, res, next) => {
    try {
        const { nome } = req.body;
        if (!nome) {
            return res.status(400).json({ success: false, message: 'Nome do prefixo é obrigatório.' });
        }

        const novoPrefixo = await addPrefixo(nome);
        res.status(201).json({
            success: true,
            data: novoPrefixo,
            message: 'Prefixo criado com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

export const updatePrefixo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ success: false, message: 'Nome do prefixo é obrigatório.' });
        }

        const prefixoAtualizado = await dbUpdatePrefixo(id, nome);
        res.status(200).json({
            success: true,
            data: prefixoAtualizado,
            message: 'Prefixo atualizado com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

export const deletePrefixo = async (req, res, next) => {
    try {
        const { id } = req.params;
        await dbDeletePrefixo(id);
        res.status(200).json({
            success: true,
            message: 'Prefixo removido com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};
