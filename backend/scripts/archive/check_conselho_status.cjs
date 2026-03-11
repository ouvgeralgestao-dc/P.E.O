const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');
const db = new Database(dbPath);

console.log('=== Verificação Final ===');
const row = db.prepare("SELECT id, nome FROM orgaos WHERE id LIKE 'conselho_de_contribuintes'").get();
console.log(JSON.stringify(row, null, 2));

if (row && row.nome === 'Conselho de Contribuintes') {
    console.log('✅ VERIFICADO: Nome está correto!');
} else {
    console.log('❌ FALHA: Nome ainda incorreto!');
}
db.close();
