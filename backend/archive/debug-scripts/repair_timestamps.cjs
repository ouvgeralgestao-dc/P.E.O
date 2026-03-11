const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('--- Repairing Timestamps ---');

    // Helper to add column if not exists
    const addColumnIfNeeded = (table, col, type) => {
        try {
            const cols = db.pragma(`table_info(${table})`);
            if (!cols.find(c => c.name === col)) {
                console.log(`Adding ${col} to ${table}...`);
                db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
            }
        } catch (e) {
            console.error(`Error checking/adding ${col} to ${table}:`, e.message);
        }
    };

    console.log('0. Verifying Columns...');
    addColumnIfNeeded('orgaos', 'created_at', 'DATETIME');
    addColumnIfNeeded('orgaos', 'updated_at', 'DATETIME');
    addColumnIfNeeded('organogramas_estruturais', 'created_at', 'DATETIME');
    addColumnIfNeeded('organogramas_estruturais', 'updated_at', 'DATETIME');
    addColumnIfNeeded('diagramas_funcionais', 'created_at', 'DATETIME');
    addColumnIfNeeded('diagramas_funcionais', 'updated_at', 'DATETIME');

    console.log('1. Updating Orgaos...');
    const info1 = db.prepare(`
        UPDATE orgaos 
        SET created_at = COALESCE(updated_at, '2026-01-01 12:00:00') 
        WHERE created_at IS NULL OR created_at = ''
    `).run();
    console.log(`Orgaos Updated: ${info1.changes}`);

    console.log('2. Updating Estuturais...');
    const info2 = db.prepare(`
        UPDATE organogramas_estruturais 
        SET created_at = COALESCE(updated_at, '2026-01-01 12:00:00') 
        WHERE created_at IS NULL OR created_at = ''
    `).run();
    console.log(`Estruturais Updated: ${info2.changes}`);

    console.log('3. Updating Funcoes...');
    const info3 = db.prepare(`
        UPDATE diagramas_funcionais 
        SET created_at = COALESCE(updated_at, '2026-01-01 12:00:00') 
        WHERE created_at IS NULL OR created_at = ''
    `).run();
    console.log(`Funcoes Updated: ${info3.changes}`);

    console.log('--- Repair Complete ---');

} catch (error) {
    console.error('Error:', error);
}
