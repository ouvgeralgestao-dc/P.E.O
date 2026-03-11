
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/organograma.db');
console.log('Opening DB:', dbPath);
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) console.error('Error opening DB:', err);
    else console.log('DB Opened');
});

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
        console.error('Error listing tables:', err);
    } else {
        console.log('Tables:', tables.map(t => t.name));
        
        db.all("PRAGMA table_info(sandbox_setores)", [], (err, cols) => {
            if (err) console.error('Error getting columns:', err);
            else {
                console.log('Columns:', cols.map(c => c.name));
                
                // Now run the data query with safer syntax
                // Assuming we found columns, we can guess names
                 db.all("SELECT * FROM sandbox_setores LIMIT 5", [], (err, rows) => {
                    if (err) console.error('Data query error:', err);
                    else {
                        console.log('Rows found:', rows.length);
                        if (rows.length > 0) console.log('Sample:', rows[0]);
                    }
                 });
            }
        });
    }
});
// db.close(); // Let process exit naturally? Or close inside callback.
