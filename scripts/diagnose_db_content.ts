
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../backend/data/organograma.sqlite');

const db = new sqlite3.Database(DB_PATH);

const runQuery = (query) => {
    return new Promise((resolve, reject) => {
        db.get(query, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const diagnose = async () => {
    try {
        console.log('--- DIAGNÓSTICO DE BANCO DE DADOS ---');
        console.log(`DB Path: ${DB_PATH}`);

        const countOrgaos = await runQuery('SELECT COUNT(*) as c FROM orgaos');
        console.log(`Órgãos: ${countOrgaos.c}`);

        const countSetores = await runQuery('SELECT COUNT(*) as c FROM setores');
        console.log(`Setores (Total): ${countSetores.c}`);

        const countDiagramas = await runQuery('SELECT COUNT(*) as c FROM diagramas_funcionais');
        console.log(`Diagramas Funcionais: ${countDiagramas.c}`);

        const countCargos = await runQuery('SELECT COUNT(*) as c FROM cargos_funcionais');
        console.log(`Cargos Funcionais: ${countCargos.c}`);

        const countOcupantes = await runQuery('SELECT COUNT(*) as c FROM ocupantes_gerais');
        console.log(`Ocupantes Gerais: ${countOcupantes.c}`);

        const countLayout = await runQuery('SELECT COUNT(*) as c FROM layout_personalizado');
        console.log(`Layout Personalizado (Nós): ${countLayout.c}`);

        console.log('-------------------------------------');

        // Verificar um órgão específico que sabemos que deveria ter dados
        // Ex: Secretaria de Governo
        const governo = await runQuery("SELECT id FROM orgaos WHERE nome LIKE '%Governo%'");
        if (governo) {
            console.log(`ID Secretaria Governo: ${governo.id}`);
            const setoresGov = await runQuery(`SELECT COUNT(*) as c FROM setores WHERE orgao_id = '${governo.id}'`);
            console.log(`Setores em Governo: ${setoresGov.c}`);
        } else {
            console.log("Secretaria de Governo não encontrada.");
        }

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        db.close();
    }
};

diagnose();
