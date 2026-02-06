# 🏛️ P.E.O - Plataforma de Estrutura Organizacional

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-28-47848F?style=for-the-badge&logo=electron&logoColor=white)

**Sistema profissional para criação, visualização e exportação de organogramas**
*Prefeitura Municipal de Duque de Caxias*

[Funcionalidades](#-funcionalidades) •
[Tecnologias](#-stack-tecnológico) •
[Instalação](#-instalação) •
[Uso](#-como-usar) •
[Arquitetura](#-arquitetura) •
[API](#-api)

</div>

---

## 📋 Sobre o Projeto

O **P.E.O** (Plataforma de Estrutura Organizacional) é um sistema completo para gerenciamento de organogramas da Prefeitura Municipal de Duque de Caxias. Permite criar, editar, visualizar e exportar organogramas estruturais e funcionais de todos os órgãos municipais.

### ✨ Destaques

- 🎨 **Editor Visual Interativo** - Drag & drop para posicionamento de nós
- 📊 **Dois Tipos de Organogramas** - Estrutural (setores) e Funcional (cargos)
- 🖨️ **Exportação Profissional** - PDF em formatos A3 e A4
- 🔐 **Controle de Acesso** - Sistema de autenticação com níveis de permissão
- 💾 **Persistência Local** - Banco SQLite para armazenamento seguro
- 🖥️ **Desktop App** - Versão Electron para uso offline

---

## 🚀 Funcionalidades

### Organogramas

| Funcionalidade | Descrição |
|----------------|-----------|
| **Organograma Estrutural** | Hierarquia de setores (Secretarias, Subsecretarias, Diretorias, etc.) |
| **Organograma Funcional** | Estrutura de cargos com símbolos e quantidades |
| **Visão Geral** | Consolidação de todos os órgãos em um único diagrama |
| **Editor Visual** | Canvas interativo com React Flow |
| **Customização** | Cores, estilos e posições personalizáveis |

### Sistema

| Funcionalidade | Descrição |
|----------------|-----------|
| **Autenticação JWT** | Login seguro com tokens |
| **Aprovação de Cadastros** | Workflow de autorização de novos usuários |
| **Gestão de Órgãos** | CRUD completo de órgãos municipais |
| **Configuração de Setores** | Tipos de setores e hierarquias |
| **Sandbox** | Área de testes para organogramas |

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18.2 | Framework UI |
| **TypeScript** | 5.3+ | Tipagem estática |
| **Vite** | 5.0 | Build tool |
| **React Flow** | 11.11 | Canvas de organogramas |
| **React Router** | 6.20 | Navegação SPA |
| **Axios** | 1.6 | Cliente HTTP |
| **jsPDF** | 4.0 | Geração de PDFs |
| **html2canvas** | 1.4 | Screenshot de elementos |

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.18 | Framework HTTP |
| **TypeScript** | 5.3+ | Tipagem estática |
| **SQLite** | 3 | Banco de dados |
| **better-sqlite3** | 9.4 | Driver SQLite |
| **JWT** | 9.0 | Autenticação |
| **bcryptjs** | 3.0 | Hash de senhas |
| **Nodemailer** | 7.0 | Envio de e-mails |

### Desktop

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Electron** | 28 | App desktop |
| **electron-builder** | 24 | Empacotamento |

---

## 📁 Arquitetura

```
P.E.O/
├── 📂 frontend/                 # Aplicação React
│   ├── 📂 src/
│   │   ├── 📂 components/       # Componentes React
│   │   │   ├── 📂 canvas/       # Editor de organogramas
│   │   │   ├── 📂 common/       # Componentes reutilizáveis
│   │   │   ├── 📂 forms/        # Formulários
│   │   │   ├── 📂 layout/       # Layout da aplicação
│   │   │   └── 📂 modals/       # Modais
│   │   ├── 📂 pages/            # Páginas da aplicação
│   │   ├── 📂 services/         # Serviços (API, Auth)
│   │   ├── 📂 constants/        # Constantes e configurações
│   │   ├── 📂 utils/            # Utilitários
│   │   └── 📂 styles/           # Estilos globais
│   └── 📄 package.json
│
├── 📂 backend/                  # API Express
│   ├── 📂 controllers/          # Controladores de rotas
│   ├── 📂 routes/               # Definição de rotas
│   ├── 📂 services/             # Lógica de negócio
│   ├── 📂 middleware/           # Middlewares (auth, etc.)
│   ├── 📂 database/             # Configuração do banco
│   ├── 📂 migrations/           # Migrações do SQLite
│   ├── 📂 data/                 # Arquivos do banco SQLite
│   └── 📄 server.ts             # Ponto de entrada
│
├── 📂 electron/                 # Configuração Electron
└── 📄 package.json              # Configuração raiz
```

### Banco de Dados (SQLite)

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários do sistema |
| `orgaos` | Órgãos municipais |
| `organogramas` | Organogramas estruturais |
| `organogramas_funcoes` | Organogramas funcionais |
| `setores` | Setores dos órgãos |
| `cargos` | Cargos funcionais |
| `tipos_setor` | Configuração de tipos de setor |
| `simbolos_padrao` | Símbolos padrão de cargos |
| `custom_positions` | Posições customizadas dos nós |
| `ocupantes_gerais` | Ocupantes de cargos fixos |

---

## 📦 Instalação

### Pré-requisitos

- **Node.js** 18 ou superior
- **npm** ou **yarn**
- **Git**

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/ouvgeralgestao-dc/P.E.O.git
cd P.E.O

# 2. Instale as dependências raiz
npm install

# 3. Instale as dependências do frontend
cd frontend && npm install && cd ..

# 4. Instale as dependências do backend
cd backend && npm install && cd ..

# 5. Configure o ambiente (copie e edite o .env)
cp backend/.env.example backend/.env

# 6. Inicie a aplicação
npm start
```

### Variáveis de Ambiente

Crie o arquivo `backend/.env` com:

```env
# Servidor
PORT=6001
NODE_ENV=development

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# E-mail (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
```

---

## 💻 Como Usar

### Iniciar em Desenvolvimento

```bash
# Inicia frontend (porta 6002) e backend (porta 6001)
npm start
```

### Acessar a Aplicação

- **Web:** http://localhost:6002
- **API:** http://localhost:6001

### Build para Produção

```bash
# Gerar build do frontend
npm run build:frontend

# Gerar build do backend
npm run build:backend

# Gerar executável Electron
npm run dist
```

---

## 🔌 API

### Endpoints Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Autenticação |
| `POST` | `/api/auth/register` | Registro de usuário |
| `GET` | `/api/organogramas` | Listar organogramas |
| `GET` | `/api/organogramas/:orgaoId` | Obter organograma |
| `PUT` | `/api/organogramas/:orgaoId` | Atualizar organograma |
| `GET` | `/api/organogramas/:orgaoId/funcoes` | Obter org. funcional |
| `PUT` | `/api/organogramas/:orgaoId/funcoes` | Atualizar org. funcional |
| `GET` | `/api/organogramas/geral` | Organograma geral estrutural |
| `GET` | `/api/organogramas/geral-funcional` | Organograma geral funcional |
| `GET` | `/api/orgaos` | Listar órgãos |
| `GET` | `/api/tipos-setor` | Listar tipos de setor |
| `GET` | `/api/simbolos` | Listar símbolos de cargos |

### Autenticação

Todas as rotas protegidas requerem o header:

```
Authorization: Bearer <token_jwt>
```

---

## 👥 Níveis de Acesso

| Nível | Permissões |
|-------|------------|
| **Admin** | Acesso total, aprovação de cadastros, configurações |
| **Servidor** | Visualização e edição de organogramas do seu órgão |

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

**Ouvidoria Geral - Gestão de Dados e Desenvolvimento**
- GitHub: [@ouvgeralgestao-dc](https://github.com/ouvgeralgestao-dc)
- E-mail: ouvgeral.gestao@gmail.com

---

<div align="center">

**Desenvolvido com ❤️ para a Prefeitura Municipal de Duque de Caxias**

</div>
