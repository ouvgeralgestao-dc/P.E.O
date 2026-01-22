
const path = require('path');
let sqlite3;
try { sqlite3 = require('sqlite3'); } catch (e) {
    try { sqlite3 = require(path.resolve(__dirname, '../backend/node_modules/sqlite3')); } catch (e2) { process.exit(1); }
}
const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = 'c:\\Users\\CroSS\\Desktop\\Criador_Organograma\\backend\\data\\organograma.sqlite';
const db = new sqlite3Verbose.Database(DB_PATH);

const run = async () => {
    db.serialize(() => {
        console.log("--- Verificando Órgãos 'sec-fazenda' ---");
        db.all("SELECT * FROM orgaos WHERE id = 'sec-fazenda' OR nome LIKE '%Fazenda%'", (err, rows) => {
            if (err) console.log(err);
            console.log(JSON.stringify(rows, null, 2));
        });

        console.log("--- Verificando Diagramas Funcionais Recentes ---");
        db.all("SELECT id, orgao_id, created_at FROM diagramas_funcionais ORDER BY created_at DESC LIMIT 5", (err, rows) => {
            if (err) console.log(err);
            console.log(JSON.stringify(rows, null, 2));
        });
    });
    // db.close() será chamado pelo processo terminando ou posso fechar no callback final, mas serialize é síncrono em ordem.
    setTimeout(() => db.close(), 1000);
};

run();
