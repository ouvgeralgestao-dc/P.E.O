
import { dbAsync } from '../backend/database/db.js';

async function fix() {
    console.log("=== REPARO: SECRETARIA MUNICIPAL DE FAZENDA ===");

    // 1. Obter IDs dos setores existentes
    const setores = await dbAsync.all('SELECT id, nome, hierarquia FROM setores WHERE orgao_id = "secretaria_municipal_de_fazenda"');

    const pai = setores.find(s => parseFloat(s.hierarquia) === 1);
    const filho = setores.find(s => parseFloat(s.hierarquia) === 2);

    if (pai && filho) {
        console.log(`🔗 Conectando:`);
        console.log(`   PAI: ${pai.nome} (${pai.id})`);
        console.log(`   FILHO: ${filho.nome} (${filho.id})`);

        await dbAsync.run(
            'UPDATE setores SET parent_id = ? WHERE id = ?',
            [pai.id, filho.id]
        );
        console.log("✅ Conexão restaurada com sucesso.");
    } else {
        console.log("❌ Não foi possível encontrar par pai/filho óbvio.");
        // Se a estrutura estiver muito corrompida, melhor limpar
        if (setores.length > 0 && (!pai || !filho)) {
            console.log("⚠️ Estrutura incoerente. Limpando setores estruturais para permitir recriação limpa pelo usuário.");
            await dbAsync.run('DELETE FROM setores WHERE orgao_id = "secretaria_municipal_de_fazenda"');
            // NÃO apagamos funcionais
            console.log("🧹 Setores limpos.");
        }
    }
}

fix();
