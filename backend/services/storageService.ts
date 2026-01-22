
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { DATA_DIR, ensureDataDir, normalizeOrgaoId, readJSONFile, writeJSONFile, deleteJSONFile } from '../utils/fileSystem.js';

// Definição de caminhos
const CENTRAL_DIR = path.join(DATA_DIR, 'central');
const ORGAOS_DIR = path.join(DATA_DIR, 'orgaos');
const INDEX_FILE = path.join(CENTRAL_DIR, 'index.json');
const GLOBAL_FILE = path.join(CENTRAL_DIR, 'global.json');

// Helper para garantir diretórios base
const ensureBaseDirs = async () => {
    await ensureDataDir();
    if (!existsSync(CENTRAL_DIR)) await fs.mkdir(CENTRAL_DIR, { recursive: true });
    if (!existsSync(ORGAOS_DIR)) await fs.mkdir(ORGAOS_DIR, { recursive: true });
};

// --- LEGACY/REGISTRY: Lista Geral de Órgãos (usado na Configuração) ---
export const readOrgaos = async () => {
    const data = await readJSONFile('orgaos.json');
    return data || [];
};

export const writeOrgaos = async (data) => {
    await writeJSONFile('orgaos.json', data);
};

// --- ÁREA CENTRAL ---

// Inicializa o índice se não existir
export const initCentralDB = async () => {
    await ensureBaseDirs();
    if (!existsSync(INDEX_FILE)) {
        await fs.writeFile(INDEX_FILE, JSON.stringify({ orgaos: [] }, null, 2));
    }
};

// Lê lista de órgãos do índice
export const listOrgaosIndex = async () => {
    await initCentralDB();
    const data = JSON.parse(await fs.readFile(INDEX_FILE, 'utf-8'));
    return data.orgao || data.orgaos || []; // Compatibilidade
};

