
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/organograma.db');
const db = new sqlite3.Database(dbPath);

console.log(`[Diagnostic] Connecting to DB at ${dbPath}`);

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
    WHERE o.nome LIKE '%Comunicação Social%' OR o.nome LIKE '%Secretaria Municipal%'
    ORDER BY s.orgao_id, s.hierarquia
`;

db.serialize(() => {
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }

        console.log(`[Diagnostic] Found ${rows.length} sectors in Sandbox.`);
        
        rows.forEach(row => {
            const warning = (row.hierarquia == 3 && row.parent_name && row.parent_name.includes('Superintend')) 
                ? ' <<< POTENTIAL BUG' 
                : '';
            
            console.log(
                `[${row.orgao_nome}] L${row.hierarquia} ${row.nome_setor} (ID: ${row.id}) ` +
                `-> Parent: ${row.parent_name || 'NULL'} (ID: ${row.parent_id}) ${warning}`
            );
        });
    });
});

db.close();
