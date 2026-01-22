import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve('data/organograma.sqlite');
console.log(`Connecting to DB at: ${DB_PATH}`);

const db = new Database(DB_PATH, { verbose: console.log });

try {
    // Helper to get columns
    const getColumns = (tableName: string) => {
        const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
        console.log(`\n=== Columns in ${tableName} ===`);
        cols.forEach((c: any) => console.log(` - ${c.name} (${c.type})`));
        return cols.map((c: any) => c.name);
    }

    const orgaosCols = getColumns('orgaos');
    const diagramasCols = getColumns('diagramas_funcionais');

    // Find the correct column for organ name (likely 'nome')
    const nameCol = orgaosCols.includes('nome') ? 'nome' : (orgaosCols.includes('orgao') ? 'orgao' : null);

    if (nameCol) {
        console.log(`\nUsing name column: ${nameCol}`);
        const orgao = db.prepare(`SELECT * FROM orgaos WHERE ${nameCol} LIKE '%Governo%'`).get() as any;

        if (orgao) {
            console.log(`\nFound Orgao: ${orgao[nameCol]} (ID: ${orgao.id})`);

            // Check structural diagrams
            console.log("\n--- Structural Diagrams ---");
            const structural = db.prepare('SELECT * FROM organogramas_estruturais WHERE orgao_id = ?').all(orgao.id);
            console.log(`Count: ${structural.length}`);
            structural.forEach((s: any) => {
                console.log(`ID: ${s.id}, Date: ${s.data || s.created_at}, Active: ${s.ativo}`);
            });

            // Check functional diagrams (Suspected Duplication)
            console.log("\n--- Functional Diagrams (diagramas_funcionais) ---");
            // Assuming linking column is orgao_id based on typical schema
            const linkCol = diagramasCols.includes('orgao_id') ? 'orgao_id' : 'orgao_id'; // Verify linking col

            const functional = db.prepare(`SELECT * FROM diagramas_funcionais WHERE ${linkCol} = ?`).all(orgao.id);
            console.log(`Count: ${functional.length}`);

            functional.forEach((f: any) => {
                console.log(`\nDiagram ID: ${f.id}`);
                console.log(`Name/Data: ${f.nome || f.data}`);

                // Check cargos for this diagram
                const cargos = db.prepare('SELECT COUNT(*) as count FROM cargos_funcionais WHERE diagrama_id = ?').get(f.id) as any;
                console.log(`Cargos count: ${cargos.count}`);

                // Get sample cargos
                const samples = db.prepare('SELECT * FROM cargos_funcionais WHERE diagrama_id = ? LIMIT 3').all(f.id);
                samples.forEach((c: any) => console.log(` - Cargo: ${c.nome || c.cargo_nome}, Qtd: ${c.quantidade}`));
            });

            if (functional.length > 1) {
                console.log("\n[!] WARNING: Multiple functional diagrams found. This likely causes the duplication/garbage data.");
            }

        } else {
            console.log("Orgao 'Governo' not found.");
        }
    } else {
        console.log("Could not identify name column in 'orgaos' table.");
    }

} catch (err) {
    console.error("Error inspecting database:", err);
}
