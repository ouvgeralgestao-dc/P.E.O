
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'data', 'organograma.sqlite');

console.log('🔍 Verificando banco em:', dbPath);

const db = new Database(dbPath, { readonly: true });

try {
    const orgaosCount = db.prepare('SELECT COUNT(*) as qtd FROM orgaos').get() as { qtd: number };
    console.log('🏛️ Total de Órgãos:', orgaosCount.qtd);

    const setoresCount = db.prepare('SELECT COUNT(*) as qtd FROM setores').get() as { qtd: number };
    console.log('🌳 Total de Setores:', setoresCount.qtd);

    const firstOrgaos = db.prepare('SELECT id, nome FROM orgaos LIMIT 5').all();
    console.log('\n--- 📂 Primeiros 5 Órgãos ---');
    console.log(JSON.stringify(firstOrgaos, null, 2));

    const integrity = db.prepare(`
        SELECT o.id, o.nome, 
        (SELECT COUNT(*) FROM setores s WHERE s.orgao_id = o.id) as qtd_setores 
        FROM orgaos o LIMIT 10
    `).all();
    console.log('\n--- ✅ Integridade (Órgão -> Qtd Setores) ---');
    console.log(JSON.stringify(integrity, null, 2));

    const distinctOrgaoIds = db.prepare('SELECT DISTINCT orgao_id FROM setores').all() as { orgao_id: string }[];
    const setorOrgaoIds = distinctOrgaoIds.map(r => r.orgao_id);

    if (setorOrgaoIds.length > 0) {
        const placeholders = setorOrgaoIds.map(() => '?').join(',');
        const existingOrgaos = db.prepare(`SELECT id FROM orgaos WHERE id IN (${placeholders})`).all(...setorOrgaoIds) as { id: string }[];

        const existingIds = existingOrgaos.map(e => e.id);
        const missing = setorOrgaoIds.filter(id => !existingIds.includes(id));

        console.log('\n--- 🛠️ Auditoria de Órfãos ---');
        console.log('IDs em setores que EXISTEM em orgaos:', existingIds.length);
        console.log('IDs em setores que NÃO EXISTEM em orgaos (Órfãos):', missing);
    }

} catch (e: any) {
    console.error('❌ Erro na auditoria:', e.message);
} finally {
    db.close();
}
