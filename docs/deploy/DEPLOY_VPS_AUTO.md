# 🚀 Deploy Automatizado VPS - Guia Rápido

## UM COMANDO PARA FAZER TUDO!

Este script faz **TUDO automaticamente**:
- ✅ Verifica pré-requisitos
- ✅ Instala todas as dependências (raiz, backend, frontend)
- ✅ Gera build do frontend
- ✅ Configura backend
- ✅ Configura Nginx automaticamente
- ✅ Inicia backend com PM2
- ✅ Verifica se tudo está funcionando
- ✅ Mostra resumo completo

---

## 📋 Pré-requisitos no VPS

Apenas **Node.js 18+** precisa estar instalado:

```bash
# Instalar Node.js 18 (se necessário)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**O script instala automaticamente:**
- Nginx (se não estiver instalado)
- PM2 (se não estiver instalado)
- Todas as dependências do projeto

---

## 🚀 DEPLOY EM 3 PASSOS

### 1. Transferir arquivos para o VPS

```bash
# Do seu computador local
rsync -av --exclude='node_modules' --exclude='archive' \
  P.E.O/ usuario@seu-servidor:/home/administrator/PEO
```

### 2. Conectar no VPS

```bash
ssh usuario@seu-servidor
cd /home/administrator/PEO
```

### 3. Executar o script (UM COMANDO!)

```bash
chmod +x scripts/deploy-vps-complete.sh
./scripts/deploy-vps-complete.sh
```

**Pronto! O script faz TUDO automaticamente!** ☕

---

## 📊 O que o script faz

### Fase 1/8: Verificação de Pré-requisitos
- Verifica Node.js 18+
- Verifica/Instala Nginx
- Verifica/Instala PM2

### Fase 2/8: Instalação de Dependências
- Instala dependências da raiz
- Instala dependências do backend
- Instala dependências do frontend

### Fase 3/8: Build do Frontend
- Cria `.env.production` (se não existir)
- Gera build otimizado em `frontend/dist/`

### Fase 4/8: Configuração do Backend
- Cria `.env` do backend (se não existir)
- Compila TypeScript

### Fase 5/8: Configuração do Nginx
- Cria configuração automática
- Configura proxy reverso para API
- Configura servir frontend estático
- Testa e recarrega Nginx

### Fase 6/8: Configuração do PM2
- Inicia backend com PM2
- Salva configuração
- Configura inicialização automática

### Fase 7/8: Verificações Finais
- Testa se backend está rodando
- Testa API localmente
- Verifica Nginx
- Verifica build do frontend

### Fase 8/8: Resumo
- Mostra informações completas
- Lista comandos úteis
- Exibe URLs de acesso

---

## ✅ Após o Deploy

O script mostra todas as informações necessárias:

```
🎉 DEPLOY COMPLETO!

📊 Informações do Deploy:
  🌐 URL de Acesso: http://seu-ip
  🔧 Backend: Porta 6001, Status: online
  🎨 Frontend: Servido por Nginx

🔍 Comandos Úteis:
  pm2 logs peo-backend
  pm2 status
  pm2 restart peo-backend
```

---

## 🔧 Comandos Úteis

### Ver logs do backend
```bash
pm2 logs peo-backend
pm2 logs peo-backend --lines 100
```

### Ver status
```bash
pm2 status
pm2 monit
```

### Reiniciar backend
```bash
pm2 restart peo-backend
```

### Ver logs do Nginx
```bash
sudo tail -f /var/log/nginx/peo_access.log
sudo tail -f /var/log/nginx/peo_error.log
```

### Testar API
```bash
curl http://localhost:6001/api/health
```

---

## 🔄 Atualizar Sistema (Nova Versão)

```bash
# 1. Transferir novos arquivos
rsync -av --exclude='node_modules' P.E.O/ usuario@servidor:/path

# 2. Conectar e executar script novamente
ssh usuario@servidor
cd /home/administrator/PEO
./scripts/deploy-vps-complete.sh
```

O script detecta instalações existentes e atualiza apenas o necessário!

---

## 🆘 Troubleshooting

### Script para em alguma fase?
- Leia a mensagem de erro
- Corrija o problema
- Execute o script novamente (é seguro!)

### Backend não inicia?
```bash
pm2 logs peo-backend --lines 50
```

### Nginx não funciona?
```bash
sudo nginx -t
sudo systemctl status nginx
```

### API não responde?
```bash
curl http://localhost:6001/api/health
pm2 logs peo-backend
```

---

## 📞 Suporte

O script é **idempotente** - pode ser executado múltiplas vezes sem problemas!

Se algo der errado:
1. Leia os logs mostrados
2. Corrija o problema
3. Execute o script novamente

---

**Desenvolvido por CÉREBRO X-3**  
**Versão: 2.0**  
**Data: 2026-02-11**
