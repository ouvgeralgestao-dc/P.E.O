
import { client } from '../src/db/index.js';

const emailAlvo = '%nilton%'; 

console.log(`--- Removendo registros de: ${emailAlvo} ---`);

// 1. Remover de solicitacoes
const delSol = client.prepare("DELETE FROM solicitacoes_cadastro WHERE email LIKE ? OR nome LIKE ?");
const resSol = delSol.run(emailAlvo, emailAlvo);
console.log(`🗑️ Solicitações removidas: ${resSol.changes}`);

// 2. Remover de usuarios
const delUser = client.prepare("DELETE FROM usuarios WHERE email LIKE ? OR nome LIKE ?");
const resUser = delUser.run(emailAlvo, emailAlvo);
console.log(`🗑️ Usuários removidos: ${resUser.changes}`);
