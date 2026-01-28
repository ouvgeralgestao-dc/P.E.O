import { Request, Response } from 'express';
import { dbAsync } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import * as customPositionsService from '../services/customPositionsService.js';
import * as layoutService from '../services/layoutService.js';

// Interface para Request com User
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        matricula: string;
        tipo: string;
        setor: string;
    };
}

// ========================================
// GERENCIAMENTO DE ÓRGÃOS SANDBOX
// ========================================

/**
 * Lista todos os órgãos sandbox do usuário autenticado
 */
export const listSandboxOrgaos = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        const orgaos = await dbAsync.all(
            'SELECT * FROM sandbox_orgaos WHERE user_id = ? ORDER BY updated_at DESC',
            [userId]
        );

        res.json(orgaos);
    } catch (error) {
        console.error('[Sandbox] Erro ao listar órgãos:', error);
        res.status(500).json({ message: 'Erro ao listar órgãos sandbox.' });
    }
};

/**
 * Cria um novo órgão sandbox
 */
export const createSandboxOrgao = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        const { nome, categoria } = req.body;

        if (!nome) {
            return res.status(400).json({ message: 'Nome do órgão é obrigatório.' });
        }

        // Verificar se já existe órgão com mesmo nome para este usuário
        const existing = await dbAsync.get(
            'SELECT id FROM sandbox_orgaos WHERE user_id = ? AND nome = ?',
            [userId, nome]
        );

        if (existing) {
            return res.status(400).json({ message: 'Você já possui um órgão sandbox com este nome.' });
        }

        const now = new Date().toISOString();

        const result = await dbAsync.run(
            `INSERT INTO sandbox_orgaos (user_id, nome, categoria, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, nome, categoria || 'OUTROS', now, now]
        );

        const newOrgao = await dbAsync.get(
            'SELECT * FROM sandbox_orgaos WHERE id = ?',
            [result.lastID]
        );

        console.log(`[Sandbox] Órgão criado: ${nome} (ID: ${result.lastID})`);
        res.status(201).json(newOrgao);
    } catch (error) {
        console.error('[Sandbox] Erro ao criar órgão:', error);
        res.status(500).json({ message: 'Erro ao criar órgão sandbox.' });
    }
};

/**
 * Deleta um órgão sandbox e todos os seus setores/cargos
 */
export const deleteSandboxOrgao = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // Verificar propriedade
        const orgao = await dbAsync.get(
            'SELECT id FROM sandbox_orgaos WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!orgao) {
            return res.status(404).json({ message: 'Órgão não encontrado.' });
        }

        // Cascade delete fará o resto (setores e cargos)
        await dbAsync.run('DELETE FROM sandbox_orgaos WHERE id = ?', [id]);

        console.log(`[Sandbox] Órgão deletado: ID ${id}`);
        res.json({ message: 'Órgão sandbox excluído com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao excluir órgão:', error);
        res.status(500).json({ message: 'Erro ao excluir órgão sandbox.' });
    }
};

// ========================================
// ORGANOGRAMA ESTRUTURAL SANDBOX
// ========================================

/**
 * Busca organograma estrutural sandbox de um órgão
 */
export const getSandboxEstrutural = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;

        // Verificar propriedade
        const orgao = await dbAsync.get(
            'SELECT * FROM sandbox_orgaos WHERE id = ? AND user_id = ?',
            [orgaoId, userId]
        );

        if (!orgao) {
            return res.status(404).json({ message: 'Órgão não encontrado.' });
        }

        // Buscar todos os setores deste órgão
        const setores = await dbAsync.all(
            'SELECT * FROM sandbox_setores WHERE orgao_id = ? ORDER BY hierarquia ASC',
            [orgaoId]
        );

        // Parsear JSON de cargos e custom_style
        const setoresProcessados = setores.map((s: any) => ({
            ...s,
            cargos: s.cargos ? JSON.parse(s.cargos) : [],
            custom_style: s.custom_style ? JSON.parse(s.custom_style) : null,
            position: { x: s.position_x || 0, y: s.position_y || 0 }
        }));

        res.json({
            orgao: orgao.nome,
            setores: setoresProcessados
        });
    } catch (error) {
        console.error('[Sandbox] Erro ao buscar estrutural:', error);
        res.status(500).json({ message: 'Erro ao buscar organograma estrutural sandbox.' });
    }
};

/**
 * Salva organograma estrutural sandbox
 */
export const saveSandboxEstrutural = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;
        const { setores } = req.body;

        if (!setores || !Array.isArray(setores)) {
            return res.status(400).json({ message: 'Dados de setores inválidos.' });
        }

        // Verificar propriedade
        const orgao = await dbAsync.get(
            'SELECT * FROM sandbox_orgaos WHERE id = ? AND user_id = ?',
            [orgaoId, userId]
        );

        if (!orgao) {
            return res.status(404).json({ message: 'Órgão não encontrado.' });
        }

        // Deletar setores existentes e inserir novos (estratégia simples)
        await dbAsync.run('DELETE FROM sandbox_setores WHERE orgao_id = ?', [orgaoId]);

        // Função recursiva para salvar setores
        const saveSetoresRecursive = async (setoresList: any[], parentId: string | null = null) => {
            for (const setor of setoresList) {
                const setorId = setor.id || uuidv4();
                
                await dbAsync.run(
                    `INSERT INTO sandbox_setores 
                    (id, user_id, orgao_id, nome_setor, tipo_setor, hierarquia, parent_id, 
                     position_x, position_y, custom_style, cargos)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        setorId,
                        userId,
                        orgaoId,
                        setor.nomeSetor || setor.nome_setor,
                        setor.tipoSetor || setor.tipo_setor,
                        setor.hierarquia,
                        parentId,
                        setor.position?.x || 0,
                        setor.position?.y || 0,
                        setor.custom_style ? JSON.stringify(setor.custom_style) : null,
                        setor.cargos ? JSON.stringify(setor.cargos) : null
                    ]
                );

                // Salvar filhos recursivamente
                if (setor.children && setor.children.length > 0) {
                    await saveSetoresRecursive(setor.children, setorId);
                }
            }
        };

        await saveSetoresRecursive(setores);

        // Atualizar timestamp do órgão
        await dbAsync.run(
            'UPDATE sandbox_orgaos SET updated_at = ? WHERE id = ?',
            [new Date().toISOString(), orgaoId]
        );

        console.log(`[Sandbox] Estrutural salvo: Órgão ${orgaoId}, ${setores.length} setores raiz`);
        res.json({ success: true, message: 'Organograma estrutural sandbox salvo com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao salvar estrutural:', error);
        res.status(500).json({ message: 'Erro ao salvar organograma estrutural sandbox.' });
    }
};

