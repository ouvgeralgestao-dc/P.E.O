const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('--- Shifting Timestamps (-3 Hours) ---');

    // Only run this ONCE. User can verify results.
    // Shifts string "2026-02-04 19:00:00" to "2026-02-04 16:00:00" using SQLite datetime modifier.

    console.log('1. Shifting Orgaos...');
    db.prepare(`
        UPDATE orgaos 
        SET created_at = datetime(created_at, '-3 hours'),
            updated_at = datetime(updated_at, '-3 hours')
        WHERE created_at IS NOT NULL
    `).run();

    console.log('2. Shifting Estruturais...');
    db.prepare(`
        UPDATE organogramas_estruturais 
        SET created_at = datetime(created_at, '-3 hours'),
            updated_at = datetime(updated_at, '-3 hours')
        WHERE created_at IS NOT NULL
    `).run();

    console.log('3. Shifting Funcionais...');
    db.prepare(`
        UPDATE diagramas_funcionais 
        SET created_at = datetime(created_at, '-3 hours'),
            updated_at = datetime(updated_at, '-3 hours')
        WHERE created_at IS NOT NULL
    `).run();

    console.log('--- Shift Complete ---');

} catch (error) {
    console.error('Error:', error);
}
