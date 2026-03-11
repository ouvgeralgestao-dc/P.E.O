
import { client } from '../src/db/index.js';

console.log('--- Buscando usuário Nilton Júnio Ribeiro Quaresma ---');
const user = client.prepare("SELECT * FROM users WHERE nome LIKE ?").get('%Nilton Júnio Ribeiro Quaresma%');

if (user) {
    console.log('Usuário encontrado:', user);
    console.log('--- Deletando usuário ---');
    const info = client.prepare("DELETE FROM users WHERE id = ?").run(user.id);
    console.log(`Usuário deletado. Linhas afetadas: ${info.changes}`);
} else {
    console.log('Usuário não encontrado.');
}
