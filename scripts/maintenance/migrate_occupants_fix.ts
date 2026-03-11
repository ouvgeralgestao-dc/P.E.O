import { dbAsync } from '../backend/database/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERAL_OCCUPANTS_FILE = path.join(__dirname, '../backend/data/central/general_occupants.json');

const migrateOccupants = async () => {
    try {
        console.log('🚀 Reiniciando migração de Ocupantes Gerais...');

        const ocupantesData = await fs.readFile(GENERAL_OCCUPANTS_FILE, 'utf-8');
        const ocupantes = JSON.parse(ocupantesData);

        await dbAsync.run("BEGIN TRANSACTION");

        let count = 0;
        for (const [cargoId, nome] of Object.entries(ocupantes)) {
            // INSERT OR REPLACE
            const exists = await dbAsync.get('SELECT cargo_id FROM ocupantes_gerais WHERE cargo_id = ?', [cargoId]);
            if (exists) {
                await dbAsync.run('UPDATE ocupantes_gerais SET nome_ocupante = ? WHERE cargo_id = ?', [nome, cargoId]);
            } else {
                await dbAsync.run('INSERT INTO ocupantes_gerais (cargo_id, nome_ocupante) VALUES (?, ?)', [cargoId, nome]);
            }
            count++;
        }

        await dbAsync.run("COMMIT");
        console.log(`✅ ${count} ocupantes migrados com sucesso.`);

    } catch (error) {
        console.error('❌ Erro na migração de ocupantes:', error);
        try { await dbAsync.run("ROLLBACK"); } catch { }
    }
};

migrateOccupants();
