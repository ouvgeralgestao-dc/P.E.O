import Database from 'better-sqlite3';
import path from 'path';

// Script para diagnosticar o estado atual do banco de dados
// Uso: npx tsx backend/scripts/diagnose_db.ts

const DB_PATH = path.resolve(__dirname, '../../data/organograma.sqlite');
console.log(`Connecting to DB at: ${DB_PATH}`);

const db = new Database(DB_PATH, { verbose: console.log });

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("=== Tabelas no Banco ===");
    tables.forEach((t: any) => console.log(` - ${t.name}`));

    // Exemplo: Verificar Secretaria de Governo
    const orgao = db.prepare("SELECT * FROM orgaos WHERE nome LIKE '%Governo%'").get() as any;
    if (orgao) {
        console.log(`\n=== Órgão: ${orgao.nome} ===`);

        const diagramas = db.prepare("SELECT * FROM diagramas_funcionais WHERE orgao_id = ?").all(orgao.id);
        console.log(`Diagramas Funcionais: ${diagramas.length}`);

        diagramas.forEach((d: any) => {
            const cargos = db.prepare("SELECT COUNT(*) as count FROM cargos_funcionais WHERE diagrama_id = ?").get(d.id) as any;
            console.log(` - ID: ${d.id} | Atualizado em: ${d.updated_at} | Cargos: ${cargos.count}`);
        });
    }

} catch (error) {
    console.error("Erro ao diagnosticar banco:", error);
}
