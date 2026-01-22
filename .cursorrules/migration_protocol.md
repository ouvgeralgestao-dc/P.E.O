# 🛡️ PROTOCOLO MESTRE DE MIGRAÇÃO DE DADOS (DMP-v2)

> **DIRETRIZ SUPREMA:** Nenhuma migração de dados ocorre sem redundância, validação e reversibilidade. A perda de dados é inaceitável.
> **MODERNIZAÇÃO:** A prioridade é sempre utilizar **ORM (Object-Relational Mapping)** para garantir integridade de tipos e independência de banco de dados.

---

## 1. 📋 PREPARAÇÃO E ANÁLISE (Fase Pré-Código)

Antes de escrever qualquer script, o Agente de IA deve realizar a **Análise de Engenharia de Dados**:

### 1.1. Mapeamento Origem x Destino
- **Fonte (Source):** Qual o formato atual? (JSON, CSV, SQL Legado, API)
- **Destino (Target):** Qual o formato alvo? (SQLite, PostgreSQL, MongoDB)
- **Volumetria:** Quantos registros? (100? 10.000? 1.000.000?)
- **Complexidade:** Os dados são planos (flat) ou aninhados (nested)?

### 1.2. Estratégia de Normalização
Se estivermos migrando de uma estrutura "Monolítica/Flat" para "Relacional/Normalizada", o Agente deve desenhar a ordem de inserção:
1.  **Dicionários/Tabelas Pai:** (Ex: Secretarias, Categorias) - *Não dependem de ninguém.*
2.  **Tabelas Intermediárias:** (Ex: Departamentos, Setores) - *Dependem das Tabelas Pai.*
3.  **Tabelas Folha/Transacionais:** (Ex: Funcionários, Logs) - *Dependem de todos acima.*

### 1.3. 🛑 AVISOS MANDATÓRIOS AO USUÁRIO
O Agente deve solicitar confirmação do usuário para:
- [ ] **Backup Frio:** "Você realizou um backup manual (zip/copy) dos dados originais?"
- [ ] **Parada de Serviço:** "O servidor está parado para evitar escrita durante a migração?"
- [ ] **Ambiente de Teste:** "Podemos rodar a migração em uma cópia do banco primeiro?"

---

## 2. 🛠️ TOOLKIT TÉCNICO RECOMENDADO

Para scripts de migração em Node.js, estas são as ferramentas padrão-ouro que o Agente deve priorizar:

| Categoria | Biblioteca Recomendada | Por que usar? |
| :--- | :--- | :--- |
| **ORM (Prioritário)** | **Prisma ORM** (Padrão) ou **Drizzle** | Garante *Type Safety*, gera migrações automáticas (`migrate dev`) e abstrai SQL complexo. |
| **Validação** | `zod` | Garante que lixo não entra no banco novo. Define o schema estrito antes do ORM. |
| **Arquivos** | `fs-extra` | Mais robusto que o `fs` nativo para ler diretórios recursivamente. |
| **Driver SQL** | `better-sqlite3` | *Fallback* apenas se não for possível usar ORM. |
| **Util** | `uuid` | Para gerar novos IDs únicos se o sistema legado não tiver. |
| **Visual** | `chalk` ou `ora` | Para logs coloridos e spinners de progresso no terminal. |

---

## 3. ⚙️ O ALGORITMO DE MIGRAÇÃO (ETL via ORM)

Esta é a abordagem padrão (**ORM-First**). O Agente só deve recorrer a SQL puro se houver restrições técnicas explícitas.

### Passo 1: Definição da Verdade (Schema Definition)
Antes de migrar dados, migre a estrutura.
1.  Criar/Atualizar o arquivo de schema (ex: `schema.prisma`).
2.  Definir modelos, campos obrigatórios (`?` vs não nulo) e relacionamentos (`@relation`).
3.  Executar a migração de estrutura:
    * *Prisma:* `npx prisma migrate dev --name init_migration`
    * *Drizzle:* `npx drizzle-kit push`

### Passo 2: Extração e Sanitização (Extract & Transform)
- Ler os dados da fonte (JSON/CSV).
- **Validação Dupla:**
    1.  **Zod:** Valida se o dado de entrada faz sentido (ex: email é email).
    2.  **Typescript:** O ORM fornecerá tipos gerados. O script deve tentar encaixar o dado no tipo do ORM.
- **Limpeza:** `.trim()`, converter datas (ISO-8601), normalizar Enums.

### Passo 3: Inserção Transacional (Load via ORM)
**REGRA CRÍTICA:** A escrita deve ser atômica usando as ferramentas do ORM.

**Exemplo com Prisma:**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ler dados (exemplo)
  const sourceData = readJsonFiles(); 

  // INÍCIO DA TRANSAÇÃO DO ORM
  // O $transaction garante que se um falhar, todos falham.
  await prisma.$transaction(async (tx) => {
    
    // 1. Inserir Pai (Secretarias)
    for (const sec of sourceData.secretarias) {
       await tx.secretaria.create({
         data: {
           id: sec.id,
           nome: sec.nome
         }
       });
    }

    // 2. Inserir Filhos (Funcionarios)
    // Usar createMany para performance se o banco suportar
    await tx.funcionario.createMany({
       data: sourceData.funcionarios.map(f => ({
         nome: f.nome,
         secretariaId: f.sec_id // Foreign Key garantida pelo ORM
       }))
    });
  });

  console.log("✅ Migração via ORM concluída com sucesso.");
}

main()
  .catch(e => {
    console.error("❌ Erro fatal na migração:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
