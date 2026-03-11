# Plano de Migração de Banco de Dados: JSON para SQLite (High Reliability)

**Autor:** Antigravity (Google Deepmind - Advanced Agentic Coding)
**Data:** 10/01/2026
**Projeto:** Planejador de Estrutura Organizacional - PMDC

---

## 1. Resumo Executivo

Este documento detalha a estratégia técnica para migrar a camada de persistência de dados do sistema, atualmente baseada em arquivos JSON distribuídos, para um banco de dados relacional **SQLite**.

**Objetivos:**
- **Segurança:** Implementar ACID (Atomicidade, Consistência, Isolamento, Durabilidade).
- **Integridade:** Garantir tipagem de dados e relações (Keys) fortes.
- **Performance:** Otimizar leituras com indexação, eliminando a necessidade de ler/escrever arquivos inteiros para pequenas alterações.
- **Confiabilidade:** Eliminar riscos de corrupção de arquivos JSON por concorrência de escrita (race conditions).

**Estratégia Principal:** Migração "Non-Destructive" com Camada de Abstração (Adapter Pattern). O frontend e os controllers NÃO saberão que o banco mudou.

---

## 2. Análise do Estado Atual (AS-IS)

Atualmente, os dados estão estruturados em sistema de arquivos:

*   **Registry Central:** `backend/data/orgaos.json` (Legado) e `backend/data/central/index.json`.
*   **Dados por Órgão:** `backend/data/orgaos/{orgaoId}/` contendo:
    *   `metadata.json` (Dados cadastrais e Auth)
    *   `estrutural.json` (Árvore de setores)
    *   `funcional/*.json` (Arquivos individuais por versão funcional)
*   **Acesso:** `backend/services/storageService.js` faz `fs.readFile` e `fs.writeFile` diretamente.

**Riscos Atuais:**
1.  Se dois usuários salvarem o mesmo órgão simultaneamente, o último arquivo sobrescreve o primeiro sem merge (Perda de dados).
2.  Corrupção do JSON se o processo Node.js falhar durante a escrita (`writeJSONFile` não é atômico por padrão em todos os SOs sem rename strategy).

---

## 3. Arquitetura Proposta (TO-BE)

### 3.1 Tecnologia

*   **Motor:** SQLite 3 (Armazenado em `backend/data/organograma.sqlite`)
*   **Driver:** `sqlite3` ou `better-sqlite3` (Recomendado `better-sqlite3` por performance e API síncrona/simples que casa bem com a lógica sequencial, mas `sqlite3` é padrão e assíncrono). Vamos desenhar para o padrão `sqlite3` assíncrono para menor impacto no event loop do servidor.

### 3.2 Schema do Banco de Dados

Modelagem Relacional Normalizada (3FN) para garantir integridade, mas com suporte a JSON para configurações complexas de layout.

```sql
-- TABELA 01: ÓRGÃOS (Entidade Principal)
CREATE TABLE orgaos (
    id TEXT PRIMARY KEY,           -- Slug único (ex: 'secretaria_de_governo')
    nome TEXT NOT NULL,
    auth_hash TEXT,                -- Hash da senha (se houver)
    auth_salt TEXT,                -- Salt da senha
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 02: ORGANOGRAMAS_ESTRUTURAIS (1:1 com Órgãos)
CREATE TABLE organogramas_estruturais (
    orgao_id TEXT PRIMARY KEY REFERENCES orgaos(id) ON DELETE CASCADE,
    tamanho_folha TEXT DEFAULT 'A4',
    updated_at DATETIME
);

-- TABELA 03: SETORES (Nós da árvore estrutural)
CREATE TABLE setores (
    id TEXT PRIMARY KEY,           -- UUID
    orgao_id TEXT REFERENCES orgaos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT,                     -- Secretaria, Diretoria, etc.
    hierarquia TEXT,               -- "1", "1.1", "2"
    parent_id TEXT REFERENCES setores(id), -- Auto-referência para árvore
    is_assessoria BOOLEAN DEFAULT 0,
    ordem INTEGER,                 -- Para manter ordem visual
    style_json TEXT,               -- Configurações visuais {color, background...}
    position_json TEXT,            -- Coordenadas {x, y}
    cargos_json TEXT               -- Array simples de cargos [{tipo: 'DAS-1', qtd: 1}] -> Se quiser normalizar deep, criar tabela 'cargos_setor'
);

-- TABELA 04: DIAGRAMAS_FUNCIONAIS (1:N com Órgãos - permite histórico)
CREATE TABLE diagramas_funcionais (
    id TEXT PRIMARY KEY,
    orgao_id TEXT REFERENCES orgaos(id) ON DELETE CASCADE,
    nome TEXT,                     -- Opcional (ex: 'Versão 2026')
    tamanho_folha TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- TABELA 05: CARGOS_FUNCIONAIS (Nós da árvore funcional)
CREATE TABLE cargos_funcionais (
    id TEXT PRIMARY KEY,
    diagrama_id TEXT REFERENCES diagramas_funcionais(id) ON DELETE CASCADE,
    nome_cargo TEXT NOT NULL,
    ocupante TEXT,                 -- Nome da pessoa
    hierarquia TEXT,
    parent_id TEXT,                -- ID do cargo pai (neste mesmo diagrama)
    is_assessoria BOOLEAN DEFAULT 0,
    style_json TEXT,
    position_json TEXT,
    simbolos_json TEXT             -- Array [{tipo: 'DAS-S', qtd: 1}]
);
```

