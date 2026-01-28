const Database = require('better-sqlite3');
const db = new Database('./backend/data/organograma.sqlite');
const rows = db.prepare("SELECT id, nome FROM orgaos WHERE id LIKE '%conselho%' OR nome LIKE '%conselho%' OR nome LIKE '%Conselho%'").all();
console.log('=== Órgãos com "conselho" ===');
console.log(JSON.stringify(rows, null, 2));
db.close();
