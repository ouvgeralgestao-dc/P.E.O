
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('backend/data/organograma.sqlite');
console.log(`Connecting to DB: ${dbPath}`);

const db = new Database(dbPath, { readonly: true });

// 1. Find the Organogram
const orgao = db.prepare("SELECT * FROM orgaos WHERE id LIKE '%ouvidoria%'").get();
if (!orgao) { console.log('Orgao not found'); process.exit(1); }
console.log(`Checking Orgao: ${orgao.nome} (${orgao.id})`);

// 2. Fetch Structural Sectors
const setores = db.prepare("SELECT id, nome FROM setores WHERE orgao_id = ?").all(orgao.id);
const setorIds = new Set(setores.map(s => s.id));
console.log(`Structural Sectors Found: ${setores.length}`);
setores.forEach(s => console.log(`   [STRUCT] ${s.nome.padEnd(30)} ID: ${s.id}`));

// 3. Fetch Functional Cargos
const diag = db.prepare("SELECT * FROM diagramas_funcionais WHERE orgao_id = ?").get(orgao.id);
if (!diag) { console.log('No Functional Diagram found'); process.exit(1); }

const cargos = db.prepare("SELECT nome_cargo, setor_ref FROM cargos_funcionais WHERE diagrama_id = ?").all(diag.id);
console.log(`Functional Cargos Found: ${cargos.length}`);

// 4. Cross-Check
console.log('\n--- INTEGRITY CHECK ---');
cargos.forEach(c => {
    const ref = c.setor_ref;
    if (!ref) {
        console.log(`[FAIL] ${c.nome_cargo.padEnd(30)}: NULL reference`);
    } else if (setorIds.has(ref)) {
        const sName = setores.find(s => s.id === ref).nome;
        console.log(`[OK]   ${c.nome_cargo.padEnd(30)}: Linked to '${sName}'`);
    } else {
        console.log(`[BROKEN] ${c.nome_cargo.padEnd(30)}: Reference ID ${ref} NOT FOUND in Sectors!`);
    }
});
