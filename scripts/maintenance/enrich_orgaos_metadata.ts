import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAsync } from '../backend/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORGAOS_JSON_PATH = path.join(__dirname, '../backend/data/orgaos.json');

const normalize = (str) => {
    return str ? str.toLowerCase().trim() : '';
};

const runEnrichment = async () => {
    console.log('🚀 Iniciando Migração de Metadados v2 (Upsert)...');

    try {
        // 1. Garantir Colunas
        try { await dbAsync.run("ALTER TABLE orgaos ADD COLUMN categoria TEXT DEFAULT 'OUTROS'"); } catch (e) { }
        try { await dbAsync.run("ALTER TABLE orgaos ADD COLUMN ordem INTEGER DEFAULT 999"); } catch (e) { }

        // 2. Ler orgaos.json
        let orgaosJson = [];
        try {
            const data = await fs.readFile(ORGAOS_JSON_PATH, 'utf-8');
            orgaosJson = JSON.parse(data);
        } catch (e) {
            console.error('❌ Falha ao ler orgaos.json:', e);
            process.exit(1);
        }

        console.log(`🔄 Processando ${orgaosJson.length} registros...`);

        let inserted = 0;
        let updated = 0;

        // Buscar dados atuais para evitar queries em loop excessivas
        const orgaosDb = await dbAsync.all('SELECT id, nome FROM orgaos');

        for (const item of orgaosJson) {
            const normalizedJsonName = normalize(item.nome);

            // Tentar encontrar match no banco
            let match = orgaosDb.find(o => normalize(o.nome) === normalizedJsonName);

            if (!match) {
                // Match parcial
                const cleanJson = normalizedJsonName.replace('municipal', '').replace(/\s+/g, ' ').trim();
                match = orgaosDb.find(o => {
                    const cleanDb = normalize(o.nome).replace('municipal', '').replace(/\s+/g, ' ').trim();
                    return cleanDb.includes(cleanJson) || cleanJson.includes(cleanDb);
                });
            }

            if (match) {
                // UPDATE
                await dbAsync.run(
                    'UPDATE orgaos SET categoria = ?, ordem = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [item.categoria, item.ordem, match.id]
                );
                console.log(`   ✏️ Atualizado: ${match.nome} (ID: ${match.id})`);
                updated++;
            } else {
                // INSERT (Novo órgão sem dados de organograma ainda)
                // Usar ID do JSON se possível, ou limpar se tiver caracteres inválidos?
                // O orgaos.json usa IDs como 'sec-governo', que são validos.

                await dbAsync.run(
                    'INSERT INTO orgaos (id, nome, categoria, ordem, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [item.id, item.nome, item.categoria, item.ordem, item.createdAt || new Date().toISOString(), item.updatedAt || new Date().toISOString()]
                );

                // Criar entrada vazia em organogramas_estruturais para garantir integridade LEFT JOIN se necessário?
                // Não obritatório, mas boa prática inicializar.
                await dbAsync.run(
                    'INSERT INTO organogramas_estruturais (orgao_id, tamanho_folha, updated_at) VALUES (?, ?, ?)',
                    [item.id, 'A4', new Date().toISOString()]
                );

                console.log(`   ➕ Inserido: ${item.nome} (ID: ${item.id})`);
                inserted++;
            }
        }

        console.log(`\n✨ Concluído! Atualizados: ${updated}, Inseridos: ${inserted}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
};

runEnrichment();
