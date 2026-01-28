import { dbAsync } from './backend/database/db.js';

async function diagnose() {
    try {
        console.log("ORGAOS_DB_START");
        const orgaos = await dbAsync.all("SELECT id, nome, categoria FROM orgaos ORDER BY id ASC");
        console.log(JSON.stringify(orgaos, null, 2));
        console.log("ORGAOS_DB_END");

        console.log("SETORES_DB_START");
        const setores = await dbAsync.all("SELECT id, orgao_id, nome FROM setores ORDER BY ROWID DESC LIMIT 10");
        console.log(JSON.stringify(setores, null, 2));
        console.log("SETORES_DB_END");

    } catch (error) {
        console.error("Erro no diagnóstico:", error);
    }
}

diagnose();
