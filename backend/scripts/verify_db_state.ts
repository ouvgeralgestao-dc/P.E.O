
import Database from 'better-sqlite3';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');
console.log(`Checking DB at: ${dbPath}`);

const db = new Database(dbPath, { readonly: true });

try {
    const row = db.prepare(`
        SELECT COUNT(*) as total,
               COUNT(parent_id) as with_parent,
               (SELECT COUNT(*) FROM setores WHERE parent_id IS NOT NULL) as valid_parents
        FROM setores 
        WHERE orgao_id = 'secretaria_municipal_de_governo'
    `).get() as any;

    console.log('--- DB Verification Result ---');
    console.log(`Total Knowledge Nodes: ${row.total}`);
    console.log(`Nodes with Parent ID: ${row.valid_parents}`);

    if (row.valid_parents > 0) {
        console.log('STATUS: DADOS_OK');

        // Show sample
        const samples = db.prepare(`
            SELECT nome, parent_id 
            FROM setores 
            WHERE orgao_id = 'secretaria_municipal_de_governo' 
            AND parent_id IS NOT NULL 
            LIMIT 3
        `).all();
        console.log('Sample data:', JSON.stringify(samples, null, 2));

    } else {
        console.log('STATUS: DADOS_VAZIOS (PERDA DE HIERARQUIA DETECTADA)');
    }

} catch (err: any) {
    console.error('Error verifying DB:', err.message);
} finally {
    db.close();
}
