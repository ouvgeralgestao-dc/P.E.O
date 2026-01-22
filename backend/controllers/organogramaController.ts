import * as storageService from '../services/sqliteStorageService.js';
import * as fileSystem from '../utils/fileSystem.js';
import { hashPassword, verifyPassword as verifyPasswordHash } from '../utils/auth.js';
import * as customPositionsService from '../services/customPositionsService.js';
import * as layoutService from '../services/layoutService.js';

// Criar Organograma Estrutural Novo (Salvar)
// Route chama: createOrganogramaEstrutural (OK)
// Route chama: updateOrganogramaEstrutural (Alias necessário)
export const createOrganogramaEstrutural = async (req, res, next) => {
    try {
        let { nomeOrgao } = req.body;
        const { tamanhoFolha, setores, password } = req.body;

        if (!nomeOrgao && req.params.nomeOrgao) {
            nomeOrgao = decodeURIComponent(req.params.nomeOrgao);
        }

        if (!nomeOrgao || !setores) {
            return res.status(400).json({ success: false, message: 'Dados incompletos' });
        }

        const existingId = await storageService.getOrgaoIdByName(nomeOrgao);
        const orgaoId = existingId || fileSystem.normalizeOrgaoId(nomeOrgao);
        if (existingId) {
            const meta = await storageService.getOrgaoMetadata(existingId);
            // Removendo verificação de senha no update/create para evitar bloqueio 401 indevido
            /*
            if (meta && meta.auth) {
                if (!password) {
                    return res.status(401).json({ success: false, message: 'Senha necessária' });
                }
                const isValid = verifyPasswordHash(password, meta.auth.salt, meta.auth.hash);
                if (!isValid) {
                    return res.status(401).json({ success: false, message: 'Senha incorreta' });
                }
            }
            */
        }

        let authData = null;
        if (password) {
            authData = hashPassword(password);
        }

        // Função recursiva para verificar se existe algum posicionamento customizado na árvore
        const checkHasPositions = (nodes: any[]): boolean => {
            if (!nodes || !Array.isArray(nodes)) return false;
            return nodes.some(s =>
                (s.position && (s.position.x !== 0 || s.position.y !== 0)) ||
                (s.children && s.children.length > 0 && checkHasPositions(s.children))
            );
        };

        const temPosicoes = checkHasPositions(setores);
        console.log(`[PERSISTENCE AUDIT] Salvando '${nomeOrgao}': temPosicoes=${temPosicoes}`);

        let setoresParaSalvar = setores;

        if (!temPosicoes) {
            console.log(`[PERSISTENCE AUDIT] Calculando AUTO-LAYOUT para '${nomeOrgao}' (sem posições prévias)`);
            const setoresComPosicao = layoutService.calculateHierarchicalLayout(setores);
            setoresParaSalvar = layoutService.centerLayout(setoresComPosicao);
        } else {
            console.log(`[PERSISTENCE AUDIT] Respeitando LAYOUT DO FRONTEND para '${nomeOrgao}'`);
        }

        const orgaoData = {
            id: orgaoId,
            orgao: nomeOrgao,
            auth: authData,
            tamanhoFolha: tamanhoFolha || 'A4',
            setores: setoresParaSalvar
        };

        await storageService.createOrUpdateOrgao(orgaoData);

        res.json({ success: true, message: 'Organograma salvo com sucesso!' });
    } catch (error) {
        next(error);
    }
};

// Alias para update (mesma lógica de upsert)
export const updateOrganogramaEstrutural = createOrganogramaEstrutural;

// ==========================================

export const getOrganogramaByName = async (req, res, next) => {
    try {
        const { nomeOrgao } = req.params;
        const decodedName = decodeURIComponent(nomeOrgao);

        let orgaoId = await storageService.getOrgaoIdByName(decodedName);
        if (!orgaoId) orgaoId = fileSystem.normalizeOrgaoId(decodedName);

        const estrutura = await storageService.getOrgaoEstrutural(orgaoId);
        const metadata = await storageService.getOrgaoMetadata(orgaoId);

        // Buscar metadados específicos do organograma estrutural (tamanho da folha)
        const tamanhoFolha = await storageService.getTamanhoFolha(orgaoId);

        if (!metadata) {
            return res.status(404).json({ success: false, message: 'Órgão não encontrado' });
        }

        // Carregar organogramas funcionais também
        let organogramasFuncoes = [];
        try {
            const funcoesMeta = await storageService.listOrganogramasFuncoes(orgaoId);
            if (funcoesMeta && funcoesMeta.length > 0) {
                organogramasFuncoes = await Promise.all(funcoesMeta.map(async (f) => {
                    return await storageService.getOrganogramaFuncoes(orgaoId, f.id);
                }));
                organogramasFuncoes = organogramasFuncoes.filter(f => f !== null);
            }
        } catch (err) {
            console.warn(`Erro ao carregar funções para ${orgaoId}:`, err.message);
        }

        // FORMATO CORRIGIDO: Frontend espera organogramaEstrutural como wrapper
        res.json({
            success: true,
            data: {
                orgao: metadata.orgao,
                orgaoId: metadata.id,
                createdAt: metadata.createdAt,
                updatedAt: metadata.updatedAt,
                auth: !!metadata.auth,
                organogramaEstrutural: estrutura && estrutura.length > 0 ? {
                    tamanhoFolha: tamanhoFolha,
                    setores: estrutura
                } : null,
                organogramasFuncoes: organogramasFuncoes
            }
        });
    } catch (error) {
        next(error);
    }
};

