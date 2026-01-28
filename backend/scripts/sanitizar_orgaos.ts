import { dbAsync } from '../database/db.js';
import { formatTitleCase } from '../utils/formatters.js';

async function sanitizarOrgaos() {
    console.log("🚀 Iniciando saneamento de órgãos...");

    try {
        await dbAsync.run("BEGIN TRANSACTION");

        // 1. Obter todos os órgãos
        const orgaos = await dbAsync.all("SELECT id, nome FROM orgaos");
        console.log(`📊 Total de órgãos encontrados: ${orgaos.length}`);

        // Mapa para detectar duplicatas por "slug"
        // Slug aqui será a versão normalizada do ID ou Nome
        const slugMap = new Map();

        for (const orgao of orgaos) {
            // Normalização simples para identificar duplicatas lógicas (ex: sec-governo vs secretaria_municipal_de_governo)
            // Removemos prefixos comuns e normalizamos separadores
            let slug = orgao.id.toLowerCase()
                .replace(/^sec-/, 'secretaria_')
                .replace(/-/g, '_');
            
            // Caso especial para IDs curtos
            if (orgao.id === 'sec-governo') slug = 'secretaria_municipal_de_governo';

            if (!slugMap.has(slug)) {
                slugMap.set(slug, []);
            }
            slugMap.get(slug).push(orgao);
        }

        for (const [slug, duplicatas] of slugMap.entries()) {
            if (duplicatas.length > 1) {
                console.log(`\n🔍 Detectada duplicidade para o slug: ${slug}`);
                
                // Escolher o ID "mestre"
                // Prioridade: IDs que não contêm underscores (geralmente os de constantes/seed)
                // Ou o ID que já está sendo usado em mais lugares (simplificação: o primeiro da lista se não houver preferência)
                let mestre = duplicatas.find(d => d.id === 'sec-governo') || 
                             duplicatas.find(d => !d.id.includes('_')) || 
                             duplicatas[0];
                
                // Se o mestre tem um nome "ruim" (snake_case) e o escravo tem um nome "bom", troca
                const melhorNome = duplicatas.find(d => !d.nome.includes('_'))?.nome || mestre.nome;
                mestre.nome = melhorNome;

                console.log(`🏆 Mestre escolhido: ${mestre.id} | Nome Final: ${mestre.nome}`);

                const escravos = duplicatas.filter(d => d.id !== mestre.id);

                for (const escravo of escravos) {
                    console.log(`   🔗 Mesclando escravo: ${escravo.id} -> ${mestre.id}`);

                    // Atualizar todas as tabelas relacionadas
                    const tabelas = [
                        { nome: 'setores', col: 'orgao_id' },
                        { nome: 'diagramas_funcionais', col: 'orgao_id' },
                        { nome: 'organogramas_estruturais', col: 'orgao_id' },
                        { nome: 'layout_personalizado', col: 'orgao_id' },
                        { nome: 'users', col: 'setor' } // O campo setor do usuário as vezes guarda o ID/Slug do órgão
                    ];

                    for (const tabela of tabelas) {
                        const result = await dbAsync.run(
                            `UPDATE ${tabela.nome} SET ${tabela.col} = ? WHERE ${tabela.col} = ?`,
                            [mestre.id, escravo.id]
                        );
                        if (result.changes > 0) {
                            console.log(`      ✅ Atualizados ${result.changes} registros na tabela ${tabela.nome}`);
                        }
                    }

                    // Deletar o registro duplicado da tabela orgaos
                    await dbAsync.run("DELETE FROM orgaos WHERE id = ?", [escravo.id]);
                }
            }
        }

        // 2. Corrigir nomes que ainda estão em snake_case no campo 'nome'
        const orgaosRestantes = await dbAsync.all("SELECT id, nome FROM orgaos");
        for (const orgao of orgaosRestantes) {
            if (orgao.nome.includes('_') || orgao.nome === orgao.nome.toLowerCase()) {
                const nomeFormatado = formatTitleCase(orgao.nome.replace(/_/g, ' '));
                if (nomeFormatado !== orgao.nome) {
                    console.log(`📝 Formatando nome: "${orgao.nome}" -> "${nomeFormatado}"`);
                    await dbAsync.run("UPDATE orgaos SET nome = ? WHERE id = ?", [nomeFormatado, orgao.id]);
                }
            }
        }

        await dbAsync.run("COMMIT");
        console.log("\n✅ Saneamento concluído com sucesso!");

    } catch (error) {
        await dbAsync.run("ROLLBACK");
        console.error("❌ Erro durante o saneamento:", error);
    }
}

sanitizarOrgaos();
