
import { client } from '../src/db/index.js';

const target = '%Nilton%';

console.log(`--- Limpando dados para recadastro: ${target} ---`);

// 1. Remover de usuarios
const delUser = client.prepare("DELETE FROM usuarios WHERE nome LIKE ? OR email LIKE 'nilton%'").run(target);
console.log(`Usuários removidos: ${delUser.changes}`);

// 2. Remover de solicitacoes_cadastro
const delReq = client.prepare("DELETE FROM solicitacoes_cadastro WHERE nome LIKE ? OR email LIKE 'nilton%'").run(target);
console.log(`Solicitações removidas: ${delReq.changes}`);

console.log('✅ Tudo limpo! O usuário pode solicitar cadastro novamente.');
