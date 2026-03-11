import { client } from './src/db/index.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function createAdmin() {
    console.log('🔄 [PEO-SEED] Iniciando criação de admin...');
    try {
        const matricula = 'admin';
        const email = 'admin@peo.gov.br';
        const senhaRaw = 'caxias2026';

        // Usar bcrypt para segurança
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(senhaRaw, salt);

        // Verificar se existe
        const existing: any = client.prepare('SELECT id FROM usuarios WHERE matricula = ? OR email = ?').get(matricula, email);

        if (existing) {
            console.log('ℹ️ Usuário já existe. Atualizando para admin...');
            client.prepare('UPDATE usuarios SET senha = ?, tipo = ?, ativo = 1 WHERE id = ?').run(hash, 'admin', existing.id);
            console.log(`✅ Admin PEO atualizado: Matrícula: ${matricula} / Senha: ${senhaRaw}`);
        } else {
            console.log('🌱 Criando novo registro de administrador...');
            client.prepare(`
                INSERT INTO usuarios (matricula, email, senha, setor, cargo, tipo, ativo, nome)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(matricula, email, hash, 'TI', 'Administrador', 'admin', 1, 'Administrador Global');
            console.log(`✅ Admin PEO criado: Matrícula: ${matricula} / Senha: ${senhaRaw}`);
        }
    } catch (e) {
        console.error('❌ Erro no PEO:', e);
    } finally {
        console.log('🏁 Processo finalizado.');
        process.exit(0);
    }
}

createAdmin();
