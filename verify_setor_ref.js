const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend/data/organograma.sqlite');
console.log(`Connecting to DB at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    // 1. Verificar se existem cargos funcionais
    db.all("SELECT count(*) as total FROM cargos_funcionais", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Total cargos_funcionais: ${rows[0].total}`);
    });

    // 2. Verificar amostra de cargos com seus setor_ref
    db.all(`
        SELECT id, nome_cargo, setor_ref, is_operacional 
        FROM cargos_funcionais 
        ORDER BY ROWID DESC 
        LIMIT 20
    `, (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('\n--- Amostra de Cargos (Últimos 20) ---');
        console.table(rows);
    });

    // 3. Verificar se existe algum setor com o ID referenciado (se houver setor_ref)
    db.all(`
        SELECT c.nome_cargo, c.setor_ref, s.nome as nome_setor_encontrado
        FROM cargos_funcionais c
        LEFT JOIN setores s ON c.setor_ref = s.id
        WHERE c.setor_ref IS NOT NULL
        LIMIT 10
    `, (err, rows) => {
        if (err) { console.error(err); return; }
        console.log('\n--- Teste de JOIN (setor_ref -> setores) ---');
        console.table(rows);
    });

});

db.close();
