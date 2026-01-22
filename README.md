# 🏛️ Gerador de Organogramas - PMDC

Sistema profissional para criação, visualização e exportação de organogramas da Prefeitura Municipal de Duque de Caxias.

![Status](https://img.shields.io/badge/status-production-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 🤖 PARA AGENTES DE IA (LEITURA OBRIGATÓRIA)

**⚠️ INSTRUÇÃO CRÍTICA PARA QUALQUER AGENTE IA QUE TRABALHAR NESTE PROJETO:**

### 📖 Auto-Load Mandatório

**ANTES de executar QUALQUER tarefa neste projeto, você DEVE:**

1. ✅ **LER COMPLETAMENTE:** `.cursorrules/rules.mdc`
2. ✅ **CONSULTAR:** `.cursorrules/AUDITORIA.md` (histórico e estado atual)
3. ✅ **VERIFICAR:** `.cursorrules/ERROR_LOG.md` (erros conhecidos e soluções)

### 🧠 Brain Mode Ativo

Este projeto opera em **BRAIN MODE** — um sistema de memória permanente e auto-aprendizagem que:
- 🛡️ **Previne erros recorrentes** (cada erro resolvido = prevenção futura)
- 📚 **Mantém contexto** entre sessões e agentes diferentes
- ⚡ **Acelera desenvolvimento** (soluções já documentadas)
- 🎯 **Garante consistência** arquitetural

### 🚨 Regra Suprema

**NUNCA:**
- ❌ Causar perda permanente de dados
- ❌ Quebrar estrutura fundamental do projeto
- ❌ Introduzir vulnerabilidades críticas
- ❌ Fazer mudanças irreversíveis sem backup

**SEMPRE:**
- ✅ Ler `.cursorrules/rules.mdc` antes de começar
- ✅ Registrar todas as tarefas em `.cursorrules/AUDITORIA.md`
- ✅ Documentar novos erros em `.cursorrules/ERROR_LOG.md`
- ✅ Consultar histórico antes de reimplementar soluções

**Localização dos Arquivos de Regras:** `.cursorrules/`

---

## ✨ Funcionalidades

### 📊 Criação de Organogramas
- **Estrutura Organizacional**: Hierarquia completa de setores (níveis 1-10)
- **Funções e Cargos**: Mapeamento de cargos DAS e símbolos
- **Assessorias**: Posicionamento lateral automático
- **Validações Inteligentes**: Regras DAS e hierarquia

### 🎨 Visualização Profissional
- **ReactFlow**: Renderização interativa com zoom e pan
- **Cores por Hierarquia**: Sistema visual de 11 cores
- **Agrupamento Automático**: Níveis 5-10 agrupados por tipo
- **MiniMap**: Navegação facilitada em organogramas grandes

### 🏛️ Organograma Geral
- **Estrutura Fixa**: Prefeito + Gabinete + 4 Subprefeituras
- **Agregação Automática**: Todas as Secretarias integradas
- **Legenda Visual**: Cores explicadas
- **Estatísticas**: Métricas em tempo real

### 📷 Exportação de Alta Qualidade
- **PNG**: 300 DPI para impressão profissional
- **JPG**: Otimizado para compartilhamento
- **PDF**: Dimensões corretas (A0-A6)
- **Download Automático**: Um clique

### 🎯 Dashboard Moderno
- **Cards Estatísticos**: 4 métricas principais
- **Busca em Tempo Real**: Filtro instantâneo
- **Filtros Múltiplos**: Tipo, tamanho, ordenação
- **Grid Visual**: Cards animados e interativos

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/pmdc/gerador-organogramas.git
cd gerador-organogramas

# Instale dependências do backend
cd backend
npm install

# Instale dependências do frontend
cd ../frontend
npm install
```

### Configuração

**Backend (.env):**
```env
PORT=6001
NODE_ENV=development
DATA_DIR=./data
```

**Frontend (vite.config.js):**
```javascript
server: {
  port: 6002,
  proxy: {
    '/api': 'http://localhost:6001'
  }
}
```

### Executar

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Acesse:** `http://localhost:6002`

---

## 📁 Estrutura do Projeto

```
Criador_Organograma/
├── backend/
│   ├── controllers/          # Lógica de negócio
│   ├── routes/               # Rotas da API
│   ├── services/             # Serviços (storage, layout)
│   ├── middleware/           # Validações
│   ├── data/                 # Armazenamento JSON
│   │   └── orgaos/          # 1 pasta por órgão
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Button, Input, Select, Card
│   │   │   ├── forms/       # WizardForm, EstruturaForm, FuncoesForm
│   │   │   ├── canvas/      # OrganogramaCanvas, SetorNode
│   │   │   └── layout/      # Header
│   │   ├── pages/           # Dashboard, CriarOrganograma, etc
│   │   ├── services/        # API (axios)
│   │   ├── utils/           # Helpers, validators
│   │   ├── constants/       # Hierarquia, DAS, tamanhos
│   │   └── styles/          # CSS global
│   └── vite.config.js
│
└── rules/                    # Documentação do projeto
    ├── TASK.md
    ├── IMPLEMENTATION_PLAN.md
    └── rules.mdc
```

---

## 🎨 Sistema de Cores

| Hierarquia | Cor | Hex | Uso |
|------------|-----|-----|-----|
| Assessoria | Prata | `#C0C0C0` | Assessorias e Gabinete |
| Nível 1 | Dourado | `#FFD700` | Secretarias e Prefeito |
| Nível 2 | Vermelho | `#FF6B6B` | Subsecretarias |
| Nível 3 | Turquesa | `#4ECDC4` | Diretorias |
| Nível 4 | Azul Claro | `#45B7D1` | Coordenadorias |
| Nível 5 | Verde Menta | `#96CEB4` | Gerências |
| Nível 6 | Amarelo | `#FFEAA7` | Supervisões |
| Nível 7 | Cinza Claro | `#DFE6E9` | Chefias |
| Nível 8 | Roxo | `#A29BFE` | Seções |
| Nível 9 | Rosa | `#FD79A8` | Setores |
| Nível 10 | Laranja | `#FDCB6E` | Unidades |

---

## 📊 Regras de Negócio

### Hierarquia
- **Níveis**: 1 (mais alto) a 10 (mais baixo)
- **Assessoria**: Nível especial (0), posicionado lateralmente
- **Fluxo**: Vertical descendente (1 → 2 → 3 → ... → 10)

### Cargos DAS

**Quantidade Máxima por Setor:**
- DAS-S, DAS-9, DAS-8: **1 cargo**
- DAS-1 a DAS-7, FC-1: **até 10.000 cargos**

**Símbolos por Nível:**
- Níveis 1, 2, 3: **1 símbolo apenas**
- Níveis 4-10: **Ilimitado**
- Assessoria: **Ilimitado**

### Agrupamento Visual (Funções)
- **Níveis 1-4**: Cada cargo = 1 nó individual
- **Níveis 5-10**: Agrupar por tipo, exibir quantidade total
  - Formato: `"Analista - DAS 5 (18)"`

---

## 🔌 API Endpoints

### Organogramas

```http
GET    /api/organogramas              # Listar todos
GET    /api/organogramas/:nomeOrgao   # Buscar por nome
GET    /api/organogramas/geral        # Organograma Geral
POST   /api/organogramas/estrutural   # Criar estrutural
POST   /api/organogramas/funcoes      # Criar funções
PUT    /api/organogramas/:nomeOrgao/estrutura  # Editar estrutural
PUT    /api/organogramas/:nomeOrgao/funcoes    # Editar funções
DELETE /api/organogramas/:nomeOrgao   # Deletar
```

### Posições Customizadas

```http
POST   /api/organogramas/:id/positions    # Salvar posições
DELETE /api/organogramas/:id/positions    # Resetar layout
```

---

## 🧪 Testes

### Teste Manual - Criar Organograma

1. Acesse Dashboard
2. Clique "Criar Novo Organograma"
3. Selecione tipo "Estrutura Organizacional"
4. Preencha:
   - Nome do Órgão: "Secretaria de Teste"
   - Tamanho: A4
   - Senha: "teste123"
5. Adicione setor:
   - Tipo: Secretaria
   - Nome: "Secretaria de Teste"
   - Hierarquia: 1
   - Cargo: DAS-9 (qtd: 1)
6. Salve e visualize

**Resultado Esperado:**
- ✅ Organograma salvo
- ✅ Nó dourado renderizado
- ✅ Exportação funcional

### Teste de Validação

**Tentar adicionar 2 cargos DAS-9:**
- ❌ Deve mostrar erro: "DAS-9 permite apenas 1 cargo"

**Tentar adicionar 2 símbolos no Nível 1:**
- ❌ Deve mostrar erro: "Nível 1 permite apenas 1 símbolo"

---

## 📦 Dependências Principais

### Backend
- `express`: ^4.18.2
- `cors`: ^2.8.5
- `uuid`: ^9.0.0

### Frontend
- `react`: ^18.2.0
- `react-router-dom`: ^6.20.0
- `reactflow`: ^11.10.0
- `axios`: ^1.6.2
- `html2canvas`: ^1.4.1
- `jspdf`: ^2.5.1
- `file-saver`: ^2.0.5

---

## 🎯 Roadmap

- [x] FASE 1-9: Funcionalidades principais
- [ ] FASE 10: Testes e documentação
- [ ] Autenticação de usuários
- [ ] Histórico de versões
- [ ] Comparação de organogramas
- [ ] Importação de dados (Excel/CSV)
- [ ] API pública
- [ ] Deploy em produção

---

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

- **Email**: suporte@pmdc.gov.br
- **Issues**: [GitHub Issues](https://github.com/pmdc/gerador-organogramas/issues)
- **Documentação**: [Wiki](https://github.com/pmdc/gerador-organogramas/wiki)

---

## 🙏 Agradecimentos

- Prefeitura Municipal de Duque de Caxias
- Equipe de Desenvolvimento
- Comunidade React e ReactFlow

---

**Desenvolvido com ❤️ para a PMDC**