// Atualiza índice (privado)
const updateIndex = async (newOrgaoData) => {
    const list = await listOrgaosIndex();
    const existingIndex = list.findIndex(o => o.id === newOrgaoData.id);

    if (existingIndex >= 0) {
        list[existingIndex] = { ...list[existingIndex], ...newOrgaoData, updatedAt: new Date().toISOString() };
    } else {
        list.push({ ...newOrgaoData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    await fs.writeFile(INDEX_FILE, JSON.stringify({ orgaos: list }, null, 2));
};

// LER organograma geral
export const getOrganogramaGeral = async () => {
    if (existsSync(GLOBAL_FILE)) {
        return JSON.parse(await fs.readFile(GLOBAL_FILE, 'utf-8'));
    }
    return null;
};

// ATUALIZAR organograma geral
export const saveOrganogramaGeral = async (data) => {
    await ensureBaseDirs();
    await fs.writeFile(GLOBAL_FILE, JSON.stringify(data, null, 2));
};

// --- ÁREA GERAL FUNCIONAL (OCUPANTES FIXOS) ---
const GENERAL_OCCUPANTS_FILE = path.join(CENTRAL_DIR, 'general_occupants.json');

export const getGeneralOccupants = async () => {
    if (existsSync(GENERAL_OCCUPANTS_FILE)) {
        return JSON.parse(await fs.readFile(GENERAL_OCCUPANTS_FILE, 'utf-8'));
    }
    return {};
};

export const saveGeneralOccupants = async (data) => {
    await ensureBaseDirs();
    await fs.writeFile(GENERAL_OCCUPANTS_FILE, JSON.stringify(data, null, 2));
    return data;
};

// --- ÁREA DO ÓRGÃO ---

// Caminho para pasta de um órgão
const getOrgaoDir = (orgaoId) => path.join(ORGAOS_DIR, orgaoId);

// LER Metadados
export const getOrgaoMetadata = async (orgaoId) => {
    const filePath = path.join(getOrgaoDir(orgaoId), 'metadata.json');
    if (!existsSync(filePath)) return null;
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
};

// LER Estrutural
export const getOrgaoEstrutural = async (orgaoId) => {
    const filePath = path.join(getOrgaoDir(orgaoId), 'estrutural.json');
    if (!existsSync(filePath)) return null;
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
};

// LER Funções (Lista)
export const listOrganogramasFuncoes = async (orgaoId) => {
    const funcDir = path.join(getOrgaoDir(orgaoId), 'funcional');
    if (!existsSync(funcDir)) return [];

    const files = await fs.readdir(funcDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const list = [];
    for (const file of jsonFiles) {
        try {
            const content = JSON.parse(await fs.readFile(path.join(funcDir, file), 'utf-8'));
            list.push(content);
        } catch (e) {
            console.error('Erro ao ler funcional', file, e);
        }
    }
    return list;
};

// CRIA OU ATUALIZA ÓRGÃO (Metadados + Index)
export const createOrUpdateOrgao = async (nomeOrgao, organogramaEstrutural = null, password = null) => {
    await ensureBaseDirs();
    const orgaoId = normalizeOrgaoId(nomeOrgao);
    const dir = getOrgaoDir(orgaoId);

    // 1. Criar pasta se não existir
    if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });

    // Ler metadados existentes para preservar dados (Nome, Auth, CreatedAt)
    const existingMeta = await getOrgaoMetadata(orgaoId);

    // 2. Preparar Auth
    let authData = null;
    if (password) {
        authData = hashPassword(password);
    } else if (existingMeta && existingMeta.auth) {
        // Preservar auth existente se não for fornecida nova senha
        authData = existingMeta.auth;
    }

    // 3. Determinar Nome Final (Preservar nome "bonito" se já existir)
    // Se update vier com nomeOrgao igual ao ID (url param), mantemos o nome formatado existente
    const nomeFinal = (existingMeta && existingMeta.nome) ? existingMeta.nome : nomeOrgao;

    // 4. Salvar Metadata
    const metadata = {
        id: orgaoId,
        nome: nomeFinal,
        auth: authData,
        updatedAt: new Date().toISOString(),
        createdAt: existingMeta ? existingMeta.createdAt : new Date().toISOString()
    };

    await fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    // 4. Salvar Estrutural se fornecido
    if (organogramaEstrutural) {
        await fs.writeFile(path.join(dir, 'estrutural.json'), JSON.stringify(organogramaEstrutural, null, 2));
    }

    // 5. Atualizar Index Central
    await updateIndex({
        id: orgaoId,
        nome: nomeOrgao,
        path: `orgaos/${orgaoId}`,
        hasAuth: !!authData
    });

    // Retorna objeto combinado para compatibilidade
    return getOrgaoCompleto(orgaoId);
};

// ADICIONAR Organograma de Funções
export const addOrganogramaFuncoes = async (nomeOrgao, organogramaFuncoes) => {
    const orgaoId = normalizeOrgaoId(nomeOrgao);
    const dir = getOrgaoDir(orgaoId);
    const funcDir = path.join(dir, 'funcional');

    if (!existsSync(funcDir)) await fs.mkdir(funcDir, { recursive: true });

    // Gerar ID
    const funcId = organogramaFuncoes.id || `func_${Date.now()}`;
    const dataToSave = { ...organogramaFuncoes, id: funcId, updatedAt: new Date().toISOString() };
    if (!dataToSave.createdAt) dataToSave.createdAt = new Date().toISOString();

    await fs.writeFile(path.join(funcDir, `${funcId}.json`), JSON.stringify(dataToSave, null, 2));

    // Atualiza metadata timestamp
    const meta = await getOrgaoMetadata(orgaoId);
    if (meta) {
        meta.updatedAt = new Date().toISOString();
        await fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(meta, null, 2));
        await updateIndex({ id: orgaoId, nome: nomeOrgao });
    }

    return getOrgaoCompleto(orgaoId);
};

// COMPATIBILIDADE: Retorna o objeto "monolítico" antigo agregando arquivos
export const getOrgaoCompleto = async (orgaoId) => {
    const meta = await getOrgaoMetadata(orgaoId);
    if (!meta) return null;

    const estrutural = await getOrgaoEstrutural(orgaoId);
    const funcoes = await listOrganogramasFuncoes(orgaoId);

    return {
        ...meta,
        orgao: meta.nome, // Compatibilidade campo antigo
        orgaoId: meta.id,
        organogramaEstrutural: estrutural,
        organogramasFuncoes: funcoes
    };
};

export const getOrgaoByName = async (nomeOrgao) => {
    // 1. Tentar encontrar no índice central pelo ID exato (prioridade para ID/Slug)
    // Isso resolve o problema de passar o ID na URL (que é o padrão REST) e não achar pelo Nome
    const orgaos = await listOrgaosIndex();

    // Normalizar entrada para comparação
    const normalizedInput = normalizeOrgaoId(nomeOrgao);

    // Tentar achar pelo ID direto
    const matchId = orgaos.find(o => o.id === normalizedInput || o.id === nomeOrgao);
    if (matchId) {
        return getOrgaoCompleto(matchId.id);
    }

    // 2. Tentar encontrar pelo NOME exato (caso antigo/legado)
    const matchNome = orgaos.find(o => o.nome.toLowerCase() === nomeOrgao.toLowerCase());
    if (matchNome) {
        return getOrgaoCompleto(matchNome.id);
    }

    // 3. Fallback: Tentar carregar direto assumindo que é um ID válido
    // (Mesmo que não esteja no index por algum erro de sincronia)
    return getOrgaoCompleto(normalizedInput);
};

// AUTH
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
};

