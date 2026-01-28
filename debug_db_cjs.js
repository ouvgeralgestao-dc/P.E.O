const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend/database/organograma.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT id, nome FROM orgaos', [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('--- ÓRGÃOS NO BANCO ---');
    console.table(rows);
    db.close();
});
