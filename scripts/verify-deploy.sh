#!/bin/bash

# ==========================================
# Script de Verificação Pré-Deploy
# Verifica se todos os arquivos necessários existem
# ==========================================

echo "🔍 Verificando arquivos necessários para deploy..."
echo ""

ERRORS=0

# Função para verificar arquivo
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 - FALTANDO!"
        ERRORS=$((ERRORS + 1))
    fi
}

# Função para verificar diretório
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1/"
    else
        echo "❌ $1/ - FALTANDO!"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📁 Verificando estrutura de diretórios..."
check_dir "backend"
check_dir "frontend"
check_dir "scripts"
check_dir "nginx"

echo ""
echo "📄 Verificando arquivos de configuração..."
check_file ".env.production"
check_file "frontend/.env.production"
check_file "nginx/peo.conf"

echo ""
echo "📜 Verificando scripts..."
check_file "scripts/deploy-production.sh"
check_file "scripts/install_all.js"

echo ""
echo "📚 Verificando documentação..."
check_file "DEPLOY_INSTRUCTIONS.md"
check_file "DEPLOY_CHECKLIST.md"
check_file "QUICK_START.md"

echo ""
echo "🔧 Verificando arquivos do backend..."
check_file "backend/package.json"
check_file "backend/server.ts"

echo ""
echo "🎨 Verificando arquivos do frontend..."
check_file "frontend/package.json"
check_file "frontend/vite.config.ts"
check_file "frontend/src/services/api.ts"
check_file "frontend/src/vite-env.d.ts"

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Todos os arquivos necessários estão presentes!"
    echo "✅ Sistema pronto para deploy!"
    echo ""
    echo "Próximo passo:"
    echo "  Transferir para o VPS e executar ./scripts/deploy-production.sh"
    exit 0
else
    echo "❌ Encontrados $ERRORS arquivo(s) faltando!"
    echo "❌ Corrija os problemas antes de fazer o deploy."
    exit 1
fi
