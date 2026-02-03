const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pointing to the REAL database found in backend/data/
const dbPath = path.resolve(__dirname, 'data/organograma.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Checking cargos_funcionais and nome_setor_ref...");

    // Check counts
    db.get("SELECT Count(*) as total FROM cargos_funcionais", (err, row) => {
        if (err) console.error("Count Error:", err);
        else console.log("Total Cargos:", row.total);
    });

    const query = `
        SELECT c.id, c.nome_cargo, c.setor_ref 
        FROM cargos_funcionais c 
        LIMIT 5
    `;

    db.all(query, (err, rows) => {
        if (err) console.error("Sample Error:", err);
        else console.log("Sample Cargos:", rows);
    });
    db.get("SELECT Count(*) as count FROM setores", (e, r) => {
        console.log("Total Setores:", r.count);
    });
});


db.close();
