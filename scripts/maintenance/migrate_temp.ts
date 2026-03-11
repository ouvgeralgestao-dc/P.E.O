const path = require('path');
const fs = require('fs');

// Importar serviços (ajustar caminhos conforme necessário, assumindo execução da raiz ou scripts/)
// Como estamos usando módulos ES6 no projeto original mas CommonJS no script novo/sqlite, 
// talvez precisemos de um ajuste. O projeto original usa "type": "module" no package.json?
// Vamos verificar. Se for module, este script precisa ser .mjs ou usar import.

// Vamos assumir que o projeto é misto ou ES modules.
// Vou criar como .mjs para garantir suporte a import.

import * as jsonStorage from '../backend/services/storageService.js';
import * as sqlStorage from '../backend/services/sqliteStorageService.js';
import { dbAsync } from '../backend/database/db.js';

const runMigration = async () => {
    console.log('🚀 Iniciando Migração JSON -> SQLite...');

    try {
        // 1. Listar Órgãos do Índice JSON
        console.log('📦 Lendo lista de órgãos JSON...');
        const orgaosList = await jsonStorage.listOrgaosIndex();
        console.log(`📋 Encontrados ${orgaosList.length} órgãos para migrar.`);

        // 2. Iterar e Migrar
        for (const orgaoSummary of orgaosList) {
            const orgaoId = orgaoSummary.id;
            console.log(`\n🔹 Processando Órgão: ${orgaoSummary.orgao} (${orgaoId})...`);

            try {
                // A. Ler dados completos do JSON
                const metadata = await jsonStorage.getOrgaoMetadata(orgaoId);
                const estrutural = await jsonStorage.getOrgaoEstrutural(orgaoId); // Retorna { orgao, setores: [], tamanhoFolha }

                if (!metadata || !estrutural) {
                    console.warn(`⚠️ Dados incompletos para ${orgaoId}, pulando...`);
                    continue;
                }

                // Montar objeto unificado para o SqlStorage
                const orgaoData = {
                    id: orgaoId,
                    orgao: metadata.orgao, // Nome oficial vem do metadata
                    auth: metadata.auth,   // Hash/Salt
                    tamanhoFolha: estrutural.tamanhoFolha,
                    setores: estrutural.setores // Árvore estrutural
                };

                // B. Salvar Estrutural no SQLite
                await sqlStorage.createOrUpdateOrgao(orgaoData);
                console.log(`   ✅ Estrutural migrado.`);

                // C. Migrar Funcionais
                const funcoesList = await jsonStorage.listOrganogramasFuncoes(orgaoId);
                if (funcoesList && funcoesList.length > 0) {
                    console.log(`   🔄 Migrando ${funcoesList.length} versões funcionais...`);

                    for (const fuc of funcoesList) {
                        // Ler arquivo funcional específico
                        // O jsonStorage pode não ter um metodo pra ler UM arquivo especifico público,
                        // mas tem list que retorna nomes. Vamos ter que ler o arquivo JSON na mão se o serviço não expor.
                        // Olhando o storageService.js (arquivo lido anteriormente), não vi um method 'getOrganogramaFuncao(id, file)'.
                        // Vou usar leitura direta de arquivo aqui para garantir.

                        const funcFilePath = path.join('../backend/data/orgaos', orgaoId, 'funcional', fuc.file);
                        // Ajustar path se rodar de dentro de scripts/

                        // Melhor: criar um helper de leitura aqui mesmo se precisar
                        // Mas vou tentar usar o jsonStorage.getOrganogramaFuncao se existir ou inferir.
                        // O storageService.js tem `listOrganogramasFuncoes`.
                    }
                }

            } catch (errOrgao) {
                console.error(`❌ Erro ao migrar órgão ${orgaoId}:`, errOrgao);
            }
        }

        console.log('\n✨ Migração Concluída!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal na migração:', error);
        process.exit(1);
    }
};

runMigration();
