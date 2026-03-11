# 🚀 Guia de Deploy - P.E.O no VPS Linux (Produção)

Este documento orienta como implantar o sistema **P.E.O** no servidor VPS usando **Nginx como proxy reverso**.

---

## 📋 Arquitetura de Produção

```
Internet → Nginx (porta 80) → Frontend (arquivos estáticos)
                            → /peo/api/ → Backend (localhost:6001)
```

**Vantagens:**
- ✅ Sem necessidade de expor porta 6001 externamente
- ✅ Nginx serve arquivos estáticos com cache otimizado
- ✅ Proxy reverso para API com headers de segurança
- ✅ Fácil adicionar HTTPS no futuro

---

## 1. Pré-requisitos do Servidor

### Software Necessário
- **Node.js** (Versão 18 ou superior)
- **npm** (Gerenciador de pacotes)
- **Nginx** (Servidor web)
- **PM2** (Gerenciador de processos Node.js)

### Verificar Instalações
```bash
node -v
npm -v
nginx -v
pm2 -v  # Será instalado pelo script se não existir
```

### Instalar Nginx (se necessário)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 2. Transferir Arquivos para o VPS

Copie todo o conteúdo da pasta `P.E.O` para `/home/administrator/PEO` no VPS.

```bash
# Exemplo usando SCP (do seu computador local)
scp -r P.E.O/ usuario@ogmanalytics.duquedecaxias.rj.gov.br:/home/administrator/

# Ou usando rsync
rsync -avz P.E.O/ usuario@ogmanalytics.duquedecaxias.rj.gov.br:/home/administrator/PEO/
```

---

## 3. Executar Deploy Automatizado

### Passo 1: Acessar o servidor
```bash
ssh usuario@ogmanalytics.duquedecaxias.rj.gov.br
cd /home/administrator/PEO
```

### Passo 2: Dar permissão ao script
```bash
chmod +x scripts/deploy-production.sh
```

### Passo 3: Executar o deploy
```bash
./scripts/deploy-production.sh
```

**O script irá:**
1. Instalar todas as dependências (root, backend, frontend)
2. Gerar build de produção do frontend
3. Configurar Nginx automaticamente
4. Iniciar backend com PM2

---

## 4. Configurar Nginx Manualmente (se necessário)

Se o script não configurou automaticamente, faça manualmente:

### Copiar configuração
```bash
sudo cp nginx/peo.conf /etc/nginx/sites-available/peo
sudo ln -s /etc/nginx/sites-available/peo /etc/nginx/sites-enabled/peo
```

### Testar e recarregar
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Verificar Funcionamento

### Verificar Backend (PM2)
```bash
pm2 status
pm2 logs peo-backend
```

### Testar API localmente
```bash
curl http://localhost:6001/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "message": "Servidor Organogramas PMDC rodando (TypeScript)",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### Testar via Nginx
```bash
curl http://ogmanalytics.duquedecaxias.rj.gov.br/peo/api/health
```

### Acessar no navegador
Abra: `http://ogmanalytics.duquedecaxias.rj.gov.br`

---

## 6. Configurar PM2 para Reiniciar no Boot

```bash
pm2 startup
pm2 save
```

Siga as instruções exibidas pelo comando `pm2 startup`.

---

## 🔧 Troubleshooting

### Erro: `ERR_CONNECTION_TIMED_OUT`

**Causa:** Nginx não está rodando ou configurado incorretamente.

**Solução:**
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Erro: `502 Bad Gateway`

**Causa:** Backend não está rodando.

**Solução:**
```bash
pm2 status
pm2 restart peo-backend
pm2 logs peo-backend
```

### Erro: `404 Not Found` na API

**Causa:** Configuração do proxy no Nginx incorreta.

**Solução:**
Verificar `/etc/nginx/sites-available/peo`:
```nginx
location /peo/api/ {
    proxy_pass http://localhost:6001/api/;  # Note o /api/ no final
    ...
}
```

### Frontend carrega mas API não funciona

**Verificar:**
1. Console do navegador (F12) - qual URL está sendo chamada?
2. Arquivo `.env.production` existe em `frontend/`?
3. Build foi gerado com `npm run build`?

```bash
# Rebuild do frontend
cd frontend
npm run build
cd ..
```

---

## 🔄 Atualizar Sistema (Deploy de Nova Versão)

```bash
cd /home/administrator/PEO

# Atualizar código (git pull ou transferir arquivos)

# Rebuild frontend
cd frontend
npm run build
cd ..

# Reiniciar backend
pm2 restart peo-backend

# Recarregar Nginx (se alterou configuração)
sudo systemctl reload nginx
```

---

## 📊 Monitoramento

### Ver logs em tempo real
```bash
pm2 logs peo-backend --lines 100
```

### Ver status de recursos
```bash
pm2 monit
```

### Logs do Nginx
```bash
sudo tail -f /var/log/nginx/peo_access.log
sudo tail -f /var/log/nginx/peo_error.log
```

---

## 🔒 Próximos Passos (Opcional)

### Adicionar HTTPS com Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ogmanalytics.duquedecaxias.rj.gov.br
```

### Configurar Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 'Nginx Full'
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do PM2: `pm2 logs peo-backend`
2. Verificar logs do Nginx: `/var/log/nginx/peo_error.log`
3. Testar API localmente: `curl http://localhost:6001/api/health`
4. Verificar configuração do Nginx: `sudo nginx -t`

