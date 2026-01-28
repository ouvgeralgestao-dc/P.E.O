const Database = require('better-sqlite3');
const path = require('path');

// Caminho relativo a partir da pasta backend/scripts
const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');

try {
    const db = new Database(dbPath);
    console.log(`📂 Banco de dados conectado: ${dbPath}`);

    const targetId = 'conselho_de_contribuintes';
    const correctName = 'Conselho de Contribuintes';

    const row = db.prepare('SELECT id, nome FROM orgaos WHERE id = ?').get(targetId);

    if (!row) {
        console.log(`❌ Órgão com ID '${targetId}' não encontrado.`);
    } else {
        console.log(`📊 Estado Atual: ID='${row.id}', Nome='${row.nome}'`);

        if (row.nome !== correctName) {
            const stmt = db.prepare('UPDATE orgaos SET nome = ? WHERE id = ?');
            const info = stmt.run(correctName, targetId);
            
            if (info.changes > 0) {
                console.log(`✅ SUCESSO! Nome atualizado para: '${correctName}'`);
            } else {
                console.log('⚠️ Nenhuma alteração realizada (banco pode estar travado).');
            }
        } else {
            console.log('ℹ️ O nome já está correto.');
        }
    }

    db.close();

} catch (error) {
    console.error('❌ ERRO CRÍTICO:', error.message);
}
