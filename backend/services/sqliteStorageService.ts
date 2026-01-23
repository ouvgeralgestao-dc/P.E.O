import { dbAsync } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import * as layoutService from './layoutService.js';
import { getNodeDimensions } from './layoutService.js';

// ==========================================
// TODAS AS OPERAÇÕES USAM SQLite - ZERO JSON
// ==========================================

// ==========================================
// FUNÇÕES DE LEITURA (GET)
// ==========================================

export const listOrgaos = async () => {
    try {
        const rows = await dbAsync.all('SELECT id, nome, categoria, ordem, created_at, updated_at FROM orgaos ORDER BY ordem ASC, nome ASC');
        return rows.map(r => ({
            id: r.id,
            folder: r.id,
            orgao: r.nome,
            categoria: r.categoria,
            ordem: r.ordem,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString()
        }));
    } catch (error) {
        console.error('Erro ao listar órgãos:', error);
        throw error;
    }
};

export const getOrgaoIdByName = async (termo) => {
    try {
        // 1. Tenta buscar por ID exato (UUID ou string)
        let row = await dbAsync.get('SELECT id FROM orgaos WHERE id = ?', [termo]);
        if (row) return row.id;

        // 2. Tenta buscar por Nome exato
        row = await dbAsync.get('SELECT id FROM orgaos WHERE nome = ?', [termo]);
        if (row) return row.id;

        // 3. Tenta buscar por Nome parcial/Like (fallback para slugs mal formados)
        // Isso ajuda se 'sec-fazenda' bater com 'Secretaria de Fazenda' de alguma forma? 
        // Não muito, mas ajuda 'Fazenda' -> 'Secretaria Municipal de Fazenda'
        row = await dbAsync.get('SELECT id FROM orgaos WHERE nome LIKE ?', [`%${termo}%`]);
        if (row) return row.id;

        return null;
    } catch (error) {
        console.error('Erro ao buscar ID do órgão:', error);
        throw error;
    }
};

export const getOrgaoMetadata = async (orgaoId) => {
    try {
        const row = await dbAsync.get('SELECT * FROM orgaos WHERE id = ?', [orgaoId]);
        if (!row) return null;

        const safeDate = (d) => {
            if (!d) return new Date().toISOString();
            try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return new Date().toISOString();
                return date.toISOString();
            } catch (e) { return new Date().toISOString(); }
        };

        return {
            id: row.id,
            orgao: row.nome,
            createdAt: safeDate(row.created_at),
            updatedAt: safeDate(row.updated_at),
            // Fallbacks legacy
            created_at: safeDate(row.created_at),
            updated_at: safeDate(row.updated_at),
            auth: row.auth_hash ? {
                hash: row.auth_hash,
                salt: row.auth_salt
            } : null
        };
    } catch (error) {
        console.error('Erro ao buscar metadata:', error);
        throw error;
    }
};

export const getTamanhoFolha = async (orgaoId) => {
    try {
        const row = await dbAsync.get('SELECT tamanho_folha FROM organogramas_estruturais WHERE orgao_id = ?', [orgaoId]);
        return row ? row.tamanho_folha : 'A4';
    } catch (error) {
        console.error('Erro ao buscar tamanho da folha:', error);
        return 'A4';
    }
};


// ==========================================
// FUNÇÕES DE ESCRITA (CREATE / UPDATE)
// ==========================================

// Helper para "achatar" árvore de setores em lista plana para inserção
const flattenSetores = (setores, orgaoId, parentId = null, ordem = 0) => {
    let result = [];
    const list = Array.isArray(setores) ? setores : [setores];

    list.forEach((setor, index) => {
        if (!setor) return;

        // CORREÇÃO: Forçar novo ID para evitar duplicatas de JSONs corrompidos
        const setorId = setor.id || uuidv4();

        const flatSetor = {
            id: setorId,
            orgao_id: orgaoId,
            nome: setor.label || setor.nome || setor.nomeSetor || 'Sem Nome',
            tipo: setor.type || setor.tipo || setor.tipoSetor || 'default',
            hierarquia: setor.hierarquia || '',
            // Tratamento robusto para Parent ID
            parent_id: (parentId && parentId !== 'null' && parentId !== 'undefined')
                ? parentId
                : (setor.parentId || setor.parent_id || null),
            is_assessoria: setor.isAssessoria ? 1 : 0,
            ordem: ordem + index,
            style_json: JSON.stringify(setor.style || {}),
            position_json: JSON.stringify(setor.position || {}),
            cargos_json: JSON.stringify(setor.cargos || [])
        };

        result.push(flatSetor);

        if (setor.children && setor.children.length > 0) {
            const childrenFlat = flattenSetores(setor.children, orgaoId, setorId, 0);
            result = result.concat(childrenFlat);
        }
    });

    return result;
};

