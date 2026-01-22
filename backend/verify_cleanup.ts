import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve('data/organograma.sqlite');
const db = new Database(DB_PATH, { verbose: console.log });

const orgao = db.prepare("SELECT id, nome FROM orgaos WHERE nome LIKE '%Governo%'").get() as any;
if (orgao) {
    const diagrams = db.prepare("SELECT * FROM diagramas_funcionais WHERE orgao_id = ?").all(orgao.id);
    console.log(`\nRemaining diagrams for ${orgao.nome}: ${diagrams.length}`);

    diagrams.forEach((f: any) => {
        const cargos = db.prepare('SELECT COUNT(*) as count FROM cargos_funcionais WHERE diagrama_id = ?').get(f.id) as any;
        console.log(`- Diagram ID: ${f.id} | Cargos Count: ${cargos.count}`);
    });
}
