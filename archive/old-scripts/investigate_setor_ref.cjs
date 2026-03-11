// Script de Depuração Profunda: Rastrear setor_ref nos cargos funcionais
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: null });

console.log('=== INVESTIGAÇÃO PROFUNDA: SETOR_REF ===\n');

// 1. Verificar estrutura da tabela cargos_funcionais
console.log('1. COLUNAS DA TABELA cargos_funcionais:');
const columns = db.pragma('table_info(cargos_funcionais)');
columns.forEach(c => console.log(`   - ${c.name} (${c.type})`));

// 2. Verificar se existem setores cadastrados
console.log('\n2. SETORES CADASTRADOS NA TABELA setores:');
const setores = db.prepare('SELECT id, nome FROM setores LIMIT 20').all();
if (setores.length === 0) {
    console.log('   ⚠️ NENHUM SETOR ENCONTRADO! Isso é suspeito.');
} else {
    setores.forEach(s => console.log(`   - ID: ${s.id?.substring(0, 8)}... | Nome: ${s.nome}`));
}

// 3. Verificar cargos com setor_ref preenchido
console.log('\n3. CARGOS FUNCIONAIS COM SETOR_REF PREENCHIDO:');
const cargosComSetor = db.prepare(`
    SELECT id, nome_cargo, setor_ref 
    FROM cargos_funcionais 
    WHERE setor_ref IS NOT NULL AND setor_ref != ''
    LIMIT 10
`).all();
if (cargosComSetor.length === 0) {
    console.log('   ⚠️ NENHUM CARGO TEM setor_ref PREENCHIDO! Esse é o problema.');
} else {
    cargosComSetor.forEach(c => console.log(`   - Cargo: ${c.nome_cargo} | setor_ref: ${c.setor_ref}`));
}

// 4. Testar o JOIN exato que o backend faz
console.log('\n4. RESULTADO DO JOIN (Query do Backend):');
const joinResult = db.prepare(`
    SELECT c.id, c.nome_cargo, c.setor_ref, s.nome as nome_setor_ref 
    FROM cargos_funcionais c 
    LEFT JOIN setores s ON c.setor_ref = s.id 
    LIMIT 10
`).all();
joinResult.forEach(r => {
    console.log(`   - Cargo: ${r.nome_cargo}`);
    console.log(`     setor_ref (ID): ${r.setor_ref || 'NULL'}`);
    console.log(`     nome_setor_ref: ${r.nome_setor_ref || 'NULL (JOIN falhou ou setor_ref inválido)'}`);
});

// 5. Verificar se o ID de setor_ref bate com algum setor
console.log('\n5. VERIFICAÇÃO CRUZADA (setor_ref vs setores.id):');
const verificacao = db.prepare(`
    SELECT c.setor_ref, 
           (SELECT s.nome FROM setores s WHERE s.id = c.setor_ref) as nome_encontrado
    FROM cargos_funcionais c 
    WHERE c.setor_ref IS NOT NULL AND c.setor_ref != ''
    LIMIT 5
`).all();
if (verificacao.length === 0) {
    console.log('   Nenhum cargo com setor_ref para verificar.');
} else {
    verificacao.forEach(v => {
        const status = v.nome_encontrado ? '✅' : '❌ (ID não existe em setores)';
        console.log(`   - setor_ref: ${v.setor_ref} -> ${v.nome_encontrado || 'NÃO ENCONTRADO'} ${status}`);
    });
}

console.log('\n=== FIM DA INVESTIGAÇÃO ===');
db.close();