---

## 4. Estratégia de Migração (Passo a Passo)

Para garantir **Zero Downtime** e **Risco Zero de Quebra**, faremos a migração em etapas.

### 🔹 Fase 1: Implementação da Interface (Backend)
Criar um novo serviço `sqliteStorageService.js` que implementa EXATAMENTE os mesmos métodos exportados por `storageService.js`.

**Métodos a implementar (Interface):**
- `getOrgaoByName(nome)`
- `createOrUpdateOrgao(...)`
- `addOrganogramaFuncoes(...)`
- `listOrgaos()`
- etc.

*Neste ponto, o sistema ainda usa o arquivo JSON antigo.*

### 🔹 Fase 2: Script de Migração (ETL)
Criar um script `scripts/migrate_json_to_sqlite.js` que:
1.  Inicializa o banco SQLite vazio.
2.  Lê recursivamente todos os arquivos JSON da pasta `backend/data`.
3.  Transforma os objetos aninhados (Árvores) em registros planos (Linhas de tabela).
4.  Insere no SQLite.
5.  Gera um log de integridade (Ex: "Lidos 5 órgãos, Inseridos 5 órgãos").

### 🔹 Fase 3: Feature Flag & Testes
No arquivo de configuração ou `.env`, criar `DB_SOURCE=json` (default).
Alterar `organogramaController.js` para importar o serviço baseado nessa flag.

```javascript
// Exemplo de factory
import * as jsonStorage from './storageService.js';
import * as sqlStorage from './sqliteStorageService.js';

const storage = process.env.DB_SOURCE === 'sqlite' ? sqlStorage : jsonStorage;
export default storage;
```

Testar exaustivamente em ambiente de desenvolvimento rodando com `DB_SOURCE=sqlite`.

### 🔹 Fase 4: Cut-over (Virada de Chave)
1.  Parar o servidor.
2.  Fazer backup final da pasta `data`.
3.  Rodar script de migração ETL final.
4.  Mudar config para `DB_SOURCE=sqlite`.
5.  Reiniciar servidor.
6.  *Opcional:* Renomear pasta `orgaos` antiga para `orgaos_old_backup`.

---

## 5. Mitigação de Riscos

| Risco | Mitigação |
|-------|-----------|
| **Perda de Integridade da Árvore** | O script de migração deve validar se cada `parentId` existe. Caso contrário, alertar ou corrigir para raiz. |
| **Quebra do Frontend** | O `sqliteStorageService` deve ter uma função `reconstructTree()` que pega os dados planos do banco e devolve exatamente o JSON aninhado (`children: []`) que o React Flow espera. **A API de resposta NÃO PODE MUDAR.** |
| **Performance de Escrita** | SQLite é rápido, mas escritas massivas devem ser feitas em Transação (`BEGIN TRANSACTION` ... `COMMIT`). |
| **Bugs de Regressão** | Manter o código `storageService.js` original disponível. Se der erro no SQLite, basta mudar a variável de ambiente e voltar para os arquivos JSON imediatamente (Rollback em segundos). |

## 6. Próximos Passos Imediatos (Sugeridos)

1.  Aprovar este plano.
2.  Instalar driver: `npm install sqlite3`.
3.  Criar arquivo `backend/database/schema.sql`.
4.  Iniciar codificação do `sqliteStorageService.js`.

---
*Este plano foi desenhado especificamente para o projeto PMDC, garantindo que a interface do usuário e as funcionalidades de edição visual permaneçam intactas enquanto robustecemos o backend.*
