# 📁 Estrutura do Projeto P.E.O

## 🎯 Status: ULTRA LIMPO E ORGANIZADO

**Limpeza profunda realizada:** 60+ arquivos organizados  
**Redução geral:** 80% mais eficiente  
**Pronto para produção:** ✅

---

## 📂 Diretórios Principais

```
P.E.O/
├── 📁 backend/              # Servidor Node.js + Express (7 arquivos)
│   ├── archive/             # Scripts debug obsoletos (15)
│   ├── scripts/             # Scripts organizados (1 ativo)
│   │   ├── maintenance/     # Scripts úteis (11)
│   │   └── archive/         # Scripts obsoletos (33)
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── database/
│   └── data/
│
├── 📁 frontend/             # Interface React + Vite (7 arquivos)
│   ├── src/
│   └── public/
│
├── 📁 scripts/              # Scripts de deploy e automação
│   ├── deploy-production.sh
│   ├── verify-deploy.sh
│   └── install_all.js
│
├── 📁 nginx/                # Configurações do Nginx
│   └── peo.conf
│
├── 📁 assets/               # Recursos estáticos organizados
│   └── logos/               # Logos da marca (3)
│
├── 📁 docs/                 # Documentação organizada
│   ├── archive/             # Documentos históricos (4)
│   └── planning/            # Documentos de planejamento (3)
│
├── 📁 archive/              # Arquivos obsoletos
│   └── old-scripts/         # Scripts de debug antigos (13)
│
└── 📁 node_modules/         # Dependências (não versionar)
```

---

## 🎯 Arquivos Essenciais na Raiz (16 arquivos)

### Configuração (7 arquivos)
- `.env` - Variáveis de ambiente (desenvolvimento)
- `.env.production` - Variáveis de ambiente (produção)
- `.gitignore` - Arquivos ignorados pelo Git
- `package.json` - Dependências e scripts do projeto
- `tsconfig.json` - Configuração TypeScript
- `mcp.json` - Configuração MCP
- `.ai-instructions` - Instruções para IA

### Deploy (5 arquivos)
- `QUICK_START.md` - Guia rápido de deploy (3 comandos)
- [`docs/deploy/DEPLOY_CHECKLIST.md`](docs/deploy/DEPLOY_CHECKLIST.md) - Checklist completo passo a passo
- [`docs/deploy/DEPLOY_INSTRUCTIONS.md`](docs/deploy/DEPLOY_INSTRUCTIONS.md) - Documentação técnica detalhada
- `README_DEPLOY.md` - Visão geral do deploy
- `deploy_vps.sh` - Script de deploy legado

### Documentação (3 arquivos)
- `README.md` - Documentação principal do projeto
- `PROJECT_STRUCTURE.md` - Este documento
- (deploy docs já contados acima)

### Execução (1 arquivo)
- `start-server.ts` - Script para iniciar backend + frontend

---

## 📊 Estatísticas de Limpeza

### Raiz do Projeto
- **Antes:** 38 arquivos
- **Depois:** 16 arquivos
- **Redução:** 58%

### Backend
- **Antes:** 27 arquivos
- **Depois:** 7 arquivos
- **Redução:** 74%

### Backend/Scripts
- **Antes:** 45 arquivos
- **Depois:** 1 arquivo (+ 2 pastas organizadas)
- **Redução:** 98%

### Frontend
- **Antes:** 8 arquivos
- **Depois:** 7 arquivos
- **Redução:** 12%

---

## 📁 Detalhamento dos Diretórios

### `backend/` (7 arquivos essenciais)
Servidor backend em Node.js + Express + TypeScript

**Arquivos principais:**
- `server.ts` - Arquivo principal do servidor
- `package.json` - Dependências
- `.env` - Configurações locais
- `.env.example` - Template de configurações
- `tsconfig.json` - Config TypeScript
- `tsconfig.build.json` - Config build

**Subpastas:**
- `routes/` - Rotas da API
- `controllers/` - Controladores
- `services/` - Serviços de negócio
- `middleware/` - Middlewares Express
- `database/` - Configuração do banco
- `data/` - Banco de dados SQLite
- `scripts/` - Scripts organizados
  - `maintenance/` - Scripts úteis (11)
  - `archive/` - Scripts obsoletos (33)
- `archive/` - Debug scripts obsoletos (15)

