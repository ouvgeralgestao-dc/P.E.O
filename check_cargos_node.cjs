
const Database = require('better-sqlite3');
const path = require('path');

// Caminho absoluto para evitar problemas de CWD
const dbPath = path.resolve('backend/data/organograma.sqlite');
console.log(`Connecting to DB: ${dbPath}`);

try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });

    const sql = `
        SELECT 
            c.nome_cargo,
            c.id,
            c.setor_ref, 
            c.parent_id,
            c.hierarquia
        FROM cargos_funcionais c
        JOIN diagramas_funcionais d ON c.diagrama_id = d.id
        JOIN orgaos o ON d.orgao_id = o.id
        WHERE o.id LIKE '%ouvidoria%' OR o.nome LIKE '%ouvidoria%';
    `;

    const rows = db.prepare(sql).all();

    console.log('--- RESULTADO DA CONSULTA ---');
    console.table(rows);
    console.log(`Total rows: ${rows.length}`);

} catch (err) {
    console.error('ERRO AO CONECTAR/CONSULTAR:', err);
}
