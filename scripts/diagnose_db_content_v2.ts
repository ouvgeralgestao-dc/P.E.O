
import path from 'path';
import { fileURLToPath } from 'url';
import * as storageService from '../backend/services/sqliteStorageService.js';
import { dbAsync } from '../backend/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const diagnose = async () => {
    try {
        console.log('--- DIAGNÓSTICO DE BANCO DE DADOS (VIA SERVICE) ---');

        // Contagem direta
        const countOrgaos = await dbAsync.get('SELECT COUNT(*) as c FROM orgaos');
        console.log(`Órgãos: ${countOrgaos.c}`);

        const countSetores = await dbAsync.get('SELECT COUNT(*) as c FROM setores');
        console.log(`Setores (Total): ${countSetores.c}`);

        const countDiagramas = await dbAsync.get('SELECT COUNT(*) as c FROM diagramas_funcionais');
        console.log(`Diagramas Funcionais: ${countDiagramas.c}`);

        const countCargos = await dbAsync.get('SELECT COUNT(*) as c FROM cargos_funcionais');
        console.log(`Cargos Funcionais: ${countCargos.c}`);

        // Verificar especificamente a Secretaria de Governo
        const governo = await dbAsync.get("SELECT id, nome FROM orgaos WHERE nome LIKE '%Governo%' OR id LIKE '%governo%' LIMIT 1");
        if (governo) {
            console.log(`\nAnálise: ${governo.nome} (${governo.id})`);

            const setoresGov = await dbAsync.get("SELECT COUNT(*) as c FROM setores WHERE orgao_id = ?", [governo.id]);
            console.log(`Setores: ${setoresGov.c}`);

            // Listar alguns setores para ver se estão lá
            const algunsSetores = await dbAsync.all("SELECT nome_setor FROM setores WHERE orgao_id = ? LIMIT 5", [governo.id]);
            console.log("Amostra de Setores:", algunsSetores.map(s => s.nome_setor));
        } else {
            console.warn("\nSecretaria de Governo não encontrada no DB.");
        }

    } catch (err) {
        console.error('Erro no diagnóstico:', err);
    }
};

diagnose();
