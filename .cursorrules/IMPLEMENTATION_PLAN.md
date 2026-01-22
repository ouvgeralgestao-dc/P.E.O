# Plano de Implementação - Gerador de Organogramas PMDC

## 📋 Descrição do Projeto

Desenvolvimento de uma aplicação web robusta para a Prefeitura Municipal de Duque de Caxias que permite:

1. **Criação de Organogramas Padronizados** (Estrutura Organizacional e Funções)
2. **Regras Hierárquicas Estritas** (Níveis 1-10 + Assessoria)
3. **Validação de Cargos DAS** (DAS 1-9, DAS-S, FC-1)
4. **Organograma Geral Automático** (agregação de todas as Secretarias)
5. **Exportação de Alta Qualidade** (PNG, JPG, PDF em tamanhos A0-A6)

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológica
- **Backend:** Node.js + Express.js
- **Frontend:** React 18 + Vite
- **Armazenamento:** Arquivos JSON locais (sem banco de dados externo)
- **Renderização de Grafos:** ReactFlow (escolhido por ser React-native, performático e com boa documentação)
- **Exportação:** html2canvas + jsPDF
- **Estilização:** CSS Modules + Variáveis CSS

### Sistema de Armazenamento Local

#### Estrutura de Dados
- **1 arquivo JSON por órgão** (setor Nível 1)
- **Nomenclatura:** `db_[nome_orgao_normalizado].json`
- **Localização:** `backend/data/`
- **Conteúdo:** Organograma Estrutural + todos os Organogramas de Funções relacionados

#### Exemplo de Estrutura
```
backend/data/
├── db_controle_interno.json       # Secretaria de Controle Interno
├── db_educacao.json                # Secretaria de Educação
├── db_saude.json                   # Secretaria de Saúde
└── organograma_geral.json          # Agregação de todos os órgãos
```

#### Formato do Arquivo JSON
```json
{
  "orgao": "Secretaria de Controle Interno",
  "orgaoId": "controle_interno",
  "organogramaEstrutural": {
    "id": "uuid-v4",
    "tipo": "estrutura",
    "tamanhoFolha": "A4",
    "setores": [...]
  },
  "organogramasFuncoes": [
    {
      "id": "uuid-v4",
      "tipo": "funcoes",
      "tamanhoFolha": "A3",
      "cargos": [...]
    }
  ],
  "createdAt": "2026-01-08T00:00:00.000Z",
  "updatedAt": "2026-01-08T00:00:00.000Z"
}
```

### Estrutura de Pastas
```
Criador_Organograma/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Organograma.js
│   │   └── Setor.js
│   ├── controllers/
│   │   └── organogramaController.js
│   ├── routes/
│   │   └── organogramas.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── services/
│   │   ├── organogramaService.js
│   │   └── exportService.js
│   ├── utils/
│   │   └── helpers.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   └── Card.jsx
│   │   │   ├── forms/
│   │   │   │   ├── WizardForm.jsx
│   │   │   │   ├── EstruturaForm.jsx
│   │   │   │   └── FuncoesForm.jsx
│   │   │   ├── canvas/
│   │   │   │   ├── OrganogramaCanvas.jsx
│   │   │   │   ├── SetorNode.jsx
│   │   │   │   └── CustomEdge.jsx
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CriarOrganograma.jsx
│   │   │   ├── VisualizarOrganograma.jsx
│   │   │   └── OrganogramaGeral.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   │   ├── useOrganograma.js
│   │   │   └── useValidation.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   └── layoutHelpers.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   ├── constants/
│   │   │   ├── hierarchyLevels.js
│   │   │   ├── cargosDAS.js
│   │   │   └── pageSizes.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── rules/
    ├── rules.mdc
    ├── AUDITORIA1.md
    └── ERROR_LOG.md
```

---

## 📊 Estrutura de Dados (JSON)

### Arquivo por Órgão: `db_[orgao].json`

