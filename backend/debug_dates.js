import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'organograma.db');
const db = new sqlite3(dbPath);

console.log('--- Checking Sistema Ouvidoria ---');
const orgao = db.prepare('SELECT id, nome, created_at, updated_at FROM orgaos WHERE nome LIKE ?').get('%Sistema Ouvidoria%');
console.log('Orgao:', orgao);

if (orgao) {
    const estrutural = db.prepare('SELECT created_at, updated_at FROM organogramas_estruturais WHERE orgao_id = ?').get(orgao.id);
    console.log('Estrutural:', estrutural);
}
