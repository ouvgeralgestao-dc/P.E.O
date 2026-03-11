
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/organograma.db');
const db = new sqlite3.Database(dbPath);

console.log(`[Diagnostic] Reading schema from ${dbPath}`);

db.serialize(() => {
    db.all("PRAGMA table_info(sandbox_setores)", (err, rows) => {
        if (err) {
            console.error('Error reading schema:', err);
            return;
        }
        console.log('Columns in sandbox_setores:', rows.map(r => r.name));
        
        // Try simple query
        db.all("SELECT * FROM sandbox_setores LIMIT 1", (err, rows) => {
            if (err) console.error("Simple query failed:", err);
            else console.log("Sample row:", rows[0]);
        });
    });
});

db.close();