const verifyPasswordHelper = (password, salt, hash) => {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
};

export const verifyOrgaoPassword = async (orgaoId, password) => {
    const meta = await getOrgaoMetadata(orgaoId);
    if (!meta || !meta.auth) return false;
    return verifyPasswordHelper(password, meta.auth.salt, meta.auth.hash);
};

// LISTAGEM GERAL
export const listOrgaos = async () => {
    // Para dashboard, idealmente retornamos dados do index OU full.
    // O Dashboard espera array de objetos completos para mostrar stats (num setores, etc)
    // Se o index tiver só metadata, stats ficam vazios.
    // OPÇÃO 1: Carregar TUDO (Lento se tiver 1000 orgaos)
    // OPÇÃO 2: Index ter cache de stats.

    // Por enquanto, vou carregar TUDO para garantir funcionalidade do Dashboard, 
    // mas isso deve ser otimizado futuramente (user pediu arquitetura profissional).
    // O Dashboard atual usa org.organogramaEstrutural.setores.length.

    // Vou usar o index para saber quem existe, e carregar os dados.
    const index = await listOrgaosIndex();
    const fullList = [];

    for (const item of index) {
        const full = await getOrgaoCompleto(item.id);
        if (full) fullList.push(full);
    }
    return fullList;
};

// AGREGAR Geral
// AGREGAR Geral
export const updateOrganogramaGeral = async () => {
    const allOrgaos = await listOrgaos();

    // 1. Estrutura Base
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

    // Map para agregar cargos pelo nome
    const cargosMap = new Map();

    allOrgaos.forEach(org => {
        // 2. Agregar Setores Estruturais
        if (org.organogramaEstrutural && org.organogramaEstrutural.setores) {
            geral.setores.push(...org.organogramaEstrutural.setores);
        }

        // 3. Agregar Cargos Funcionais
        if (org.organogramasFuncoes && Array.isArray(org.organogramasFuncoes)) {
            org.organogramasFuncoes.forEach(func => {
                if (func.cargos && Array.isArray(func.cargos)) {
                    func.cargos.forEach(cargo => {
                        const nomeNormalizado = cargo.nomeCargo.trim();
                        // Tentar pegar quantidade (se não tiver, assume 1, mas ideal é ter)
                        // A propriedade correta nos nós de cargo é 'quantidade' (string ou number)
                        // ou calcular baseado nos símbolos.
                        // Vamos usar lógica robusta:
                        let qtd = parseInt(cargo.quantidade) || 0;

                        // Se qtd for 0, verificamos se tem símbolos com quantidade
                        if (qtd === 0 && cargo.simbolos && Array.isArray(cargo.simbolos)) {
                            qtd = cargo.simbolos.reduce((acc, sim) => acc + (parseInt(sim.quantidade) || 0), 0);
                        }

                        // Fallback final
                        if (qtd === 0) qtd = 1;

                        if (cargosMap.has(nomeNormalizado)) {
                            cargosMap.set(nomeNormalizado, cargosMap.get(nomeNormalizado) + qtd);
                        } else {
                            cargosMap.set(nomeNormalizado, qtd);
                        }
                    });
                }
            });
        }
    });

    // Converter Map para Array ordenado
    geral.estatisticas.cargos = Array.from(cargosMap.entries())
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

    geral.estatisticas.totalCargos = geral.estatisticas.cargos.reduce((acc, c) => acc + c.quantidade, 0);

    await saveOrganogramaGeral(geral);
    return geral;
};

