
const path = require('path');
let sqlite3;
try { sqlite3 = require('sqlite3'); } catch (e) {
    try { sqlite3 = require(path.resolve(__dirname, '../backend/node_modules/sqlite3')); } catch (e2) { process.exit(1); }
}
const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = 'c:\\Users\\CroSS\\Desktop\\Criador_Organograma\\backend\\data\\organograma.sqlite';
const db = new sqlite3Verbose.Database(DB_PATH);

const run = async () => {
    const targetId = 'sec-fazenda';

    // Helper promise
    const runSql = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    try {
        console.log("Iniciando unificação para:", targetId);

        // 1. Garantir que o Target existe
        await runSql(`INSERT OR IGNORE INTO orgaos (id, nome, categoria, ordem) VALUES (?, 'Secretaria Municipal de Fazenda', 'SECRETARIAS', 99)`, [targetId]);

        // 2. Migrar Diagramas Funcionais (UPDATE com OR)
        // Migra qualquer coisa que pareça Fazenda mas não seja o target
        await runSql(`UPDATE diagramas_funcionais SET orgao_id = ? WHERE (orgao_id LIKE '%Fazenda%' OR orgao_id LIKE '%fazenda%') AND orgao_id != ?`, [targetId, targetId]);
        console.log("Diagramas migrados.");

        // 3. Migrar Estruturais
        await runSql(`UPDATE organogramas_estruturais SET orgao_id = ? WHERE (orgao_id LIKE '%Fazenda%' OR orgao_id LIKE '%fazenda%') AND orgao_id != ?`, [targetId, targetId]);
        console.log("Estruturais migrados.");

        // 4. Migrar Setores
        await runSql(`UPDATE setores SET orgao_id = ? WHERE (orgao_id LIKE '%Fazenda%' OR orgao_id LIKE '%fazenda%') AND orgao_id != ?`, [targetId, targetId]);
        console.log("Setores migrados.");

        // 5. Deletar Órgãos duplicados (antigos)
        await runSql(`DELETE FROM orgaos WHERE (id LIKE '%Fazenda%' OR id LIKE '%fazenda%') AND id != ?`, [targetId]);
        console.log("Órgãos duplicados removidos.");

        console.log("Unificação Concluída com Sucesso!");

    } catch (e) {
        console.error("Erro na unificação:", e);
    } finally {
        db.close();
    }
};

run();
