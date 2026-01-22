import Database from 'better-sqlite3';
import path from 'path';

// Adjust path as needed based on where this script is run
const DB_PATH = path.resolve('backend/data/organograma.sqlite');
console.log(`Connecting to DB at: ${DB_PATH}`);

const db = new Database(DB_PATH, { verbose: console.log });

try {
    const row = db.prepare("SELECT * FROM organogramas WHERE orgao LIKE '%Governo%'").get() as any;

    if (row) {
        console.log("\n=== ORGAO FOUND ===");
        console.log(`ID: ${row.id}`);
        console.log(`Name: ${row.orgao}`);

        // 1. Inspect Structural Data
        if (row.organograma_estrutural) {
            const estrutural = JSON.parse(row.organograma_estrutural);
            console.log("\n--- Structural Data ---");
            console.log(`Setores count: ${estrutural.setores ? estrutural.setores.length : 0}`);

            // Helper to count DAS in structural
            let totalDAS = 0;
            const countDAS = (cargos: any[]) => {
                if (!cargos) return 0;
                return cargos.reduce((acc, c) => acc + (parseInt(c.quantidade) || 0), 0);
            }

            const traverseSetores = (setores: any[]) => {
                if (!setores) return;
                setores.forEach(s => {
                    if (s.cargos) totalDAS += countDAS(s.cargos);
                    if (s.children) traverseSetores(s.children);
                });
            };
            traverseSetores(estrutural.setores);
            console.log(`Total Symbols (calculated): ${totalDAS}`);
        }

        // 2. Inspect Functional Data (The suspected issue)
        if (row.organogramas_funcoes) {
            const funcoes = JSON.parse(row.organogramas_funcoes);
            console.log("\n--- Functional Data (organogramas_funcoes column) ---");
            console.log(`Type: ${Array.isArray(funcoes) ? "Array" : typeof funcoes}`);

            if (Array.isArray(funcoes)) {
                console.log(`Total items in array: ${funcoes.length}`);

                funcoes.forEach((f, i) => {
                    console.log(`\n[Item ${i}]`);
                    console.log(`Data: ${f.data || "No date"}`);
                    console.log(`Cargos count (top-level): ${f.cargos ? f.cargos.length : 0}`);

                    // Count total cargos recursively for this item
                    let itemTotalCargos = 0;
                    const countCargos = (list: any[]) => {
                        if (!list) return;
                        list.forEach(c => {
                            itemTotalCargos += (parseInt(c.quantidade) || 1);
                            if (c.children) countCargos(c.children);
                        });
                    };
                    countCargos(f.cargos);
                    console.log(`Total recursive cargos in this item: ${itemTotalCargos}`);
                });
            }
        } else {
            console.log("No organogramas_funcoes data found.");
        }

    } else {
        console.log("Orgao 'Governo' not found in database.");
    }

} catch (err) {
    console.error("Error inspecting database:", err);
}