// ========================================
// ORGANOGRAMA FUNCIONAL SANDBOX
// ========================================

/**
 * Busca organograma funcional sandbox de um órgão
 */
export const getSandboxFuncional = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;

        // Verificar propriedade
        const orgao = await dbAsync.get(
            'SELECT * FROM sandbox_orgaos WHERE id = ? AND user_id = ?',
            [orgaoId, userId]
        );

        if (!orgao) {
            return res.status(404).json({ message: 'Órgão não encontrado.' });
        }

        // Buscar todos os cargos deste órgão
        const cargos = await dbAsync.all(
            'SELECT * FROM sandbox_cargos_funcionais WHERE orgao_id = ? ORDER BY hierarquia ASC',
            [orgaoId]
        );

        // Processar JSON
        const cargosProcessados = cargos.map((c: any) => ({
            ...c,
            simbolos: c.simbolos ? JSON.parse(c.simbolos) : [],
            custom_style: c.custom_style ? JSON.parse(c.custom_style) : null,
            position: { x: c.position_x || 0, y: c.position_y || 0 }
        }));

        res.json({
            orgao: orgao.nome,
            cargos: cargosProcessados
        });
    } catch (error) {
        console.error('[Sandbox] Erro ao buscar funcional:', error);
        res.status(500).json({ message: 'Erro ao buscar organograma funcional sandbox.' });
    }
};

