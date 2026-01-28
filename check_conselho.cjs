const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'organogramas.db');
const db = new Database(dbPath);

console.log('=== Verificando Conselho de Contribuintes ===\n');

// Verificar na tabela orgaos
const orgao = db.prepare('SELECT * FROM orgaos WHERE id = ?').get('conselho_de_contribuintes');
console.log('1. Tabela orgaos:', orgao || 'NÃO ENCONTRADO ✅');

// Verificar organogramas estruturais
const estrutural = db.prepare('SELECT * FROM organogramas_estruturais WHERE orgao_id = ?').get('conselho_de_contribuintes');
console.log('2. Organograma estrutural:', estrutural || 'NÃO ENCONTRADO ✅');

// Verificar setores
const setores = db.prepare('SELECT COUNT(*) as count FROM setores WHERE orgao_id = ?').get('conselho_de_contribuintes');
console.log('3. Setores:', setores.count > 0 ? `${setores.count} encontrados ❌` : 'NÃO ENCONTRADO ✅');

// Verificar diagramas funcionais
const funcional = db.prepare('SELECT * FROM diagramas_funcionais WHERE orgao_id = ?').get('conselho_de_contribuintes');
console.log('4. Diagrama funcional:', funcional || 'NÃO ENCONTRADO ✅');

// Listar todos os órgãos
console.log('\n=== Todos os órgãos no banco ===');
const allOrgaos = db.prepare('SELECT id, nome FROM orgaos ORDER BY nome').all();
console.log(`Total: ${allOrgaos.length} órgãos`);
allOrgaos.slice(0, 10).forEach(o => console.log(`  - ${o.nome} (${o.id})`));
if (allOrgaos.length > 10) console.log(`  ... e mais ${allOrgaos.length - 10} órgãos`);

db.close();
