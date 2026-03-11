
const path = require('path');
let sqlite3;
try { sqlite3 = require('sqlite3'); } catch (e) {
    try { sqlite3 = require(path.resolve(__dirname, '../backend/node_modules/sqlite3')); } catch (e2) { process.exit(1); }
}
const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = 'c:\\Users\\CroSS\\Desktop\\Criador_Organograma\\backend\\data\\organograma.sqlite';
const db = new sqlite3Verbose.Database(DB_PATH);

const run = () => {
    // Tenta restaurar com os possíveis slugs que o frontend geraria
    const inserts = [
        { id: 'Secretaria Municipal de Fazenda', nome: 'Secretaria Municipal de Fazenda' }, // Caso legacy direto
        { id: 'secretaria-municipal-de-fazenda', nome: 'Secretaria Municipal de Fazenda' } // Slug comum
    ];

    inserts.forEach(item => {
        db.run("INSERT OR IGNORE INTO orgaos (id, nome, categoria, ordem) VALUES (?, ?, 'SECRETARIAS', 99)", [item.id, item.nome], function (err) {
            if (err) console.error(`Erro ao inserir ${item.id}:`, err);
            else console.log(`Restaurado (ou já existe): ${item.id}`);
        });
    });

    // Validar qual ficou
    setTimeout(() => {
        db.all("SELECT * FROM orgaos WHERE nome LIKE '%Fazenda%'", [], (err, rows) => {
            console.log("Órgãos Fazenda atualmente no banco:", rows);
            db.close();
        });
    }, 1000);
};

run();
