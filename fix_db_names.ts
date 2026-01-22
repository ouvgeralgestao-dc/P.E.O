
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'backend', 'data', 'organograma.sqlite');

const db = new Database(dbPath);

try {
    console.log('📦 Conectado ao banco de dados.');

    // 1. Corrigir o nome da Defesa Civil remanescente
    const update = db.prepare("UPDATE orgaos SET nome = 'Secretaria Municipal de Defesa Civil' WHERE nome LIKE '%Defesa%Civil%' OR id LIKE '%defesa%civil%'").run();
    console.log(`✅ Órgãos atualizados: ${update.changes}`);

    // 2. Listar para conferência
    const rows = db.prepare("SELECT id, nome FROM orgaos").all() as { id: string, nome: string }[];

    console.log('\n--- 📊 Estado Atual do Banco ---');
    rows.forEach(r => console.log(`ID: ${r.id} | Nome: ${r.nome}`));

} catch (err: any) {
    console.error('❌ Erro durante a correção:', err.message);
} finally {
    db.close();
}