export const createOrUpdateOrgao = async (orgaoData) => {
    const { id, orgao, setores, tamanhoFolha, auth } = orgaoData;

    // Validar ID
    if (!id) throw new Error('ID do órgão é obrigatório');

    try {
        // DESABILITAR FK TEMPORARIAMENTE para permitir DELETE total sem travar em auto-referência
        await dbAsync.run("PRAGMA foreign_keys = OFF");
        await dbAsync.run("BEGIN TRANSACTION");

        // 1. Upsert Órgão
        const existing = await dbAsync.get('SELECT id FROM orgaos WHERE id = ?', [id]);

        if (existing) {
            await dbAsync.run(
                'UPDATE orgaos SET nome = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [orgao, id]
            );
            if (auth) {
                await dbAsync.run(
                    'UPDATE orgaos SET auth_hash = ?, auth_salt = ? WHERE id = ?',
                    [auth.hash, auth.salt, id]
                );
            }
        } else {
            await dbAsync.run(
                'INSERT INTO orgaos (id, nome, auth_hash, auth_salt) VALUES (?, ?, ?, ?)',
                [id, orgao, auth?.hash || null, auth?.salt || null]
            );
        }

        // 2. Upsert ou Delete Organograma Estrutural Metadata
        if (!setores || setores.length === 0) {
            await dbAsync.run('DELETE FROM organogramas_estruturais WHERE orgao_id = ?', [id]);
        } else {
            const existingOrg = await dbAsync.get('SELECT orgao_id FROM organogramas_estruturais WHERE orgao_id = ?', [id]);
            if (existingOrg) {
                await dbAsync.run(
                    'UPDATE organogramas_estruturais SET tamanho_folha = ?, updated_at = CURRENT_TIMESTAMP WHERE orgao_id = ?',
                    [tamanhoFolha || 'A4', id]
                );
            } else {
                await dbAsync.run(
                    'INSERT INTO organogramas_estruturais (orgao_id, tamanho_folha, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                    [id, tamanhoFolha || 'A4']
                );
            }
        }

        // 3. Reescrever Setores
        await dbAsync.run('DELETE FROM setores WHERE orgao_id = ?', [id]);

        if (setores) {
            const flatSetores = flattenSetores(setores, id);

            // DEDUPLICAÇÃO DE IDS (CRÍTICO: Evita erro UNIQUE constraint)
            const uniqueSetores = [];
            const seenIds = new Set();
            for (const s of flatSetores) {
                if (!seenIds.has(s.id)) {
                    seenIds.add(s.id);
                    uniqueSetores.push(s);
                }
            }

            console.log(`[SQLite] Salvar Órgão - VERSÃO BLINDADA V2 - Setores: ${uniqueSetores.length}`);

            for (const s of uniqueSetores) {
                // DELETE preventivo por ID (Garante que não exista em NENHUM órgão)
                await dbAsync.run('DELETE FROM setores WHERE id = ?', [s.id]);

                await dbAsync.run(
                    `INSERT INTO setores (
                        id, orgao_id, nome, tipo, hierarquia, parent_id, 
                        is_assessoria, ordem, style_json, position_json, cargos_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        s.id, s.orgao_id, s.nome, s.tipo, s.hierarquia, s.parent_id,
                        s.is_assessoria, s.ordem, s.style_json, s.position_json, s.cargos_json
                    ]
                );
            }
        }

        await dbAsync.run("COMMIT");
        await dbAsync.run("PRAGMA foreign_keys = ON"); // Reabilitar FKs
        console.log(`✅ [SQLite] Órgão '${orgao}' salvo com sucesso.`);
        return { success: true };

    } catch (error) {
        await dbAsync.run("ROLLBACK");
        await dbAsync.run("PRAGMA foreign_keys = ON"); // Reabilitar FKs em caso de erro também
        console.error(`❌ [SQLite] Falha ao salvar órgão '${orgao}':`, error);
        throw error;
    }
};

export const updateOrgaoAuth = async (orgaoId, salt, hash) => {
    try {
        await dbAsync.run(
            'UPDATE orgaos SET auth_salt = ?, auth_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [salt, hash, orgaoId]
        );
        console.log(`[SQLite] Senha atualizada para ${orgaoId}`);
        return { success: true };
    } catch (error) {
        console.error(`Erro ao atualizar auth para ${orgaoId}:`, error);
        throw error;
    }
};

// ==========================================
// FUNÇÕES DE LEITURA (TREE RECONSTRUCTION)
// ==========================================

const reconstructTree = (flatList) => {
    const list = JSON.parse(JSON.stringify(flatList));
    const map = {};
    const roots = [];

    list.forEach(node => {
        try {
            node.style = JSON.parse(node.style_json || '{}');
            node.position = JSON.parse(node.position_json || '{}');
            node.cargos = JSON.parse(node.cargos_json || '[]');
            if (!Array.isArray(node.cargos)) node.cargos = []; // Garantir array
        } catch (e) {
            console.warn(`Erro JSON setor ${node.id}`, e);
            node.cargos = [];
        }

        // Mapear para Formato Legacy (Frontend espera nomeSetor, tipoSetor, isAssessoria)
        node.nomeSetor = node.nome;
        node.tipoSetor = node.tipo;
        node.isAssessoria = !!node.is_assessoria; // Converter 0/1 para bool
        node.parentId = node.parent_id;

        // Limpar propriedades SQL antigas
        delete node.style_json;
        delete node.position_json;
        delete node.cargos_json;
        delete node.nome; // Frontend usa nomeSetor
        delete node.tipo; // Frontend usa tipoSetor
        delete node.is_assessoria;
        delete node.parent_id;

        // CRÍTICO: Inicializar array de filhos (removido acidentalmente na última refatoração)
        node.children = [];

        map[node.id] = node;
    });

    list.forEach(node => {
        if (node.parentId && map[node.parentId]) {
            map[node.parentId].children.push(node);
        } else {
            roots.push(node);
        }
    });

    const sortChildren = (node) => {
        if (node.children.length > 0) {
            node.children.sort((a, b) => a.ordem - b.ordem);
            node.children.forEach(sortChildren);
        }
    };
    roots.sort((a, b) => a.ordem - b.ordem);
    roots.forEach(sortChildren);

    return roots;
};

export const getOrgaoEstrutural = async (orgaoId) => {
    try {
        const setores = await dbAsync.all(
            'SELECT * FROM setores WHERE orgao_id = ? ORDER BY ordem ASC',
            [orgaoId]
        );

        if (!setores || setores.length === 0) return [];
        return reconstructTree(setores);

    } catch (error) {
        console.error(`Erro ao buscar estrutural para ${orgaoId}:`, error);
        throw error;
    }
};

// ==========================================
// FUNÇÕES DE ORGANOGRAMA FUNCIONAL
// ==========================================

export const listOrganogramasFuncoes = async (orgaoId) => {
    try {
        const diagramas = await dbAsync.all(
            'SELECT id, nome, updated_at FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at DESC',
            [orgaoId]
        );
        return diagramas.map(d => ({
            id: d.id,
            nome: d.nome || `Versão ${new Date(d.created_at).toLocaleDateString()}`,
            data: d.updated_at
        }));
    } catch (error) {
        console.error(`Erro ao listar funções para ${orgaoId}:`, error);
        throw error;
    }
};

const flattenCargos = (cargos, diagramaId, parentId = null) => {
    let result = [];
    const list = Array.isArray(cargos) ? cargos : [cargos];

    list.forEach((cargo) => {
        if (!cargo) return;

        // ID Lógico (Original ou Temporário) para manter referência na árvore
        const logicalId = cargo.id || uuidv4();

        result.push({
            id: logicalId, // ID Lógico (será mapeado antes do insert)
            diagrama_id: diagramaId,
            nome_cargo: cargo.nomeCargo || cargo.nome || cargo.label || cargo.data?.nomeCargo || cargo.data?.label || 'Cargo',
            ocupante: cargo.ocupante || cargo.data?.ocupante || '',
            hierarquia: cargo.hierarquia ?? cargo.nivel ?? cargo.data?.hierarquia ?? cargo.data?.nivel ?? 0,
            // O parentId aqui refere-se ao ID Lógico do pai. Tratamento defensivo.
            parent_id: (parentId || cargo.parentId || cargo.parent_id), // Será higienizado abaixo
            // is_assessoria...
            is_assessoria: cargo.isAssessoria ? 1 : 0,
            setor_ref: cargo.setorRef || cargo.setor_ref || cargo.data?.setorRef || null,
            style_json: JSON.stringify(cargo.style || {}),
            position_json: JSON.stringify(cargo.position || {}),
            simbolos_json: JSON.stringify(cargo.simbolos || [])
        });

        if (cargo.children && cargo.children.length > 0) {
            // Passa o logicalId como pai para os filhos
            result = result.concat(flattenCargos(cargo.children, diagramaId, logicalId));
        }
    });

    return result;
};

export const addOrganogramaFuncoes = async (orgaoId, nomeVersao, dados) => {
    console.log(`[SQLite] Adicionando funcional para ${orgaoId}, versão: ${nomeVersao}`);

    // CORREÇÃO: Extrair cargos IMEDIATAMENTE para evitar ReferenceError
    const cargos = dados?.cargos || [];
    const tamanhoFolha = dados?.tamanhoFolha || 'A4';

    // Se veio vazio, deleta todas as versões funcionais deste órgão (Exclusão Total)
    if (!cargos || cargos.length === 0) {
        try {
            await dbAsync.run('DELETE FROM diagramas_funcionais WHERE orgao_id = ?', [orgaoId]);
            console.log(`[SQLite] Organograma funcional de ${orgaoId} removido (Lista vazia enviada)`);
            return { success: true, id: null };
        } catch (error) {
            console.error(`[SQLite] Erro ao deletar funcional:`, error);
            throw error;
        }
    }

    const diagramaId = uuidv4();

    try {
        await dbAsync.run("BEGIN TRANSACTION");

        await dbAsync.run(
            'INSERT INTO diagramas_funcionais (id, orgao_id, nome, tamanho_folha, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [diagramaId, orgaoId, nomeVersao, tamanhoFolha || 'A4']
        );

        if (cargos) {
            console.log(`[SQLite] Processando cargos... Recebidos: ${cargos && cargos.length}`);

            const flatCargos = flattenCargos(cargos, diagramaId);
            console.log(`[SQLite] Flat Cargos count: ${flatCargos.length}`);

            // MAPA DE TRADUÇÃO
            const idMap = {};
            flatCargos.forEach(c => {
                idMap[c.id] = uuidv4();
            });
            console.log(`[SQLite] ID Map size: ${Object.keys(idMap).length}`);

            console.log(`[SQLite] Iniciando inserção de ${flatCargos.length} cargos...`);

            for (const c of flatCargos) {
                const realId = idMap[c.id];

                // Lógica de Parent ID robusta
                let originalParentId = c.parent_id;
                // Se parent_id for a string "null" ou "undefined", transformar em null real
                if (originalParentId === 'null' || originalParentId === 'undefined') originalParentId = null;

                const realParentId = (originalParentId && idMap[originalParentId]) ? idMap[originalParentId] : null;

                if (originalParentId && !realParentId) {
                    console.warn(`[SQLite] AVISO: Cargo '${c.nome_cargo}' tem parent_id '${originalParentId}' que não foi encontrado no idMap. Tornando-se raiz.`);
                }

                console.log(`[SQLite] Inserting Cargo: ${c.nome_cargo} (OldID: ${c.id}) -> (NewID: ${realId}), Parent: ${realParentId}`);

                // BLINDAGEM V2: Delete preventivo para evitar conflito de ID (UNIQUE Constraint)
                await dbAsync.run('DELETE FROM cargos_funcionais WHERE id = ?', [realId]);

                await dbAsync.run(
                    `INSERT INTO cargos_funcionais (
                        id, diagrama_id, nome_cargo, ocupante, hierarquia, parent_id,
                        is_assessoria, style_json, position_json, simbolos_json, setor_ref
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        realId, c.diagrama_id, c.nome_cargo, c.ocupante, c.hierarquia, realParentId,
                        c.is_assessoria, c.style_json, c.position_json, c.simbolos_json, c.setor_ref
                    ]
                );
            }
        }

        await dbAsync.run("COMMIT");
        console.log(`[SQLite] Funcional salvo com sucesso: ${diagramaId}`);
        return { success: true, id: diagramaId };

    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error(`[SQLite] Erro ao salvar funcional:`, error);
        throw error;
    }
};

