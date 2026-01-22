
const path = require('path');
let sqlite3;
try { sqlite3 = require('sqlite3'); } catch (e) {
    try { sqlite3 = require(path.resolve(__dirname, '../backend/node_modules/sqlite3')); } catch (e2) { process.exit(1); }
}
const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = 'c:\\Users\\CroSS\\Desktop\\Criador_Organograma\\backend\\data\\organograma.sqlite';
const db = new sqlite3Verbose.Database(DB_PATH);

db.serialize(() => {
    // Pegar último diagrama
    db.get("SELECT * FROM diagramas_funcionais WHERE orgao_id = 'sec-fazenda' ORDER BY created_at DESC LIMIT 1", (err, diag) => {
        if (err) { console.error(err); return; }
        if (!diag) { console.log("Nenhum diagrama encontrado para sec-fazenda"); return; }

        console.log("Diagrama:", JSON.stringify(diag, null, 2));

        // Pegar cargos
        db.all("SELECT id, nome_cargo, parent_id, hierarquia FROM cargos_funcionais WHERE diagrama_id = ?", [diag.id], (err2, cargos) => {
            if (err2) console.error(err2);
            else {
                console.log("Cargos:");
                console.table(cargos);
            }
            db.close();
        });
    });
});
