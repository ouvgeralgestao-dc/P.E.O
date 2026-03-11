import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho base para armazenamento de dados
export const DATA_DIR = path.join(__dirname, '../data');

/**
 * Garante que o diretório de dados existe
 */
export const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log('📁 Diretório de dados criado:', DATA_DIR);
    }
};

/**
 * Lê um arquivo JSON
 * @param {string} filename - Nome do arquivo (ex: 'db_controle_interno.json')
 * @returns {Promise<Object>} - Dados do arquivo
 */
export const readJSONFile = async (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null; // Arquivo não existe
        }
        throw error;
    }
};

/**
 * Escreve dados em um arquivo JSON
 * @param {string} filename - Nome do arquivo
 * @param {Object} data - Dados a serem salvos
 */
export const writeJSONFile = async (filename, data) => {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

/**
 * Lista todos os arquivos JSON no diretório de dados
 * @returns {Promise<string[]>} - Array de nomes de arquivos
 */
export const listJSONFiles = async () => {
    await ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    return files.filter(file => file.endsWith('.json'));
};

/**
 * Deleta um arquivo JSON
 * @param {string} filename - Nome do arquivo
 */
export const deleteJSONFile = async (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    await fs.unlink(filePath);
};

/**
 * Normaliza nome de órgão para usar como ID de arquivo
 * @param {string} nomeOrgao - Nome do órgão (ex: "Secretaria de Controle Interno")
 * @returns {string} - ID normalizado (ex: "controle_interno")
 */
export const normalizeOrgaoId = (nomeOrgao) => {
    return nomeOrgao
        .toLowerCase()
        .normalize('NFD') // Decompor caracteres com acento
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        // Removido: .replace(/^secretaria de /i, '') // Preservar nome completo para evitar duplicatas erradas
        // Removido: .replace(/^superintendência de /i, '')
        .replace(/[^a-z0-9\s_]/g, '') // Permite letras, números, espaços E UNDERSCORES
        .trim()
        .replace(/\s+/g, '_'); // Substitui espaços por underscore
};

/**
 * Gera nome de arquivo para órgão
 * @param {string} nomeOrgao - Nome do órgão
 * @returns {string} - Nome do arquivo (ex: "db_controle_interno.json")
 */
export const getOrgaoFilename = (nomeOrgao) => {
    const orgaoId = normalizeOrgaoId(nomeOrgao);
    return `db_${orgaoId}.json`;
};
