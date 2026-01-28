import { dbAsync } from '../database/db.js';

async function listAllOrgaosPlain() {
    console.log('--- LISTA DE ÓRGÃOS ---');
    try {
        const rows = await dbAsync.all('SELECT id, nome FROM orgaos');
        rows.forEach(r => console.log(`ID: ${r.id} | NOME: ${r.nome}`));
        console.log('--- FIM DA LISTA ---');
    } catch (e) {
        console.error('Erro:', e);
    }
}

listAllOrgaosPlain();
