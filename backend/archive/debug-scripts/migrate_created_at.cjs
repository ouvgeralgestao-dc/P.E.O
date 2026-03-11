const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/organograma.sqlite');
console.log(`Migrating database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run("ALTER TABLE organogramas_estruturais ADD COLUMN created_at DATETIME", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column created_at already exists.');
            } else {
                console.error('Error adding column created_at:', err.message);
            }
        } else {
            console.log('Column created_at added successfully.');
            // Populate existing rows
            db.run("UPDATE organogramas_estruturais SET created_at = datetime('now') WHERE created_at IS NULL");
        }
    });

    db.run("ALTER TABLE organogramas_estruturais ADD COLUMN updated_at DATETIME", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column updated_at already exists.');
            } else {
                console.error('Error adding column updated_at:', err.message);
            }
        } else {
            console.log('Column updated_at added successfully.');
            // Populate existing rows
            db.run("UPDATE organogramas_estruturais SET updated_at = datetime('now') WHERE updated_at IS NULL");
        }
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database', err.message);
    }
    console.log('Database connection closed.');
});
