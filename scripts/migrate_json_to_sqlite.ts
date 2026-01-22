import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as sqlStorage from '../backend/services/sqliteStorageService.js';
import { dbAsync } from '../backend/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos locais dos dados JSON (Leitura Manual para evitar conflitos de import)
// const DATA_DIR = path.join(__dirname, '../backend/data');
const DATA_DIR = path.join(__dirname, '../backup/banco_json'); // USER REQUESTED SOURCE
const CENTRAL_DIR = path.join(DATA_DIR, 'central');
const ORGAOS_DIR = path.join(DATA_DIR, 'orgaos');
const INDEX_FILE = path.join(CENTRAL_DIR, 'index.json');

const readJSON = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
};

const runMigration = async () => {
    console.log('🚀 Iniciando Migração JSON -> SQLite (v2)...');

    try {
        // 1. Validar estrutura
        const indexData = await readJSON(INDEX_FILE);
        if (!indexData) {
            console.error('❌ Index JSON não encontrado ou inválido.');
            process.exit(1);
        }

        // 0. LIMPEZA TOTAL (Para evitar conflitos de IDs antigos e duplicatas)
        console.log('🧹 Limpando banco de dados para importação limpa...');
        await dbAsync.run("DELETE FROM ocupantes_gerais");
        await dbAsync.run("DELETE FROM layout_personalizado");
        await dbAsync.run("DELETE FROM cargos_funcionais");
        await dbAsync.run("DELETE FROM diagramas_funcionais");
        await dbAsync.run("DELETE FROM setores");
        await dbAsync.run("DELETE FROM orgaos");
        await dbAsync.run("DELETE FROM organogramas_estruturais"); // Dependente de orgaos, mas bom garantir
        console.log('✅ Banco limpo.');

        const orgaosList = indexData.orgao || indexData.orgaos || [];
        console.log(`📦 Encontrados ${orgaosList.length} órgãos no índice.`);

        // 2. Iterar e Migrar
        for (const orgaoSummary of orgaosList) {
            const orgaoId = orgaoSummary.id;
            console.log(`\n🔹 Processando Órgão: ${orgaoSummary.orgao || orgaoSummary.nome} (${orgaoId})...`);

            const orgaoPath = path.join(ORGAOS_DIR, orgaoId);
            const metadataPath = path.join(orgaoPath, 'metadata.json');
            const estruturalPath = path.join(orgaoPath, 'estrutural.json');

            try {
                // A. Ler dados JSON
                const metadata = await readJSON(metadataPath);

                // Se metadata não existe, tenta pular ou usar dados do Summary
                if (!metadata) {
                    console.warn(`⚠️ Metadata incompleto para ${orgaoId}, verificando se pasta existe...`);
                    try {
                        await fs.access(orgaoPath);
                    } catch {
                        console.warn(`   ❌ Pasta não encontrada. Pulando lixo do índice.`);
                        continue;
                    }
                    console.warn(`   ⚠️ Pasta existe mas metadata.json falhou. Pulando.`);
                    continue;
                }

                const estrutural = await readJSON(estruturalPath) || { setores: [], tamanhoFolha: 'A4' };

                // CORREÇÃO CRÍTICA: Fallback de nome
                const nomeOrgao = metadata.nome || metadata.orgao || orgaoSummary.nome || orgaoSummary.orgao || 'Órgão Sem Nome';

                const orgaoData = {
                    id: orgaoId,
                    orgao: nomeOrgao,
                    auth: metadata.auth,
                    tamanhoFolha: estrutural.tamanhoFolha,
                    setores: estrutural.setores
                };

                // B. Salvar Estrutural no SQLite
                await sqlStorage.createOrUpdateOrgao(orgaoData);
                console.log(`   ✅ Estrutural migrado: "${nomeOrgao}"`);

                // C. Migrar Funcionais
                const funcionalDir = path.join(orgaoPath, 'funcional');

                try {
                    const funcionalFiles = await fs.readdir(funcionalDir);
                    const jsonFiles = funcionalFiles.filter(f => f.endsWith('.json'));

                    if (jsonFiles.length > 0) {
                        console.log(`   🔄 Migrando ${jsonFiles.length} arquivos funcionais...`);

                        for (const file of jsonFiles) {
                            const funcData = await readJSON(path.join(funcionalDir, file));
                            if (funcData) {
                                // Extrair nome da versão do nome do arquivo ou dados
                                const nomeVersao = funcData.nome || file.replace('.json', '');

                                await sqlStorage.addOrganogramaFuncoes(orgaoId, nomeVersao, {
                                    tamanhoFolha: funcData.tamanhoFolha,
                                    cargos: funcData.cargos
                                });
                            }
                        }
                    }
                } catch (e) {
                    // Diretorio funcional pode não existir
                }

            } catch (errOrgao) {
                console.error(`❌ Erro ao migrar órgão ${orgaoId}:`, errOrgao);
            }
        }

        console.log('\n✨ Migração Concluída com Sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal na migração:', error);
        process.exit(1);
    }
};

runMigration();
