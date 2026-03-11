
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/organograma.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

// Filter specifically for "Subsecretaria" to check its parent
const query = `
    SELECT 
        s.id, 
        s.nome_setor, 
        s.hierarquia, 
        s.parent_id,
        parent.nome_setor as parent_name
    FROM sandbox_setores s
    LEFT JOIN sandbox_setores parent ON s.parent_id = parent.id
    WHERE s.nome_setor LIKE '%Subsecretaria%'
      AND s.orgao_id = (SELECT id FROM orgaos WHERE nome LIKE '%Comunicação Social%' LIMIT 1)
`;

console.log("--- SUBSECRETARIA CHECK ---");
db.all(query, (err, rows) => {
    if (err) { console.error(err); return; }
    
    rows.forEach(row => {
        console.log(`Child: ${row.nome_setor} (Level ${row.hierarquia})`);
        console.log(`Parent: ${row.parent_name} (ID: ${row.parent_id})`);
        
        if (row.parent_name && row.parent_name.includes('Superinten')) {
             console.log("RESULT: BUGGED (Connected to Superintendent)");
        } else if (row.parent_name && row.parent_name.includes('Secretaria')) {
             console.log("RESULT: OK (Connected to Secretariat)");
        } else {
             console.log("RESULT: UNKNOWN PARENT");
        }
    });
});

db.close();
