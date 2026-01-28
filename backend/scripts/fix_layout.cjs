const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho corrigido para backend/data/organograma.sqlite
// Scripts roda em backend/scripts, então subir um nível (backend) e entrar em data
const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');
const db = new sqlite3.Database(dbPath);

const fixedIds = [
    'prefeito', 'gabinete',
    'subprefeitura-1', 'subprefeitura-2', 'subprefeitura-3', 'subprefeitura-4',
    'prefeito-cargo', 'gabinete-cargo',
    'subprefeitura-1-cargo', 'subprefeitura-2-cargo', 'subprefeitura-3-cargo', 'subprefeitura-4-cargo'
];

// Montar query
const placeholders = fixedIds.map(() => '?').join(',');
const sql = `DELETE FROM layout_personalizado WHERE orgao_id = 'geral' AND node_id IN (${placeholders})`;

console.log(`Abrindo banco em: ${dbPath}`);
console.log(`Limpando layout personalizado para nós fixos: ${fixedIds.length} IDs`);

db.run(sql, fixedIds, function (err) {
    if (err) {
        console.error('Erro ao limpar layout:', err.message);
    } else {
        console.log(`Sucesso! ${this.changes} registros de posições personalizadas foram removidos.`);
        console.log('Agora o sistema usará o layout calculado automaticamente (espaçado).');
    }
    db.close();
});
