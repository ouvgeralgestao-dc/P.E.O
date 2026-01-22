
const path = require('path');

// Resolver sqlite3 robustamente
let sqlite3;
try {
    sqlite3 = require('sqlite3');
} catch (e) {
    try {
        sqlite3 = require(path.resolve(__dirname, '../backend/node_modules/sqlite3'));
    } catch (e2) {
        console.error("Não foi possível encontrar sqlite3.");
        process.exit(1);
    }
}

const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = 'c:\\Users\\CroSS\\Desktop\\Criador_Organograma\\backend\\data\\organograma.sqlite';
const db = new sqlite3Verbose.Database(DB_PATH);

const dbAsync = {
    get: (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    }),
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
    })
};

const run = async () => {
    try {
        console.log("Removendo versão MERGED para expor a versão salva pelo usuário...");

        // Deletar MERGED diagrams
        await dbAsync.run("DELETE FROM diagramas_funcionais WHERE id LIKE 'func_MERGED_%'");
        await dbAsync.run("DELETE FROM cargos_funcionais WHERE diagrama_id LIKE 'func_MERGED_%'"); // Cascade manual (se FK não pegar)

        console.log("Versão Merged removida.");

        // Verificar o novo Latest
        const orgao = await dbAsync.get("SELECT id, nome FROM orgaos WHERE nome LIKE '%Fazenda%' OR id LIKE '%fazenda%'");
        const latest = await dbAsync.get(
            "SELECT id, created_at FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at DESC LIMIT 1",
            [orgao.id]
        );

        if (!latest) return console.log("Nenhum diagrama restante.");

        console.log(`NOVO Latest Diagram ID: ${latest.id}`);
        console.log(`Created At: ${latest.created_at}`);

        const count = await dbAsync.get("SELECT count(*) as qtd FROM cargos_funcionais WHERE diagrama_id = ?", [latest.id]);
        console.log(`Quantidade de Cargos: ${count.qtd}`);

        const cargos = await dbAsync.all("SELECT nome_cargo FROM cargos_funcionais WHERE diagrama_id = ?", [latest.id]);
        console.log("Cargos:", cargos.map(c => c.nome_cargo).join(', '));

    } catch (e) {
        console.error("Erro:", e);
    } finally {
        db.close();
    }
};

run();
