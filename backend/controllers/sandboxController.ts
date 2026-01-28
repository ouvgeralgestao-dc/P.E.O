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
// ORGANOGRAMA ESTRUTURAL SANDBOX
// ========================================

/**
 * Busca organograma estrutural sandbox de um órgão
 */
export const getSandboxEstrutural = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Buscar setores sandbox do usuário para este órgão
        const setores = await dbAsync.all(
            'SELECT * FROM sandbox_setores WHERE user_id = ? AND orgao_id = ? ORDER BY hierarquia',
            [userId, orgaoId]
        );

        // Buscar nome do órgão institucional
        const orgao = await dbAsync.get('SELECT nome FROM orgaos WHERE id = ?', [orgaoId]);

        res.json({
            orgao: orgao?.nome || 'Órgão',
            setores: setores.map((s: any) => ({
                id: s.id,
                nomeSetor: s.nome_setor,
                tipoSetor: s.tipo_setor,
                hierarquia: s.hierarquia,
                parentId: s.parent_id,
                position: { x: s.position_x, y: s.position_y }, // Unificado para objeto position
                customStyle: s.custom_style ? JSON.parse(s.custom_style) : null,
                cargos: s.cargos ? JSON.parse(s.cargos) : []
            }))
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

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        if (!setores || !Array.isArray(setores)) {
            return res.status(400).json({ message: 'Setores inválidos.' });
        }

        // Deletar setores antigos do usuário para este órgão
        await dbAsync.run(
            'DELETE FROM sandbox_setores WHERE user_id = ? AND orgao_id = ?',
            [userId, orgaoId]
        );

        // Inserir todos os setores (Array Plano)
        for (const setor of setores) {
            const id = setor.id || uuidv4();
            const parentId = setor.parentId || null;

            await dbAsync.run(
                `INSERT INTO sandbox_setores (
                    id, user_id, orgao_id, nome_setor, tipo_setor, hierarquia, parent_id,
                    position_x, position_y, custom_style, cargos
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    userId,
                    orgaoId,
                    setor.nomeSetor,
                    setor.tipoSetor,
                    setor.hierarquia,
                    parentId,
                    setor.positionX || 0,
                    setor.positionY || 0,
                    setor.customStyle ? JSON.stringify(setor.customStyle) : null,
                    setor.cargos ? JSON.stringify(setor.cargos) : null
                ]
            );
        }

        console.log(`[Sandbox] Organograma estrutural salvo para órgão ${orgaoId} (user ${userId})`);
        res.json({ message: 'Organograma estrutural sandbox salvo com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao salvar estrutural:', error);
        res.status(500).json({ message: 'Erro ao salvar organograma estrutural sandbox.' });
    }
};

/**
 * Deleta organograma estrutural sandbox
 */
export const deleteSandboxEstrutural = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Deletar setores do usuário para este órgão
        await dbAsync.run(
            'DELETE FROM sandbox_setores WHERE user_id = ? AND orgao_id = ?',
            [userId, orgaoId]
        );

        console.log(`[Sandbox] Organograma estrutural deletado para órgão ${orgaoId} (user ${userId})`);
        res.json({ message: 'Organograma estrutural sandbox excluído com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao deletar estrutural:', error);
        res.status(500).json({ message: 'Erro ao excluir organograma estrutural sandbox.' });
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

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Buscar cargos sandbox do usuário para este órgão
        const cargos = await dbAsync.all(
            'SELECT * FROM sandbox_cargos_funcionais WHERE user_id = ? AND orgao_id = ? ORDER BY hierarquia',
            [userId, orgaoId]
        );

        // Buscar nome do órgão institucional
        const orgao = await dbAsync.get('SELECT nome FROM orgaos WHERE id = ?', [orgaoId]);

        res.json({
            orgao: orgao?.nome || 'Órgão',
            cargos: cargos.map((c: any) => ({
                id: c.id,
                nomeCargo: c.nome_cargo,
                ocupante: c.ocupante,
                hierarquia: c.hierarquia,
                nivel: c.nivel,
                parentId: c.parent_id,
                position: { x: c.position_x, y: c.position_y }, // Unificado para objeto position
                customStyle: c.custom_style ? JSON.parse(c.custom_style) : null,
                simbolos: c.simbolos ? JSON.parse(c.simbolos) : [],
                setorRef: c.setor_ref
            }))
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

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        if (!cargos || !Array.isArray(cargos)) {
            return res.status(400).json({ message: 'Cargos inválidos.' });
        }

        // Deletar cargos antigos do usuário para este órgão
        await dbAsync.run(
            'DELETE FROM sandbox_cargos_funcionais WHERE user_id = ? AND orgao_id = ?',
            [userId, orgaoId]
        );

        // Inserir todos os cargos (Array Plano)
        for (const cargo of cargos) {
            const id = cargo.id || uuidv4();
            const parentId = cargo.parentId || null;

            await dbAsync.run(
                `INSERT INTO sandbox_cargos_funcionais (
                    id, user_id, orgao_id, nome_cargo, ocupante, hierarquia, nivel, parent_id,
                    position_x, position_y, custom_style, simbolos, setor_ref
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    userId,
                    orgaoId,
                    cargo.nomeCargo,
                    cargo.ocupante || null,
                    cargo.hierarquia,
                    cargo.nivel,
                    parentId,
                    cargo.positionX || 0,
                    cargo.positionY || 0,
                    cargo.customStyle ? JSON.stringify(cargo.customStyle) : null,
                    cargo.simbolos ? JSON.stringify(cargo.simbolos) : null,
                    cargo.setorRef || null
                ]
            );
        }

        console.log(`[Sandbox] Organograma funcional salvo para órgão ${orgaoId} (user ${userId})`);
        res.json({ message: 'Organograma funcional sandbox salvo com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao salvar funcional:', error);
        res.status(500).json({ message: 'Erro ao salvar organograma funcional sandbox.' });
    }
};

/**
 * Deleta organograma funcional sandbox
 */
export const deleteSandboxFuncional = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Deletar cargos funcionais do usuário para este órgão
        await dbAsync.run(
            'DELETE FROM sandbox_cargos_funcionais WHERE user_id = ? AND orgao_id = ?',
            [userId, orgaoId]
        );

        console.log(`[Sandbox] Organograma funcional deletado para órgão ${orgaoId} (user ${userId})`);
        res.json({ message: 'Organograma funcional sandbox excluído com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao deletar funcional:', error);
        res.status(500).json({ message: 'Erro ao excluir organograma funcional sandbox.' });
    }
};

