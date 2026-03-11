// Script para executar migration de permissões
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'organograma.sqlite');
const migrationPath = join(__dirname, '..', 'migrations', 'add_user_permissions.sql');

console.log('📊 Executando migration de permissões...');
console.log(`Database: ${dbPath}`);
console.log(`Migration: ${migrationPath}`);

try {
    const db = new Database(dbPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Executar migration
    db.exec(migrationSQL);

    console.log('✅ Migration executada com sucesso!');

    // Verificar tabela criada
    const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='permissoes_usuario'
    `).get();

    if (tableExists) {
        console.log('✅ Tabela permissoes_usuario criada');

        // Contar permissões inseridas
        const count = db.prepare('SELECT COUNT(*) as total FROM permissoes_usuario').get();
        console.log(`✅ ${count.total} permissões padrão inseridas`);
    }

    db.close();
} catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
}
