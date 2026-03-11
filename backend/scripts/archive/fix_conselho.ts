
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', 'data', 'organograma.sqlite');
console.log(`[FIX] Conectando ao banco: ${dbPath}`);
const db = new Database(dbPath);

async function runFix() {
    const id = 'conselho-contribuintes';
    
    console.log(`[FIX] Iniciando remoção completa de ${id}...`);
    
    db.prepare("BEGIN TRANSACTION").run();
    
    try {
        // Remover setores
        const deleteSetores = db.prepare("DELETE FROM setores WHERE orgao_id = ?");
        const resSetores = deleteSetores.run(id);
        console.log(`   - Setores removidos: ${resSetores.changes}`);

        // Remover estrutural metadata
        const deleteEstrutural = db.prepare("DELETE FROM organogramas_estruturais WHERE orgao_id = ?");
        const resEstrutural = deleteEstrutural.run(id);
        console.log(`   - Organograma Estrutural removido: ${resEstrutural.changes}`);

        // Remover funcionais
        const deleteFuncionais = db.prepare("DELETE FROM diagramas_funcionais WHERE orgao_id = ?");
        const resFuncionais = deleteFuncionais.run(id);
        console.log(`   - Diagramas Funcionais removidos: ${resFuncionais.changes}`);

        // Remover layout personalizado
        const deleteLayout = db.prepare("DELETE FROM layout_personalizado WHERE orgao_id = ?");
        const resLayout = deleteLayout.run(id);
        console.log(`   - Layout personalizado removido: ${resLayout.changes}`);

        // POR FIM: Remover o Órgão
        const deleteOrgao = db.prepare("DELETE FROM orgaos WHERE id = ?");
        const resOrgao = deleteOrgao.run(id);
        console.log(`   - Órgão (${id}) removido da tabela orgaos: ${resOrgao.changes}`);

        db.prepare("COMMIT").run();
        console.log(`\n✅ SUCESSO! O órgão "${id}" foi totalmente removido. Você pode recriá-lo agora.`);
    } catch (e) {
        db.prepare("ROLLBACK").run();
        console.error("❌ ERRO durante a correção:", e);
    } finally {
        db.close();
    }
}

runFix();
