
import { dbAsync } from '../backend/database/db.js';

async function inspect() {
    console.log("=== INSPEÇÃO: SECRETARIA MUNICIPAL DE FAZENDA ===");

    // 1. Encontrar o Órgão
    const orgaos = await dbAsync.all('SELECT * FROM orgaos WHERE nome LIKE "%Fazenda%"');

    if (orgaos.length === 0) {
        console.log("❌ Nenhuma Secretaria de Fazenda encontrada.");
        return;
    }

    for (const orgao of orgaos) {
        console.log(`\n🏢 ÓRGÃO: ${orgao.nome} (ID: ${orgao.id})`);

        // 2. Buscar Setores (Estrutural)
        const setores = await dbAsync.all('SELECT * FROM setores WHERE orgao_id = ? ORDER BY ordem ASC', [orgao.id]);
        console.log(`   📊 Setores Encontrados: ${setores.length}`);

        if (setores.length > 0) {
            setores.forEach(s => {
                let parentInfo = "RAIZ";
                if (s.parent_id) {
                    // Verificar se pai existe
                    const paiExiste = setores.find(p => p.id === s.parent_id);
                    parentInfo = paiExiste ? `Pai: "${paiExiste.nome}" (${s.parent_id})` : `⚠️ PAI INEXISTENTE (${s.parent_id})`;
                }

                console.log(`      - [${s.hierarquia}] "${s.nome}" (ID: ${s.id}) -> ${parentInfo}`);

                // Verificar JSONs
                try {
                    JSON.parse(s.style_json || '{}');
                    JSON.parse(s.position_json || '{}');
                } catch (e) {
                    console.log(`        ❌ ERRO JSON: ${e.message}`);
                }
            });
        }

        // 3. Buscar Funcionais
        const funcionais = await dbAsync.all('SELECT * FROM diagramas_funcionais WHERE orgao_id = ?', [orgao.id]);
        console.log(`   ⚙️ Diagramas Funcionais: ${funcionais.length}`);
    }
}

inspect();
