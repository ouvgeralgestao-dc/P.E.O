// Script de Reparo: Vincular Cargos a Setores Automaticamente
// Este script usa heurísticas de matching por nome para preencher o setor_ref
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: null });

console.log('=== REPARO: VINCULANDO CARGOS A SETORES ===\n');

// 1. Carregar todos os setores
console.log('1. CARREGANDO SETORES...');
const setores = db.prepare('SELECT id, nome, orgao_id FROM setores').all();
console.log(`   Total de setores: ${setores.length}`);

// Criar mapa de lookup (normalizado para comparação)
const setorLookup = new Map();
setores.forEach(s => {
    // Chave: nome normalizado, Valor: { id, nome, orgaoId }
    const nomeNormalizado = s.nome.toLowerCase().trim();
    setorLookup.set(nomeNormalizado, { id: s.id, nome: s.nome, orgaoId: s.orgao_id });
});

// 2. Carregar cargos SEM setor_ref
console.log('\n2. CARREGANDO CARGOS SEM SETOR_REF...');
const cargosSemSetor = db.prepare(`
    SELECT cf.id, cf.nome_cargo, cf.diagrama_id, df.orgao_id
    FROM cargos_funcionais cf
    JOIN diagramas_funcionais df ON cf.diagrama_id = df.id
    WHERE cf.setor_ref IS NULL OR cf.setor_ref = ''
`).all();
console.log(`   Total de cargos sem setor: ${cargosSemSetor.length}`);

// 3. Função de matching inteligente
function encontrarSetorParaCargo(nomeCargo, orgaoId) {
    const cargoNorm = nomeCargo.toLowerCase().trim();

    // Estratégia 1: Match exato em substring
    // Ex: "Diretor de Ouvidoria Geral" contém "Ouvidoria Geral"
    const candidatos = Array.from(setorLookup.entries())
        .map(([nome, dados]) => ({ nome, ...dados }))
        .filter(s => s.orgaoId === orgaoId) // Filtrar por órgão
        .filter(s => s.nome.length > 3) // Ignorar siglas curtas
        .sort((a, b) => b.nome.length - a.nome.length); // Ordenar por comprimento (mais específico primeiro)

    for (const setor of candidatos) {
        const setorNorm = setor.nome.toLowerCase().trim();
        if (cargoNorm.includes(setorNorm)) {
            return setor;
        }
    }

    // Estratégia 2: Match parcial usando palavras-chave
    // Ex: "Analista de Ouvidoria" → buscar setor que contenha "Ouvidoria"
    const palavrasChave = cargoNorm.split(/\s+de\s+|\s+da\s+|\s+do\s+|\s+/).filter(p => p.length > 3);
    for (const palavra of palavrasChave.reverse()) { // Começar pelo final (mais específico)
        for (const setor of candidatos) {
            const setorNorm = setor.nome.toLowerCase();
            if (setorNorm.includes(palavra)) {
                return setor;
            }
        }
    }

    return null;
}

// 4. Processar e atualizar cargos
console.log('\n3. PROCESSANDO MATCHING...');
const updateStmt = db.prepare('UPDATE cargos_funcionais SET setor_ref = ? WHERE id = ?');
let atualizados = 0;
let naoEncontrados = [];

db.transaction(() => {
    for (const cargo of cargosSemSetor) {
        const setorEncontrado = encontrarSetorParaCargo(cargo.nome_cargo, cargo.orgao_id);

        if (setorEncontrado) {
            updateStmt.run(setorEncontrado.id, cargo.id);
            console.log(`   ✅ ${cargo.nome_cargo} → ${setorEncontrado.nome}`);
            atualizados++;
        } else {
            naoEncontrados.push(cargo.nome_cargo);
            console.log(`   ❌ ${cargo.nome_cargo} → NÃO ENCONTRADO (será manual)`);
        }
    }
})();

// 5. Resumo
console.log('\n=== RESUMO ===');
console.log(`   Cargos atualizados: ${atualizados}`);
console.log(`   Cargos não vinculados: ${naoEncontrados.length}`);

if (naoEncontrados.length > 0) {
    console.log('\n   Cargos que precisam de vinculação manual:');
    naoEncontrados.forEach(c => console.log(`   - ${c}`));
}

console.log('\n=== REPARO CONCLUÍDO ===');
db.close();
