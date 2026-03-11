
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'data', 'organograma.sqlite');

console.log('🔍 Diagnosing DB at:', dbPath);

const db = new Database(dbPath, { readonly: true });

try {
    const totalOrgaos = db.prepare('SELECT COUNT(*) as count FROM orgaos').get() as { count: number };
    console.log(`\n📊 Total de Órgãos: ${totalOrgaos.count}`);

    const totalSetores = db.prepare('SELECT COUNT(*) as count FROM setores').get() as { count: number };
    console.log(`📊 Total de Setores: ${totalSetores.count}`);

    const sectorsPerOrgan = db.prepare(`
        SELECT o.id, o.nome, COUNT(s.id) as qtd_setores
        FROM orgaos o
        LEFT JOIN setores s ON s.orgao_id = o.id
        GROUP BY o.id
        ORDER BY qtd_setores DESC
    `).all();

    console.log('\n--- 🏢 Setores por Órgão ---');
    console.table(sectorsPerOrgan);

    const sectorsWithoutOrgan = db.prepare('SELECT COUNT(*) as count FROM setores WHERE orgao_id IS NULL').get() as { count: number };
    console.log(`\n⚠️ Setores sem Órgão: ${sectorsWithoutOrgan.count}`);

} catch (e: any) {
    console.error('❌ Erro:', e.message);
} finally {
    db.close();
}
