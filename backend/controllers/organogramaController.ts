import * as storageService from '../services/sqliteStorageService.js';
import * as fileSystem from '../utils/fileSystem.js';
import { hashPassword, verifyPassword as verifyPasswordHash } from '../utils/auth.js';
import * as customPositionsService from '../services/customPositionsService.js';
import * as layoutService from '../services/layoutService.js';

// Helper para recalcular hierarquia automaticamente (Lógica Auto-Level)
const recalculateHierarchy = (setores: any[]) => {
    if (!setores || !Array.isArray(setores)) return setores;

    const setoresMap = new Map();
    const childrenMap = new Map();
    const roots = [];

    // 1. Indexar e achar raízes
    setores.forEach(s => {
        setoresMap.set(s.id, s);
        // Normalizar is_assessoria: Garante booleano ou inferência pelo nível 0 antigo
        s.is_assessoria = !!s.is_assessoria || (s.hierarquia === '0' || s.hierarquia === 0);

        // Normalização de chaves de pai (parentId vs parent_id)
        const pid = s.parentId || s.parent_id;

        if (!pid) {
            roots.push(s);
        } else {
            if (!childrenMap.has(pid)) childrenMap.set(pid, []);
            childrenMap.get(pid).push(s);
        }
    });

    // Se houver setores com pai inexistente, tratar como raiz (fallback para órfãos)
    setores.forEach(s => {
        const pid = s.parentId || s.parent_id;
        if (pid && !setoresMap.has(pid) && !roots.includes(s)) {
            roots.push(s);
        }
    });

    // 2. BFS para propagar níveis
    const queue = [...roots];

    // Configurar raízes
    roots.forEach(root => {
        if (root.is_assessoria) {
            root.hierarquia = '0';
        } else {
            // Se for explicitamente Subprefeitura (0.5), mantém. Se não, assume 1 (Raiz padrão).
            const h = parseFloat(root.hierarquia);
            root.hierarquia = (h === 0.5) ? '0.5' : '1';
        }
    });

    while (queue.length > 0) {
        const current = queue.shift();
        // Garantir que current.hierarquia é string tratável
        const currentH = parseFloat(current.hierarquia);

        // Normalizar ID para buscar filhos
        const currentId = current.id;
        const children = childrenMap.get(currentId) || [];

        children.forEach(child => {
            if (child.is_assessoria) {
                child.hierarquia = '0';
            } else {
                // Cálculo de nível automático: Base + 1
                // Trata subprefeitura (0.5) e assessoria (0) como base 0 para virar 1
                let baseH = currentH;
                if (baseH < 1) baseH = 0;

                let nextH = Math.floor(baseH) + 1;
                // Limite máximo de 10
                if (nextH > 10) nextH = 10;

                child.hierarquia = String(nextH);
            }
            queue.push(child);
        });
    }

    return setores;
};