### `frontend/` (7 arquivos essenciais)
Interface do usuário em React + TypeScript + Vite

**Arquivos principais:**
- `index.html` - HTML principal
- `vite.config.ts` - Configuração Vite
- `package.json` - Dependências
- `tsconfig.json` - Config TypeScript
- `tsconfig.node.json` - Config Node
- `.env.production` - Variáveis de produção

**Subpastas:**
- `src/` - Código-fonte
  - `components/` - Componentes React
  - `services/` - Serviços (API, autenticação)
  - `pages/` - Páginas da aplicação
- `public/` - Arquivos públicos
- `dist/` - Build de produção (gerado)

### `scripts/`
Scripts de automação
- `deploy-production.sh` - Deploy automatizado para VPS
- `verify-deploy.sh` - Verificação pré-deploy
- `install_all.js` - Instalação de dependências

### `nginx/`
Configurações do servidor web
- `peo.conf` - Template de configuração Nginx

### `assets/`
Recursos estáticos organizados
- `logos/` - Logos e imagens da marca (3 arquivos)
  - `dc-logo.png`
  - `logo_blue_com_fundo-removebg-preview.png`
  - `logo_white_com_fundo-removebg-preview.png`

### `docs/`
Documentação do projeto
- `archive/` - Documentos antigos/históricos (4 arquivos)
  - `AUDITORIA1.md`
  - `ERROR_LOG.md`
  - `TASK_LOCAL_FIX.md`
  - `project_analysis.md`
- `planning/` - Documentos de planejamento (3 arquivos)
  - `PLANO_DE_METAS.md`
  - `PLANO_MIGRACAO_SQLITE.md`
  - `RELATORIO_SEGURANCA.md`

### `archive/`
Arquivos obsoletos (não necessários para produção)
- `old-scripts/` - Scripts de debug e teste antigos (13 arquivos)

---

## 🚀 Arquivos Necessários para Deploy

### Mínimo para Produção
```
✅ backend/
✅ frontend/
✅ scripts/
✅ nginx/
✅ .env.production
✅ package.json
✅ start-server.ts
✅ tsconfig.json
```

### Opcional (mas recomendado)
```
📚 QUICK_START.md
📚 docs/deploy/DEPLOY_CHECKLIST.md
📚 docs/deploy/DEPLOY_INSTRUCTIONS.md
📚 README.md
📚 PROJECT_STRUCTURE.md
```

### Não Necessário para Deploy
```
❌ archive/ (apenas histórico)
❌ docs/ (apenas documentação)
❌ assets/ (logos já estão no frontend/public)
❌ P.E.O-Install/ (instalador desktop)
❌ node_modules/ (será instalado no VPS)
❌ backend/archive/ (scripts obsoletos)
❌ backend/scripts/archive/ (scripts obsoletos)
❌ backend/scripts/maintenance/ (apenas manutenção)
```

---

## 🧹 Arquivos Organizados

### Total: 60+ arquivos movidos

#### Da Raiz (23 arquivos)
- 13 scripts → `archive/old-scripts/`
- 3 logos → `assets/logos/`
- 4 docs → `docs/archive/`
- 3 docs → `docs/planning/`

#### Do Backend (15 arquivos)
- 15 scripts de debug → `backend/archive/debug-scripts/`

#### Do Backend/Scripts (44 arquivos)
- 33 scripts de debug/fix → `backend/scripts/archive/`
- 11 scripts de manutenção → `backend/scripts/maintenance/`

#### Do Frontend (1 arquivo)
- 1 arquivo temporário Vite (removido)

---

## 📝 Notas

1. **Pasta `archive/`**: Contém arquivos antigos. Pode ser excluída do deploy.
2. **Pasta `docs/`**: Documentação histórica. Pode ser excluída do deploy.
3. **Pasta `assets/`**: Logos organizados. Já estão duplicados em `frontend/public/`.
4. **Pasta `backend/archive/`**: Scripts de debug obsoletos. Não necessário em produção.
5. **Pasta `backend/scripts/archive/`**: Scripts de fix obsoletos. Não necessário em produção.
6. **Pasta `backend/scripts/maintenance/`**: Scripts úteis para manutenção. Opcional em produção.

---

**Última atualização:** 2026-02-11  
**Versão:** 2.0 - Ultra Limpo e Organizado  
**Status:** ✅ Pronto para Produção

