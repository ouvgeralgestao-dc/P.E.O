
const path = require('path');

// Resolver sqlite3 robustamente
let sqlite3;
try {
    sqlite3 = require('sqlite3');
} catch (e) {
    try {
        sqlite3 = require(path.resolve(__dirname, '../backend/node_modules/sqlite3'));
    } catch (e2) {
        console.error("Não foi possível encontrar sqlite3. Rode 'npm install sqlite3' na raiz ou backend.");
        process.exit(1);
    }
}

const sqlite3Verbose = sqlite3.verbose();
// Caminho absoluto CORRETO
const DB_PATH = 'c:\\Users\\CroSS\\Desktop\\Criador_Organograma\\backend\\data\\organograma.sqlite';
console.log("Tentando conectar em:", DB_PATH);

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
        // Debug tabelas
        const tables = await dbAsync.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tabelas encontradas:", tables.map(t => t.name));

        console.log("Analisando versões para Secretaria de Fazenda...");

        // 1. Achar ID do Orgao
        const orgao = await dbAsync.get("SELECT id, nome FROM orgaos WHERE nome LIKE '%Fazenda%' OR id LIKE '%fazenda%'");
        if (!orgao) {
            console.log("Órgão não encontrado!");
            return;
        }
        console.log(`Órgão encontrado: ${orgao.nome} (${orgao.id})`);

        // 2. Listar diagramas funcionais
        const diags = await dbAsync.all(
            "SELECT id, created_at, updated_at FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at DESC",
            [orgao.id]
        );

        console.log(`\nEncontrados ${diags.length} diagramas funcionais.`);
        console.log("---------------------------------------------------");
        console.log("Data Criação         | ID (Parcial) | Qtd Cargos");
        console.log("---------------------------------------------------");

        let bestVersion = null;
        let maxCargos = -1;

        for (const d of diags) {
            const count = await dbAsync.get("SELECT count(*) as qtd FROM cargos_funcionais WHERE diagrama_id = ?", [d.id]);
            const qtd = count.qtd;

            console.log(`${d.created_at} | ${d.id.substring(0, 10)}... | ${qtd}`);

            if (qtd > maxCargos) {
                maxCargos = qtd;
                bestVersion = d;
            }
        }
        console.log("---------------------------------------------------");

        if (bestVersion && maxCargos > 0) {
            console.log(`\nMelhor versão candidata: ${bestVersion.id} com ${maxCargos} cargos.`);
            console.log(`Criada em: ${bestVersion.created_at}`);

            // Sugestão de restore (Se quiser rodar, descomentar aqui e implementar)
            // Vou implementar a cópia agora mesmo se encontrar a versão boa.
            if (maxCargos > 2) { // Critério para "Versão Boa": mais que os 2 atuais
                console.log("RESTAURANDO AUTOMATICAMENTE PARA A VERSÃO TOP...");
                await restoreVersion(bestVersion.id, orgao.id);
            }
        } else {
            console.log("\nNenhuma versão com cargos encontrada (ou todas vazias).");
        }

    } catch (e) {
        console.error("Erro:", e);
    } finally {
        db.close();
    }
};

const restoreVersion = async (sourceDiagramId, orgaoId) => {
    // 1. Gerar novo ID
    const newId = `func_restored_${Date.now()}`;
    const now = new Date().toISOString();

    // 2. Criar novo diagrama
    await dbAsync.run(
        'INSERT INTO diagramas_funcionais (id, orgao_id, nome, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [newId, orgaoId, 'Restored Auto Version', now, now]
    );

    // 3. Copiar cargos
    const cargosSource = await dbAsync.all('SELECT * FROM cargos_funcionais WHERE diagrama_id = ?', [sourceDiagramId]);
    console.log(`Copiando ${cargosSource.length} cargos...`);

    const stmt = db.prepare(`INSERT INTO cargos_funcionais (
        id, diagrama_id, nome_cargo, ocupante, hierarquia, parent_id, is_assessoria,
        style_json, position_json, simbolos_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    // Usar 'uuid' geraria dependência, vou gerar ID aleatório simples
    const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    // Mapear IDs antigos para novos para manter hierarquia
    const idMap = {};
    cargosSource.forEach(c => {
        idMap[c.id] = uuid(); // Novo ID
    });

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        cargosSource.forEach(c => {
            const newCargoId = idMap[c.id];
            // Parent ID também precisa ser mapeado se existir no set
            const newParentId = (c.parent_id && idMap[c.parent_id]) ? idMap[c.parent_id] : null;

            stmt.run(
                newCargoId,
                newId,
                c.nome_cargo,
                c.ocupante,
                c.hierarquia,
                newParentId,
                c.is_assessoria,
                c.style_json,
                c.position_json,
                c.simbolos_json
            );
        });
        db.run("COMMIT", () => {
            console.log("RESTORE CONCLUÍDO COM SUCESSO! A nova versão 'Latest' contém todos os cargos.");
        });
    });
    stmt.finalize();
};

run();
