const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend/data/organograma.sqlite');
console.log(`Debug DB at: ${dbPath}`);

const db = new Database(dbPath);

console.log('Searching for "ouvidoria"...');

const orgaos = db.prepare("SELECT id, nome FROM orgaos WHERE id LIKE '%ouvidoria%' OR nome LIKE '%ouvidoria%'").all();
console.log('Orgaos found:', orgaos);

if (orgaos.length === 0) process.exit(0);

const orgaoId = orgaos[0].id; // Pegar o primeiro (provavelmente sistema-ouvidoria)
console.log(`Checking Functional for Orgao ID: ${orgaoId}`);

// 1. Get Setores IDs
const setores = db.prepare("SELECT id, nome FROM setores WHERE orgao_id = ?").all(orgaoId);
const setorMap = new Map();
setores.forEach(s => setorMap.set(s.id, s.nome));
console.log(`Structural Setores count: ${setores.length}`);
console.log('Setores IDs sample:', setores.slice(0, 3).map(s => s.id));

// 2. Get Functional Cargos
const diags = db.prepare("SELECT * FROM diagramas_funcionais WHERE orgao_id = ?").all(orgaoId);

if (diags.length === 0) {
    console.log('No functional diagram found');
    process.exit(0);
}

const diagId = diags[0].id;
console.log(`Using Diagram ID: ${diagId}`);

const cargos = db.prepare(`SELECT c.id, c.nome_cargo, c.setor_ref FROM cargos_funcionais c WHERE c.diagrama_id = ?`).all(diagId);

console.log(`Functional Cargos count: ${cargos.length}`);
cargos.forEach(c => {
    const hasRef = !!c.setor_ref;
    const match = setorMap.has(c.setor_ref);
    const setorName = match ? setorMap.get(c.setor_ref) : 'N/A';

    // Check explicit JOIN logic
    if (c.setor_ref) {
        console.log(`Cargo: ${c.nome_cargo.padEnd(40)} | RefID: ${c.setor_ref.substring(0, 8)}... | Match: ${match.toString().toUpperCase()} | Name: ${setorName}`);
    } else {
        console.log(`Cargo: ${c.nome_cargo.padEnd(40)} | RefID: NULL`);
    }
});
