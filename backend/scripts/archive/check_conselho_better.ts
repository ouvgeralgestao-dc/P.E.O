
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', 'data', 'organograma.sqlite');
console.log(`🔍 Conectando ao banco: ${dbPath}`);
const db = new Database(dbPath);

function check() {
    console.log('\n--- BUSCA POR "Conselho de Contribuintes" ---');
    
    // 1. Órgãos
    console.log('\n[Tabela: orgaos]');
    const orgaos = db.prepare("SELECT * FROM orgaos WHERE nome LIKE '%Conselho de Contribuintes%' OR id LIKE '%conselho%'").all();
    console.log(JSON.stringify(orgaos, null, 2));

    // 2. Estruturais
    console.log('\n[Tabela: organogramas_estruturais]');
    const estruturais = db.prepare("SELECT * FROM organogramas_estruturais WHERE orgao_id LIKE '%conselho%'").all();
    console.log(JSON.stringify(estruturais, null, 2));

    // 3. Funcionais
    console.log('\n[Tabela: diagramas_funcionais]');
    const funcionais = db.prepare("SELECT * FROM diagramas_funcionais WHERE orgao_id LIKE '%conselho%'").all();
    console.log(JSON.stringify(funcionais, null, 2));

    // 4. Setores
    console.log('\n[Tabela: setores (LIKE)]');
    const setores = db.prepare("SELECT id, orgao_id, nome FROM setores WHERE nome LIKE '%Conselho%Contribuintes%'").all();
    console.log(JSON.stringify(setores, null, 2));

    console.log('\n--- FIM ---');
}

try {
    check();
} catch (e) {
    console.error(e);
} finally {
    db.close();
}
