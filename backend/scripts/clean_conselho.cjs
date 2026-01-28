const Database = require('better-sqlite3');
const path = require('path');

// Caminho correto do banco de dados
const dbPath = path.join(__dirname, '..', 'database', 'organograma.db');
console.log('📂 Caminho do banco:', dbPath);

const db = new Database(dbPath);

const orgaoId = 'conselho_de_contribuintes';
const orgaoName = 'Conselho de Contribuintes';

console.log(`\n🧹 Limpando "${orgaoName}" do banco de dados...\n`);

// Função auxiliar para deletar de forma segura (ignora se tabela não existe)
function safeDelete(tableName, whereClause, params) {
    try {
        const result = db.prepare(`DELETE FROM ${tableName} WHERE ${whereClause}`).run(...params);
        console.log(`   ✓ ${tableName}: ${result.changes || 0} removidos`);
        return result.changes || 0;
    } catch (error) {
        if (error.message.includes('no such table')) {
            console.log(`   ⚠️ ${tableName}: Tabela não existe (ignorado)`);
            return 0;
        }
        throw error;
    }
}

try {
    // 1. Verificar se existe
    const exists = db.prepare('SELECT * FROM orgaos WHERE id = ?').get(orgaoId);
    if (!exists) {
        console.log('✅ Órgão não encontrado no banco. Nada a fazer.');
        db.close();
        process.exit(0);
    }
    
    console.log(`📋 Órgão encontrado: ${exists.nome} (${exists.id})`);
    
    // 2. Executar limpeza
    console.log('\n🗑️ Removendo dados relacionados...');
    
    // Deletar cargos funcionais
    safeDelete('cargos_funcionais', 'diagrama_id IN (SELECT id FROM diagramas_funcionais WHERE orgao_id = ?)', [orgaoId]);
    
    // Deletar diagramas funcionais
    safeDelete('diagramas_funcionais', 'orgao_id = ?', [orgaoId]);
    
    // Deletar organogramas estruturais
    safeDelete('organogramas_estruturais', 'orgao_id = ?', [orgaoId]);
    
    // Deletar setores
    safeDelete('setores', 'orgao_id = ?', [orgaoId]);
    
    // Deletar layout personalizado
    safeDelete('layout_personalizado', 'orgao_id = ?', [orgaoId]);
    
    // Deletar o registro do órgão
    const orgaoResult = db.prepare('DELETE FROM orgaos WHERE id = ?').run(orgaoId);
    console.log(`   ✓ orgaos: ${orgaoResult.changes || 0} removido`);
    
    console.log(`\n✅ "${orgaoName}" foi completamente removido do banco de dados!`);
    console.log(`\n🔍 Verificando remoção...`);
    
    // Verificar se realmente foi removido
    const stillExists = db.prepare('SELECT * FROM orgaos WHERE id = ?').get(orgaoId);
    if (stillExists) {
        console.log('❌ ERRO: Órgão ainda existe no banco!');
        db.close();
        process.exit(1);
    } else {
        console.log('✅ Confirmado: Órgão não existe mais no banco.');
    }
    
    db.close();
    console.log('\n✨ Script concluído com sucesso!');
    process.exit(0);
    
} catch (error) {
    console.error('❌ Erro ao limpar órgão:', error);
    try { db.close(); } catch(e) {}
    process.exit(1);
}
