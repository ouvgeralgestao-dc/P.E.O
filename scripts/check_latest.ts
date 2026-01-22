
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
        console.log("Verificando LATEST version para Secretaria de Fazenda...");

        const orgao = await dbAsync.get("SELECT id, nome FROM orgaos WHERE nome LIKE '%Fazenda%' OR id LIKE '%fazenda%'");
        if (!orgao) return console.log("Órgão não encontrado!");

        // Pegar o diagrama mais recente
        const latest = await dbAsync.get(
            "SELECT id, created_at FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at DESC LIMIT 1",
            [orgao.id]
        );

        if (!latest) {
            console.log("Nenhum diagrama encontrado.");
            return;
        }

        console.log(`Latest Diagram ID: ${latest.id}`);
        console.log(`Created At: ${latest.created_at}`);

        // Contar cargos
        const count = await dbAsync.get("SELECT count(*) as qtd FROM cargos_funcionais WHERE diagrama_id = ?", [latest.id]);
        console.log(`Quantidade de Cargos na Latest: ${count.qtd}`);

        // Listar os nomes dos cargos para confirmar
        const cargos = await dbAsync.all("SELECT nome_cargo FROM cargos_funcionais WHERE diagrama_id = ?", [latest.id]);
        console.log("Cargos:", cargos.map(c => c.nome_cargo).join(', '));

        // Verificar se é o MERGED ou outro
        if (latest.id.includes('MERGED')) {
            console.log("STATUS: A versão ativa é a MERGED (Recuperada).");
        } else {
            console.log("STATUS: A versão ativa NÃO é a Merged. É uma nova versão salva pelo usuário.");
        }

    } catch (e) {
        console.error("Erro:", e);
    } finally {
        db.close();
    }
};

run();
