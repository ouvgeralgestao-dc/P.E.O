const Database = require('better-sqlite3');
const path = require('path');

// Caminho relativo a partir da pasta backend
const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');

try {
    const db = new Database(dbPath);
    console.log(`📂 Banco de dados conectado: ${dbPath}`);

    const targetId = 'conselho_de_contribuintes';
    const correctName = 'Conselho de Contribuintes';

    // Update forçado
    const stmt = db.prepare('UPDATE orgaos SET nome = ? WHERE id = ?');
    const info = stmt.run(correctName, targetId);
    
    if (info.changes > 0) {
        console.log(`✅ SUCESSO! Nome corrigido para: '${correctName}'`);
    } else {
        console.log('⚠️ Nada alterado (talvez já corrigido ou ID errado).');
    }

    db.close();
} catch (error) {
    console.error('❌ ERRO:', error.message);
}
