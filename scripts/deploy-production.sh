#!/bin/bash

# ==========================================
# P.E.O - Script de Deploy para Produção (VPS)
# Com Nginx como Proxy Reverso
# ==========================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando Deploy de Produção do P.E.O..."
echo ""

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto P.E.O"
    exit 1
fi

# 1. Instalar dependências da raiz
echo "📦 [1/5] Instalando dependências da raiz..."
npm install

# 2. Instalar dependências de backend e frontend
echo "📦 [2/5] Instalando dependências de Backend e Frontend..."
node scripts/install_all.js

# 3. Build do Frontend para Produção
echo "🏗️ [3/5] Gerando build de produção do Frontend..."
cd frontend
npm run build
cd ..

echo "✅ Build do frontend concluído em: frontend/dist/"

# 4. Configurar Nginx (se ainda não configurado)
echo "🌐 [4/5] Verificando configuração do Nginx..."

NGINX_CONF="/etc/nginx/sites-available/peo"
NGINX_ENABLED="/etc/nginx/sites-enabled/peo"

if [ ! -f "$NGINX_CONF" ]; then
    echo "⚠️  Configuração do Nginx não encontrada."
    echo "📝 Copiando template de configuração..."
    
    sudo cp nginx/peo.conf "$NGINX_CONF"
    
    # Criar link simbólico
    if [ ! -L "$NGINX_ENABLED" ]; then
        sudo ln -s "$NGINX_CONF" "$NGINX_ENABLED"
    fi
    
    echo "✅ Configuração do Nginx instalada."
    echo "⚠️  ATENÇÃO: Verifique o arquivo $NGINX_CONF e ajuste se necessário."
    echo ""
    echo "Depois execute:"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
else
    echo "✅ Configuração do Nginx já existe."
fi

# 5. Iniciar Backend com PM2
echo "🔧 [5/5] Iniciando Backend com PM2..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 não encontrado. Instalando globalmente..."
    sudo npm install -g pm2
fi

# Parar processo anterior se existir
pm2 delete peo-backend 2>/dev/null || true

# Iniciar backend
cd backend
pm2 start npm --name "peo-backend" -- start
cd ..

# Salvar configuração do PM2
pm2 save

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Verifique a configuração do Nginx:"
echo "     sudo nginx -t"
echo "     sudo systemctl reload nginx"
echo ""
echo "  2. Verifique o status do backend:"
echo "     pm2 status"
echo "     pm2 logs peo-backend"
echo ""
echo "  3. Acesse o sistema em:"
echo "     http://ogm.duquedecaxias.rj.gov.br"
echo ""
echo "  4. Teste a API:"
echo "     curl http://localhost:6001/api/health"
echo ""
