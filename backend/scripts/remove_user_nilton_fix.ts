
import { client } from '../src/db/index.js';

const nome = 'Nilton Júnio Ribeiro Quaresma';
console.log(`--- Buscando usuário: ${nome} ---`);

// Busca
const user = client.prepare("SELECT * FROM usuarios WHERE nome = ?").get(nome);

if (user) {
    console.log('Usuário encontrado:', user);
    console.log('--- Deletando usuário ---');
    // Deleção
    const info = client.prepare("DELETE FROM usuarios WHERE id = ?").run(user.id);
    console.log(`✅ Usuário deletado com sucesso. Registros afetados: ${info.changes}`);
} else {
    console.log('❌ Usuário não encontrado na tabela usuarios.');
    
    // Debug: mostrar nomes parecidos
    const all = client.prepare("SELECT nome FROM usuarios").all();
    console.log('Nomes existentes no banco:', all.map((u: any) => u.nome));
}
