
import { client } from '../src/db/index.js';
import bcrypt from 'bcryptjs';

const matricula = '370517';
console.log(`--- Verificando Usuário ${matricula} ---`);

const user = client.prepare('SELECT * FROM usuarios WHERE matricula = ?').get(matricula);

if (user) {
    console.log('Usuário encontrado:', user);
    console.log('Senha Hash:', user.senha);
    
    // Tentar validar senha se possível (simulando o que o auth faz)
    // Mas não tenho a senha plain aqui, a menos que seja aquela 123
    // Vou apenas listar.
} else {
    console.log('❌ Usuário NÃO encontrado na tabela usuarios.');
}
