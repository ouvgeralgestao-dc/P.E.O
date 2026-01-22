import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve('data/organograma.sqlite');
const db = new Database(DB_PATH, { verbose: console.log });

try {
    const orgao = db.prepare("SELECT id, nome FROM orgaos WHERE nome LIKE '%Governo%'").get() as any;

    if (!orgao) {
        console.error("Orgao not found!");
        process.exit(1);
    }

    console.log(`Processing duplicates for: ${orgao.nome} (${orgao.id})`);

    // Get all diagrams sorted by latest first
    const diagrams = db.prepare(`
        SELECT id, nome, created_at, updated_at 
        FROM diagramas_funcionais 
        WHERE orgao_id = ? 
        ORDER BY updated_at DESC, created_at DESC
    `).all(orgao.id) as any[];

    console.log(`Found ${diagrams.length} diagrams.`);

    if (diagrams.length <= 1) {
        console.log("No duplicates to remove.");
        process.exit(0);
    }

    const keep = diagrams[0];
    const remove = diagrams.slice(1);

    console.log(`\nKEEPING: ID ${keep.id} (Updated: ${keep.updated_at})`);
    console.log(`REMOVING: ${remove.length} diagrams.`);

    const removeIds = remove.map(d => d.id);

    // Transaction for safety
    const deleteMany = db.transaction((ids: string[]) => {
        // 1. Delete cargos linked to these diagrams
        const deleteCargos = db.prepare(`DELETE FROM cargos_funcionais WHERE diagrama_id IN (${ids.map(() => '?').join(',')})`);
        const cargosResult = deleteCargos.run(...ids);
        console.log(`Deleted ${cargosResult.changes} cargos.`);

        // 2. Delete diagrams
        const deleteDiagrams = db.prepare(`DELETE FROM diagramas_funcionais WHERE id IN (${ids.map(() => '?').join(',')})`);
        const diagramsResult = deleteDiagrams.run(...ids);
        console.log(`Deleted ${diagramsResult.changes} diagrams.`);
    });

    deleteMany(removeIds);
    console.log("\nCleanup complete successfully!");

} catch (err) {
    console.error("Error during cleanup:", err);
}