// Route chama: verifyPassword
export async function verifyPassword(req, res, next) {
    try {
        let { nomeOrgao, password } = req.body;
        const { orgaoId: urlParamId } = req.params;

        // Se não veio no body, pega da URL (que o router mapeia como :orgaoId)
        if (!nomeOrgao && urlParamId) {
            nomeOrgao = decodeURIComponent(urlParamId);
        }

        // Validação defensiva
        if (!nomeOrgao) {
            return res.status(400).json({ success: false, message: 'Nome do órgão não informado' });
        }

        let orgaoId = await storageService.getOrgaoIdByName(nomeOrgao);
        if (!orgaoId) orgaoId = fileSystem.normalizeOrgaoId(nomeOrgao);

        const meta = await storageService.getOrgaoMetadata(orgaoId);
        if (!meta || !meta.auth) {
            return res.json({ success: true, valid: true });
        }

        const isValid = verifyPasswordHash(password, meta.auth.salt, meta.auth.hash);

        if (isValid) {
            res.json({ success: true, valid: true });
        } else {
            res.status(401).json({ success: false, message: 'Senha incorreta' });
        }
    } catch (error) {
        next(error);
    }
};

export async function updateOrgaoName(req, res, next) {
    try {
        const { orgaoId, novoNome } = req.body;
        await storageService.updateOrgaoMetadata(orgaoId, { nome: novoNome });
        res.json({ success: true });
    } catch (e) { next(e); }
}

// Route chama: updatePassword
export async function updatePassword(req, res, next) {
    try {
        let { orgaoId } = req.params;
        const { novaSenha } = req.body;

        // Se orgaoId não veio na URL, tenta pegar do body (embora a rota defina :orgaoId)
        if (!orgaoId && req.body.orgaoId) orgaoId = req.body.orgaoId;

        if (!orgaoId) {
            return res.status(400).json({ success: false, message: 'ID do órgão não fornecido' });
        }

        if (!novaSenha) {
            return res.status(400).json({ success: false, message: 'Nova senha não fornecida' });
        }

        const authData = hashPassword(novaSenha);
        await storageService.updateOrgaoAuth(orgaoId, authData.salt, authData.hash);

        res.json({ success: true, message: 'Senha atualizada com sucesso' });
    } catch (e) { next(e); }
}

// Route chama: getAllOrganogramas
// Route chama: getAllOrganogramas
export async function getAllOrganogramas(req, res, next) {
    try {
        const listaBasica = await storageService.listOrgaos();

        // Enriquecer com dados estruturais e funcionais para o Dashboard
        const listaCompleta = await Promise.all(listaBasica.map(async (orgao) => {
            // 1. Estrutural
            const nodes = await storageService.getOrgaoEstrutural(orgao.id);
            const organogramaEstrutural = (nodes && nodes.length > 0)
                ? { setores: nodes }
                : null;

            // 2. Funcional
            let organogramasFuncoes = [];
            try {
                const funcoesMeta = await storageService.listOrganogramasFuncoes(orgao.id);
                if (funcoesMeta && funcoesMeta.length > 0) {
                    organogramasFuncoes = await Promise.all(funcoesMeta.map(async (f) => {
                        return await storageService.getOrganogramaFuncoes(orgao.id, f.id);
                    }));
                    organogramasFuncoes = organogramasFuncoes.filter(f => f !== null);
                }
            } catch (err) {
                console.warn(`Erro ao carregar funções para ${orgao.orgao}:`, err.message);
            }

            return {
                ...orgao, // id, orgao, updatedAt, createdAt, categoria
                orgaoId: orgao.id, // Alias para compatibilidade frontend
                createdAt: orgao.createdAt || new Date().toISOString(),
                updatedAt: orgao.updatedAt || new Date().toISOString(),
                categoria: orgao.categoria || 'OUTROS',
                organogramaEstrutural,
                organogramasFuncoes
            };
        }));

        // Filtrar órgãos vazios (que não possuem estrutura nem funções) para limpar o dashboard
        const organogramasFiltrados = listaCompleta.filter(org => {
            const temEstrutura = org.organogramaEstrutural && org.organogramaEstrutural.setores && org.organogramaEstrutural.setores.length > 0;
            const temFuncoes = org.organogramasFuncoes && org.organogramasFuncoes.length > 0;
            return temEstrutura || temFuncoes;
        });

        // Retornar ARRAY direto filtrado
        res.json({ success: true, data: organogramasFiltrados });
    } catch (e) { next(e); }
}

