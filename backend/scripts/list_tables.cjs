
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/organograma.db');
console.log('Database Path:', dbPath);
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log('Tables:', rows);
});

setTimeout(() => {
    db.close();
}, 2000);
