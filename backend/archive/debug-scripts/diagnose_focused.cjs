
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/organograma.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

const query = `
    SELECT 
        s.id, 
        s.nome_setor, 
        s.hierarquia, 
        s.parent_id,
        parent.nome_setor as parent_name,
        o.nome as orgao_nome
    FROM sandbox_setores s
    LEFT JOIN sandbox_setores parent ON s.parent_id = parent.id
    LEFT JOIN orgaos o ON s.orgao_id = o.id
    WHERE (o.nome LIKE '%Comunicação Social%' OR o.nome LIKE '%Secretaria Municipal%')
      AND s.hierarquia = 3
`;

console.log("--- START DIAGNOSIS ---");
db.all(query, (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    
    if (rows.length === 0) {
        console.log("No Level 3 sectors found.");
    } else {
        rows.forEach(row => {
            console.log(`[L3] ${row.nome_setor}`);
            console.log(`     Parent: ${row.parent_name} (ID: ${row.parent_id})`);
            
            if (row.parent_name && row.parent_name.includes('Superinten')) {
                 console.log("     >>> STATUS: BUG CONFIRMED (Parent is Superintendent)");
            } else {
                 console.log("     >>> STATUS: OK (Parent looks correct)");
            }
            console.log('');
        });
    }
});
db.close();
