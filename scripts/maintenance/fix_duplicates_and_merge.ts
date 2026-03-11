
import { dbAsync } from '../backend/database/db.js';

async function fix() {
    console.log("=== INICIANDO CORREÇÃO DE DUPLICATAS ===");

    try {
        await dbAsync.run("BEGIN TRANSACTION");

        const orgaos = await dbAsync.all('SELECT id, nome FROM orgaos');
        const nomeGroups = {};

        // Agrupar por nome
        orgaos.forEach(o => {
            if (!nomeGroups[o.nome]) nomeGroups[o.nome] = [];
            nomeGroups[o.nome].push(o.id);
        });

        for (const [nome, ids] of Object.entries(nomeGroups)) {
            if (ids.length > 1) {
                console.log(`\n🔧 Processando duplicata: "${nome}"`);
                console.log(`   IDs: ${ids.join(', ')}`);

                // 1. Eleger o "Vencedor" (Winner)
                // Preferência: ID mais longo (geralmente normalizado correto) ou que tem estrutura
                let winnerId = ids[0];
                let maxLen = 0;

                // Estratégia: Verificar quem tem estrutura
                for (const id of ids) {
                    const struct = await dbAsync.get('SELECT count(*) as qtd FROM organogramas_estruturais WHERE orgao_id = ?', [id]);
                    if (struct.qtd > 0) {
                        winnerId = id;
                        break;
                    }
                    if (id.length > maxLen) {
                        maxLen = id.length;
                        winnerId = id;
                    }
                }

                console.log(`   🏆 Vencedor eleito: ${winnerId}`);

                // 2. Mover dados dos perdedores para o vencedor
                const losers = ids.filter(id => id !== winnerId);

                for (const loserId of losers) {
                    console.log(`   ➡️ Migrando dados de ${loserId} para ${winnerId}...`);

                    // Mover Diagramas Funcionais
                    const funcUpdates = await dbAsync.run(
                        'UPDATE diagramas_funcionais SET orgao_id = ? WHERE orgao_id = ?',
                        [winnerId, loserId]
                    );
                    console.log(`      - Funcionais migrados: ${funcUpdates.changes}`);

                    // Mover Layout Personalizado
                    await dbAsync.run(
                        'UPDATE layout_personalizado SET orgao_id = ? WHERE orgao_id = ?',
                        [winnerId, loserId]
                    );

                    // Mover Histórico/Outros se houver (mas tabelas principais são essas)

                    // Deletar o Perdedor
                    await dbAsync.run('DELETE FROM organogramas_estruturais WHERE orgao_id = ?', [loserId]);
                    await dbAsync.run('DELETE FROM setores WHERE orgao_id = ?', [loserId]);
                    await dbAsync.run('DELETE FROM orgaos WHERE id = ?', [loserId]);
                    console.log(`      ❌ Órgão duplicado ${loserId} removido.`);
                }
            }
        }

        console.log("\n=== LIMPEZA DE ORGÃOS ESTRUTURAIS ORFÃOS/VAZIOS ===");
        // Limpar registros de organogramas_estruturais que não têm orgao correspondente (integridade)
        await dbAsync.run('DELETE FROM organogramas_estruturais WHERE orgao_id NOT IN (SELECT id FROM orgaos)');

        await dbAsync.run("COMMIT");
        console.log("\n✅ Correção de duplicatas concluída com sucesso.");

    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error("\n❌ Erro fatal na correção:", error);
    }
}

fix();
