
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.resolve('c:/Users/junio/OneDrive/Área de Trabalho/Criador_Organograma/backend/data/organograma.sqlite');
const db = new sqlite3.Database(dbPath);
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

async function check() {
    try {
        console.log('--- AUDITORIA DE CAPITALIZAÇÃO ---');
        const rows = await all('SELECT id, nome FROM orgaos WHERE id IN ("ipmdc", "fundec", "funlar") OR nome LIKE "%IPMDC%" OR nome LIKE "%Fundec%" OR id LIKE "%ipmdc%"');
        console.log('Dados encontrados:', JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        db.close();
    }
}

check();
