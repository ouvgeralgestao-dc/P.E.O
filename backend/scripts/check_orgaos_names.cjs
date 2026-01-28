// Script para verificar e corrigir nomes de órgãos no banco
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath);

console.log('=== Verificando órgãos com "conselho" no nome ou ID ===\n');

const rows = db.prepare(`
    SELECT id, nome, categoria 
    FROM orgaos 
    WHERE id LIKE '%conselho%' 
       OR nome LIKE '%conselho%' 
       OR nome LIKE '%Conselho%'
`).all();

console.log('Registros encontrados:');
console.log(JSON.stringify(rows, null, 2));

// Verificar se o nome está igual ao ID (normalizado)
for (const row of rows) {
    if (row.id === row.nome) {
        console.log(`\n⚠️ PROBLEMA DETECTADO: id="${row.id}" tem nome igual ao ID!`);
        console.log('   O nome deveria ser o nome legível, não o slug.');
    }
}

db.close();
