import { dbAsync } from './backend/database/db.js';

async function debugOrgaos() {
    try {
        const rows = await dbAsync.all('SELECT id, nome FROM orgaos');
        console.log('--- ÓRGÃOS NO BANCO ---');
        console.table(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debugOrgaos();
