import { dbAsync } from '../backend/database/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERAL_OCCUPANTS_FILE = path.join(__dirname, '../backend/data/central/general_occupants.json');
const CUSTOM_POSITIONS_FILE = path.join(__dirname, '../backend/data/custom_positions.json');

const migrate = async () => {
    try {
        console.log('🚀 Iniciando migração de remanescentes para SQLite...');

        // 1. Criar Tabelas
        console.log('📦 Criando tabelas...');
        await dbAsync.run("BEGIN TRANSACTION");

        await dbAsync.run(`
            CREATE TABLE IF NOT EXISTS ocupantes_gerais (
                cargo_id TEXT PRIMARY KEY,
                nome_ocupante TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await dbAsync.run(`
            CREATE TABLE IF NOT EXISTS layout_personalizado (
                orgao_id TEXT,
                node_id TEXT,
                x REAL,
                y REAL,
                custom_style_json TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (orgao_id, node_id)
            )
        `);

        await dbAsync.run("COMMIT");

        // 2. Migrar Ocupantes Gerais
        console.log('👤 Migrando Ocupantes Gerais...');
        try {
            const ocupantesData = await fs.readFile(GENERAL_OCCUPANTS_FILE, 'utf-8');
            const ocupantes = JSON.parse(ocupantesData);

            await dbAsync.run("BEGIN TRANSACTION");
            const stmt = await dbAsync.prepare('INSERT OR REPLACE INTO ocupantes_gerais (cargo_id, nome_ocupante) VALUES (?, ?)');

            for (const [cargoId, nome] of Object.entries(ocupantes)) {
                await stmt.run(cargoId, nome);
            }
            await stmt.finalize();
            await dbAsync.run("COMMIT");
            console.log(`   ✅ ${Object.keys(ocupantes).length} ocupantes migrados.`);

        } catch (e) {
            console.warn('   ⚠️ Arquivo de ocupantes não encontrado ou vazio.', e.message);
            await dbAsync.run("ROLLBACK");
        }

        // 3. Migrar Posições Customizadas
        console.log('📍 Migrando Posições Customizadas...');
        try {
            const positionsData = await fs.readFile(CUSTOM_POSITIONS_FILE, 'utf-8');
            const positionsMap = JSON.parse(positionsData);

            await dbAsync.run("BEGIN TRANSACTION");
            // Limpar tabela antes de popular para evitar duplicatas se rodar 2x
            await dbAsync.run('DELETE FROM layout_personalizado');

            let totalPos = 0;
            for (const [orgaoId, data] of Object.entries(positionsMap)) {
                if (!data.positions || !Array.isArray(data.positions)) continue;

                for (const pos of data.positions) {
                    await dbAsync.run(
                        `INSERT INTO layout_personalizado (orgao_id, node_id, x, y, custom_style_json, updated_at) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            orgaoId,
                            pos.id,
                            pos.position?.x || 0,
                            pos.position?.y || 0,
                            JSON.stringify(pos.customStyle || {}),
                            data.updatedAt || new Date().toISOString()
                        ]
                    );
                    totalPos++;
                }
            }
            await dbAsync.run("COMMIT");
            console.log(`   ✅ ${totalPos} posições migradas de ${Object.keys(positionsMap).length} órgãos.`);

        } catch (e) {
            console.warn('   ⚠️ Arquivo de posições não encontrado ou vazio.', e.message);
            await dbAsync.run("ROLLBACK");
        }

        console.log('🏁 Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro fatal na migração:', error);
        try { await dbAsync.run("ROLLBACK"); } catch { }
    }
};

migrate();
