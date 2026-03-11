# 📦 Sistema P.E.O - Pronto para Deploy em Produção

## ✅ Status: PRONTO PARA DEPLOY

Este sistema está completamente configurado e pronto para ser implantado na máquina virtual VPS.

---

## 🚀 Deploy Rápido (3 Passos)

### 1. Transferir Arquivos
```bash
scp -r P.E.O/ usuario@ogmanalytics.duquedecaxias.rj.gov.br:/home/administrator/
```

### 2. Preparar no VPS
```bash
ssh usuario@ogmanalytics.duquedecaxias.rj.gov.br
cd /home/administrator/PEO
cp .env.production .env
chmod +x scripts/deploy-production.sh
```

### 3. Executar Deploy
```bash
./scripts/deploy-production.sh
```

**Acesse:** `http://ogmanalytics.duquedecaxias.rj.gov.br`

---

## 📚 Documentação Disponível

| Arquivo | Descrição |
|---------|-----------|
| **QUICK_START.md** | Guia de início rápido (3 comandos) |
| **DEPLOY_CHECKLIST.md** | Checklist completo passo a passo |
| **DEPLOY_INSTRUCTIONS.md** | Documentação técnica detalhada |

---

## 🏗️ Arquitetura de Produção

```
Internet → Nginx (porta 80) → Frontend (arquivos estáticos)
                            → /peo/api/ → Backend (localhost:6001)
```

**Componentes:**
- ✅ Frontend: Build de produção servido pelo Nginx
- ✅ Backend: Node.js + Express rodando via PM2
- ✅ Proxy Reverso: Nginx configurado automaticamente
- ✅ Banco de Dados: SQLite (incluído)

---

## 📦 Arquivos de Deploy Incluídos

### Configurações
- `.env.production` - Variáveis de ambiente do backend
- `frontend/.env.production` - Variáveis de ambiente do frontend
- `nginx/peo.conf` - Template de configuração do Nginx

### Scripts
- `scripts/deploy-production.sh` - Deploy automatizado completo
- `scripts/install_all.js` - Instalação de dependências
- `scripts/verify-deploy.sh` - Verificação pré-deploy

### Documentação
- `QUICK_START.md` - Início rápido
- `DEPLOY_CHECKLIST.md` - Checklist detalhado
- `DEPLOY_INSTRUCTIONS.md` - Guia técnico completo

---

## ✅ Verificação Pré-Deploy

Antes de transferir, verifique se todos os arquivos estão presentes:

```bash
# No Linux/Mac
chmod +x scripts/verify-deploy.sh
./scripts/verify-deploy.sh

# No Windows (Git Bash)
bash scripts/verify-deploy.sh
```

---

## 🔧 Requisitos do VPS

- **Node.js** v18 ou superior
- **npm** (incluído com Node.js)
- **Nginx** (será configurado automaticamente)
- **PM2** (será instalado automaticamente se necessário)

---

## 🆘 Suporte

Em caso de problemas durante o deploy:

1. Consulte `DEPLOY_CHECKLIST.md` - Seção "Troubleshooting"
2. Verifique logs do PM2: `pm2 logs peo-backend`
3. Verifique logs do Nginx: `/var/log/nginx/peo_error.log`
4. Teste API local: `curl http://localhost:6001/api/health`

---

## 🎯 Checklist Rápido

- [ ] Arquivos transferidos para `/home/administrator/PEO`
- [ ] `.env.production` copiado para `.env`
- [ ] Script de deploy executado: `./scripts/deploy-production.sh`
- [ ] Backend rodando: `pm2 status`
- [ ] Nginx configurado: `sudo nginx -t`
- [ ] Sistema acessível: `http://ogmanalytics.duquedecaxias.rj.gov.br`

---

## 📞 Informações Técnicas

**URL de Produção:** `http://ogmanalytics.duquedecaxias.rj.gov.br`  
**API Endpoint:** `/peo/api/`  
**Backend Port:** `6001` (localhost apenas)  
**Frontend:** Servido pelo Nginx na porta 80  

---

**Última atualização:** 2026-02-11  
**Versão:** 1.0 - Pronto para Produção
