import * as storageService from '../services/sqliteStorageService.js';
import * as fileSystem from '../utils/fileSystem.js';
import { formatTitleCase } from '../utils/formatters.js';

// Listar todos os órgãos
export const getAllOrgaos = async (req, res, next) => {
    try {
        const orgaos = await storageService.listOrgaos();

        // Mapear campos para compatibilidade
        const mapped = orgaos.map(o => ({
            id: o.id,
            nome: o.orgao,
            categoria: o.categoria || 'OUTROS',
            ordem: o.ordem || 999,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        res.json({
            success: true,
            data: mapped,
            count: mapped.length
        });
    } catch (error) {
        next(error);
    }
};

// Criar novo órgão
export const createOrgao = async (req, res, next) => {
    try {
        const { nome, categoria } = req.body; // removemos ordem pois pode vir undefined e virar null
        const ordem = req.body.ordem;

        if (!nome || !categoria) {
            return res.status(400).json({
                success: false,
                message: 'Nome e categoria são obrigatórios'
            });
        }

        const id = fileSystem.normalizeOrgaoId(nome);

        const existingId = await storageService.getOrgaoIdByName(nome);
        if (existingId) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um órgão com este nome'
            });
        }

        const formattedNome = formatTitleCase(nome);
        const novoOrgao = await storageService.createOrgaoAdmin({
            id,
            nome: formattedNome,
            categoria,
            ordem: ordem || 999
        });

        res.status(201).json({
            success: true,
            data: novoOrgao,
            message: 'Órgão criado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// Atualizar órgão
export const updateOrgao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, categoria, ordem } = req.body;

        const meta = await storageService.getOrgaoMetadata(id);
        if (!meta) {
            return res.status(404).json({
                success: false,
                message: 'Órgão não encontrado'
            });
        }

        const formattedNome = nome ? formatTitleCase(nome) : meta.orgao;
        const updated = await storageService.updateOrgaoMetadata(id, {
            nome: formattedNome,
            categoria,
            ordem
        });

        res.json({
            success: true,
            data: {
                id: updated.id,
                nome: updated.orgao,
                categoria,
                ordem
            },
            message: 'Órgão atualizado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// Deletar órgão
export const deleteOrgao = async (req, res, next) => {
    try {
        const { id } = req.params;

        const meta = await storageService.getOrgaoMetadata(id);
        if (!meta) {
            return res.status(404).json({
                success: false,
                message: 'Órgão não encontrado'
            });
        }

        await storageService.deleteOrgao(id);

        res.json({
            success: true,
            message: 'Órgão deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};
