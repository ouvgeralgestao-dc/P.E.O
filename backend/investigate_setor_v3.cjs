// Script de Depuração V3: Verificar cargos específicos do Sistema Ouvidoria
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: null });

console.log('=== INVESTIGAÇÃO V3: CARGOS DO SISTEMA OUVIDORIA ===\n');

// 1. Encontrar o ID do órgão "sistema-ouvidoria"
console.log('1. BUSCANDO ÓRGÃO "sistema-ouvidoria":');
const orgao = db.prepare(`SELECT id, nome FROM orgaos WHERE id LIKE '%ouvidoria%' OR nome LIKE '%ouvidoria%' LIMIT 5`).all();
console.log('   Órgãos encontrados:', orgao);

// 2. Encontrar diagramas funcionais desse órgão
console.log('\n2. DIAGRAMAS FUNCIONAIS:');
const diagramas = db.prepare(`SELECT id, orgao_id, nome FROM diagramas_funcionais WHERE orgao_id LIKE '%ouvidoria%' ORDER BY created_at DESC`).all();
diagramas.forEach(d => console.log(`   ID: ${d.id} | OrgaoID: ${d.orgao_id} | Nome: ${d.nome}`));

// 3. Pegar os cargos do primeiro diagrama
if (diagramas.length > 0) {
    const diagramaId = diagramas[0].id;
    console.log(`\n3. CARGOS DO DIAGRAMA "${diagramaId}":`);

    const cargos = db.prepare(`
        SELECT id, nome_cargo, setor_ref, ocupante
        FROM cargos_funcionais 
        WHERE diagrama_id = ?
    `).all(diagramaId);

    console.log(`   Total de cargos: ${cargos.length}`);
    cargos.forEach(c => {
        const setorStatus = c.setor_ref ? '✅ TEM setor_ref' : '❌ SEM setor_ref (NULL)';
        console.log(`   - ${c.nome_cargo} | ${setorStatus}`);
        if (c.setor_ref) {
            console.log(`     -> setor_ref: ${c.setor_ref}`);
        }
    });

    // 4. Testar JOIN para esses cargos
    console.log(`\n4. TESTE DO JOIN COM TABELA SETORES:`);
    const cargosComJoin = db.prepare(`
        SELECT c.nome_cargo, c.setor_ref, s.nome as nome_setor_ref
        FROM cargos_funcionais c
        LEFT JOIN setores s ON c.setor_ref = s.id
        WHERE c.diagrama_id = ?
    `).all(diagramaId);

    cargosComJoin.forEach(c => {
        console.log(`   - ${c.nome_cargo}`);
        console.log(`     setor_ref: ${c.setor_ref || 'NULL'}`);
        console.log(`     nome_setor_ref (JOIN): ${c.nome_setor_ref || 'NULL'}`);
    });
}

console.log('\n=== FIM DA INVESTIGAÇÃO V3 ===');
db.close();
