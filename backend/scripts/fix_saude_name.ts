
import { client } from '../src/db/index.js';

console.log('--- Corrigindo Secretaria de Saúde ---');

// Encontrar o órgão errado
const wrongName = client.prepare("SELECT id, nome FROM orgaos WHERE nome LIKE '%Saude Teste%' OR nome LIKE '%Saúde Teste%'").get();

if (wrongName) {
    console.log(`Encontrado: [${wrongName.id}] ${wrongName.nome}`);
    
    const newName = "Secretaria Municipal de Saúde";
    
    client.prepare('UPDATE orgaos SET nome = ? WHERE id = ?').run(newName, wrongName.id);
    
    console.log(`✅ Atualizado para: "${newName}"`);
} else {
    console.log('❌ Nenhum órgão encontrado com "Saude Teste" no nome.');
    
    // Tentar listar para ver se o nome é lixeiramente diferente
    const check = client.prepare("SELECT id, nome FROM orgaos WHERE nome LIKE '%Saude%'").all();
    console.log('Órgãos com "Saude":', check);
}
