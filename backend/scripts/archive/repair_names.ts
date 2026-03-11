
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('c:/Users/junio/OneDrive/Área de Trabalho/Criador_Organograma/backend/data/organograma.sqlite');
const jsonPath = path.resolve('c:/Users/junio/OneDrive/Área de Trabalho/Criador_Organograma/backend/data/orgaos.json');

const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));

async function repair() {
    try {
        console.log('--- REPARO DE CAPITALIZAÇÃO ---');
        
        if (!fs.existsSync(jsonPath)) {
            console.error('JSON não encontrado em:', jsonPath);
            return;
        }

        const orgaosJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        console.log(`Carregados ${orgaosJson.length} órgãos do JSON.`);

        for (const o of orgaosJson) {
            const res = await run('UPDATE orgaos SET nome = ? WHERE id = ?', [o.nome, o.id]);
            console.log(`Atualizado ID '${o.id}' para: "${o.nome}"`);
        }

        console.log('✅ Reparo concluído com sucesso!');
    } catch (e) {
        console.error('❌ Erro no reparo:', e);
    } finally {
        db.close();
    }
}

repair();
