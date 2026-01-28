const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/organograma.sqlite');
const db = new Database(dbPath);

console.log('🔄 Iniciando migração da tabela USUARIOS (campo: ativo)...');

try {
    const tableInfo = db.pragma('table_info(usuarios)');
    const hasAtivo = tableInfo.some(col => col.name === 'ativo');

    if (!hasAtivo) {
        console.log('➕ Adicionando coluna "ativo" (DEFAULT 1)...');
        db.exec('ALTER TABLE usuarios ADD COLUMN ativo INTEGER DEFAULT 1;');
        console.log('✅ Coluna adicionada com sucesso.');
    } else {
        console.log('ℹ️ Coluna "ativo" já existe.');
    }

    console.log('🏁 Migração concluída.');
} catch (error) {
    console.error('❌ Erro na migração:', error);
} finally {
    db.close();
}