// ========================================
// LISTAGEM DE SANDBOXES
// ========================================

/**
 * Lista todos os órgãos que possuem sandbox criado pelo usuário
 */
export const listSandboxes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Buscar IDs de órgãos com estrutural
        const structuralRows = await dbAsync.all(
            'SELECT DISTINCT orgao_id FROM sandbox_setores WHERE user_id = ?',
            [userId]
        );
        const structuralIds = new Set(structuralRows.map((r: any) => r.orgao_id));

        // Buscar IDs de órgãos com funcional
        const functionalRows = await dbAsync.all(
            'SELECT DISTINCT orgao_id FROM sandbox_cargos_funcionais WHERE user_id = ?',
            [userId]
        );
        const functionalIds = new Set(functionalRows.map((r: any) => r.orgao_id));

        // Unir todos os IDs
        const allIds = new Set([...structuralIds, ...functionalIds]);

        if (allIds.size === 0) {
            return res.json([]);
        }

        // Buscar detalhes dos órgãos
        // SQLite não suporta array binding nativo facilmente em node-sqlite3 antigo,
        // mas podemos construir a query dinamicamente pois os IDs vieram do banco (seguro-ish, mas ideal limpar)
        // Como orgao_id é string (slug) ou int, vamos usar placeholders.
        
        const idsArray = Array.from(allIds);
        const placeholders = idsArray.map(() => '?').join(',');
        
        const orgaos = await dbAsync.all(
            `SELECT id, nome, categoria FROM orgaos WHERE id IN (${placeholders})`,
            idsArray
        );

        // Montar resposta
        const result = orgaos.map((o: any) => ({
            orgaoId: o.id,
            nome: o.nome,
            categoria: o.categoria,
            hasEstrutural: structuralIds.has(o.id.toString()), // Garantir string comparison
            hasFuncional: functionalIds.has(o.id.toString())
        }));

        res.json(result);

    } catch (error) {
        console.error('[Sandbox] Erro ao listar sandboxes:', error);
        res.status(500).json({ message: 'Erro ao listar sandboxes.' });
    }
};

// ========================================
// POSIÇÕES CUSTOMIZADAS
// ========================================

/**
 * Salva posições customizadas de um organograma sandbox
 */
export const saveSandboxPositions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orgaoId } = req.params;
        const { tipo, positions } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        if (!tipo || !positions) {
            return res.status(400).json({ message: 'Tipo e posições são obrigatórios.' });
        }

        const table = tipo === 'estrutural' ? 'sandbox_setores' : 'sandbox_cargos_funcionais';

        // Atualizar posições e estilos
        // O frontend envia um Array de { id, position: { x, y }, customStyle?: any }
        if (Array.isArray(positions)) {
            for (const item of positions) {
                const id = item.id;
                const pos = item.position;
                const style = item.customStyle;

                if (id) {
                    if (pos && style) {
                        await dbAsync.run(
                            `UPDATE ${table} SET position_x = ?, position_y = ?, custom_style = ? WHERE id = ? AND user_id = ? AND orgao_id = ?`,
                            [pos.x, pos.y, JSON.stringify(style), id, userId, orgaoId]
                        );
                    } else if (pos) {
                        await dbAsync.run(
                            `UPDATE ${table} SET position_x = ?, position_y = ? WHERE id = ? AND user_id = ? AND orgao_id = ?`,
                            [pos.x, pos.y, id, userId, orgaoId]
                        );
                    } else if (style) {
                        await dbAsync.run(
                            `UPDATE ${table} SET custom_style = ? WHERE id = ? AND user_id = ? AND orgao_id = ?`,
                            [JSON.stringify(style), id, userId, orgaoId]
                        );
                    }
                }
            }
        } else {
            // Fallback para Objeto (para compatibilidade legada se houver)
            for (const [id, posData] of Object.entries(positions as Record<string, any>)) {
                const pos = posData.position || posData;
                const style = posData.customStyle;

                if (pos && style) {
                    await dbAsync.run(
                        `UPDATE ${table} SET position_x = ?, position_y = ?, custom_style = ? WHERE id = ? AND user_id = ? AND orgao_id = ?`,
                        [pos.x, pos.y, JSON.stringify(style), id, userId, orgaoId]
                    );
                } else if (pos) {
                    await dbAsync.run(
                        `UPDATE ${table} SET position_x = ?, position_y = ? WHERE id = ? AND user_id = ? AND orgao_id = ?`,
                        [pos.x || 0, pos.y || 0, id, userId, orgaoId]
                    );
                }
            }
        }

        console.log(`[Sandbox] Posições salvas para ${tipo} do órgão ${orgaoId}`);
        res.json({ message: 'Posições salvas com sucesso.' });
    } catch (error) {
        console.error('[Sandbox] Erro ao salvar posições:', error);
        res.status(500).json({ message: 'Erro ao salvar posições.' });
    }
};
