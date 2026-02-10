
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

function runInstall(directory, name) {
    if (fs.existsSync(directory)) {
        try {
            console.log(`\n📦 Instalando dependências do ${name}...`);
            execSync('npm install', {
                cwd: directory,
                stdio: 'inherit',
                shell: true
            });
            console.log(`✅ Dependências do ${name} instaladas com sucesso!`);
        } catch (error) {
            console.warn(`⚠️ Aviso: Falha na compilação nativa em ${name}. Tentando instalar ignorando scripts de build...`);
            try {
                execSync('npm install --ignore-scripts', {
                    cwd: directory,
                    stdio: 'inherit',
                    shell: true
                });
                console.log(`✅ Dependências do ${name} instaladas (sem scripts de build)!`);
            } catch (e2) {
                console.error(`❌ Erro crítico ao instalar ${name}:`, e2.message);
                process.exit(1);
            }
        }
    } else {
        console.warn(`⚠️ Diretório ${name} não encontrado em: ${directory}`);
    }
}

console.log('🚀 Iniciando instalação completa do sistema...');

// 1. Instalar na raiz
runInstall(rootDir, 'ROOT (Electron/Geral)');

// 2. Instalar no Backend
runInstall(backendDir, 'BACKEND');

// 3. Instalar no Frontend
runInstall(frontendDir, 'FRONTEND');

console.log('\n✨ Instalação completa finalizada com sucesso!');
console.log('👉 Para iniciar o projeto, execute: npm run dev');
