
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAsync } from '../backend/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORGAOS_JSON_PATH = path.join(__dirname, '../backup/banco_json/orgaos.json');

const restore = async () => {
    try {
        console.log('📦 Restaurando lista completa de órgãos...');

        const raw = await fs.readFile(ORGAOS_JSON_PATH, 'utf-8');
        const orgaos = JSON.parse(raw);

        console.log(`Lidos ${orgaos.length} órgãos do JSON.`);

        await dbAsync.run("BEGIN TRANSACTION");

        for (const org of orgaos) {
            // Verificar se já existe
            const exists = await dbAsync.get('SELECT id FROM orgaos WHERE id = ?', [org.id]);

            if (!exists) {
                await dbAsync.run(
                    'INSERT INTO orgaos (id, nome, created_at, updated_at) VALUES (?, ?, ?, ?)',
                    [org.id, org.nome, org.createdAt, org.updatedAt]
                );
                // Inserir metadata estrutural placeholder
                await dbAsync.run(
                    'INSERT INTO organogramas_estruturais (orgao_id, tamanho_folha, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                    [org.id, 'A4']
                );
                console.log(`➕ Inserido: ${org.nome} (${org.id})`);
            } else {
                console.log(`🆗 Já existe: ${org.nome}`);
            }
        }

        await dbAsync.run("COMMIT");
        console.log('✅ Lista de órgãos restaurada com sucesso!');

    } catch (err) {
        await dbAsync.run("ROLLBACK");
        console.error('Erro na restauração:', err);
    }
};

restore();
