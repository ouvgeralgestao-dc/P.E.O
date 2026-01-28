import { dbAsync } from '../database/db.js';

async function listAllOrgaos() {
    console.log('--- EXAMINANDO ÓRGÃOS ---');
    try {
        const rows = await dbAsync.all('SELECT id, nome FROM orgaos');
        console.table(rows);
    } catch (e) {
        console.error('Erro:', e);
    }
}

listAllOrgaos();
