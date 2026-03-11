
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAsync } from '../backend/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const diagnose = async () => {
    try {
        console.log('--- DIAGNÓSTICO ESPECÍFICO (Articulação) ---');

        // Buscar ID correto
        const org = await dbAsync.get("SELECT id, nome FROM orgaos WHERE id = 'secretaria_municipal_de_articulacao_institucional'");

        if (org) {
            console.log(`Órgão: ${org.nome} (${org.id})`);

            // Contar setores
            const count = await dbAsync.get("SELECT COUNT(*) as c FROM setores WHERE orgao_id = ?", [org.id]);
            console.log(`Total de Setores no SQL: ${count.c}`);
            console.log(`Esperado (Backup JSON): 5`);

            // Listar nomes e hierarquia
            const rows = await dbAsync.all("SELECT nome, hierarquia, parent_id FROM setores WHERE orgao_id = ?", [org.id]);
            console.table(rows);

        } else {
            console.error("Órgão não encontrado no SQL.");
        }

    } catch (err) {
        console.error('Erro:', err);
    }
};

diagnose();
