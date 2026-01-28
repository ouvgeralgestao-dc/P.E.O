/**
 * Script para limpar TODOS os órgãos "Conselho" fantasmas do banco
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'data', 'organograma.sqlite');
console.log(`📂 Banco: ${DB_PATH}`);

const db = new Database(DB_PATH);

console.log('\n🔍 Buscando órgãos com "conselho" no nome...\n');

// Encontrar todos os órgãos "conselho"
const conselhos = db.prepare("SELECT id, nome FROM orgaos WHERE UPPER(nome) LIKE UPPER('%conselho%')").all() as any[];

if (conselhos.length === 0) {
    console.log('✅ Nenhum órgão "Conselho" encontrado no banco.');
    db.close();
    process.exit(0);
}

console.log(`📋 Encontrados ${conselhos.length} órgão(s):`);
conselhos.forEach((o: any) => console.log(`   - ${o.nome} (${o.id})`));

console.log('\n🗑️ Removendo todos...\n');

// Remover cada um
for (const orgao of conselhos) {
    console.log(`\n🧹 Removendo: ${orgao.nome} (${orgao.id})`);
    
    // Cargos funcionais
    try {
        const r = db.prepare('DELETE FROM cargos_funcionais WHERE diagrama_id IN (SELECT id FROM diagramas_funcionais WHERE orgao_id = ?)').run(orgao.id);
        console.log(`   ✓ cargos_funcionais: ${r.changes}`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
    }
    
    // Diagramas funcionais
    try {
        const r = db.prepare('DELETE FROM diagramas_funcionais WHERE orgao_id = ?').run(orgao.id);
        console.log(`   ✓ diagramas_funcionais: ${r.changes}`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
    }
    
    // Estrutural
    try {
        const r = db.prepare('DELETE FROM organogramas_estruturais WHERE orgao_id = ?').run(orgao.id);
        console.log(`   ✓ organogramas_estruturais: ${r.changes}`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
    }
    
    // Setores
    try {
        const r = db.prepare('DELETE FROM setores WHERE orgao_id = ?').run(orgao.id);
        console.log(`   ✓ setores: ${r.changes}`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
    }
    
    // Layout
    try {
        const r = db.prepare('DELETE FROM layout_personalizado WHERE orgao_id = ?').run(orgao.id);
        console.log(`   ✓ layout_personalizado: ${r.changes}`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
    }
    
    // Órgão
    const r = db.prepare('DELETE FROM orgaos WHERE id = ?').run(orgao.id);
    console.log(`   ✓ orgaos: ${r.changes}`);
}

// Verificar se todos foram removidos
console.log('\n🔍 Verificando remoção...');
const remaining = db.prepare("SELECT id, nome FROM orgaos WHERE UPPER(nome) LIKE UPPER('%conselho%')").all();
if (remaining.length === 0) {
    console.log('✅ Todos os órgãos "Conselho" foram removidos com sucesso!');
} else {
    console.log('❌ Ainda existem órgãos "Conselho":');
    remaining.forEach((o: any) => console.log(`   - ${o.nome} (${o.id})`));
}

db.close();
console.log('\n✨ Script concluído.');
