import Database from 'better-sqlite3';
import path from 'path';

const fixName = () => {
    try {
        const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');
        const db = new Database(dbPath);
        
        console.log('🔄 Corrigindo nome do Conselho de Contribuintes...');
        console.log(`📂 Banco de dados: ${dbPath}`);
        
        const targetId = 'conselho_de_contribuintes';
        const correctName = 'Conselho de Contribuintes';

        // Verificar como está agora
        const current = db.prepare('SELECT id, nome FROM orgaos WHERE id = ?').get(targetId) as any;
        
        if (!current) {
            console.log('❌ Órgão não encontrado!');
            return;
        }

        console.log(`📊 Estado atual: ID="${current.id}", Nome="${current.nome}"`);

        if (current.nome === targetId) {
            // Se o nome for igual ao ID, está errado e precisa corrigir
            db.prepare('UPDATE orgaos SET nome = ? WHERE id = ?').run(correctName, targetId);
            console.log(`✅ Nome corrigido para: "${correctName}"`);
        } else {
            console.log(`ℹ️ O nome já parece estar correto (diferente do ID).`);
        }

        db.close();
    } catch (error) {
        console.error('❌ Erro ao corrigir nome:', error);
    }
};

fixName();
