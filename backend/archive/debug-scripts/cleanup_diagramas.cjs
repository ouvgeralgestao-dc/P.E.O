// Script de Limpeza: Remover diagramas duplicados e manter apenas o mais recente
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'organograma.sqlite');
const db = new Database(dbPath, { verbose: null });

console.log('=== LIMPEZA: REMOVENDO DIAGRAMAS DUPLICADOS ===\n');

// 1. Encontrar todos os órgãos com múltiplos diagramas funcionais
const orgaosComDuplicatas = db.prepare(`
    SELECT orgao_id, COUNT(*) as total 
    FROM diagramas_funcionais 
    GROUP BY orgao_id 
    HAVING total > 1
`).all();

console.log('Órgãos com diagramas duplicados:', orgaosComDuplicatas.length);

let totalRemovidos = 0;

db.transaction(() => {
    for (const orgao of orgaosComDuplicatas) {
        console.log(`\n📁 ${orgao.orgao_id}: ${orgao.total} diagramas`);

        // Pegar todos os diagramas deste órgão ordenados por data (mais recente primeiro)
        const diagramas = db.prepare(`
            SELECT id, created_at 
            FROM diagramas_funcionais 
            WHERE orgao_id = ? 
            ORDER BY created_at DESC
        `).all(orgao.orgao_id);

        // Manter apenas o primeiro (mais recente), deletar os outros
        const diagramasParaDeletar = diagramas.slice(1);

        for (const diagrama of diagramasParaDeletar) {
            // Deletar cargos do diagrama
            db.prepare('DELETE FROM cargos_funcionais WHERE diagrama_id = ?').run(diagrama.id);
            // Deletar diagrama
            db.prepare('DELETE FROM diagramas_funcionais WHERE id = ?').run(diagrama.id);
            console.log(`   ❌ Deletado: ${diagrama.id} (${diagrama.created_at})`);
            totalRemovidos++;
        }

        console.log(`   ✅ Mantido: ${diagramas[0].id} (${diagramas[0].created_at})`);
    }
})();

console.log('\n=== RESUMO ===');
console.log(`   Diagramas removidos: ${totalRemovidos}`);

// 2. Agora rodar o reparo de setor_ref
console.log('\n=== REPARANDO SETOR_REF ===\n');

// Carregar setores
const setores = db.prepare('SELECT id, nome, orgao_id FROM setores').all();
const setorLookup = new Map();
setores.forEach(s => {
    setorLookup.set(s.nome.toLowerCase().trim(), { id: s.id, nome: s.nome, orgaoId: s.orgao_id });
});

// Carregar cargos sem setor_ref
const cargosSemSetor = db.prepare(`
    SELECT cf.id, cf.nome_cargo, cf.diagrama_id, df.orgao_id
    FROM cargos_funcionais cf
    JOIN diagramas_funcionais df ON cf.diagrama_id = df.id
    WHERE cf.setor_ref IS NULL OR cf.setor_ref = ''
`).all();

console.log(`Cargos sem setor: ${cargosSemSetor.length}`);

// Função de matching
function encontrarSetorParaCargo(nomeCargo, orgaoId) {
    const cargoNorm = nomeCargo.toLowerCase().trim();

    const candidatos = Array.from(setorLookup.entries())
        .map(([nome, dados]) => ({ nome, ...dados }))
        .filter(s => s.orgaoId === orgaoId)
        .filter(s => s.nome.length > 3)
        .sort((a, b) => b.nome.length - a.nome.length);

    for (const setor of candidatos) {
        const setorNorm = setor.nome.toLowerCase().trim();
        if (cargoNorm.includes(setorNorm)) {
            return setor;
        }
    }

    const palavrasChave = cargoNorm.split(/\s+de\s+|\s+da\s+|\s+do\s+|\s+/).filter(p => p.length > 3);
    for (const palavra of palavrasChave.reverse()) {
        for (const setor of candidatos) {
            const setorNorm = setor.nome.toLowerCase();
            if (setorNorm.includes(palavra)) {
                return setor;
            }
        }
    }

    return null;
}

// Atualizar cargos
const updateStmt = db.prepare('UPDATE cargos_funcionais SET setor_ref = ? WHERE id = ?');
let atualizados = 0;

db.transaction(() => {
    for (const cargo of cargosSemSetor) {
        const setorEncontrado = encontrarSetorParaCargo(cargo.nome_cargo, cargo.orgao_id);
        if (setorEncontrado) {
            updateStmt.run(setorEncontrado.id, cargo.id);
            console.log(`   ✅ ${cargo.nome_cargo} → ${setorEncontrado.nome}`);
            atualizados++;
        }
    }
})();

console.log(`\nCargos atualizados: ${atualizados}`);
console.log('\n=== LIMPEZA E REPARO CONCLUÍDOS ===');
db.close();
