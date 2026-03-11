/**
 * Script para limpar completamente o "Conselho de Contribuintes" do banco de dados
 * Remove o órgão fantasma que impede a criação de novo organograma
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho correto do banco (./backend/data/organograma.sqlite)
const DB_PATH = path.resolve(__dirname, '..', 'data', 'organograma.sqlite');
console.log(`📂 Caminho do banco: ${DB_PATH}`);

const client = new Database(DB_PATH);

const orgaoId = 'conselho_de_contribuintes';
const orgaoName = 'Conselho de Contribuintes';

console.log(`\n🧹 Limpando "${orgaoName}" do banco de dados...\n`);

// 1. Verificar se existe
const exists = client.prepare('SELECT * FROM orgaos WHERE id = ?').get(orgaoId) as any;
if (!exists) {
    console.log('✅ Órgão não encontrado no banco. Nada a fazer.');
    client.close();
    process.exit(0);
}

console.log(`📋 Órgão encontrado: ${exists.nome} (${exists.id})`);

// 2. Executar limpeza em transação
console.log('\n🗑️ Removendo dados relacionados...');

client.transaction(() => {
    // Deletar cargos funcionais relacionados
    try {
        const cargosResult = client.prepare('DELETE FROM cargos_funcionais WHERE diagrama_id IN (SELECT id FROM diagramas_funcionais WHERE orgao_id = ?)').run(orgaoId);
        console.log(`   ✓ cargos_funcionais: ${cargosResult.changes || 0} removidos`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
        console.log(`   ⚠️ cargos_funcionais: Tabela não existe (ignorado)`);
    }

    // Deletar diagramas funcionais
    try {
        const funcionalResult = client.prepare('DELETE FROM diagramas_funcionais WHERE orgao_id = ?').run(orgaoId);
        console.log(`   ✓ diagramas_funcionais: ${funcionalResult.changes || 0} removidos`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
        console.log(`   ⚠️ diagramas_funcionais: Tabela não existe (ignorado)`);
    }

    // Deletar organogramas estruturais
    try {
        const estruturalResult = client.prepare('DELETE FROM organogramas_estruturais WHERE orgao_id = ?').run(orgaoId);
        console.log(`   ✓ organogramas_estruturais: ${estruturalResult.changes || 0} removidos`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
        console.log(`   ⚠️ organogramas_estruturais: Tabela não existe (ignorado)`);
    }

    // Deletar setores
    try {
        const setoresResult = client.prepare('DELETE FROM setores WHERE orgao_id = ?').run(orgaoId);
        console.log(`   ✓ setores: ${setoresResult.changes || 0} removidos`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
        console.log(`   ⚠️ setores: Tabela não existe (ignorado)`);
    }

    // Deletar layout personalizado
    try {
        const layoutResult = client.prepare('DELETE FROM layout_personalizado WHERE orgao_id = ?').run(orgaoId);
        console.log(`   ✓ layout_personalizado: ${layoutResult.changes || 0} removidos`);
    } catch (e: any) {
        if (!e.message.includes('no such table')) throw e;
        console.log(`   ⚠️ layout_personalizado: Tabela não existe (ignorado)`);
    }

    // Deletar o registro do órgão
    const orgaoResult = client.prepare('DELETE FROM orgaos WHERE id = ?').run(orgaoId);
    console.log(`   ✓ orgaos: ${orgaoResult.changes || 0} removido`);
})();

console.log(`\n✅ "${orgaoName}" foi completamente removido do banco de dados!`);
console.log(`\n🔍 Verificando remoção...`);

// Verificar se realmente foi removido
const stillExists = client.prepare('SELECT * FROM orgaos WHERE id = ?').get(orgaoId);
if (stillExists) {
    console.log('❌ ERRO: Órgão ainda existe no banco!');
    client.close();
    process.exit(1);
} else {
    console.log('✅ Confirmado: Órgão não existe mais no banco.');
}

client.close();
console.log('\n✨ Script concluído com sucesso!');