// DELETAR Órgão (Remove pasta e atualiza índice)
export const deleteOrgao = async (nomeOrgao) => {
    const orgaoId = normalizeOrgaoId(nomeOrgao);
    const dir = getOrgaoDir(orgaoId);

    // 1. Remover pasta do órgão recursivamente
    if (existsSync(dir)) {
        await fs.rm(dir, { recursive: true, force: true });
    }


    // 2. Remover do índice central
    const list = await listOrgaosIndex();
    const newList = list.filter(o => o.id !== orgaoId);
    await fs.writeFile(INDEX_FILE, JSON.stringify({ orgaos: newList }, null, 2));

    return true;
};

// ATUALIZAR Organograma de Funções (substitui o primeiro/único)
export const updateOrganogramaFuncoes = async (nomeOrgao, organogramaFuncoes) => {
    const orgaoId = normalizeOrgaoId(nomeOrgao);
    const funcDir = path.join(getOrgaoDir(orgaoId), 'funcional');

    // Criar diretório funcional se não existir
    if (!existsSync(funcDir)) await fs.mkdir(funcDir, { recursive: true });

    // Listar arquivos existentes
    const files = await fs.readdir(funcDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    let funcId;
    let existingData = null;

    if (jsonFiles.length > 0) {
        // Atualizar o primeiro arquivo encontrado
        const firstFile = jsonFiles[0];
        funcId = firstFile.replace('.json', '');
        try {
            existingData = JSON.parse(await fs.readFile(path.join(funcDir, firstFile), 'utf-8'));
        } catch (e) {
            console.error('Erro ao ler funcional existente', e);
        }
    } else {
        // Criar novo se não existir
        funcId = `func_${Date.now()}`;
    }

    const funcData = {
        id: funcId,
        ...organogramaFuncoes,
        createdAt: existingData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await fs.writeFile(
        path.join(funcDir, `${funcId}.json`),
        JSON.stringify(funcData, null, 2)
    );

    // Atualizar metadata timestamp
    const meta = await getOrgaoMetadata(orgaoId);
    if (meta) {
        meta.updatedAt = new Date().toISOString();
        await fs.writeFile(path.join(getOrgaoDir(orgaoId), 'metadata.json'), JSON.stringify(meta, null, 2));
        await updateIndex({ id: orgaoId, nome: nomeOrgao });
    }

    // Retornar órgão completo
    return await getOrgaoCompleto(orgaoId);
};

// ATUALIZAR Senha do Órgão
export const updateOrgaoPassword = async (orgaoId, newPassword) => {
    const meta = await getOrgaoMetadata(orgaoId);
    if (!meta) {
        throw new Error('Órgão não encontrado');
    }

    // Gerar novo hash
    const authData = hashPassword(newPassword);

    // Atualizar metadata
    meta.auth = authData;
    meta.updatedAt = new Date().toISOString();

    const dir = getOrgaoDir(orgaoId);
    await fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(meta, null, 2));

    // Atualizar index
    await updateIndex({ id: orgaoId, nome: meta.nome, hasAuth: true });

    return true;
};

