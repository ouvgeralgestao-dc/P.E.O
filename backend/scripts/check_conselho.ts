/**
 * Script rápido para verificar se Conselho de Contribuintes existe no banco
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Banco que o sistema usa
const DB_PATH = path.resolve(__dirname, '..', 'data', 'organograma.sqlite');
console.log(`📂 Verificando banco: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Buscar por diferentes variações do nome
const queries = [
    ['id = ?', 'conselho_de_contribuintes'],
    ['UPPER(nome) LIKE UPPER(?)', '%conselho%contribuintes%'],
    ['UPPER(nome) LIKE UPPER(?)', '%conselho%'],
];

console.log('\n🔍 Buscando órgãos relacionados a "Conselho"...\n');

for (const [where, param] of queries) {
    const results = db.prepare(`SELECT id, nome FROM orgaos WHERE ${where}`).all(param);
    console.log(`Query: ${where} [${param}]`);
    if (results.length > 0) {
        results.forEach((r: any) => console.log(`  ❌ ENCONTRADO: ${r.nome} (${r.id})`));
    } else {
        console.log(`  ✅ Nenhum resultado`);
    }
    console.log('');
}

db.close();
console.log('✨ Verificação concluída.');
