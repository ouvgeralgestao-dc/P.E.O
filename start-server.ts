
/**
 * Script para iniciar o sistema completo (Backend + Frontend)
 * Uso: npx tsx start-server.ts
 */

import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando Sistema Gerador de Organogramas PMDC (TypeScript)...');
console.log('💡 DICA: Pressione [ Ctrl + C ] para encerrar tudo de uma vez.\n');

// 1. Iniciar servidor Backend (Porta 6001 com tsx watch)
// Agora usa 'start' que configuraremos para usar tsx
const backendProcess: ChildProcess = spawn('npm', ['start'], {
    cwd: join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true
});

// 2. Iniciar servidor Frontend (Porta 6002 via Vite)
const frontendProcess: ChildProcess = spawn('npm', ['run', 'dev'], {
    cwd: join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
});

// Tratamento de Erros
backendProcess.on('error', (err) => console.error('❌ Erro no Backend:', err));
frontendProcess.on('error', (err) => console.error('❌ Erro no Frontend:', err));

// Capturar encerramento do script (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando todos os servidores...');

    // Mata os processos filhos
    backendProcess.kill();
    frontendProcess.kill();

    // Força a saída do script principal
    setTimeout(() => {
        process.exit(0);
    }, 500);
});

// Se um dos processos morrer inesperadamente
const handleExit = (name: string, code: number | null) => {
    if (code !== 0 && code !== null) {
        console.error(`\n⚠️ O ${name} parou (Código: ${code})`);
    }
};

backendProcess.on('exit', (code) => handleExit('Backend', code));
frontendProcess.on('exit', (code) => handleExit('Frontend', code));
