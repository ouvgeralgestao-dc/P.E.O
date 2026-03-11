// Script para migrar organogramas gerais do backup JSON para SQLite
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAsync } from '../backend/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../backup/banco_json');

const migrate = async () => {
    try {
        console.log('=== Migração de Organogramas Gerais para SQLite ===\n');

        // 1. Criar tabelas (caso não existam)
        console.log('Criando tabelas...');

        // Dropar e recriar para garantir schema correto
        await dbAsync.run(`DROP TABLE IF EXISTS organogramas_gerais`);
        await dbAsync.run(`DROP TABLE IF EXISTS ocupantes_gerais`);
        await dbAsync.run(`DROP TABLE IF EXISTS layout_personalizado`);

        await dbAsync.run(`
            CREATE TABLE IF NOT EXISTS organogramas_gerais (
                tipo TEXT PRIMARY KEY,
                data_json TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await dbAsync.run(`
            CREATE TABLE IF NOT EXISTS ocupantes_gerais (
                cargo_id TEXT PRIMARY KEY,
                nome_ocupante TEXT NOT NULL
            )
        `);
        await dbAsync.run(`
            CREATE TABLE IF NOT EXISTS layout_personalizado (
                orgao_id TEXT NOT NULL,
                node_id TEXT NOT NULL,
                x REAL NOT NULL,
                y REAL NOT NULL,
                custom_style_json TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (orgao_id, node_id)
            )
        `);
        console.log('✅ Tabelas criadas/verificadas.\n');

        // 2. Migrar global.json
        console.log('Migrando global.json...');
        const globalPath = path.join(BACKUP_DIR, 'central/global.json');
        const globalData = JSON.parse(await fs.readFile(globalPath, 'utf-8'));

        await dbAsync.run('DELETE FROM organogramas_gerais WHERE tipo = ?', ['estrutural']);
        await dbAsync.run(
            'INSERT INTO organogramas_gerais (tipo, data_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            ['estrutural', JSON.stringify(globalData)]
        );
        console.log('✅ global.json migrado como tipo "estrutural".\n');

        // 3. Migrar custom_positions.json (convertendo para formato row-per-node)
        console.log('Migrando custom_positions.json...');
        const positionsPath = path.join(BACKUP_DIR, 'custom_positions.json');
        const positionsData = JSON.parse(await fs.readFile(positionsPath, 'utf-8'));

        await dbAsync.run('DELETE FROM layout_personalizado');

        for (const [organogramaId, layoutData] of Object.entries(positionsData)) {
            const positions = layoutData.positions || [];
            for (const pos of positions) {
                await dbAsync.run(
                    `INSERT INTO layout_personalizado (orgao_id, node_id, x, y, custom_style_json, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        organogramaId,
                        pos.id,
                        pos.position?.x || 0,
                        pos.position?.y || 0,
                        JSON.stringify(pos.customStyle || {}),
                        layoutData.updatedAt || new Date().toISOString()
                    ]
                );
            }
            console.log(`  ✓ Layout para "${organogramaId}" migrado (${positions.length} nós).`);
        }
        console.log('✅ custom_positions.json migrado.\n');

        // 4. Migrar general_occupants.json
        console.log('Migrando general_occupants.json...');
        const occupantsPath = path.join(BACKUP_DIR, 'central/general_occupants.json');
        const occupantsData = JSON.parse(await fs.readFile(occupantsPath, 'utf-8'));

        await dbAsync.run('DELETE FROM ocupantes_gerais');
        for (const [cargoId, nomeOcupante] of Object.entries(occupantsData)) {
            await dbAsync.run(
                'INSERT INTO ocupantes_gerais (cargo_id, nome_ocupante) VALUES (?, ?)',
                [cargoId, nomeOcupante]
            );
        }
        console.log(`✅ ${Object.keys(occupantsData).length} ocupantes gerais migrados.\n`);

        console.log('=== Migração concluída com sucesso! ===');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro na migração:', err.message);
        process.exit(1);
    }
};

migrate();
