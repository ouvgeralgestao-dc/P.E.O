
import { client } from '../src/db/index.js';

console.log('--- Listando Usuários ---');
try {
    const users = client.prepare("SELECT * FROM usuarios").all();
    console.log(JSON.stringify(users, null, 2));
} catch (e) {
    console.error('Erro ao listar usuários:', e);
}