```json
{
  "orgao": "Secretaria de Controle Interno",
  "orgaoId": "controle_interno",
  "organogramaEstrutural": {
    "id": "uuid-v4-string",
    "tipo": "estrutura",
    "tamanhoFolha": "A4",
    "setores": [
      {
        "id": "uuid-v4-string",
        "tipoSetor": "Secretaria",
        "nomeSetor": "Secretaria de Controle Interno",
        "hierarquia": 1,
        "isAssessoria": false,
        "parentId": null,
        "cargos": [
          {
            "tipo": "DAS-9",
            "quantidade": 1
          }
        ],
        "position": {
          "x": 0,
          "y": 0
        }
      },
      {
        "id": "uuid-v4-string",
        "tipoSetor": "Diretoria",
        "nomeSetor": "Diretoria de Auditoria",
        "hierarquia": 2,
        "isAssessoria": false,
        "parentId": "uuid-do-pai",
        "cargos": [
          {
            "tipo": "DAS-7",
            "quantidade": 1
          }
        ],
        "position": {
          "x": 0,
          "y": 150
        }
      }
    ],
    "createdAt": "2026-01-08T00:00:00.000Z",
    "updatedAt": "2026-01-08T00:00:00.000Z"
  },
  "organogramasFuncoes": [
    {
      "id": "uuid-v4-string",
      "tipo": "funcoes",
      "tamanhoFolha": "A3",
      "cargos": [
        {
          "id": "uuid-v4-string",
          "nomeCargo": "Auditor Interno",
          "hierarquia": 3,
          "isAssessoria": false,
          "parentId": "uuid-do-pai",
          "simbolos": [
            {
              "tipo": "DAS-5",
              "quantidade": 3
            }
          ],
          "position": {
            "x": 0,
            "y": 300
          }
        }
      ],
      "createdAt": "2026-01-08T00:00:00.000Z",
      "updatedAt": "2026-01-08T00:00:00.000Z"
    }
  ],
  "createdAt": "2026-01-08T00:00:00.000Z",
  "updatedAt": "2026-01-08T00:00:00.000Z"
}
```

### Arquivo Organograma Geral: `organograma_geral.json`

```json
{
  "tipo": "geral",
  "estruturaFixa": {
    "prefeito": {
      "id": "prefeito-node",
      "nome": "Prefeito",
      "cor": "#FFD700",
      "position": { "x": 0, "y": 0 }
    },
    "gabinete": {
      "id": "gabinete-node",
      "nome": "Gabinete do Prefeito",
      "cor": "#C0C0C0",
      "position": { "x": 300, "y": 50 }
    }
  },
  "orgaos": [
    "controle_interno",
    "educacao",
    "saude"
  ],
  "updatedAt": "2026-01-08T00:00:00.000Z"
}
```

---

## 🔒 Regras de Negócio

### 1. Regras de Hierarquia
- **Níveis:** 1 (mais alto) a 10 (mais baixo) + Assessoria (0)
- **Assessoria:** Posicionada lateralmente ao setor de Hierarquia 1, com offset vertical pequeno
- **Fluxo:** Vertical descendente (1 → 2 → 3 → ... → 10)

### 2. Regras de Cargos DAS

#### Quantidade Máxima por Cargo
- **DAS-S, DAS-9, DAS-8:** Máximo 1 por setor
- **DAS-1 a DAS-7, FC-1:** Até 10.000 por setor

#### Quantidade de Símbolos por Nível Hierárquico
- **Níveis 1, 2, 3:** Apenas 1 símbolo permitido
- **Níveis 4 a 10:** Ilimitado (respeitando regras de quantidade acima)
- **Assessoria:** Ilimitado

### 3. Regras de Renderização (Modo Funções)

#### Agrupamento Visual
- **Níveis Assessoria, 1, 2, 3, 4:** Cada cargo cria um nó individual
- **Níveis 5 a 10:** Agrupar por tipo de cargo
  - Exibir: `"Nome do Cargo - Símbolo (Quantidade)"`
  - Exemplo: `"Analista - DAS 5 (18)"`

### 4. Organograma Geral

#### Estrutura Fixa do Topo
- **Nó Supremo:** Caixa dourada com texto "Prefeito"
- **Nó Staff:** Caixa prateada ao lado, texto "Gabinete do Prefeito"

