import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve('data/organograma.sqlite');
const db = new Database(DB_PATH, { verbose: console.log });

const cols = db.prepare("PRAGMA table_info(diagramas_funcionais)").all();
cols.forEach((c: any) => console.log(c.name));

const orgao = db.prepare("SELECT id FROM orgaos WHERE nome LIKE '%Governo%'").get() as any;
if (orgao) {
    // List diagrams with possible date columns
    const diagrams = db.prepare("SELECT * FROM diagramas_funcionais WHERE orgao_id = ?").all(orgao.id);
    console.log(`\nFound ${diagrams.length} diagrams.`);
    if (diagrams.length > 0) {
        // Print first few to see data structure
        console.log("Sample:", diagrams[0]);
    }
}
