# 🚀 Deploy Rápido - P.E.O na Máquina Virtual

## ⚡ Início Rápido (3 Comandos)

### 1️⃣ Transferir arquivos
```bash
# No seu computador local (Windows PowerShell ou CMD)
cd C:\Users\501379.PMDC\Desktop\PEO
scp -r P.E.O/ usuario@ogm.duquedecaxias.rj.gov.br:/home/administrator/
```

### 2️⃣ Preparar ambiente
```bash
# Conectar no VPS
ssh usuario@ogm.duquedecaxias.rj.gov.br

# Ir para a pasta e preparar
cd /home/administrator/PEO
cp .env.production .env
chmod +x scripts/deploy-production.sh
```

### 3️⃣ Executar deploy
```bash
# Ainda no VPS
./scripts/deploy-production.sh
```

**Pronto!** Aguarde a conclusão e acesse: `http://ogm.duquedecaxias.rj.gov.br`

---

## 📋 Verificação Rápida

```bash
# Backend rodando?
pm2 status

# API funcionando?
curl http://localhost:6001/api/health

# Nginx OK?
sudo nginx -t

# Tudo certo? Acesse no navegador:
# http://ogm.duquedecaxias.rj.gov.br
```

---

## 🆘 Problemas?

Veja o arquivo completo: **[`docs/deploy/DEPLOY_CHECKLIST.md`](docs/deploy/DEPLOY_CHECKLIST.md)** ou **[`docs/deploy/DEPLOY_INSTRUCTIONS.md`](docs/deploy/DEPLOY_INSTRUCTIONS.md)**

---

## 📦 Arquivos Importantes

- [`docs/deploy/DEPLOY_CHECKLIST.md`](docs/deploy/DEPLOY_CHECKLIST.md) - Checklist completo passo a passo
- [`docs/deploy/DEPLOY_INSTRUCTIONS.md`](docs/deploy/DEPLOY_INSTRUCTIONS.md) - Documentação detalhada
- `scripts/deploy-production.sh` - Script de deploy automatizado
- `nginx/peo.conf` - Configuração do Nginx
- `.env.production` - Variáveis de ambiente de produção
