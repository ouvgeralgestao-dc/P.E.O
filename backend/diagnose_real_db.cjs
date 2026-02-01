
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pointing to the CORRECT database file found in listing
const dbPath = path.resolve(__dirname, 'data/organograma.sqlite');
console.log(`[Diagnostic] Connecting to DB at ${dbPath}`);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening DB:', err);
        process.exit(1);
    }
});

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
    WHERE o.nome LIKE '%Secretaria Municipal de Comunicação%' 
    ORDER BY s.hierarquia
`;

db.serialize(() => {
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }

        console.log(`[Diagnostic] Found ${rows.length} sectors for Comunicação Social.`);
        console.log('---------------------------------------------------');
        
        rows.forEach(row => {
            const warning = (row.hierarquia == 3 && row.parent_name && row.parent_name.includes('Superintend')) 
                ? ' <<< [FAIL] PERMANENT BUG DETECTED' 
                : ' [OK]';
            
            console.log(
                `L${row.hierarquia} [${row.nome_setor}] \n` +
                `   -> Parent: [${row.parent_name || 'ROOT'}] (ID: ${row.parent_id}) ${warning}`
            );
        });
        console.log('---------------------------------------------------');

        // Check if there are ANY sectors if filter was too strict
        if (rows.length === 0) {
            db.all("SELECT DISTINCT nome FROM orgaos WHERE nome LIKE '%Comunicação%'", (err, orgs) => {
                if (orgs && orgs.length > 0) {
                     console.log("Found organs matching 'Comunicação':", orgs.map(o => o.nome));
                     // Check their IDs
                     db.all("SELECT id, nome FROM orgaos WHERE nome LIKE '%Comunicação%'", (err, orgIds) => {
                        orgIds.forEach(o => {
                             db.all("SELECT count(*) as c FROM sandbox_setores WHERE orgao_id = ?", [o.id], (err, count) => {
                                 console.log(`Organ '${o.nome}' has ${count[0].c} sandbox sectors.`);
                             });
                        });
                     });
                } else {
                    console.log("No organs found matching 'Comunicação'. Listing top 5 organs:");
                    db.all("SELECT nome FROM orgaos LIMIT 5", (err, allOrgs) => console.log(allOrgs));
                }
            });
        }
    });
});

db.close();