// Criar Organograma Estrutural Novo (Salvar)
// Route chama: createOrganogramaEstrutural (OK)
// Route chama: updateOrganogramaEstrutural (Alias necessário)
export const createOrganogramaEstrutural = async (req, res, next) => {
    try {
        const { tamanhoFolha, setores } = req.body;
        let { nomeOrgao } = req.body;

        // APLICAR CÁLCULO AUTOMÁTICO DE HIERARQUIA
        // Ignora o que vem do front (exceto is_assessoria) e recria os níveis
        const setoresCalculados = recalculateHierarchy(setores);

        if (!nomeOrgao && req.params.nomeOrgao) {
            nomeOrgao = decodeURIComponent(req.params.nomeOrgao);
        }

        if (!nomeOrgao || !setores) {
            return res.status(400).json({ success: false, message: 'Dados incompletos' });
        }

        const orgaoIdSlug = fileSystem.normalizeOrgaoId(nomeOrgao);

        // Validação de Duplicidade CORRETA
        const existingOrgaoId = await storageService.getOrgaoIdByName(nomeOrgao) || orgaoIdSlug;

        // RECUPERAÇÃO DE NOME INTELIGENTE (Smart Retrieval V2 - Heurística de Qualidade)
        // Objetivo: Impedir que um nome rico (ex: "Conselho de Contribuintes") seja sobrescrito por um slug ("conselho_de_contribuintes")
        if (existingOrgaoId) {
            const existingMeta = await storageService.getOrgaoMetadata(existingOrgaoId);
            if (existingMeta && existingMeta.orgao) {
                const currentName = existingMeta.orgao;
                const inputName = nomeOrgao;

                // Heurística: O nome atual tem formatação humana (Maiúsculas ou Espaços)?
                const hasHumanFormat = /[A-Z]/.test(currentName) || /\s/.test(currentName);

                // Heurística: O input parece um slug técnico (só minúsculas, números e underscore)?
                const isTechnicalSlug = /^[a-z0-9_]+$/.test(inputName.trim());

                // Se temos um nome formatado guardado e estão tentando salvar um slug técnico...
                // IGNORAMOS o slug e usamos o nome guardado.
                if (hasHumanFormat && isTechnicalSlug) {
                    console.log(`[Controller] 🛡️ Smart Name: Input '${inputName}' ignorado em favor de '${currentName}'`);
                    nomeOrgao = currentName;
                } else if (inputName === orgaoIdSlug && currentName !== orgaoIdSlug) {
                    // Fallback para caso simples de igualdade exata
                    nomeOrgao = currentName;
                }
            }
        }

        // Buscar se já existe organograma estrutural para este órgão
        const existingSetores = await storageService.getOrgaoEstrutural(existingOrgaoId);
        const hasExistingContent = Array.isArray(existingSetores) && existingSetores.length > 0;

        console.log(`[DUPLICATE CHECK] Órgão: "${nomeOrgao}" | Slug: "${orgaoIdSlug}"`);
        console.log(`[DUPLICATE CHECK] Organograma existente: ${hasExistingContent ? 'SIM (com ' + existingSetores.length + ' setores)' : 'NÃO'}`);

        if (hasExistingContent) {
            console.warn(`[DUPLICATE CHECK] Bloqueando: Já existe organograma estrutural para ${nomeOrgao}`);
            return res.status(400).json({ success: false, message: 'Este órgão já possui um organograma estrutural!' });
        }

        // Verificar se usuário comum pode criar organograma para este setor
        if (req.user && req.user.tipo !== 'admin') {
            const userSector = req.user.setor.toUpperCase();

            // Verificar se o órgão pertence ao setor do usuário
            const meta = await storageService.getOrgaoMetadata(orgaoIdSlug);
            if (meta) {
                const orgaoCategoria = (meta as any).categoria ? (meta as any).categoria.toUpperCase() : '';

                if (orgaoCategoria !== userSector &&
                    !orgaoCategoria.includes(userSector) &&
                    !userSector.includes(orgaoCategoria)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Acesso negado. Você só pode criar organogramas para órgãos do seu setor.'
                    });
                }
            }
        }

        const orgaoId = orgaoIdSlug;

        // Função recursiva para verificar se existe algum posicionamento customizado na árvore
        const checkHasPositions = (nodes: any[]): boolean => {
            if (!nodes || !Array.isArray(nodes)) return false;
            return nodes.some(s =>
                (s.position && (s.position.x !== 0 || s.position.y !== 0)) ||
                (s.children && s.children.length > 0 && checkHasPositions(s.children))
            );
        };

        const temPosicoes = checkHasPositions(setoresCalculados);
        console.log(`[PERSISTENCE AUDIT] Salvando '${nomeOrgao}': temPosicoes=${temPosicoes}`);

        let setoresParaSalvar = setoresCalculados;

        if (!temPosicoes) {
            console.log(`[PERSISTENCE AUDIT] Calculando AUTO-LAYOUT para '${nomeOrgao}' (sem posições prévias)`);
            const setoresComPosicao = layoutService.calculateHierarchicalLayout(setoresCalculados);
            setoresParaSalvar = layoutService.centerLayout(setoresComPosicao);
        } else {
            console.log(`[PERSISTENCE AUDIT] Respeitando LAYOUT DO FRONTEND para '${nomeOrgao}'`);
        }

        const orgaoData = {
            id: orgaoId,
            orgao: nomeOrgao,
            tamanhoFolha: tamanhoFolha || 'A4',
            setores: setoresParaSalvar
        };

        await storageService.createOrUpdateOrgao(orgaoData);

        res.json({ success: true, message: 'Organograma salvo com sucesso!' });
    } catch (error) {
        next(error);
    }
};
// Handler de UPDATE para organograma estrutural (não verifica duplicidade)
export const updateOrganogramaEstrutural = async (req, res, next) => {
    try {
        const { nomeOrgao } = req.params; // Nome vem da URL
        const { tamanhoFolha, setores } = req.body;

        // APLICAR CÁLCULO AUTOMÁTICO DE HIERARQUIA
        const setoresCalculados = recalculateHierarchy(setores);

        const decodedName = decodeURIComponent(nomeOrgao);
        console.log(`[UPDATE] Atualizando organograma estrutural: "${decodedName}"`);

        if (!setores || !Array.isArray(setores)) {
            return res.status(400).json({ success: false, message: 'Setores inválidos' });
        }

        const orgaoIdSlug = fileSystem.normalizeOrgaoId(decodedName);

        let orgaoId = await storageService.getOrgaoIdByName(decodedName);

        // CORREÇÃO ID vs NOME: Se não achou por nome, verifica se decodedName é o ID direto
        if (!orgaoId) {
            const maybeOrgao = await storageService.getOrgaoById(decodedName);
            if (maybeOrgao) orgaoId = maybeOrgao.id;
        }

        if (!orgaoId) orgaoId = orgaoIdSlug;

        // HEURÍSTICA DE PROTEÇÃO DE NOME (Auto-Save Fix)
        if (req.user && req.user.tipo !== 'admin') {
            const userOrgaoId = String(req.user.orgao_id || '').trim();
            const targetOrgaoId = String(orgaoId || '').trim();

            if (userOrgaoId !== targetOrgaoId) {
                console.warn(`[AUTH] Update Estrutural Negado: User '${userOrgaoId}' vs Target '${targetOrgaoId}'`);
                return res.status(403).json({ success: false, message: 'Acesso negado. Você só pode editar o organograma do seu próprio órgão.' });
            }
        }
        // O frontend envia o slug na URL durante o auto-save.
        // Se o nome do banco for "Rico" e o da URL for "Pobre (Slug)", preservamos o do banco.
        let finalName = decodedName;
        if (orgaoId) {
            const existingMeta = await storageService.getOrgaoMetadata(orgaoId);
            if (existingMeta && existingMeta.orgao) {
                const currentName = existingMeta.orgao;
                const inputName = decodedName;

                const hasHumanFormat = /[A-Z]/.test(currentName) || /\s/.test(currentName);
                const isTechnicalSlug = /^[a-z0-9_]+$/.test(inputName.trim());

                if (hasHumanFormat && isTechnicalSlug) {
                    console.log(`[UPDATE] 🛡️ Smart Name: URL Slug '${inputName}' ignorado em favor de '${currentName}'`);
                    finalName = currentName;
                }
            }
        }

        // Função recursiva para verificar se existe algum posicionamento customizado na árvore
        const checkHasPositions = (nodes: any[]): boolean => {
            if (!nodes || !Array.isArray(nodes)) return false;
            return nodes.some(s =>
                (s.position && (s.position.x !== 0 || s.position.y !== 0)) ||
                (s.children && s.children.length > 0 && checkHasPositions(s.children))
            );
        };

        const temPosicoes = checkHasPositions(setoresCalculados);
        console.log(`[UPDATE] Salvando '${finalName}': temPosicoes=${temPosicoes}`);

        let setoresParaSalvar = setoresCalculados;

        if (!temPosicoes) {
            console.log(`[UPDATE] Calculando AUTO-LAYOUT para '${decodedName}' (sem posições prévias)`);
            const setoresComPosicao = layoutService.calculateHierarchicalLayout(setoresCalculados);
            setoresParaSalvar = layoutService.centerLayout(setoresComPosicao);
        } else {
            console.log(`[UPDATE] Respeitando LAYOUT DO FRONTEND para '${decodedName}'`);
        }

        const orgaoData = {
            id: orgaoId,
            orgao: finalName,
            tamanhoFolha: tamanhoFolha || 'A4',
            setores: setoresParaSalvar
        };

        await storageService.createOrUpdateOrgao(orgaoData);

        res.json({ success: true, message: 'Organograma atualizado com sucesso!' });
    } catch (error) {
        next(error);
    }
};

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

        // Verificar se usuário comum tem acesso a este órgão
        if (req.user && req.user.tipo !== 'admin') {
            const userSector = req.user.setor.toUpperCase();
            const orgaoCategoria = (metadata as any).categoria ? (metadata as any).categoria.toUpperCase() : '';

            if (orgaoCategoria !== userSector &&
                !orgaoCategoria.includes(userSector) &&
                !userSector.includes(orgaoCategoria)) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado. Você só pode visualizar órgãos do seu próprio setor.'
                });
            }
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
                organogramaEstrutural: estrutura && estrutura.length > 0 ? {
                    tamanhoFolha: tamanhoFolha,
                    setores: estrutura
                } : null,
                organogramasFuncoes: organogramasFuncoes
            },
            filtered: req.user && req.user.tipo !== 'admin'
        });
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


