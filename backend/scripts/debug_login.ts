
import { client } from '../src/db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Carregar .env do backend
dotenv.config({ path: 'backend/.env' });

const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET:', JWT_SECRET);

const matricula = '370517';
const senhaInput = '123'; // Supondo que a senha seja essa (do teste anterior)

async function debugLogin() {
    console.log(`\n--- Debug Login para ${matricula} ---`);
    
    try {
        const user = client.prepare(`
            SELECT id, matricula, email, senha, setor, cargo, tipo 
            FROM usuarios 
            WHERE matricula = ?
        `).get(matricula);

        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }

        console.log('✅ Usuário encontrado:', user);

        let senhaValida = false;
        
        // Teste SHA256
        const hashSha256 = crypto.createHash('sha256').update(senhaInput).digest('hex');
        console.log('Hash SHA256 Input:', hashSha256);
        console.log('Senha salva no DB:', user.senha);
        
        if (user.senha === hashSha256) {
            console.log('✅ Senha válida (SHA256)');
            senhaValida = true;
        } else {
            console.log('❌ Senha inválida (SHA256)');
        }

        // Teste Bcrypt
        if (!senhaValida && user.senha.startsWith('$2')) {
            console.log('Tentando bcrypt...');
            const match = await bcrypt.compare(senhaInput, user.senha);
            console.log('Bcrypt Match:', match);
            if (match) senhaValida = true;
        }

        if (!senhaValida) {
            console.log('❌ Login falhou: Senha incorreta');
            return;
        }

        console.log('✅ Senha válida! Gerando token...');
        
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET não definido!');
        }

        const token = jwt.sign(
            { 
                userId: user.id,
                matricula: user.matricula,
                tipo: user.tipo
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('✅ Token gerado com sucesso:', token);

    } catch (error) {
        console.error('🔥 CRASH NO LOGIN:', error);
    }
}

debugLogin();