const reconstructTreeFuncional = (flatList) => {
    const list = JSON.parse(JSON.stringify(flatList));
    const map = {};
    const roots = [];

    list.forEach(node => {
        let pos = { x: 0, y: 0 };
        try {
            node.style = JSON.parse(node.style_json || '{}');
            const parsedPos = JSON.parse(node.position_json || '{}');
            if (parsedPos && typeof parsedPos.x === 'number' && typeof parsedPos.y === 'number') {
                pos = parsedPos;
            }
            node.simbolos = JSON.parse(node.simbolos_json || '[]');
        } catch (e) { console.warn(`Erro JSON cargo ${node.id}`, e); }

        // ReactFlow standard format
        node.data = {
            label: node.nome_cargo,
            nomeCargo: node.nome_cargo, // Compatibilidade frontend
            ...node // inclui outras props no data se necessário
        };
        node.label = node.nome_cargo; // Compatibilidade legado
        node.nomeCargo = node.nome_cargo; // Compatibilidade frontend (Stats)
        node.isAssessoria = !!node.is_assessoria; // MAPEAR PARA CAMELCASE
        node.type = 'customNode'; // Forçar tipo se necessário (ver frontend)

        node.position = pos;
        node.children = [];

        delete node.style_json;
        delete node.position_json;
        delete node.simbolos_json;
        // delete node.nome_cargo; // Manter por segurança

        // COMPATIBILIDADE FRONTEND: Expor parentId em camelCase para criação de edges
        node.parentId = node.parent_id;

        map[node.id] = node;
    });

    list.forEach(node => {
        if (node.parent_id && map[node.parent_id]) {
            map[node.parent_id].children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};

// REMOVIDA DUPLICATA AQUI

export const updateOrganogramaFuncoes = addOrganogramaFuncoes; // Alias se precisar atualizar criando nova versão

export const getOrganogramaFuncoes = async (orgaoId, diagramaId) => {
    let targetId = diagramaId;

    if (!targetId) {
        const latest = await dbAsync.get(
            'SELECT id FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at DESC LIMIT 1',
            [orgaoId]
        );
        if (!latest) return null;
        targetId = latest.id;
    }

    const diagrama = await dbAsync.get('SELECT * FROM diagramas_funcionais WHERE id = ?', [targetId]);
    if (!diagrama) return null;

    const cargos = await dbAsync.all(`
        SELECT c.*, s.nome as nome_setor_ref 
        FROM cargos_funcionais c 
        LEFT JOIN setores s ON c.setor_ref = s.id 
        WHERE c.diagrama_id = ? 
        ORDER BY c.ROWID ASC
    `, [targetId]);

    /* REMOVIDO FALLBACK LEGADO: O frontend agora controla o auto-layout inicial se necessário
    const hasPositions = cargos.some(c => {
        try {
            const pos = JSON.parse(c.position_json || '{}');
            return pos.x !== 0 || pos.y !== 0;
        } catch (e) { return false; }
    });

    if (!hasPositions && cargos.length > 0) {
        console.log(`[SQLite] Layout ausente para diagrama ${targetId}. Calculando automaticamente (Fallback Legacy)...`);
        cargos.forEach(c => c.isAssessoria = !!c.is_assessoria);
        const cargosComLayout = layoutService.calculateFuncoesLayout(cargos);
        cargosComLayout.forEach(c => {
            if (c.position) {
                c.position_json = JSON.stringify(c.position);
            }
        });
    }
    */

    const tree = reconstructTreeFuncional(cargos);

    return {
        id: diagrama.id,
        nome: diagrama.nome,
        tamanhoFolha: diagrama.tamanho_folha,
        cargos: tree,
        updatedAt: diagrama.updated_at
    };
};


// ==========================================
// FUNÇÕES DE ADMINISTRAÇÃO (METADATA ONLY)
// ==========================================

export const updateOrgaoMetadata = async (id, data) => {
    try {
        const { nome, categoria, ordem } = data;
        const updates = [];
        const params = [];

        if (nome !== undefined) {
            updates.push('nome = ?');
            params.push(nome);
        }
        if (categoria !== undefined) {
            updates.push('categoria = ?');
            params.push(categoria);
        }
        if (ordem !== undefined) {
            updates.push('ordem = ?');
            params.push(ordem);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        if (updates.length > 1) { // > 1 porque updated_at sempre está lá
            const sql = `UPDATE orgaos SET ${updates.join(', ')} WHERE id = ?`;
            params.push(id);
            await dbAsync.run(sql, params);
        }

        return getOrgaoMetadata(id); // Retorna atualizado
    } catch (error) {
        console.error(`Erro ao atualizar metadata do órgão ${id}:`, error);
        throw error;
    }
};

export const createOrgaoAdmin = async (data) => {
    try {
        const { id, nome, categoria, ordem } = data;
        await dbAsync.run(
            'INSERT INTO orgaos (id, nome, categoria, ordem, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [id, nome, categoria || 'OUTROS', ordem || 999]
        );
        // Criar placeholder estrutural
        await dbAsync.run(
            'INSERT INTO organogramas_estruturais (orgao_id, tamanho_folha, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [id, 'A4']
        );
        return { id, nome, categoria, ordem };
    } catch (error) {
        console.error(`Erro ao criar órgão admin ${data.id}:`, error);
        throw error;
    }
}

export const deleteOrgao = async (orgaoId) => {
    try {
        await dbAsync.run("BEGIN TRANSACTION");
        await dbAsync.run('DELETE FROM orgaos WHERE id = ?', [orgaoId]);
        await dbAsync.run("COMMIT");
        return { success: true };
    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error(`Erro ao deletar órgão ${orgaoId}:`, error);
        throw error;
    }
};

export const clearOrgaoContent = async (orgaoId) => {
    try {
        console.log(`[SQLite] Limpando conteúdo do órgão ${orgaoId}...`);
        await dbAsync.run("BEGIN TRANSACTION");

        // Deletar diagramas funcionais (Cascata deve apagar cargos, mas por segurança...)
        await dbAsync.run('DELETE FROM diagramas_funcionais WHERE orgao_id = ?', [orgaoId]);

        // Deletar estrutural (Setores e Metadata)
        await dbAsync.run('DELETE FROM organogramas_estruturais WHERE orgao_id = ?', [orgaoId]);
        await dbAsync.run('DELETE FROM setores WHERE orgao_id = ?', [orgaoId]);

        // Deletar layout personalizado
        await dbAsync.run('DELETE FROM layout_personalizado WHERE orgao_id = ?', [orgaoId]);

        await dbAsync.run("COMMIT");
        console.log(`[SQLite] Conteúdo limpo com sucesso para ${orgaoId}`);
        return { success: true };
    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error(`Erro ao limpar conteúdo do órgão ${orgaoId}:`, error);
        throw error;
    }
};

export const getGeneralOccupants = async () => {
    try {
        const rows = await dbAsync.all('SELECT cargo_id, nome_ocupante FROM ocupantes_gerais');
        const occupants = {};
        rows.forEach(row => {
            occupants[row.cargo_id] = row.nome_ocupante;
        });
        return occupants;
    } catch (e) {
        console.error('Erro ao ler ocupantes SQL:', e);
        return {};
    }
};

export const saveGeneralOccupants = async (data) => {
    try {
        await dbAsync.run("BEGIN TRANSACTION");
        await dbAsync.run('DELETE FROM ocupantes_gerais');

        for (const [key, value] of Object.entries(data)) {
            await dbAsync.run('INSERT INTO ocupantes_gerais (cargo_id, nome_ocupante) VALUES (?, ?)', [key, value]);
        }

        await dbAsync.run("COMMIT");
        return data;
    } catch (e) {
        await dbAsync.run("ROLLBACK");
        console.error('Erro ao salvar ocupantes SQL:', e);
        throw e;
    }
};

// ==========================================
// ORGANOGRAMAS GERAIS (Estrutura consolidada)
// ==========================================

export const getOrganogramaGeral = async (tipo = 'estrutural') => {
    try {
        const row = await dbAsync.get('SELECT data_json FROM organogramas_gerais WHERE tipo = ?', [tipo]);
        if (!row) return null;
        return JSON.parse(row.data_json);
    } catch (e) {
        console.error('Erro ao ler organograma geral:', e);
        return null;
    }
};

export const saveOrganogramaGeral = async (tipo, data) => {
    try {
        const exists = await dbAsync.get('SELECT tipo FROM organogramas_gerais WHERE tipo = ?', [tipo]);
        if (exists) {
            await dbAsync.run(
                'UPDATE organogramas_gerais SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE tipo = ?',
                [JSON.stringify(data), tipo]
            );
        } else {
            await dbAsync.run(
                'INSERT INTO organogramas_gerais (tipo, data_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [tipo, JSON.stringify(data)]
            );
        }
        return { success: true };
    } catch (e) {
        console.error('Erro ao salvar organograma geral:', e);
        throw e;
    }
};

// Alias para layout personalizado
export const getCustomPositions = async (organogramaId) => {
    try {
        const rows = await dbAsync.all(
            'SELECT node_id, x, y, custom_style_json FROM layout_personalizado WHERE orgao_id = ?',
            [organogramaId]
        );

        if (!rows || rows.length === 0) {
            return null;
        }

        // Mapear para formato de array de objetos { id, position: {x, y}, customStyle }
        return rows.map(row => ({
            id: row.node_id,
            position: { x: row.x, y: row.y },
            customStyle: row.custom_style_json ? JSON.parse(row.custom_style_json) : {}
        }));
    } catch (e) {
        console.error('Erro ao ler layout personalizado:', e);
        return null;
    }
};

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
        return { success: true };
    } catch (e) {
        await dbAsync.run("ROLLBACK");
        console.error('Erro ao salvar layout personalizado:', e);
        throw e;
    }
};

// ==========================================
// AGREGAÇÃO DINÂMICA DO ORGANOGRAMA GERAL
// ==========================================

/**
 * Agrega dinamicamente todos os setores de todos os órgãos para o Organograma Geral
 * Cria a estrutura fixa: Prefeito -> Gabinete/Subprefeituras -> Secretarias
 */
export const updateOrganogramaGeral = async () => {
    try {
        // 1. Buscar todos os órgãos
        const orgaos = await listOrgaos();

        // 2. Estrutura Base do Organograma Geral
        const geral = {
            orgao: "Prefeitura Municipal de Duque de Caxias",
            tipo: 'geral',
            dataGeracao: new Date().toISOString(),
            setores: [],
            estatisticas: {
                cargos: [],
                totalCargos: 0
            }
        };

        // 3. Criar Nós Fixos (Prefeito, Gabinete, Subprefeituras) com Posições Exatas
        const nosFixos = [
            {
                id: 'prefeito',
                nomeSetor: 'Prefeito Municipal',
                tipoSetor: 'Prefeito',
                nivelHierarquico: 0,
                ordem: 1,
                dataCriacao: new Date().toISOString(),
                position: { x: 0, y: 0 }, // Centro superior
                style: {
                    background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', // Ouro Gradiente
                    border: '1px solid #D4AF37',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)', // Brilho
                    color: '#ffffff',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                },
                children: []
            },
            {
                id: 'gabinete',
                nomeSetor: 'Gabinete do Prefeito',
                tipoSetor: 'Gabinete',
                nivelHierarquico: 1,
                ordem: 1,
                parentId: 'prefeito',
                isAssessoria: true,
                dataCriacao: new Date().toISOString(),
                // Alinhamento Y=0 para garantir linha reta horizontal com o Prefeito
                position: { x: 350, y: 0 },
                style: {
                    backgroundColor: '#C0C0C0', // Prata Fosco
                    border: '1px solid #A9A9A9',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-1',
                nomeSetor: 'Subprefeitura do 1º Distrito',
                tipoSetor: 'Subprefeitura',
                nivelHierarquico: 1,
                hierarquia: 0.5, // Adicionado para forçar lógica de conexão vertical no frontend
                ordem: 2,
                parentId: 'prefeito',
                dataCriacao: new Date().toISOString(),
                // Aumentado Y para 250 para forçar detecção vertical clara
                position: { x: -495, y: 250 }, // Esquerda extrema
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)', // Prata Reluzente
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-2',
                nomeSetor: 'Subprefeitura do 2º Distrito',
                tipoSetor: 'Subprefeitura',
                nivelHierarquico: 1,
                hierarquia: 0.5,
                ordem: 3,
                parentId: 'prefeito',
                dataCriacao: new Date().toISOString(),
                position: { x: -165, y: 250 }, // Centro-esquerda
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)',
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-3',
                nomeSetor: 'Subprefeitura do 3º Distrito',
                tipoSetor: 'Subprefeitura',
                nivelHierarquico: 1,
                hierarquia: 0.5,
                ordem: 4,
                parentId: 'prefeito',
                dataCriacao: new Date().toISOString(),
                position: { x: 165, y: 250 }, // Centro-direita
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)',
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-4',
                nomeSetor: 'Subprefeitura do 4º Distrito',
                tipoSetor: 'Subprefeitura',
                nivelHierarquico: 1,
                hierarquia: 0.5,
                ordem: 5,
                parentId: 'prefeito',
                dataCriacao: new Date().toISOString(),
                position: { x: 495, y: 250 }, // Direita extrema
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)',
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            }
        ];

        geral.setores.push(...nosFixos);

        // 4. Agregar TODOS os setores de todos os órgãos (hierarquia completa de forma PLANA)
        let currentCursorX = -600; // Posição X inicial (mais à esquerda)
        const GAP = 250; // Espaçamento entre organogramas
        const orgaoY = 400; // Y fixo abaixo das subprefeituras

        for (const orgao of orgaos) {
            const setoresTree = await getOrgaoEstrutural(orgao.id);
            if (setoresTree && setoresTree.length > 0) {
                // Identificar o nó raiz (aquele sem parentId)
                const setorRaiz = setoresTree.find(s => !s.parentId);

                if (setorRaiz) {
                    // Calcular limites (Bounding Box) deste órgão para determinar largura
                    let minX = Infinity;
                    let maxX = -Infinity;

                    const traverseAndMeasure = (node) => {
                        const posX = (node.position && node.position.x) || 0;
                        const { w } = getNodeDimensions(node);

                        if (posX < minX) minX = posX;
                        if (posX + w > maxX) maxX = posX + w;

                        if (node.children && node.children.length > 0) {
                            node.children.forEach(traverseAndMeasure);
                        }
                    };

                    // Medir a árvore inteira partindo da raiz
                    traverseAndMeasure(setorRaiz);

                    // Se por algum motivo inválido, usar fallback
                    if (minX === Infinity) { minX = 0; maxX = 300; }

                    // Calcular offset necessário para encaixar logo após o cursor atual
                    // Queremos que o 'minX' deste órgão comece em 'currentCursorX'
                    const offsetX = currentCursorX - minX;
                    const offsetY = orgaoY - ((setorRaiz.position && setorRaiz.position.y) || 0);

                    // Função recursiva para processar a árvore e achatar em uma lista
                    const processNode = (node) => {
                        // Clonar para não afetar referência original se houver
                        const newNode = { ...node };
                        delete newNode.children; // Remover referência circular/ninho para lista plana

                        // Aplicar Offset calculado dinamicamente
                        const originalX = (node.position && node.position.x) || 0;
                        const originalY = (node.position && node.position.y) || 0;

                        newNode.position = {
                            x: originalX + offsetX,
                            y: originalY + offsetY
                        };

                        newNode.orgaoOrigem = orgao.nome || orgao.id;

                        // Se for a raiz, conecta ao Prefeito
                        if (node.id === setorRaiz.id) {
                            newNode.parentId = 'prefeito';
                        }
                        // Se não for raiz, mantém parentId original

                        // Styling fallback - SÓ APLICA SE NÃO TIVER ESTILO PRÓPRIO
                        // Preservar cores originais do órgão (Rules of Preservation)
                        const hasStyle = newNode.style && Object.keys(newNode.style).length > 0;
                        const hasCustomStyle = newNode.customStyle && Object.keys(newNode.customStyle).length > 0;

                        if (!hasStyle && !hasCustomStyle) {
                            // Deixar vazio para que o Frontend aplique a cor padrão da hierarquia (HIERARCHY_COLORS)
                            newNode.style = {};
                        }

                        // Adicionar à lista geral plana
                        geral.setores.push(newNode);

                        // Processar filhos recursivamente
                        if (node.children && node.children.length > 0) {
                            node.children.forEach(child => processNode(child));
                        }
                    };

                    // Iniciar processamento pela raiz
                    processNode(setorRaiz);

                    // Atualizar cursor para o próximo (Fim deste órgão + GAP)
                    // A largura ocupada foi (maxX - minX). A nova posição final é (maxX + offsetX).
                    currentCursorX = (maxX + offsetX) + GAP;
                }
            }
        }

        // 5. Agregar estatísticas de cargos
        const cargosMap = new Map();
        for (const orgao of orgaos) {
            const funcoes = await listOrganogramasFuncoes(orgao.id);
            for (const f of funcoes) {
                const diagrama = await getOrganogramaFuncoes(orgao.id, f.id);
                if (diagrama && diagrama.cargos) {
                    diagrama.cargos.forEach(cargo => {
                        const nome = cargo.nomeCargo?.trim() || 'Cargo Não Especificado';
                        const qtd = parseInt(cargo.quantidade) || 1;
                        cargosMap.set(nome, (cargosMap.get(nome) || 0) + qtd);
                    });
                }
            }
        }

        geral.estatisticas.cargos = Array.from(cargosMap.entries())
            .map(([nome, quantidade]) => ({ nome, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade);
        geral.estatisticas.totalCargos = geral.estatisticas.cargos.reduce((acc, c) => acc + c.quantidade, 0);

        // 6. Aplicar Layout Personalizado (Posições X, Y)
        const customPositions = await getCustomPositions('geral');
        if (customPositions && customPositions.length > 0) {
            const posMap = new Map(customPositions.map(p => [p.id, p]));

            geral.setores.forEach(setor => {
                const custom = posMap.get(setor.id);
                if (custom) {
                    setor.position = (custom as any).position;
                    // Preservar estilo se houver, EXCETO para nós fixos (Padrão e Funcional)
                    const fixedIds = [
                        'prefeito', 'gabinete', 'subprefeitura-1', 'subprefeitura-2', 'subprefeitura-3', 'subprefeitura-4',
                        'prefeito-cargo', 'gabinete-cargo', 'subprefeitura-1-cargo', 'subprefeitura-2-cargo', 'subprefeitura-3-cargo', 'subprefeitura-4-cargo'
                    ];
                    const isFixed = fixedIds.includes(setor.id);

                    if (!isFixed && (custom as any).customStyle && Object.keys((custom as any).customStyle).length > 0) {
                        setor.customStyle = (custom as any).customStyle;
                        setor.style = (custom as any).customStyle; // ReactFlow usa style
                    }
                }
            });
        }

        // 7. Salvar resultado agregado
        await saveOrganogramaGeral('estrutural', geral);

        return geral;
    } catch (e) {
        console.error('Erro ao agregar organograma geral:', e);
        throw e;
    }
};

