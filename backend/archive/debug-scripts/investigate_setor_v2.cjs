// Script de Depuração V2: Verificar discrepância de IDs
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: null });

console.log('=== INVESTIGAÇÃO V2: ESTRUTURA DE SETORES ===\n');

// 1. Listar TODAS as tabelas do banco
console.log('1. TABELAS NO BANCO:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log(`   - ${t.name}`));

// 2. Verificar estrutura da tabela setores
console.log('\n2. COLUNAS DA TABELA setores:');
const setoresColumns = db.pragma('table_info(setores)');
setoresColumns.forEach(c => console.log(`   - ${c.name} (${c.type})`));

// 3. Contar quantos setores existem
const countSetores = db.prepare('SELECT COUNT(*) as total FROM setores').get();
console.log(`\n3. TOTAL DE SETORES: ${countSetores.total}`);

// 4. Pegar um setor_ref que está falhando e comparar
console.log('\n4. ANÁLISE DE UM CASO ESPECÍFICO:');
const cargoProblema = db.prepare(`
    SELECT id, nome_cargo, setor_ref 
    FROM cargos_funcionais 
    WHERE setor_ref IS NOT NULL AND setor_ref != ''
    LIMIT 1
`).get();

if (cargoProblema) {
    console.log(`   Cargo: ${cargoProblema.nome_cargo}`);
    console.log(`   setor_ref armazenado: "${cargoProblema.setor_ref}"`);
    console.log(`   Tipo de setor_ref: ${typeof cargoProblema.setor_ref}`);
    console.log(`   Comprimento: ${cargoProblema.setor_ref.length}`);

    // Tentar encontrar na tabela setores
    const setorNaTabela = db.prepare('SELECT id, nome FROM setores WHERE id = ?').get(cargoProblema.setor_ref);
    if (setorNaTabela) {
        console.log(`   ✅ ENCONTRADO em setores: "${setorNaTabela.nome}"`);
    } else {
        console.log(`   ❌ NÃO ENCONTRADO em setores`);

        // Tentar busca parcial
        const buscaParcial = db.prepare(`SELECT id, nome FROM setores WHERE id LIKE ?`).all(`%${cargoProblema.setor_ref.substring(0, 8)}%`);
        if (buscaParcial.length > 0) {
            console.log(`   Busca parcial encontrou:`);
            buscaParcial.forEach(s => console.log(`      - "${s.id}" = "${s.nome}"`));
        }
    }
}

// 5. Verificar se setor_ref está apontando para organogramas_estruturais em vez de setores
console.log('\n5. VERIFICANDO SE setor_ref APONTA PARA OUTRA TABELA:');
const setoresEstruturais = db.prepare(`
    SELECT se.id, se.nome, se.orgao_id 
    FROM setores se 
    LIMIT 5
`).all();
console.log('   Amostra de setores:');
setoresEstruturais.forEach(s => console.log(`      ID: ${s.id} | Nome: ${s.nome} | OrgaoID: ${s.orgao_id}`));

// 6. Verificar especificamente o JOIN
console.log('\n6. TESTE DIRETO DO JOIN:');
const testJoin = db.prepare(`
    SELECT 
        c.nome_cargo,
        c.setor_ref,
        s.id as setor_id_encontrado,
        s.nome as setor_nome_encontrado
    FROM cargos_funcionais c
    LEFT JOIN setores s ON c.setor_ref = s.id
    WHERE c.setor_ref IS NOT NULL AND c.setor_ref != ''
    LIMIT 5
`).all();
testJoin.forEach(r => {
    const status = r.setor_nome_encontrado ? '✅' : '❌';
    console.log(`   ${status} Cargo: ${r.nome_cargo}`);
    console.log(`      setor_ref: "${r.setor_ref}"`);
    console.log(`      JOIN result: ${r.setor_nome_encontrado || 'NULO'}`);
});

console.log('\n=== FIM DA INVESTIGAÇÃO V2 ===');
db.close();