/**
 * Salva organograma funcional sandbox
 */
export const saveSandboxFuncional = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;
        const { cargos } = req.body;

        if (!cargos || !Array.isArray(cargos)) {
            return res.status(400).json({ message: 'Dados de cargos inválidos.' });
        }

        // Verificar propriedade
        const orgao = await dbAsync.get(
            'SELECT * FROM sandbox_orgaos WHERE id = ? AND user_id = ?',
            [orgaoId, userId]
        );

        if (!orgao) {
            return res.status(404).json({ message: 'Órgão não encontrado.' });
        }

        // Deletar cargos existentes
        await dbAsync.run('DELETE FROM sandbox_cargos_funcionais WHERE orgao_id = ?', [orgaoId]);

        // Função recursiva para salvar cargos
        const saveCargosRecursive = async (cargosList: any[], parentId: string | null = null) => {
            for (const cargo of cargosList) {
                const cargoId = cargo.id || uuidv4();
                
                await dbAsync.run(
                    `INSERT INTO sandbox_cargos_funcionais 
                    (id, user_id, orgao_id, nome_cargo, ocupante, hierarquia, nivel, parent_id,
                     position_x, position_y, custom_style, simbolos, setor_ref)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        cargoId,
                        userId,
                        orgaoId,
                        cargo.nomeCargo || cargo.nome_cargo,
                        cargo.ocupante || null,
                        cargo.hierarquia || 0,
                        cargo.nivel || 0,
                        parentId,
                        cargo.position?.x || 0,
                        cargo.position?.y || 0,
                        cargo.custom_style ? JSON.stringify(cargo.custom_style) : null,
                        cargo.simbolos ? JSON.stringify(cargo.simbolos) : null,
                        cargo.setor_ref || null
                    ]
                );

                // Salvar filhos recursivamente
                if (cargo.children && cargo.children.length > 0) {
                    await saveCargosRecursive(cargo.children, cargoId);
                }
            }
        };

        await saveCargosRecursive(cargos);

        // Atualizar timestamp do órgão
        await dbAsync.run(
            'UPDATE sandbox_orgaos SET updated_at = ? WHERE id = ?',
            [new Date().toISOString(), orgaoId]
        );

        console.log(`[Sandbox] Funcional salvo: Órgão ${orgaoId}, ${cargos.length} cargos raiz`);
        res.json({ success: true, message: 'Organograma funcional sandbox salvo com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao salvar funcional:', error);
        res.status(500).json({ message: 'Erro ao salvar organograma funcional sandbox.' });
    }
};

// ========================================
// POSIÇÕES CUSTOMIZADAS
// ========================================

/**
 * Salva posições customizadas de setores/cargos
 */
export const saveSandboxPositions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;
        const { tipo, positions } = req.body; // tipo: 'estrutural' | 'funcional'

        if (!tipo || !positions) {
            return res.status(400).json({ message: 'Tipo e posições são obrigatórios.' });
        }

        // Verificar propriedade
        const orgao = await dbAsync.get(
            'SELECT * FROM sandbox_orgaos WHERE id = ? AND user_id = ?',
            [orgaoId, userId]
        );

        if (!orgao) {
            return res.status(404).json({ message: 'Órgão não encontrado.' });
        }

        const table = tipo === 'estrutural' ? 'sandbox_setores' : 'sandbox_cargos_funcionais';

        // Atualizar posições
        for (const [id, pos] of Object.entries(positions as Record<string, any>)) {
            await dbAsync.run(
                `UPDATE ${table} SET position_x = ?, position_y = ? WHERE id = ? AND orgao_id = ?`,
                [pos.x, pos.y, id, orgaoId]
            );
        }

        console.log(`[Sandbox] Posições salvas: ${Object.keys(positions).length} itens`);
        res.json({ success: true, message: 'Posições salvas com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao salvar posições:', error);
        res.status(500).json({ message: 'Erro ao salvar posições.' });
    }
};
