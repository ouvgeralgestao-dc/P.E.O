
import { client } from '../src/db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Schema se necessário (comportamento legado)
function initDb() {
    try {
        const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(SCHEMA_PATH)) {
            const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
            client.exec(schema);
            console.log('✅ [SQLite] Tabelas verificadas/criadas com sucesso (via Better-SQLite3).');
        }
    } catch (e) {
        console.error('❌ [SQLite] Erro ao ler/executar schema:', e);
    }
}

// Função para adicionar colunas faltantes de forma segura (Migration Automática)
function runMigrations() {
    console.log('🔄 [SQLite] Verificando migrações pendentes...');

    // Lista de migrações: { tabela, coluna, tipo, default }
    const migrations = [
        { table: 'orgaos', column: 'categoria', type: 'TEXT', default: "'OUTROS'" },
        { table: 'orgaos', column: 'ordem', type: 'INTEGER', default: '999' },
        // 2026-01-21: Adicionar setor_ref para correlacionar cargos funcionais com setores estruturais
        { table: 'cargos_funcionais', column: 'setor_ref', type: 'TEXT', default: 'NULL' }
    ];

    for (const m of migrations) {
        try {
            // Verificar se coluna já existe usando PRAGMA table_info
            const columns = client.prepare(`PRAGMA table_info(${m.table})`).all();
            const columnExists = columns.some((col: any) => col.name === m.column);

            if (!columnExists) {
                const sql = `ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type} DEFAULT ${m.default}`;
                client.exec(sql);
                console.log(`✅ [Migration] Coluna '${m.column}' adicionada à tabela '${m.table}'.`);
            }
        } catch (e: any) {
            // Se der erro de "duplicate column" é porque já existe - ignorar
            if (e.message?.includes('duplicate column name')) {
                console.log(`ℹ️ [Migration] Coluna '${m.column}' já existe em '${m.table}' - pulando.`);
            } else {
                console.error(`❌ [Migration] Erro ao adicionar '${m.column}' em '${m.table}':`, e);
            }
        }
    }

    console.log('✅ [SQLite] Migrações concluídas.');
}

// Função para carregar dados legados do JSON para SQLite (Auto-Seed)
function seedFromJson() {
    try {
        // Verificar se tabela orgaos está vazia
        const count = client.prepare('SELECT COUNT(*) as total FROM orgaos').get() as { total: number };

        if (count.total > 0) {
            console.log(`ℹ️ [Seed] Tabela orgaos já possui ${count.total} registros - pulando seed.`);
            return;
        }

        // Carregar dados do JSON legado
        // __dirname é backend/database/, então ../data/ aponta para backend/data/
        const jsonPath = path.resolve(__dirname, '..', 'data', 'orgaos.json');
        console.log(`🔍 [Seed] Procurando JSON em: ${jsonPath}`);

        if (!fs.existsSync(jsonPath)) {
            console.log('ℹ️ [Seed] Arquivo orgaos.json não encontrado - pulando seed.');
            return;
        }

        const orgaosJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        console.log(`🌱 [Seed] Carregando ${orgaosJson.length} órgãos do JSON legado...`);

        const insertStmt = client.prepare(`
            INSERT OR IGNORE INTO orgaos (id, nome, categoria, ordem, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertMany = client.transaction((orgaos: any[]) => {
            for (const o of orgaos) {
                insertStmt.run(
                    o.id,
                    o.nome,
                    o.categoria || 'OUTROS',
                    o.ordem || 999,
                    o.createdAt || new Date().toISOString(),
                    o.updatedAt || new Date().toISOString()
                );
            }
        });

        insertMany(orgaosJson);
        console.log(`✅ [Seed] ${orgaosJson.length} órgãos carregados com sucesso!`);

    } catch (e) {
        console.error('❌ [Seed] Erro ao carregar dados do JSON:', e);
    }
}

// Executa init + migrations + seed na importação
initDb();
runMigrations();
seedFromJson();

// Wrapper Async para compatibilidade com código existente
export const dbAsync = {
    run: async (sql: string, params: any[] = []) => {
        try {
            const stmt = client.prepare(sql);
            const info = stmt.run(...params);
            return { id: info.lastInsertRowid, changes: info.changes };
        } catch (error) {
            console.error('SQL Error (run):', sql, error);
            throw error;
        }
    },
    get: async (sql: string, params: any[] = []) => {
        try {
            const stmt = client.prepare(sql);
            return stmt.get(...params);
        } catch (error) {
            console.error('SQL Error (get):', sql, error);
            throw error;
        }
    },
    all: async (sql: string, params: any[] = []) => {
        try {
            const stmt = client.prepare(sql);
            return stmt.all(...params);
        } catch (error) {
            console.error('SQL Error (all):', sql, error);
            throw error;
        }
    },
    exec: async (sql: string) => {
        try {
            client.exec(sql);
        } catch (error) {
            console.error('SQL Error (exec):', sql, error);
            throw error;
        }
    }
};

// Exportar client raw se necessário, mas dbAsync deve cobrir 99%
export { client as db };
