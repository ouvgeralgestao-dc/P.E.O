import * as storageService from '../services/sqliteStorageService.js';
import * as fileSystem from '../utils/fileSystem.js';
import { formatTitleCase } from '../utils/formatters.js';

// Listar todos os órgãos
export const getAllOrgaos = async (req, res, next) => {
    try {
        const orgaos = await storageService.listOrgaos();

        // Mapear campos para compatibilidade
        let mapped = orgaos.map(o => ({
            id: o.id,
            nome: o.orgao,
            categoria: o.categoria || 'OUTROS',
            ordem: o.ordem || 999,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        // Aplicar filtro por órgão para usuários comuns
        const isFiltered = req.user && req.user.tipo !== 'admin';
        
        if (isFiltered) {
            const userOrgaoId = req.user.orgao_id;
            console.log('[DEBUG] Filtrando órgãos para usuário:', { 
                orgao_id: userOrgaoId, 
                tipo: req.user.tipo,
                totalOrgaos: mapped.length 
            });
            
            if (userOrgaoId) {
                // Filtrar apenas o órgão ao qual o usuário pertence
                mapped = mapped.filter(orgao => {
                    const match = orgao.id === userOrgaoId;
                    
                    if (!match) {
                        console.log('[DEBUG] Órgão filtrado:', { id: orgao.id, nome: orgao.nome });
                    }
                    
                    return match;
                });
            } else {
                // Se usuário não tem órgão definido, não mostra nenhum
                console.log('[DEBUG] Usuário sem orgao_id definido - lista vazia');
                mapped = [];
            }
            
            console.log('[DEBUG] Órgãos após filtro:', mapped.length);
        }

        res.json({
            success: true,
            data: mapped,
            count: mapped.length,
            filtered: isFiltered
        });
    } catch (error) {
        next(error);
    }
};

// Listar órgãos para cadastro público (apenas id e nome)
export const getPublicOrgaos = async (req, res, next) => {
    try {
        const orgaos = await storageService.listOrgaos();
        
        // Retornar apenas dados necessários para o dropdown
        const mapped = orgaos.map(o => ({
            id: o.id,
            nome: o.orgao
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

        const novoOrgao = await storageService.createOrgaoAdmin({
            id,
            nome: nome, // Preservar capitalização do usuário
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

        const updated = await storageService.updateOrgaoMetadata(id, {
            nome: nome || meta.orgao, // Preservar capitalização do usuário
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
