/**
 * Serviço de Armazenamento de Posições Customizadas (Versão SQLite)
 * Permite salvar e carregar layouts personalizados pelo usuário diretamente no banco.
 */

import { dbAsync } from '../database/db.js';

/**
 * Salva posições customizadas para um organograma
 * @param {string} organogramaId - ID do organograma (ex: 'geral', 'secgoverno', etc)
 * @param {Array} positions - Array de {id, position: {x, y}, customStyle: {}}
 */
export const saveCustomPositions = async (organogramaId, positions) => {
    try {
        await dbAsync.run("BEGIN TRANSACTION");

        // Remove posições anteriores deste organograma (substituição completa)
        await dbAsync.run('DELETE FROM layout_personalizado WHERE orgao_id = ?', [organogramaId]);

        if (positions && Array.isArray(positions)) {
            for (const pos of positions) {
                await dbAsync.run(
                    `INSERT INTO layout_personalizado (orgao_id, node_id, x, y, custom_style_json, updated_at) 
                     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        organogramaId,
                        pos.id,
                        pos.position?.x || 0,
                        pos.position?.y || 0,
                        JSON.stringify(pos.customStyle || {})
                    ]
                );
            }
        }

        await dbAsync.run("COMMIT");

        // Retorna formato compatível com o esperado pelo controller (embora não seja muito usado lá)
        return {
            positions: positions,
            updatedAt: new Date().toISOString()
        };

    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error(`Erro ao salvar layout personalizado para ${organogramaId}:`, error);
        throw error;
    }
};

/**
 * Carrega posições customizadas para um organograma
 * @param {string} organogramaId - ID do organograma
 * @returns {Array|null} - Array de posições ou null se não houver customização
 */
export const loadCustomPositions = async (organogramaId) => {
    try {
        const rows = await dbAsync.all(
            'SELECT node_id, x, y, custom_style_json FROM layout_personalizado WHERE orgao_id = ?',
            [organogramaId]
        );

        if (!rows || rows.length === 0) {
            return null;
        }

        // Mapeia para o formato esperado pelo frontend
        return rows.map(row => ({
            id: row.node_id,
            position: {
                x: row.x,
                y: row.y
            },
            customStyle: JSON.parse(row.custom_style_json || '{}')
        }));

    } catch (error) {
        console.error(`Erro ao carregar layout personalizado para ${organogramaId}:`, error);
        throw error;
    }
};

/**
 * Remove posições customizadas para um organograma (volta ao layout automático)
 * @param {string} organogramaId - ID do organograma
 */
export const deleteCustomPositions = async (organogramaId) => {
    try {
        await dbAsync.run("BEGIN TRANSACTION");
        await dbAsync.run('DELETE FROM layout_personalizado WHERE orgao_id = ?', [organogramaId]);
        await dbAsync.run("COMMIT");
        return true;
    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error(`Erro ao deletar layout personalizado para ${organogramaId}:`, error);
        throw error;
    }
};

/**
 * Aplica posições customizadas a um array de setores (Função de Helper - In-Memory)
 * Mantida igual à original para compatibilidade lógica.
 * @param {Array} setores - Setores com posições automáticas
 * @param {Array} customPositions - Posições customizadas
 * @returns {Array} - Setores com posições atualizadas
 */
export const applyCustomPositions = (setores, customPositions) => {
    if (!customPositions || customPositions.length === 0) {
        return setores;
    }

    const positionMap = new Map();
    customPositions.forEach(cp => {
        positionMap.set(cp.id, cp.position);
    });

    return setores.map(setor => {
        const customPos = positionMap.get(setor.id);
        if (customPos) {
            return {
                ...setor,
                position: customPos
            };
        }
        return setor;
    });
};
