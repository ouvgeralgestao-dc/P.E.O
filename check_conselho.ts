
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('backend/database.sqlite');
const db = new sqlite3.Database(dbPath);

const query = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

async function check() {
    console.log('--- BUSCA POR "Conselho de Contribuintes" ---');
    
    console.log('\n1. Tabela orgaos:');
    const orgaos = await query("SELECT * FROM orgaos WHERE nome LIKE '%Conselho de Contribuintes%' OR id LIKE '%conselho%'");
    console.log(JSON.stringify(orgaos, null, 2));

    const orgaoIds = (orgaos as any[]).map(o => o.id);

    if (orgaoIds.length > 0) {
        console.log('\n2. Tabela organogramas_estruturais:');
        const estruturais = await query(`SELECT id, orgao_id FROM organogramas_estruturais WHERE orgao_id IN (${orgaoIds.map(() => '?').join(',')})`, orgaoIds);
        console.log(JSON.stringify(estruturais, null, 2));

        console.log('\n3. Tabela diagramas_funcionais:');
        const funcionais = await query(`SELECT id, orgao_id FROM diagramas_funcionais WHERE orgao_id IN (${orgaoIds.map(() => '?').join(',')})`, orgaoIds);
        console.log(JSON.stringify(funcionais, null, 2));
    } else {
        console.log('\nNenhum órgão encontrado com esse termo.');
    }

    console.log('\n--- FIM ---');
    db.close();
}

check().catch(console.error);
