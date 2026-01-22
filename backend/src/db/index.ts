import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garantir que o diretório de dados existe
// __dirname = backend/src/db/, então ../../data/ = backend/data/
const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'organograma.sqlite');
console.log(`📁 [DB] Caminho do banco: ${DB_PATH}`);
const dataDir = path.dirname(DB_PATH);

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Inicializar Better-SQLite3
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL'); // Melhor performance e concorrência

// Inicializar Drizzle
export const db = drizzle(sqlite);
export { sqlite as client };
