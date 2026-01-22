import { dbAsync } from '../backend/database/db.js';

const list = async () => {
    const rows = await dbAsync.all('SELECT id, nome, categoria FROM orgaos');
    console.log('--- ÓRGÃOS NO BANCO ---');
    rows.forEach(r => {
        console.log(`[${r.id}] "${r.nome}" (Cat: ${r.categoria})`);
    });
};
list();