#### Alimentação Automática
- Todos os organogramas de **Estrutura Organizacional** cujo setor principal seja **Nível 1** (Secretarias) são automaticamente conectados abaixo do Prefeito
- Cada Secretaria desenrola sua estrutura completa

---

## 🎨 Sistema de Cores por Hierarquia

```javascript
const HIERARCHY_COLORS = {
  0: '#C0C0C0',  // Assessoria - Prata
  1: '#FFD700',  // Nível 1 - Dourado
  2: '#FF6B6B',  // Nível 2 - Vermelho suave
  3: '#4ECDC4',  // Nível 3 - Turquesa
  4: '#45B7D1',  // Nível 4 - Azul claro
  5: '#96CEB4',  // Nível 5 - Verde menta
  6: '#FFEAA7',  // Nível 6 - Amarelo suave
  7: '#DFE6E9',  // Nível 7 - Cinza claro
  8: '#A29BFE',  // Nível 8 - Roxo suave
  9: '#FD79A8',  // Nível 9 - Rosa
  10: '#FDCB6E', // Nível 10 - Laranja suave
};
```

---

## 📝 Mudanças Propostas

### Backend

#### [NEW] [db.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/config/db.js)
- Configuração de conexão com MongoDB
- Tratamento de erros de conexão
- Logs de status

#### [NEW] [Organograma.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/models/Organograma.js)
- Schema Mongoose para Organograma
- Validações de tipo e tamanho de folha
- Timestamps automáticos

#### [NEW] [Setor.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/models/Setor.js)
- Schema Mongoose para Setor
- Validações de hierarquia (0-10)
- Validações de cargos DAS (quantidade máxima)
- Validação de símbolos por nível hierárquico

#### [NEW] [organogramaController.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/controllers/organogramaController.js)
- `createOrganograma` - Criar novo organograma
- `getAllOrganogramas` - Listar todos
- `getOrganogramaById` - Buscar por ID (com populate de setores)
- `updateOrganograma` - Atualizar organograma
- `deleteOrganograma` - Deletar organograma
- `getOrganogramaGeral` - Buscar todos organogramas de Nível 1 para agregação

#### [NEW] [organogramas.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/routes/organogramas.js)
- Rotas REST completas (GET, POST, PUT, DELETE)
- Rota especial: `GET /organogramas/geral` para Organograma Geral

#### [NEW] [validator.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/middleware/validator.js)
- Validação de regras DAS (quantidade máxima)
- Validação de símbolos por nível hierárquico
- Validação de hierarquia (0-10)

#### [NEW] [errorHandler.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/middleware/errorHandler.js)
- Middleware global de tratamento de erros
- Formatação de respostas de erro

#### [NEW] [organogramaService.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/services/organogramaService.js)
- Lógica de cálculo de posicionamento de nós
- Algoritmo de layout hierárquico
- Lógica de posicionamento de Assessoria (lateral)

#### [NEW] [server.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/backend/server.js)
- Configuração do Express
- Middlewares (CORS, JSON parser)
- Conexão com MongoDB
- Registro de rotas
- Inicialização do servidor

---

### Frontend

#### [NEW] [api.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/services/api.js)
- Configuração do Axios
- Base URL da API
- Interceptors para tratamento de erros

#### [NEW] [hierarchyLevels.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/constants/hierarchyLevels.js)
- Constantes de níveis hierárquicos
- Tipos de setores
- Mapeamento de cores por hierarquia

#### [NEW] [cargosDAS.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/constants/cargosDAS.js)
- Lista de cargos DAS disponíveis
- Regras de quantidade máxima por cargo
- Regras de símbolos por nível hierárquico

#### [NEW] [pageSizes.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/constants/pageSizes.js)
- Dimensões de páginas A0-A6 (em pixels para 300 DPI)

#### [NEW] [validators.js](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/utils/validators.js)
- Validação de regras DAS (frontend)
- Validação de hierarquia
- Validação de formulários

#### [NEW] [Button.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/common/Button.jsx)
- Componente de botão reutilizável
- Variantes (primary, secondary, danger)

#### [NEW] [Input.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/common/Input.jsx)
- Componente de input reutilizável
- Validação visual

#### [NEW] [Select.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/common/Select.jsx)
- Componente de select reutilizável
- Suporte a múltipla seleção

