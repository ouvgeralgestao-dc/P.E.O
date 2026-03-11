#!/bin/bash

##############################################################################
# 🚀 P.E.O - Script de Deploy Automatizado para VPS
# 
# Descrição: Deploy completo com um único comando
# Autor: CÉREBRO X-3
# Versão: 2.0
# Data: 2026-02-11
#
# USO: ./scripts/deploy-vps-complete.sh
##############################################################################

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função de título
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Verificar se está rodando como root (para algumas operações)
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_warning "Algumas operações podem precisar de sudo. Você pode ser solicitado a inserir a senha."
    fi
}

##############################################################################
# 1. PRÉ-REQUISITOS
##############################################################################

print_header "1/8 - Verificando Pré-requisitos"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado!"
    log_info "Instale Node.js 18+ antes de continuar:"
    log_info "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    log_info "sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js versão 18+ necessária. Versão atual: $(node -v)"
    exit 1
fi
log_success "Node.js $(node -v) ✓"

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado!"
    exit 1
fi
log_success "npm $(npm -v) ✓"

# Verificar Nginx
if ! command -v nginx &> /dev/null; then
    log_warning "Nginx não encontrado. Instalando..."
    sudo apt update
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_success "Nginx instalado ✓"
else
    log_success "Nginx $(nginx -v 2>&1 | cut -d'/' -f2) ✓"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 não encontrado. Instalando globalmente..."
    sudo npm install -g pm2
    log_success "PM2 instalado ✓"
else
    log_success "PM2 $(pm2 -v) ✓"
fi

check_sudo

##############################################################################
# 2. INSTALAÇÃO DE DEPENDÊNCIAS
##############################################################################

print_header "2/8 - Instalando Dependências"

# Raiz
log_info "Instalando dependências da raiz..."
npm install --production=false
log_success "Dependências da raiz instaladas ✓"

# Backend
log_info "Instalando dependências do backend..."
cd backend
npm install --production=false
cd ..
log_success "Dependências do backend instaladas ✓"

# Frontend
log_info "Instalando dependências do frontend..."
cd frontend
npm install --production=false
cd ..
log_success "Dependências do frontend instaladas ✓"

##############################################################################
# 3. BUILD DO FRONTEND
##############################################################################

print_header "3/8 - Gerando Build do Frontend"

log_info "Verificando arquivo .env.production..."
if [ ! -f "frontend/.env.production" ]; then
    log_warning "Criando frontend/.env.production..."
    cat > frontend/.env.production << 'EOF'
VITE_API_URL=/peo/api
VITE_APP_TITLE=P.E.O - Organogramas PMDC
VITE_NODE_ENV=production
EOF
    log_success "Arquivo .env.production criado ✓"
fi

log_info "Gerando build de produção do frontend..."
cd frontend
npm run build
cd ..

if [ ! -d "frontend/dist" ]; then
    log_error "Build do frontend falhou! Diretório dist/ não foi criado."
    exit 1
fi

log_success "Build do frontend gerado em frontend/dist/ ✓"

##############################################################################
# 4. CONFIGURAÇÃO DO BACKEND
##############################################################################

print_header "4/8 - Configurando Backend"

log_info "Verificando arquivo .env do backend..."
if [ ! -f "backend/.env" ]; then
    log_warning "Criando backend/.env..."
    cat > backend/.env << 'EOF'
PORT=6001
NODE_ENV=production
DATA_PATH=./data
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION_$(openssl rand -hex 32)
EOF
    log_success "Arquivo backend/.env criado ✓"
    log_warning "IMPORTANTE: Altere JWT_SECRET em backend/.env!"
fi

log_info "Compilando TypeScript do backend..."
cd backend
npx tsc
cd ..
log_success "Backend compilado ✓"

##############################################################################
# 5. CONFIGURAÇÃO DO NGINX
##############################################################################

print_header "5/8 - Configurando Nginx"

NGINX_CONF="/etc/nginx/sites-available/peo"
NGINX_ENABLED="/etc/nginx/sites-enabled/peo"

log_info "Removendo configurações antigas do Nginx..."
if [ -f "/etc/nginx/sites-enabled/ouvidoria" ]; then
    sudo rm /etc/nginx/sites-enabled/ouvidoria
    log_info "Configuração antiga 'ouvidoria' removida"
fi
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    log_info "Configuração 'default' removida"
fi

log_info "Criando configuração do Nginx..."

# Obter o caminho absoluto do projeto
PROJECT_PATH=$(pwd)

sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name _;

    # 1. FRONTEND P.E.O (Subpasta /peo/)
    location /peo/ {
        alias $PROJECT_PATH/frontend/dist/;
        try_files \$uri \$uri/ /peo/index.html;
        
        # Cache para assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 2. BACKEND API P.E.O
    location /peo/api/ {
        proxy_pass http://localhost:6001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Redirecionamento correto
        proxy_redirect / /peo/;
        proxy_redirect http://localhost:6001/ /peo/;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 3. OUVIDORIA (Raiz - Proxy para porta 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Logs
    access_log /var/log/nginx/peo_access.log;
    error_log /var/log/nginx/peo_error.log;
}
EOF

log_success "Configuração do Nginx criada ✓"

# Criar link simbólico
if [ -L "$NGINX_ENABLED" ]; then
    sudo rm "$NGINX_ENABLED"
fi
sudo ln -s "$NGINX_CONF" "$NGINX_ENABLED"
log_success "Link simbólico criado ✓"

# Remover configuração padrão se existir
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    log_info "Configuração padrão do Nginx removida"
fi

# Testar configuração
log_info "Testando configuração do Nginx..."
if sudo nginx -t; then
    log_success "Configuração do Nginx válida ✓"
else
    log_error "Configuração do Nginx inválida!"
    exit 1
fi

# Recarregar Nginx
log_info "Recarregando Nginx..."
sudo systemctl reload nginx
log_success "Nginx recarregado ✓"

##############################################################################
# 6. CONFIGURAÇÃO DO PM2
##############################################################################

print_header "6/8 - Configurando PM2"

# Parar processos anteriores se existirem
pm2 delete peo-backend 2>/dev/null || true

log_info "Iniciando backend com PM2..."
cd backend
pm2 start server.ts --name peo-backend --interpreter=npx --interpreter-args="tsx" --time
cd ..

log_success "Backend iniciado com PM2 ✓"

# Salvar configuração do PM2
log_info "Salvando configuração do PM2..."
pm2 save

# Configurar PM2 para iniciar no boot
log_info "Configurando PM2 para iniciar no boot..."
pm2 startup | grep -E "^sudo" | bash || log_warning "PM2 startup já configurado"

log_success "PM2 configurado ✓"

##############################################################################
# 7. VERIFICAÇÕES FINAIS
##############################################################################

print_header "7/8 - Verificações Finais"

# Aguardar backend iniciar
log_info "Aguardando backend iniciar..."
sleep 3

# Verificar se backend está rodando
if pm2 list | grep -q "peo-backend.*online"; then
    log_success "Backend está rodando ✓"
else
    log_error "Backend não está rodando!"
    pm2 logs peo-backend --lines 20
    exit 1
fi

# Testar API localmente
log_info "Testando API localmente..."
if curl -s http://localhost:6001/api/health > /dev/null; then
    log_success "API respondendo em localhost:6001 ✓"
else
    log_error "API não está respondendo!"
    pm2 logs peo-backend --lines 20
    exit 1
fi

# Verificar Nginx
log_info "Verificando Nginx..."
if sudo systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando ✓"
else
    log_error "Nginx não está rodando!"
    sudo systemctl status nginx
    exit 1
fi

# Verificar arquivos do frontend
if [ -f "frontend/dist/index.html" ]; then
    log_success "Frontend build disponível ✓"
else
    log_error "Frontend build não encontrado!"
    exit 1
fi

##############################################################################
# 8. RESUMO E INSTRUÇÕES
##############################################################################

print_header "8/8 - Deploy Concluído com Sucesso!"

echo ""
log_success "🎉 DEPLOY COMPLETO!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Sistema P.E.O implantado com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Obter IP do servidor
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${BLUE}📊 Informações do Deploy:${NC}"
echo ""
echo -e "  🌐 URL de Acesso:"
echo -e "     ${GREEN}http://$SERVER_IP${NC}"
echo -e "     ${GREEN}http://$(hostname)${NC}"
echo ""
echo -e "  🔧 Backend:"
echo -e "     Porta: ${GREEN}6001${NC}"
echo -e "     Status: ${GREEN}$(pm2 list | grep peo-backend | awk '{print $10}')${NC}"
echo -e "     Logs: ${YELLOW}pm2 logs peo-backend${NC}"
echo ""
echo -e "  🎨 Frontend:"
echo -e "     Build: ${GREEN}frontend/dist/${NC}"
echo -e "     Servido por: ${GREEN}Nginx${NC}"
echo ""
echo -e "  📁 Arquivos:"
echo -e "     Projeto: ${GREEN}$(pwd)${NC}"
echo -e "     Nginx Config: ${GREEN}$NGINX_CONF${NC}"
echo ""

echo -e "${BLUE}🔍 Comandos Úteis:${NC}"
echo ""
echo -e "  Ver logs do backend:"
echo -e "    ${YELLOW}pm2 logs peo-backend${NC}"
echo ""
echo -e "  Ver status do PM2:"
echo -e "    ${YELLOW}pm2 status${NC}"
echo ""
echo -e "  Reiniciar backend:"
echo -e "    ${YELLOW}pm2 restart peo-backend${NC}"
echo ""
echo -e "  Ver logs do Nginx:"
echo -e "    ${YELLOW}sudo tail -f /var/log/nginx/peo_access.log${NC}"
echo -e "    ${YELLOW}sudo tail -f /var/log/nginx/peo_error.log${NC}"
echo ""
echo -e "  Testar API:"
echo -e "    ${YELLOW}curl http://localhost:6001/api/health${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
log_success "Deploy finalizado! Acesse o sistema no navegador."
echo ""