// Route chama: getAllOrganogramas
// Route chama: getAllOrganogramas
export async function getAllOrganogramas(req, res, next) {
    try {
        const listaBasica = await storageService.listOrgaos();

        // Aplicar filtro por setor para usuários comuns
        let listaFiltrada = listaBasica;
        const isFiltered = req.user && req.user.tipo !== 'admin';

        if (isFiltered) {
            if (req.user.orgao_id) {
                // Filtrar pelo ID do órgão vinculado ao usuário
                listaFiltrada = listaBasica.filter(orgao => String(orgao.id) === String(req.user.orgao_id));
            } else if (req.user.setor) {
                const userSector = req.user.setor.toUpperCase();
                listaFiltrada = listaBasica.filter(orgao => {
                    const orgaoCategoria = orgao.categoria ? orgao.categoria.toUpperCase() : '';
                    return orgaoCategoria === userSector ||
                        orgaoCategoria.includes(userSector) ||
                        userSector.includes(orgaoCategoria);
                });
            } else {
                // Sem setor e sem órgão definido
                listaFiltrada = [];
            }
        }

        // Enriquecer com dados estruturais e funcionais para o Dashboard
        const listaCompleta = await Promise.all(listaFiltrada.map(async (orgao) => {
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
        res.json({
            success: true,
            data: organogramasFiltrados,
            filtered: isFiltered
        });
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

        // Aplicar filtro por setor para usuários comuns
        let filteredSetores = data.setores;
        if (req.user && req.user.tipo !== 'admin') {
            const userSector = req.user.setor.toUpperCase();
            filteredSetores = data.setores.filter(setor => {
                try {
                    if (!setor || !setor.nome) return false;
                    const setorUpper = String(setor.nome).toUpperCase();
                    return setorUpper === userSector ||
                        setorUpper.includes(userSector) ||
                        userSector.includes(setorUpper);
                } catch (error) {
                    console.warn('Erro ao filtrar setor:', error);
                    return false;
                }
            });
        }

        // Envelopar no formato esperado pelo OrganogramaCanvas.jsx
        // Canvas espera: { organogramaEstrutural: { setores: [...] } }
        const wrappedData = {
            orgao: data.orgao || 'Prefeitura Municipal de Duque de Caxias',
            organogramaEstrutural: {
                setores: filteredSetores || [],
                tamanhoFolha: 'A3'
            },
            estatisticas: data.estatisticas || {}
        };

        res.json({
            success: true,
            data: wrappedData,
            filtered: req.user && req.user.tipo !== 'admin'
        });
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

        // CORREÇÃO FK: Buscar ID real do órgão no banco antes de normalizar
        let orgaoId = await storageService.getOrgaoIdByName(nomeOrgao);

        // CORREÇÃO ID vs NOME: Se não achou por nome, verifica se nomeOrgao é o ID direto
        if (!orgaoId) {
            const maybeOrgao = await storageService.getOrgaoById(nomeOrgao);
            if (maybeOrgao) orgaoId = maybeOrgao.id;
        }

        if (!orgaoId) {
            console.warn(`[CREATE FUNCIONAL] ID não encontrado por nome/id para '${nomeOrgao}'. Tentando normalização.`);
            orgaoId = fileSystem.normalizeOrgaoId(nomeOrgao);
        } else {
            console.log(`[CREATE FUNCIONAL] ID resolvido com sucesso: '${nomeOrgao}' -> '${orgaoId}'`);
        }

        // AUTH CHECK: Usuário comum só pode editar seu órgão
        if (req.user && req.user.tipo !== 'admin') {
            const userOrgaoId = String(req.user.orgao_id || '').trim();
            const targetOrgaoId = String(orgaoId || '').trim();

            if (userOrgaoId !== targetOrgaoId) {
                console.warn(`[AUTH] Update Funcional Negado: User '${userOrgaoId}' vs Target '${targetOrgaoId}'`);
                return res.status(403).json({ success: false, message: 'Acesso negado. Você só pode editar o organograma do seu próprio órgão.' });
            }
        }

        // Validação de Duplicidade CORRETA (Funcional): Verificar se já existe organograma FUNCIONAL
        // Um órgão pode ter organograma estrutural sem ter funcional, então verificamos especificamente
        if (req.method === 'POST') {
            const existingFuncional = await storageService.listOrganogramasFuncoes(orgaoId);
            const hasExistingFuncional = Array.isArray(existingFuncional) && existingFuncional.length > 0;

            console.log(`[DUPLICATE CHECK FUNCIONAL] Órgão: "${nomeOrgao}" | ID: "${orgaoId}"`);
            console.log(`[DUPLICATE CHECK FUNCIONAL] Existe funcional: ${hasExistingFuncional ? 'SIM (com ' + existingFuncional.length + ' cargos)' : 'NÃO'}`);

            if (hasExistingFuncional) {
                return res.status(400).json({
                    success: false,
                    message: 'Este órgão já possui um organograma funcional!'
                });
            }
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

        // Aplicar filtro por setor para usuários comuns
        let filteredCargos = data.cargos || [];
        if (req.user && req.user.tipo !== 'admin') {
            const userSector = req.user.setor.toUpperCase();
            filteredCargos = data.cargos.filter(cargo => {
                if (!cargo) return false;
                const cargoSector = cargo.setor ? cargo.setor.toUpperCase() : '';
                return cargoSector === userSector ||
                    cargoSector.includes(userSector) ||
                    userSector.includes(cargoSector);
            });
        }

        res.json({
            success: true,
            data: {
                organogramaFuncional: {
                    cargos: filteredCargos,
                    tamanhoFolha: 'A3'
                },
                occupants: data.occupants || {}
            },
            filtered: req.user && req.user.tipo !== 'admin'
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

/**
 * Deleta organograma ESTRUTURAL (remove estrutural + funcional, mantém órgão na config)
 * Mensagem de aviso severa: "Ao deletar o estrutural, o funcional também será deletado!"
 */
export const deleteOrganogramaEstrutural = async (req, res, next) => {
    try {
        const { nomeOrgao } = req.params;
        const decodedName = decodeURIComponent(nomeOrgao);

        let orgaoId = await storageService.getOrgaoIdByName(decodedName);

        // CORREÇÃO ID vs NOME
        if (!orgaoId) {
            const maybeOrgao = await storageService.getOrgaoById(decodedName);
            if (maybeOrgao) orgaoId = maybeOrgao.id;
        }

        if (!orgaoId) {
            orgaoId = fileSystem.normalizeOrgaoId(decodedName);
        }

        // AUTH CHECK: Usuário comum só pode deletar seu órgão
        if (req.user && req.user.tipo !== 'admin') {
            const userOrgaoId = String(req.user.orgao_id || '').trim();
            const targetOrgaoId = String(orgaoId || '').trim();

            if (userOrgaoId !== targetOrgaoId) {
                console.warn(`[AUTH] Delete Estrutural Negado: User '${userOrgaoId}' vs Target '${targetOrgaoId}'`);
                return res.status(403).json({ success: false, message: 'Acesso negado. Você só pode gerenciar o seu próprio órgão.' });
            }
        }

        console.log(`[DELETE] Deletando organograma ESTRUTURAL (e funcional) de ${decodedName}`);
        await storageService.clearOrgaoContent(orgaoId);
        res.json({ success: true, message: 'Organograma estrutural e funcional deletados. O órgão permanece na lista de configuração.' });
    } catch (e) { next(e); }
};

/**
 * Deleta APENAS organograma FUNCIONAL (mantém estrutural e configuração)
 */
export const deleteOrganogramaFuncional = async (req, res, next) => {
    try {
        const { nomeOrgao } = req.params;
        const decodedName = decodeURIComponent(nomeOrgao);

        let orgaoId = await storageService.getOrgaoIdByName(decodedName);

        // CORREÇÃO ID vs NOME
        if (!orgaoId) {
            const maybeOrgao = await storageService.getOrgaoById(decodedName);
            if (maybeOrgao) orgaoId = maybeOrgao.id;
        }

        if (!orgaoId) {
            orgaoId = fileSystem.normalizeOrgaoId(decodedName);
        }

        // AUTH CHECK: Usuário comum só pode deletar seu órgão
        if (req.user && req.user.tipo !== 'admin') {
            const userOrgaoId = String(req.user.orgao_id || '').trim();
            const targetOrgaoId = String(orgaoId || '').trim();

            if (userOrgaoId !== targetOrgaoId) {
                console.warn(`[AUTH] Delete Funcional Negado: User '${userOrgaoId}' vs Target '${targetOrgaoId}'`);
                return res.status(403).json({ success: false, message: 'Acesso negado. Você só pode gerenciar o seu próprio órgão.' });
            }
        }

        console.log(`[DELETE] Deletando APENAS organograma FUNCIONAL de ${decodedName}`);
        await storageService.clearOrgaoFuncional(orgaoId);
        res.json({ success: true, message: 'Organograma funcional deletado. O estrutural e a configuração permanecem.' });
    } catch (e) { next(e); }
};

// Alias legado (mesmo comportamento que deleteOrganogramaEstrutural)
export const deleteOrganograma = deleteOrgao;

