
const path = require('path');
let sqlite3;
try { sqlite3 = require('sqlite3'); } catch (e) {
    try { sqlite3 = require(path.resolve(__dirname, '../backend/node_modules/sqlite3')); } catch (e2) { process.exit(1); }
}
const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = 'c:\\Users\\CroSS\\Desktop\\Criador_Organograma\\backend\\data\\organograma.sqlite';
const db = new sqlite3Verbose.Database(DB_PATH);

db.all("SELECT * FROM orgaos WHERE nome LIKE '%Fazenda%'", [], (err, rows) => {
    if (err) console.error(err);
    else console.log("Fazenda encontrada:", JSON.stringify(rows, null, 2));
    db.close();
});
