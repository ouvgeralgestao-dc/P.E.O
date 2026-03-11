
import { client } from '../src/db/index.js';

const matricula = '370517';
const user = client.prepare('SELECT id, matricula, email, nome, tipo FROM usuarios WHERE matricula = ?').get(matricula);

console.log('--- Dados do Usuário ---');
console.log(JSON.stringify(user, null, 2));

if (user && !user.nome) {
    console.log('⚠️ O campo nome está VAZIO ou NULO no banco!');
}
