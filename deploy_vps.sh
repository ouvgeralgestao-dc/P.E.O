#!/bin/bash

# ==========================================
# P.E.O - Script de Deploy Automatizado (VPS)
# ==========================================

echo "🔵 Iniciando Configuração do Ambiente P.E.O..."

# 1. Instalar dependências da raiz (necessário para os scripts de automação)
echo "📦 [1/3] Instalando dependências da raiz..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependências da raiz instaladas."
else
    echo "❌ Erro ao instalar dependências da raiz."
    exit 1
fi

# 2. Executar o script de instalação dos módulos (Backend e Frontend)
echo "📦 [2/3] Executando script de instalação global..."
node scripts/install_all.js
if [ $? -eq 0 ]; then
    echo "✅ Módulos instalados com sucesso."
else
    echo "❌ Erro ao instalar módulos."
    exit 1
fi

# 3. Iniciar o Sistema (Modo Servidor - Sem Electron)
echo "🚀 [3/3] Iniciando Servidores (Backend :6001 / Frontend :6002)..."
echo "ℹ️  O Frontend estará disponível externamente (0.0.0.0)"

# Executa o comando de start definido no package.json (npx tsx start-server.ts)
npm start