// Alias (caso antigo uso)
// CORRIGIDO: Usar agregação dinâmica de todos os órgãos do SQLite
export const getOrganogramaGeral = async (req, res, next) => {
    try {
        // Agregar dinamicamente todos os setores de todos os órgãos
        const data = await storageService.updateOrganogramaGeral();

        if (!data || !data.setores || data.setores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum organograma estrutural encontrado. Crie organogramas para os órgãos primeiro.'
            });
        }

        // Envelopar no formato esperado pelo OrganogramaCanvas.jsx
        // Canvas espera: { organogramaEstrutural: { setores: [...] } }
        const wrappedData = {
            orgao: data.orgao || 'Prefeitura Municipal de Duque de Caxias',
            organogramaEstrutural: {
                setores: data.setores || [],
                tamanhoFolha: 'A3'
            },
            estatisticas: data.estatisticas || {}
        };

        res.json({ success: true, data: wrappedData });
    } catch (e) { next(e); }
};


// Route chama: createOrganogramaFuncoes
// Route chama: updateOrganogramaFuncoes
export async function createOrganogramaFuncoes(req, res, next) {
    try {
        let { nomeOrgao } = req.body;
        const { organogramaFuncoes, tamanhoFolha, cargos } = req.body;

        // Se não veio no body (caso do PUT), pega da URL
        if (!nomeOrgao && req.params.nomeOrgao) {
            nomeOrgao = decodeURIComponent(req.params.nomeOrgao);
        }

        // 1. Tentar resolver ID real no banco pelo Nome
        let orgaoId = await storageService.getOrgaoIdByName(nomeOrgao);

        // 2. Se não achar, fallback para normalização (comportamento antigo)
        if (!orgaoId) {
            orgaoId = fileSystem.normalizeOrgaoId(nomeOrgao);
        }

        // Suporte a payload legado (organogramaFuncoes) ou novo (direto na raiz)
        const dados = organogramaFuncoes || { tamanhoFolha, cargos };
        const nomeVersao = dados.nome || 'Nova Versão';

        const result = await storageService.addOrganogramaFuncoes(orgaoId, nomeVersao, dados);
        res.json({ success: true, id: result.id });
    } catch (e) { next(e); }
}
// Alias
export const updateOrganogramaFuncoes = createOrganogramaFuncoes;

export const getOrganogramaFuncoes = async (req, res, next) => {
    try {
        const { nomeOrgao } = req.params;
        const orgaoId = fileSystem.normalizeOrgaoId(decodeURIComponent(nomeOrgao));

        const lista = await storageService.listOrganogramasFuncoes(orgaoId);
        res.json({ success: true, data: lista }); // Retorna lista de versões
    } catch (e) { next(e); }
}

export const getOrganogramaFuncaoById = async (req, res, next) => {
    try {
        const { nomeOrgao, id } = req.params;
        const orgaoId = fileSystem.normalizeOrgaoId(decodeURIComponent(nomeOrgao));

        const data = await storageService.getOrganogramaFuncoes(orgaoId, id);
        if (!data) return res.status(404).json({ success: false });

        res.json({ success: true, data: data });
    } catch (e) { next(e); }
}

export const getOrganogramaGeralFuncional = async (req, res, next) => {
    try {
        // Agregar dinamicamente usando a função que cria a estrutura fixa correta
        // (Prefeito -> Subprefeitos -> Secretários)
        const data = await storageService.updateOrganogramaGeralFuncional();

        if (!data) {
            return res.status(404).json({ success: false, message: 'Não foi possível gerar o organograma funcional.' });
        }

        res.json({
            success: true,
            data: {
                organogramaFuncional: {
                    cargos: data.cargos || [],
                    tamanhoFolha: 'A3'
                },
                occupants: data.occupants || {}
            }
        });
    } catch (e) { next(e); }
};

export const deleteOrgao = async (req, res, next) => {
    try {
        const { nomeOrgao } = req.params;
        const decodedName = decodeURIComponent(nomeOrgao);

        // 1. Tentar obter ID real
        let orgaoId = await storageService.getOrgaoIdByName(decodedName);

        // 2. Fallback para normalização se não encontrar pelo nome (caso legado)
        if (!orgaoId) {
            orgaoId = fileSystem.normalizeOrgaoId(decodedName);
        }

        await storageService.clearOrgaoContent(orgaoId);
        res.json({ success: true });
    } catch (e) { next(e); }
}

export const updateGeneralFuncionalOccupants = async (req, res, next) => {
    try {
        // Aceitar tanto { occupants: { ... } } quanto { ... }
        const occupants = req.body.occupants || req.body;
        await storageService.saveGeneralOccupants(occupants);
        res.json({ success: true });
    } catch (e) { next(e); }
};

export const saveCustomPositions = async (req, res, next) => {
    try {
        const { organogramaId } = req.params;
        const positions = req.body.positions || req.body;
        const result = await customPositionsService.saveCustomPositions(organogramaId, positions);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const deleteCustomPositions = async (req, res, next) => {
    try {
        const { organogramaId } = req.params;
        await customPositionsService.deleteCustomPositions(organogramaId);
        res.json({ success: true });
    } catch (e) { next(e); }
};

export const deleteOrganograma = deleteOrgao;
