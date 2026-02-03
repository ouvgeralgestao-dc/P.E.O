
import { client } from '../src/db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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
        { table: 'cargos_funcionais', column: 'setor_ref', type: 'TEXT', default: 'NULL' },
        // 2026-01-28: Adicionar colunas faltantes na tabela usuarios
        { table: 'usuarios', column: 'nome', type: 'TEXT', default: 'NULL' },
        { table: 'usuarios', column: 'orgao_id', type: 'TEXT', default: 'NULL' },
        { table: 'usuarios', column: 'ativo', type: 'INTEGER', default: '1' },
        // 2026-02-03: Hierarquia Operacional vs Chefia (is_operacional)
        { table: 'setores', column: 'is_operacional', type: 'INTEGER', default: '0' },
        { table: 'cargos_funcionais', column: 'is_operacional', type: 'INTEGER', default: '0' },
        // 2026-02-03: Data de criação e atualização para organogramas estruturais
        { table: 'organogramas_estruturais', column: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
        { table: 'organogramas_estruturais', column: 'updated_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
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

// Função para criar usuário admin padrão
function seedUsuarios() {
    try {
        // Verificar se tabela usuarios está vazia
        const count = client.prepare('SELECT COUNT(*) as total FROM usuarios').get() as { total: number };

        if (count.total > 0) {
            console.log(`ℹ️ [Seed] Tabela usuarios já possui ${count.total} registros - pulando seed.`);
            return;
        }

        // Criar hash de senha simples (em produção usar bcrypt)
        const senhaAdmin = 'admin123';
        const hash = crypto.createHash('sha256').update(senhaAdmin).digest('hex');

        // Inserir usuário admin padrão
        const insertStmt = client.prepare(`
            INSERT INTO usuarios (matricula, email, senha, setor, cargo, tipo)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
            '000001',
            'admin@peo.gov.br',
            hash,
            'TI',
            'Administrador',
            'admin'
        );

        console.log('✅ [Seed] Usuário admin padrão criado com sucesso! Matrícula: 000001, Senha: admin123');

    } catch (e) {
        console.error('❌ [Seed] Erro ao criar usuário admin:', e);
    }
}

// Função para seedar Tipos de Cargo (Refatoração Dinâmica)
function seedTiposCargo() {
    try {
        const count = client.prepare('SELECT COUNT(*) as total FROM tipos_cargo').get() as { total: number };
        if (count.total > 0) return;

        console.log('🌱 [Seed] Inicializando tabela tipos_cargo com padrões...');

        const padroes = [
            { nome: 'Secretário Municipal', hierarquia: 1, simbolo: '⬛', ordem: 1 },
            { nome: 'Subsecretário / Diretor Geral', hierarquia: 2, simbolo: '⬛', ordem: 2 },
            { nome: 'Diretor', hierarquia: 3, simbolo: '⬛', ordem: 3 },
            { nome: 'Coordenador', hierarquia: 4, simbolo: '▪', ordem: 4 },
            { nome: 'Gerente / Chefe de Departamento', hierarquia: 5, simbolo: '▪', ordem: 5 },
            { nome: 'Chefe de Divisão', hierarquia: 6, simbolo: '▪', ordem: 6 },
            { nome: 'Chefe de Seção', hierarquia: 7, simbolo: '▫', ordem: 7 },
            { nome: 'Supervisor', hierarquia: 8, simbolo: '▫', ordem: 8 },
            { nome: 'Assistente', hierarquia: 9, simbolo: '▫', ordem: 9 },
            { nome: 'Auxiliar', hierarquia: 10, simbolo: '○', ordem: 10 },
            { nome: 'Função Comissionada', hierarquia: 11, simbolo: '○', ordem: 11 }
        ];

        // Mapeamento de abreviações antigas para referência se necessário
        // 'DAS-S' -> Secretário
        // 'DAS-9' -> Subsecretário...

        const insert = client.prepare(`
            INSERT INTO tipos_cargo (id, nome, hierarquia_padrao, simbolo, ordem)
            VALUES (?, ?, ?, ?, ?)
        `);

        client.transaction(() => {
            for (const p of padroes) {
                // Usar UUID ou slug simples como ID? Vamos usar UUID para consistência
                insert.run(crypto.randomUUID(), p.nome, p.hierarquia, p.simbolo, p.ordem);
            }
        })();

        console.log('✅ [Seed] Tipos de Cargo inicializados.');

    } catch (e) {
        console.error('❌ [Seed] Erro ao seedar tipos_cargo:', e);
    }
}

// Função para migrar prefixos legados para a nova tabela tipos_cargo
function migratePrefixosToTiposCargo() {
    try {
        // Verificar se a tabela prefixos existe
        const tableExists = client.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='prefixos'").get() as { count: number };
        if (!tableExists || tableExists.count === 0) return;

        console.log('🔄 [Migration] Verificando migração de prefixos antigos...');

        const prefixos = client.prepare('SELECT * FROM prefixos').all() as any[];

        if (prefixos.length === 0) return;

        const insert = client.prepare(`
            INSERT INTO tipos_cargo (id, nome, hierarquia_padrao, simbolo, ordem)
            VALUES (?, ?, ?, ?, ?)
        `);

        // Check existing names to avoid duplicates
        const existing = client.prepare('SELECT nome FROM tipos_cargo').all() as any[];
        const existingNames = new Set(existing.map(e => e.nome.toLowerCase()));

        let migratedCount = 0;

        client.transaction(() => {
            for (const p of prefixos) {
                if (!existingNames.has(p.nome.toLowerCase())) {
                    // Default: Nível 11 (Outros), Símbolo O, Ordem 99
                    insert.run(crypto.randomUUID(), p.nome, 11, '○', 99);
                    migratedCount++;
                }
            }
        })();

        if (migratedCount > 0) {
            console.log(`✅ [Migration] ${migratedCount} prefixos antigos migrados para tipos_cargo.`);
        }

    } catch (e) {
        console.error('❌ [Migration] Erro ao migrar prefixos:', e);
    }
}

// Executa init + migrations + seed na importação
initDb();
runMigrations();
seedFromJson();
seedUsuarios();
migratePrefixosToTiposCargo(); // Run before seedTiposCargo to preserve user data preference? Or after? Order doesn't matter much due to checks.
seedTiposCargo();

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