#### [NEW] [WizardForm.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/forms/WizardForm.jsx)
- Componente wrapper para formulário multi-etapas
- Navegação entre etapas
- Validação por etapa

#### [NEW] [EstruturaForm.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/forms/EstruturaForm.jsx)
- Formulário específico para Organograma de Estrutura Organizacional
- Seleção de tipo de setor
- Seleção de hierarquia
- Seleção de cargos DAS com validação

#### [NEW] [FuncoesForm.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/forms/FuncoesForm.jsx)
- Formulário específico para Organograma de Funções
- Input de nome de cargo
- Seleção de hierarquia
- Seleção de símbolos com validação

#### [NEW] [OrganogramaCanvas.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/canvas/OrganogramaCanvas.jsx)
- Componente principal de renderização usando ReactFlow
- Renderização de nós e conexões
- Zoom e pan
- Exportação para imagem/PDF

#### [NEW] [SetorNode.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/components/canvas/SetorNode.jsx)
- Componente de nó customizado para ReactFlow
- Exibição de nome do setor
- Exibição de cargos/símbolos
- Aplicação de cores por hierarquia

#### [NEW] [Dashboard.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/pages/Dashboard.jsx)
- Página principal
- Lista de organogramas salvos
- Busca e filtros
- Ações (visualizar, editar, deletar)

#### [NEW] [CriarOrganograma.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/pages/CriarOrganograma.jsx)
- Página de criação de organograma
- Seleção de tipo (Estrutura ou Funções)
- Seleção de tamanho de folha
- Wizard de criação

#### [NEW] [VisualizarOrganograma.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/pages/VisualizarOrganograma.jsx)
- Página de visualização de organograma individual
- Renderização do canvas
- Botões de exportação

#### [NEW] [OrganogramaGeral.jsx](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/pages/OrganogramaGeral.jsx)
- Página do Organograma Geral do Município
- Estrutura fixa do topo (Prefeito + Gabinete)
- Agregação automática de todas as Secretarias
- Exportação em alta resolução

#### [NEW] [variables.css](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/styles/variables.css)
- Variáveis CSS globais
- Cores por hierarquia
- Espaçamentos
- Tipografia

#### [NEW] [global.css](file:///c:/Users/CroSS/Desktop/Criador_Organograma/frontend/src/styles/global.css)
- Reset CSS
- Estilos globais
- Animações e transições

---

## ✅ Plano de Verificação

### Testes Automatizados (Backend)

#### 1. Teste de Validação de Regras DAS
**Arquivo:** `backend/tests/validator.test.js` (a criar)

**Como executar:**
```bash
cd backend
npm test -- validator.test.js
```

**O que testa:**
- DAS-S, DAS-9, DAS-8: máximo 1 por setor
- DAS-1 a DAS-7, FC-1: até 10.000 por setor
- Níveis 1, 2, 3: apenas 1 símbolo
- Níveis 4-10: ilimitado

#### 2. Teste de CRUD de Organogramas
**Arquivo:** `backend/tests/organograma.test.js` (a criar)

**Como executar:**
```bash
cd backend
npm test -- organograma.test.js
```

**O que testa:**
- Criação de organograma
- Listagem de organogramas
- Busca por ID
- Atualização
- Deleção

### Testes Manuais (Frontend)

#### 1. Teste de Criação de Organograma de Estrutura

**Passos:**
1. Acessar `http://localhost:5173`
2. Clicar em "Criar Novo Organograma"
3. Selecionar tipo "Estrutura Organizacional"
4. Selecionar tamanho "A4"
5. Preencher:
   - Tipo de Setor: "Secretaria"
   - Nome: "Secretaria de Controle Interno"
   - Hierarquia: "1"
   - Cargo: "DAS-9" (quantidade: 1)
6. Clicar em "Adicionar Setor"
7. Adicionar setor filho:
   - Tipo: "Diretoria"
   - Nome: "Diretoria de Auditoria"
   - Hierarquia: "2"
   - Cargo: "DAS-7" (quantidade: 1)
8. Clicar em "Salvar Organograma"