/**
 * Agrega dinamicamente todos os CARGOS de todos os órgãos para o Organograma Geral Funcional
 * Cria a estrutura fixa: Prefeito -> Subprefeitos -> Secretários
 */
export const updateOrganogramaGeralFuncional = async () => {
    try {
        // 1. Buscar todos os órgãos
        const orgaos = await listOrgaos();

        // 2. Estrutura Base
        const geral = {
            orgao: "Prefeitura Municipal de Duque de Caxias",
            tipo: 'geral-funcional',
            dataGeracao: new Date().toISOString(),
            cargos: [], // Lista unificada de cargos
            occupants: {} // Mapa de ocupantes
        };

        // 3. Criar Nós Fixos de CARGOS (Prefeito, Gabinete, Subprefeitos) com Posições Exatas
        const cargosFixos = [
            {
                id: 'prefeito-cargo',
                nomeCargo: 'Prefeito Municipal',
                tipoSetor: 'Prefeito',
                nivel: 1,
                hierarquia: 1,
                simbolos: [],
                quantidade: 1,
                ordem: 1,
                position: { x: 0, y: 0 }, // Centro superior
                style: {
                    background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', // Ouro Gradiente
                    border: '1px solid #D4AF37',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)', // Brilho
                    color: '#ffffff',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                },
                children: []
            },
            {
                id: 'gabinete-cargo',
                nomeCargo: 'Chefe de Gabinete',
                tipoSetor: 'Gabinete',
                nivel: 2,
                hierarquia: 0, // Assessoria
                simbolos: [],
                quantidade: 1,
                ordem: 2,
                parentId: 'prefeito-cargo',
                isAssessoria: true, // Marcador para linha pontilhada
                // Alinhamento Y=0 para garantir linha reta horizontal
                position: { x: 350, y: 0 },
                style: {
                    backgroundColor: '#C0C0C0', // Prata Fosco
                    border: '1px solid #A9A9A9',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-1-cargo',
                nomeCargo: 'Subprefeito(a) 1º Distrito',
                tipoSetor: 'Subprefeitura',
                nivel: 2,
                hierarquia: 0.5,
                simbolos: [],
                quantidade: 1,
                ordem: 3,
                parentId: 'prefeito-cargo',
                position: { x: -495, y: 250 }, // Esquerda extrema
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)', // Prata Reluzente
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-2-cargo',
                nomeCargo: 'Subprefeito(a) 2º Distrito',
                tipoSetor: 'Subprefeitura',
                nivel: 2,
                hierarquia: 0.5,
                simbolos: [],
                quantidade: 1,
                ordem: 4,
                parentId: 'prefeito-cargo',
                position: { x: -165, y: 250 }, // Centro-esquerda
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)',
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-3-cargo',
                nomeCargo: 'Subprefeito(a) 3º Distrito',
                tipoSetor: 'Subprefeitura',
                nivel: 2,
                hierarquia: 0.5,
                simbolos: [],
                quantidade: 1,
                ordem: 5,
                parentId: 'prefeito-cargo',
                position: { x: 165, y: 250 }, // Centro-direita
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)',
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            },
            {
                id: 'subprefeitura-4-cargo',
                nomeCargo: 'Subprefeito(a) 4º Distrito',
                tipoSetor: 'Subprefeitura',
                nivel: 2,
                hierarquia: 0.5,
                simbolos: [],
                quantidade: 1,
                ordem: 6,
                parentId: 'prefeito-cargo',
                position: { x: 495, y: 250 }, // Direita extrema
                style: {
                    background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)',
                    border: '1px solid #808080',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.4)',
                    color: '#333333',
                    fontWeight: '500'
                }
            }
        ];

        geral.cargos.push(...cargosFixos);

        // 4. Agregar TODOS os cargos de todos os órgãos (hierarquia completa)
        let currentCursorX = -600; // Posição X inicial
        const GAP = 300; // Espaçamento horizontal entre árvores de cargos
        const cargoY = 400; // Y fixo abaixo dos subprefeitos

        for (const orgao of orgaos) {
            const funcoesMeta = await listOrganogramasFuncoes(orgao.id);
            if (funcoesMeta && funcoesMeta.length > 0) {
                const f = funcoesMeta[0];
                const diagrama = await getOrganogramaFuncoes(orgao.id, f.id);

                if (diagrama && diagrama.cargos) {
                    // Identificar o cargo raiz (nível 1 ou sem parentId)
                    // No array flat reconstruído, roots estão no topo da hierarquia
                    const cargoRaiz = diagrama.cargos.find(c => c.nivel === 1 || !c.parentId);

                    if (cargoRaiz) {
                        // Calcular Bounding Box da árvore de cargos
                        let minX = Infinity;
                        let maxX = -Infinity;

                        // Como 'diagrama.cargos' já é uma árvore reconstruída (tem children), podemos percorrer
                        const traverseAndMeasure = (node) => {
                            const posX = (node.position && node.position.x) || 0;
                            const { w } = getNodeDimensions(node);

                            if (posX < minX) minX = posX;
                            if (posX + w > maxX) maxX = posX + w;

                            if (node.children) node.children.forEach(traverseAndMeasure);
                        };

                        // Se diagrama.cargos for lista plana (depende da implementação do getOrganogramaFuncoes), 
                        // precisamos garantir que estamos percorrendo tudo. 
                        // getOrganogramaFuncoes retorna { cargos: tree } (reconstructTreeFuncional)
                        // Então diagrama.cargos é um array de raízes.
                        diagrama.cargos.forEach(traverseAndMeasure);

                        if (minX === Infinity) { minX = 0; maxX = 300; }

                        // Offset para posicionar 'minX' em 'currentCursorX'
                        const offsetX = currentCursorX - minX;
                        const offsetY = cargoY - (cargoRaiz.position?.y || 0);

                        // Função para processar a árvore e adicionar à lista plana 'geral.cargos'
                        const processCargoNode = (cargo) => {
                            // Aplicar offset
                            if (cargo.position) {
                                cargo.position = {
                                    x: cargo.position.x + offsetX,
                                    y: cargo.position.y + offsetY
                                };
                            } else {
                                cargo.position = { x: currentCursorX, y: cargoY };
                            }

                            cargo.orgaoOrigemId = orgao.id;
                            cargo.orgaoOrigemNome = orgao.nome || orgao.orgao;

                            // Conectar APENAS o raiz ao Prefeito, outros mantêm parentId interno
                            if (cargo.id === cargoRaiz.id) {
                                cargo.parentId = 'prefeito-cargo';
                            }

                            // Preservar estilo ou aplicar padrão
                            const hasStyle = cargo.style && Object.keys(cargo.style).length > 0;
                            if (!hasStyle) {
                                cargo.style = {
                                    backgroundColor: '#2f1d29',
                                    borderColor: 'transparent',
                                    color: '#ffffff'
                                };
                            }

                            // Adicionar (cópia sem children para evitar circularidade na serialização se necessário, 
                            // mas aqui estamos construindo uma flat list para o frontend?)
                            // O frontend espera flat list? 
                            // O 'updateOrganogramaGeralFuncional' retorna { cargos: [] }
                            // O 'getOrganogramaGeral' retorna { setores: [] } que são FLAT.
                            // Mas 'reconstructTreeFuncional' devolve TREE.
                            // Espera... 'getOrganogramaFuncoes' devolve TREE.
                            // 'updateOrganogramaGeralFuncional' parece estar construindo uma lista PLANA em `geral.cargos`.
                            // SIM, `geral.cargos.push(...diagrama.cargos)` na versão anterior estava empurrando a árvore toda?
                            // NÃO, `diagrama.cargos` do `getOrganogramaFuncoes` é uma TREE (roots com children).
                            // Se empurrarmos raízes com children, o frontend (OrganogramaCanvas) vai receber objects com children.
                            // O Canvas tem `flattenCargos`? Sim, ele tem.
                            // MAS para manipulação segura aqui e consistência, vamos achatar manualmente ou garantir que empurramos tudo.
                            // A versão anterior fazia `geral.cargos.push(...diagrama.cargos)`. Se `diagrama.cargos` fossem apenas as raízes, 
                            // perdíamos os filhos na lista plana principal?
                            // O `OrganogramaCanvas` recosntrói ou usa flat?
                            // `OrganogramaCanvas.tsx`: "const flattenCargos = (cargosHierarquicos) => ..." 
                            // Ele aceita hierárquico e achata. OK.
                            // ENTÃO, podemos empurrar os nós da árvore modificados.
                            // Porém, precisamos garantir que TODOS os nós da árvore tiveram suas posições atualizadas.

                            // Vamos percorrer e atualizar in-place, depois empurrar as raízes.

                            // O `processCargoNode` aqui deve ser apenas um helper de travessia para update.
                        };

                        const updatePositionsRecursively = (node) => {
                            if (node.position) {
                                node.position = {
                                    x: node.position.x + offsetX,
                                    y: node.position.y + offsetY
                                };
                            } else {
                                node.position = { x: currentCursorX, y: cargoY };
                            }

                            node.orgaoOrigemId = orgao.id;
                            node.orgaoOrigemNome = orgao.nome || orgao.orgao;

                            if (node.id === cargoRaiz.id) {
                                node.parentId = 'prefeito-cargo';
                            }

                            // Style preservation
                            const hasStyle = node.style && Object.keys(node.style).length > 0;
                            if (!hasStyle) {
                                // Deixar vazio para que o Frontend aplique a cor padrão da hierarquia
                                node.style = {};
                            }

                            if (node.children) node.children.forEach(updatePositionsRecursively);
                        };

                        // Atualizar árvore inteira
                        diagrama.cargos.forEach(updatePositionsRecursively);

                        // Adicionar raízes atualizadas (que contêm toda a árvore nos children) à lista geral
                        geral.cargos.push(...diagrama.cargos);

                        // Atualizar cursor
                        currentCursorX = (maxX + offsetX) + GAP;
                    }
                }
            }
        }

        // 5. Carregar ocupantes
        geral.occupants = await getGeneralOccupants();

        // 6. Aplicar Layout Personalizado (Posições X, Y)
        // Tentamos aplicar posições do 'geral' se os IDs baterem (ex: prefeito, gabinete, etc).
        const layoutGeral = await getCustomPositions('geral');

        if (layoutGeral && layoutGeral.length > 0) {
            const posMap = new Map(layoutGeral.map(p => [p.id, p]));

            geral.cargos.forEach(cargo => {
                const custom = posMap.get(cargo.id);
                if (custom) {
                    cargo.position = (custom as any).position;
                    // Preservar estilo se houver, EXCETO para nós fixos (Padrão e Funcional)
                    const fixedIds = [
                        'prefeito', 'gabinete', 'subprefeitura-1', 'subprefeitura-2', 'subprefeitura-3', 'subprefeitura-4',
                        'prefeito-cargo', 'gabinete-cargo', 'subprefeitura-1-cargo', 'subprefeitura-2-cargo', 'subprefeitura-3-cargo', 'subprefeitura-4-cargo'
                    ];
                    const isFixed = fixedIds.includes(cargo.id);

                    if (!isFixed && (custom as any).customStyle && Object.keys((custom as any).customStyle).length > 0) {
                        cargo.customStyle = (custom as any).customStyle;
                        cargo.style = (custom as any).customStyle;
                    }
                }
            });
        }

        // 7. Salvar (opcional, para cache)
        await saveOrganogramaGeral('funcional', geral);

        return geral;
    } catch (e) {
        console.error('Erro ao agregar organograma geral funcional:', e);
        throw e;
    }
};

