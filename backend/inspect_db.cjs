const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('--- Listing All Orgaos (Limit 20) ---');
    const rows = db.prepare("SELECT id, nome, created_at, updated_at FROM orgaos LIMIT 20").all();
    console.log(rows);

    // Attempt specific find if we see a likely candidate manually later
    const orgao = null;

    if (orgao) {
        console.log('\n--- Inspecting Estrutural ---');
        const estrutural = db.prepare("SELECT id, orgao_id, created_at, updated_at FROM organogramas_estruturais WHERE orgao_id = ?").get(orgao.id);
        console.log('Estrutural Record:', estrutural);

        console.log('\n--- Inspecting Funcional ---');
        const funcional = db.prepare("SELECT id, orgao_id, created_at, updated_at FROM organogramas_funcoes WHERE orgao_id = ?").get(orgao.id);
        console.log('Funcional Record:', funcional);
    } else {
        console.log('Orgao "Sistema Ouvidoria" not found.');
    }
} catch (error) {
    console.error('Error:', error);
}