**Resultado Esperado:**
- Organograma salvo com sucesso
- Redirecionamento para visualização
- Canvas renderiza 2 nós conectados
- Cores diferentes por hierarquia (Nível 1 dourado, Nível 2 vermelho suave)

#### 2. Teste de Validação de Regras DAS

**Passos:**
1. Criar organograma de Estrutura
2. Adicionar setor Nível 1
3. Tentar adicionar 2 cargos DAS-9

**Resultado Esperado:**
- Mensagem de erro: "DAS-9 permite apenas 1 cargo por setor"
- Formulário não permite salvar

#### 3. Teste de Assessoria (Posicionamento Lateral)

**Passos:**
1. Criar organograma de Estrutura
2. Adicionar setor Nível 1 (Secretaria)
3. Adicionar setor Assessoria
4. Visualizar organograma

**Resultado Esperado:**
- Nó de Assessoria posicionado ao lado (direita) do Nível 1
- Offset vertical pequeno para baixo
- Cor prata para Assessoria

#### 4. Teste de Agrupamento Visual (Níveis 5-10)

**Passos:**
1. Criar organograma de Funções
2. Adicionar 3 cargos "Analista - DAS 5" em Nível 5
3. Visualizar organograma

**Resultado Esperado:**
- Apenas 1 nó visual exibido
- Texto: "Analista - DAS 5 (3)"

#### 5. Teste de Organograma Geral

**Passos:**
1. Criar 3 organogramas de Estrutura com Secretarias diferentes (Nível 1)
2. Acessar página "Organograma Geral"

**Resultado Esperado:**
- Nó dourado no topo: "Prefeito"
- Nó prateado ao lado: "Gabinete do Prefeito"
- 3 Secretarias conectadas abaixo do Prefeito
- Cada Secretaria com sua estrutura completa desenrolada

#### 6. Teste de Exportação PNG

**Passos:**
1. Visualizar qualquer organograma
2. Clicar em "Exportar PNG"

**Resultado Esperado:**
- Download automático de arquivo PNG
- Resolução 300 DPI
- Dimensões corretas (A4 = 2480 x 3508 pixels)
- Qualidade visual alta

#### 7. Teste de Exportação PDF

**Passos:**
1. Visualizar qualquer organograma
2. Clicar em "Exportar PDF"

**Resultado Esperado:**
- Download automático de arquivo PDF
- Tamanho de página correto (A4)
- Qualidade vetorial ou alta resolução

---

## 🚨 Pontos de Atenção

### Performance
- Organograma Geral pode ter centenas de nós
- Implementar virtualização ou lazy loading se necessário
- Otimizar algoritmo de layout

### Validação
- Validação duplicada (frontend + backend) para segurança
- Mensagens de erro claras em PT-BR

### Exportação
- Garantir qualidade 300 DPI mínimo
- Testar com organogramas grandes
- Considerar timeout para exportações pesadas

### UX
- Feedback visual durante salvamento
- Loading states
- Confirmação antes de deletar

---

## 📅 Cronograma Estimado

1. **Setup do Projeto** - 1 dia
2. **Backend (Models + Controllers + Routes)** - 2 dias
3. **Frontend Base (Componentes comuns + Rotas)** - 2 dias
4. **Formulários e Validação** - 2 dias
5. **Engine de Renderização (ReactFlow)** - 3 dias
6. **Organograma Geral** - 1 dia
7. **Exportação** - 2 dias
8. **Testes e Ajustes** - 2 dias

**Total:** ~15 dias de desenvolvimento

---

## 🚀 FASE 12: Ajustes Finais e Organograma de Funções Geral (PENDENTE)

### Metas Principais:
1. **Estilização Individual:** Edição de cores por nó no canvas e salvamento automático sem senha.
2. **Dashboard Avançado:** Gráficos sem limite de itens (scroll) e novos indicadores de volume por cargo.
3. **Organograma Geral v2:** Correção de layout via métricas JSON e novo motor de Impressão/PDF.
4. **Geral Funcional:** Criação do módulo de visualização consolidada de cargos de toda a prefeitura.

**Previsão de Conclusão:** 10/01/2026

---

**Pronto para iniciar a Fase 12 conforme o Plano de Metas aprovado.**
