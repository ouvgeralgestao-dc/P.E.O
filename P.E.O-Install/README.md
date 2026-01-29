# 🚀 P.E.O - Sistema de Instaladores Profissionais

Sistema automatizado de geração de instaladores profissionais para o **P.E.O - Criador de Organogramas PMDC**.

---

## 📋 Pré-requisitos

### Obrigatórios:

- **Node.js** 18+ instalado
- **PowerShell** (Windows 10/11)
- **Git** (para controle de versão)

### Opcionais (Para ícone profissional):

- **ImageMagick** para conversão PNG→ICO automática
  - Download: https://imagemagick.org/script/download.php

---

## 🎯 Como Gerar os Instaladores

### Método 1: Geração Automática de TODOS os Instaladores (RECOMENDADO)

```powershell
# Na pasta P.E.O-Install, execute como Administrador:
.\Gerar_Instaladores.ps1
```

Este script irá:

1. Converter o ícone PNG para ICO
2. Compilar o backend TypeScript em JavaScript standalone
3. Buildar o frontend React em arquivos estáticos
4. Gerar o **Instalador LOCAL** (uso offline)
5. Gerar o **Instalador INTRANET** (uso em rede)

**Resultado:** Pasta `dist/` com dois arquivos `.exe` prontos para distribuição!

---

### Método 2: Geração Individual

#### Instalador LOCAL (Offline)

```powershell
.\build-instalador-local.ps1
```

- **Uso:** Departamentos isolados sem rede
- **Características:** Banco local, sem telemetria, sem cadastro
- **Arquivo gerado:** `P.E.O - Local Setup 1.0.0.exe`

#### Instalador INTRANET (Rede)

```powershell
.\build-instalador-intranet.ps1
```

- **Uso:** Servidores de rede, múltiplos usuários
- **Características:** Cadastro por e-mail, auditoria habilitada
- **Arquivo gerado:** `P.E.O - Intranet Setup 1.0.0.exe`

---

## 📦 Estrutura dos Arquivos

```
P.E.O-Install/
├── src/
│   ├── main.js              # Lógica principal do Electron
│   ├── preload.cjs          # Script de preload
│   └── security.js          # Motor de criptografia
├── assets/
│   ├── icon.ico             # Ícone do Windows (gerado)
│   └── icon.png             # Ícone do Linux
├── bundled-backend/         # Backend compilado (gerado)
│   ├── server.js
│   ├── data/
│   └── node_modules/
├── bundled-frontend/        # Frontend buildado (gerado)
│   ├── index.html
│   └── assets/
├── Gerar_Instaladores.ps1   # Script MASTER
├── build-instalador-local.ps1
├── build-instalador-intranet.ps1
├── build-frontend.ps1
├── converter-icone.ps1
└── package.json
```

---

## 🔧 Solução de Problemas

### Erro: "ícone inválido"

**Causa:** PNG não convertido para ICO  
**Solução:**

1. Execute `.\converter-icone.ps1`
2. OU converta manualmente em https://convertio.co/pt/png-ico/
3. Salve como `assets/icon.ico`

### Erro: "Backend ainda não disponível"

**Causa:** Backend não foi compilado  
**Solução:** Execute na pasta `backend`:

```powershell
npm install
node build-standalone.js
```

### Erro: "Tela branca ao abrir o app"

**Causa:** Frontend não foi buildado  
**Solução:** Execute na pasta `P.E.O-Install`:

```powershell
.\build-frontend.ps1
```

### Instalador não cria atalho

**Causa:** Configuração NSIS incorreta  
**Solução:** Verifique que `perMachine: true` está no `package.json`

---

## 📊 Especificações Técnicas

### Instaladores Gerados:

- **Formato:** NSIS (Nullsoft Scriptable Install System)
- **Tamanho:** ~250-300 MB cada
- **Compressão:** 7-Zip máxima
- **Compatibilidade:** Windows 7, 10, 11 (64-bit)

### Instalação Padrão:

- **Pasta:** `C:\Program Files\P.E.O`
- **Dados:** `%LOCALAPPDATA%\P.E.O\peo.db`
- **Atalhos:** Área de Trabalho + Menu Iniciar

### Runtime Incluído:

- **Node.js:** Embutido via Electron
- **Backend:** Express + Better-SQLite3
- **Frontend:** React (compilado)

---

## 🛡️ Segurança

- ✅ Banco de dados SQLite criptografado
- ✅ Variáveis de ambiente protegidas (AES-256-GCM)
- ✅ Código fonte ofuscado no bundle
- ✅ Isolamento por contexto (contextIsolation)
- ✅ Sem nodeIntegration no renderer

---

## 📞 Suporte

**Desenvolvido por:** Antigravity AI  
**Versão:** 2.0.0  
**Data:** Janeiro de 2026

Para erros técnicos, verifique:

1. Logs do PowerShell
2. Console do aplicativo instalado (F12)
3. Arquivo `ARQUITETURA_INSTALACAO.md` para detalhes técnicos
