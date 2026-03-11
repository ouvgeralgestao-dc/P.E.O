
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
        console.log("Iniciando MERGE de versões para Secretaria de Fazenda...");

        const orgao = await dbAsync.get("SELECT id, nome FROM orgaos WHERE nome LIKE '%Fazenda%' OR id LIKE '%fazenda%'");
        if (!orgao) return console.log("Órgão não encontrado!");

        // Listar todos os diagramas
        const diags = await dbAsync.all(
            "SELECT id FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at ASC",
            [orgao.id]
        );

        console.log(`Encontrados ${diags.length} diagramas fragmentados. Coletando cargos...`);

        const allCargos = [];
        for (const d of diags) {
            const cargos = await dbAsync.all("SELECT * FROM cargos_funcionais WHERE diagrama_id = ?", [d.id]);
            allCargos.push(...cargos);
        }

        console.log(`Total de cargos encontrados no histórico: ${allCargos.length}`);

        if (allCargos.length === 0) return console.log("Nenhum cargo para recuperar.");

        // Criar DIAGRAMA UNIFICADO
        const newId = `func_MERGED_${Date.now()}`;
        const now = new Date().toISOString();

        await dbAsync.run(
            'INSERT INTO diagramas_funcionais (id, orgao_id, nome, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [newId, orgao.id, 'Versão Unificada (Recuperada)', now, now]
        );

        console.log(`Criado novo diagrama: ${newId}. Inserindo cargos...`);

        const stmt = db.prepare(`INSERT INTO cargos_funcionais (
            id, diagrama_id, nome_cargo, ocupante, hierarquia, parent_id, is_assessoria,
            style_json, position_json, simbolos_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        // Gerador de ID simples
        const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Inserir todos os cargos como raízes (parent_id null) para evitar erros de parent inexistente
            // Ou melhor: Tentar manter parent se possível, mas como são de diagramas diferentes, os IDs de parent podem não existir nesse set.
            // Vou zerar parent_id para garantir que apareçam soltos e o usuário organiza.

            allCargos.forEach((c, index) => {
                // Espalhar visualmente para não ficarem empilhados?
                // Vou dar um reset no position_json para (0,0) e deixar o AutoLayout (que ativei) cuidar,
                // OU dar uma posição incremental.

                const posX = (index % 5) * 250;
                const posY = Math.floor(index / 5) * 150;
                const newPos = JSON.stringify({ x: posX, y: posY });

                stmt.run(
                    uuid(), // Novo ID único
                    newId,
                    c.nome_cargo,
                    c.ocupante,
                    c.hierarquia,
                    null, // Parent NULL (Root)
                    c.is_assessoria,
                    c.style_json,
                    newPos, // Posição em Grid
                    c.simbolos_json
                );
            });

            db.run("COMMIT", () => {
                console.log("MERGE CONCLUÍDO! Todos os cargos foram reunidos na versão mais recente.");
                console.log("Por favor, recarregue a página de edição.");
            });
        });
        stmt.finalize();

    } catch (e) {
        console.error("Erro:", e);
    } finally {
        db.close();
    }
};

run();
