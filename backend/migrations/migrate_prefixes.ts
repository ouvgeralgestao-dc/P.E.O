
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');

const db = new Database(dbPath);

// Lista de prefixos a serem migrados
const PREFIXOS_CARGOS = [
    'Secretário(a)',
    'Subprefeito(a)',
    'Superintendente',
    'Subsecretário(a)',
    'Diretor(a)',
    'Gerente',
    'Coordenador(a)',
    'Assessor(a)',
    'Analista',
    'Assistente',
    'Auxiliar',
    'Consultor(a)',
    'Contrato PSS',
    'Estagiário(a)'
];

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS prefixos_cargos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        ordem INTEGER DEFAULT 0
    );
`;

const insertPrefixQuery = `
    INSERT INTO prefixos_cargos (nome, ordem) 
    VALUES (?, ?)
    ON CONFLICT(nome) DO UPDATE SET ordem=excluded.ordem;
`;

try {
    console.log('📦 Conectado ao banco de dados SQLite.');

    // 1. Criar Tabela
    db.exec(createTableQuery);
    console.log('✅ Tabela prefixos_cargos verificada/criada com sucesso.');

    // 2. Inserir Dados
    const insert = db.prepare(insertPrefixQuery);

    const migration = db.transaction((prefixes) => {
        for (let i = 0; i < prefixes.length; i++) {
            insert.run(prefixes[i], i);
            console.log(`🔹 Prefixo migrado: ${prefixes[i]}`);
        }
    });

    migration(PREFIXOS_CARGOS);
    console.log('🚀 Migração concluída com sucesso!');

} catch (err: any) {
    console.error('❌ Erro na migração:', err.message);
} finally {
    db.close();
}