// ==========================================
// GERENCIAMENTO GLOBAL DE TIPOS DE SETOR
// ==========================================

export const listTiposSetor = async () => {
    try {
        const rows = await dbAsync.all('SELECT * FROM tipos_setor ORDER BY nome ASC');
        // Inicializar se estiver vazio
        if (rows.length === 0) {
            await initializeTiposSetor();
            return await listTiposSetor();
        }
        return rows.map(r => ({
            ...r,
            hierarquias: r.hierarquias.split(',').map(h => h.trim())
        }));
    } catch (error) {
        console.error('Erro ao listar tipos de setor:', error);
        throw error;
    }
};

const initializeTiposSetor = async () => {
    const initialSetorTypes = {
        '0': ['Assessoria', 'Gabinete', 'Consultoria'],
        '0.5': ['Subprefeitura'],
        '1': ['Secretaria', 'Presidência', 'Procuradoria'],
        '2': ['Superintendência', 'Subprocuradoria'],
        '3': ['Subsecretaria'],
        '4,5,6,7,8,9,10': ['Diretoria', 'Gerência', 'Coordenação', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo']
    };

    try {
        await dbAsync.run("BEGIN TRANSACTION");
        for (const [hierarquias, nomes] of Object.entries(initialSetorTypes)) {
            for (const nome of nomes) {
                // Evitar duplicatas se o nome já estiver em outra hierarquia (Assessor(a) aparece em 0 e 4)
                const existing = await dbAsync.get('SELECT id FROM tipos_setor WHERE nome = ?', [nome]);
                if (existing) continue;

                await dbAsync.run(
                    'INSERT INTO tipos_setor (id, nome, hierarquias) VALUES (?, ?, ?)',
                    [uuidv4(), nome, hierarquias]
                );
            }
        }
        await dbAsync.run("COMMIT");
        console.log('✅ [SQLite] Tabela tipos_setor inicializada com padrões.');
    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error('Erro ao inicializar tipos de setor:', error);
    }
};

export const upsertTipoSetor = async (tipoData) => {
    const { id, nome, hierarquias, oldNome } = tipoData;
    const hString = Array.isArray(hierarquias) ? hierarquias.join(',') : hierarquias;

    try {
        await dbAsync.run("BEGIN TRANSACTION");

        // Verificar se já existe pelo nome (para evitar duplicidade no insert ou permitir update inteligente)
        const existingByName = await dbAsync.get('SELECT id FROM tipos_setor WHERE nome = ?', [nome]);

        // Se tem ID, é um UPDATE explícito via edição
        if (id) {
            // Se estiver tentando renomear para um nome que já existe (e não é ele mesmo)
            if (existingByName && existingByName.id !== id) {
                throw new Error(`O tipo de setor '${nome}' já existe.`);
            }

            await dbAsync.run(
                'UPDATE tipos_setor SET nome = ?, hierarquias = ? WHERE id = ?',
                [nome, hString, id]
            );

            // Refletir mudança de nome globalmente
            if (oldNome && oldNome !== nome) {
                await dbAsync.run(
                    'UPDATE setores SET nome = ? WHERE nome = ?',
                    [nome, oldNome]
                );
                await dbAsync.run(
                    'UPDATE setores SET tipo = ? WHERE tipo = ?',
                    [nome, oldNome]
                );
            }
        } else {
            // Create (ou Update implícito se já existe o nome)
            if (existingByName) {
                // Se já existe, vamos atualizar as hierarquias deste registro existente
                console.log(`[SQLite] Tipo '${nome}' já existe. Atualizando hierarquias...`);
                await dbAsync.run(
                    'UPDATE tipos_setor SET hierarquias = ? WHERE id = ?',
                    [hString, existingByName.id]
                );
            } else {
                // Insert real
                await dbAsync.run(
                    'INSERT INTO tipos_setor (id, nome, hierarquias) VALUES (?, ?, ?)',
                    [uuidv4(), nome, hString]
                );
            }
        }

        await dbAsync.run("COMMIT");
        return { success: true };
    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error('Erro ao salvar tipo de setor:', error);
        throw error;
    }
};

export const deleteTipoSetor = async (id) => {
    try {
        await dbAsync.run('DELETE FROM tipos_setor WHERE id = ?', [id]);
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar tipo de setor:', error);
        throw error;
    }
};

export const listUniqueSetores = async () => {
    // Redireciona para listTiposSetor para manter consistência
    const tipos = await listTiposSetor();
    return tipos.map(t => t.nome);
};

export const renameSectorGlobally = async (oldName, newName) => {
    try {
        await dbAsync.run("BEGIN TRANSACTION");

        // Atualizar no dicionário
        await dbAsync.run(
            'UPDATE tipos_setor SET nome = ? WHERE nome = ?',
            [newName, oldName]
        );

        // Atualizar nas instâncias
        await dbAsync.run(
            'UPDATE setores SET nome = ?, updated_at = CURRENT_TIMESTAMP WHERE nome = ?',
            [newName, oldName]
        );

        await dbAsync.run("COMMIT");
        console.log(`[SQLite] Setor '${oldName}' renomeado para '${newName}' globalmente.`);
        return { success: true };
    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error('Erro ao renomear setor globalmente:', error);
        throw error;
    }
};

export const deleteSectorGlobally = async (sectorName) => {
    try {
        await dbAsync.run("BEGIN TRANSACTION");

        // Remover do dicionário
        await dbAsync.run('DELETE FROM tipos_setor WHERE nome = ?', [sectorName]);

        // Remover instâncias
        await dbAsync.run('DELETE FROM setores WHERE nome = ?', [sectorName]);

        await dbAsync.run("COMMIT");
        console.log(`[SQLite] Setor '${sectorName}' removido globalmente.`);
        return { success: true };
    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error('Erro ao deletar setor globalmente:', error);
        throw error;
    }
};

/**
 * Lista todos os prefixos de cargos ordenados.
 */
export const listPrefixos = async () => {
    try {
        const rows = await dbAsync.all('SELECT * FROM prefixos_cargos ORDER BY ordem ASC, nome ASC');
        return rows;
    } catch (error) {
        console.error('Erro ao listar prefixos:', error);
        throw error;
    }
};

/**
 * Adiciona um novo prefixo de cargo.
 */
export const addPrefixo = async (nome) => {
    try {
        const result = await dbAsync.run(
            'INSERT INTO prefixos_cargos (nome, ordem) VALUES (?, (SELECT COALESCE(MAX(ordem), 0) + 1 FROM prefixos_cargos))',
            [nome]
        );
        return { id: (result as any).lastID, nome };
    } catch (error) {
        console.error('Erro ao adicionar prefixo:', error);
        throw error;
    }
};

/**
 * Atualiza um prefixo de cargo.
 */
export const updatePrefixo = async (id, nome) => {
    try {
        await dbAsync.run(
            'UPDATE prefixos_cargos SET nome = ? WHERE id = ?',
            [nome, id]
        );
        return { id, nome };
    } catch (error) {
        console.error('Erro ao atualizar prefixo:', error);
        throw error;
    }
};

/**
 * Remove um prefixo de cargo.
 */
export const deletePrefixo = async (id) => {
    try {
        await dbAsync.run('DELETE FROM prefixos_cargos WHERE id = ?', [id]);
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar prefixo:', error);
        throw error;
    }
};
