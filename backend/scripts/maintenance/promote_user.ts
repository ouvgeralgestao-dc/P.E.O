
import { client } from '../src/db/index.js';

const emailAlvo = '%nilton%'; // Buscando por parte do email ou nome

console.log(`--- Promovendo usuário a ADMIN: ${emailAlvo} ---`);

// Atualizar tipo para 'admin'
const update = client.prepare("UPDATE usuarios SET tipo = 'admin' WHERE email LIKE ? OR nome LIKE ?");
const info = update.run(emailAlvo, emailAlvo);

if (info.changes > 0) {
    console.log(`✅ Sucesso! ${info.changes} usuário(s) promovido(s) a ADMIN.`);
} else {
    console.log('⚠️ Nenhum usuário encontrado com esse critério.');
}
