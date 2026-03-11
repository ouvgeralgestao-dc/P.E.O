# 🚀 Checklist de Deploy - P.E.O na Máquina Virtual

## ✅ Pré-requisitos (Verificar antes de começar)

### No seu computador local:
- [ ] Todos os arquivos do projeto P.E.O estão atualizados
- [ ] Você tem acesso SSH ao VPS: `ogmanalytics.duquedecaxias.rj.gov.br`
- [ ] Você tem as credenciais de administrador do VPS

### No VPS (verificar via SSH):
```bash
# Conectar no VPS
ssh usuario@ogmanalytics.duquedecaxias.rj.gov.br

# Verificar Node.js (precisa ser v18+)
node -v

# Verificar npm
npm -v

# Verificar Nginx
nginx -v

# Se algum não estiver instalado, veja a seção "Instalação" no DEPLOY_INSTRUCTIONS.md
```

---

## 📤 Passo 1: Transferir Arquivos

### Opção A: SCP (Recomendado)
```bash
# Do seu computador local, execute:
cd C:\Users\501379.PMDC\Desktop\PEO
scp -r P.E.O/ usuario@ogmanalytics.duquedecaxias.rj.gov.br:/home/administrator/
```

### Opção B: Rsync (Mais eficiente para atualizações)
```bash
rsync -avz --progress P.E.O/ usuario@ogmanalytics.duquedecaxias.rj.gov.br:/home/administrator/PEO/
```

**Verificar transferência:**
```bash
ssh usuario@ogmanalytics.duquedecaxias.rj.gov.br
ls -la /home/administrator/PEO
```

---

## 🔧 Passo 2: Preparar Ambiente no VPS

```bash
# Conectar no VPS
ssh usuario@ogmanalytics.duquedecaxias.rj.gov.br

# Ir para a pasta do projeto
cd /home/administrator/PEO

# Copiar arquivo de ambiente de produção
cp .env.production .env

# Dar permissão de execução ao script de deploy
chmod +x scripts/deploy-production.sh

# IMPORTANTE: Editar o .env e alterar o JWT_SECRET para uma chave forte
nano .env
# Altere a linha: JWT_SECRET=sua_chave_secreta_forte_aqui
```

---

## 🚀 Passo 3: Executar Deploy Automatizado

```bash
# Ainda no VPS, na pasta /home/administrator/PEO
./scripts/deploy-production.sh
```

**O script irá:**
1. ✅ Instalar dependências (root, backend, frontend)
2. ✅ Gerar build de produção do frontend
3. ✅ Configurar Nginx automaticamente
4. ✅ Iniciar backend com PM2

**Aguarde a conclusão** (pode levar alguns minutos).

---

## ✅ Passo 4: Verificações Pós-Deploy

### 4.1 Verificar Backend (PM2)
```bash
pm2 status
# Deve mostrar: peo-backend | online

pm2 logs peo-backend --lines 20
# Deve mostrar logs sem erros
```

### 4.2 Testar API Localmente
```bash
curl http://localhost:6001/api/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "message": "Servidor Organogramas PMDC rodando (TypeScript)",
  "timestamp": "2026-02-11T12:42:00.000Z"
}
```

### 4.3 Verificar Nginx
```bash
sudo nginx -t
# Deve retornar: syntax is ok, test is successful

sudo systemctl status nginx
# Deve mostrar: active (running)
```

### 4.4 Testar API via Nginx Proxy
```bash
curl http://ogmanalytics.duquedecaxias.rj.gov.br/peo/api/health
```

**Deve retornar o mesmo JSON acima.**

### 4.5 Testar no Navegador
Abra: `http://ogmanalytics.duquedecaxias.rj.gov.br`

- [ ] Página de login carrega corretamente
- [ ] Console do navegador (F12) não mostra erros de conexão
- [ ] Consegue fazer login com credenciais válidas

---

## 🔄 Passo 5: Configurar Inicialização Automática

```bash
# Configurar PM2 para iniciar no boot
pm2 startup
# Copie e execute o comando que aparecer

pm2 save
# Salva a configuração atual
```

---

## 🎯 Checklist Final

- [ ] Backend rodando no PM2: `pm2 status`
- [ ] API responde localmente: `curl http://localhost:6001/api/health`
- [ ] Nginx configurado: `sudo nginx -t`
- [ ] API responde via proxy: `curl http://ogmanalytics.duquedecaxias.rj.gov.br/peo/api/health`
- [ ] Frontend acessível no navegador
- [ ] Login funciona
- [ ] PM2 configurado para boot: `pm2 startup` + `pm2 save`

---

## 🆘 Troubleshooting

### Erro: "Permission denied" ao executar script
```bash
chmod +x scripts/deploy-production.sh
```

### Erro: "npm: command not found"
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Erro: "nginx: command not found"
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Erro: "502 Bad Gateway" no navegador
```bash
# Backend não está rodando
pm2 restart peo-backend
pm2 logs peo-backend
```

### Erro: "ERR_CONNECTION_TIMED_OUT"
```bash
# Nginx não está rodando
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Frontend carrega mas API não funciona
```bash
# Verificar se o build foi feito corretamente
cd /home/administrator/PEO/frontend
npm run build

# Verificar se o .env.production existe
ls -la .env.production

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 📞 Comandos Úteis

```bash
# Ver logs do backend em tempo real
pm2 logs peo-backend

# Reiniciar backend
pm2 restart peo-backend

# Parar backend
pm2 stop peo-backend

# Ver status de recursos
pm2 monit

# Logs do Nginx
sudo tail -f /var/log/nginx/peo_access.log
sudo tail -f /var/log/nginx/peo_error.log

# Recarregar Nginx (após mudanças de config)
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🎉 Deploy Concluído!

Se todos os itens do checklist final estão ✅, o sistema está rodando em produção!

**URL de Acesso:** `http://ogmanalytics.duquedecaxias.rj.gov.br`

**Próximos passos opcionais:**
- Configurar HTTPS com Let's Encrypt (ver `DEPLOY_INSTRUCTIONS.md`)
- Configurar firewall
- Configurar backup automático do banco de dados
