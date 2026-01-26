# Relatório de Auditoria de Segurança - Projeto P.E.O

Este relatório detalha as vulnerabilidades de segurança encontradas no código fonte do projeto P.E.O, classificadas por nível de severidade. A análise cobriu arquivos do backend e frontend.

## Resumo das Vulnerabilidades

| Nível | Vulnerabilidade | Localização | Descrição |
| :--- | :--- | :--- | :--- |
| 🔴 **Crítico** | Senha Padrão Hardcoded | `backend/database/db.ts` | Credenciais administrativas padrão expostas no código de seed. |
| 🟠 **Alto** | Algoritmo de Hashing Fraco | `backend/routes/auth.ts`, `backend/database/db.ts` | Uso de SHA-256 sem salt para armazenamento de senhas. |
| 🟠 **Alto** | Cross-Site Scripting (XSS) Armazenado | `frontend/src/components/preview/LivePreviewCanvas.tsx` | Renderização de HTML não sanitizado via `dangerouslySetInnerHTML`. |
| 🟡 **Médio** | Segredo JWT Padrão Fraco | `backend/routes/auth.ts` | Fallback para string previsível se variável de ambiente falhar. |
| 🔵 **Baixo** | Configuração CORS Permissiva | `backend/server.ts` | Permite requisições de qualquer origem (`*`). |
| ⚪ **Info** | Integridade de Dados (FK) | `backend/services/sqliteStorageService.ts` | Desativação temporária de Foreign Keys. |

---

## Detalhes Técnicos

### 1. Senha Padrão Hardcoded (Crítico)
**Arquivo:** `backend/database/db.ts` (Linhas 124-140)

O código de inicialização do banco de dados cria um usuário administrador padrão com uma senha fixa e fraca sempre que a tabela de usuários está vazia.

```typescript
const senhaAdmin = 'admin123'; // ⚠️ SENHA EXPOSTA
const hash = crypto.createHash('sha256').update(senhaAdmin).digest('hex');
// ...
insertStmt.run('000001', 'admin@peo.gov.br', hash, ...);
```

**Risco:** Se este código for para produção e o banco for reiniciado ou implantado do zero, qualquer pessoa com acesso ao repositório conhece a credencial de admin.

**Correção Recomendada:**
*   Nunca hardcodar senhas.
*   Gerar uma senha aleatória forte no primeiro setup e imprimi-la no console apenas uma vez.
*   Forçar a alteração de senha no primeiro login.

### 2. Algoritmo de Hashing Fraco (Alto)
**Arquivos:** `backend/routes/auth.ts` (Linha 42), `backend/database/db.ts` (Linha 125)

O sistema utiliza SHA-256 simples (`crypto.createHash('sha256')`) sem *salt* aleatório por usuário.

```typescript
const hashSha256 = crypto.createHash('sha256').update(senha).digest('hex');
```

**Risco:** Suscetível a ataques de tabela arco-íris (Rainbow Tables). Se o banco de dados vazar, todas as senhas comuns serão descobertas instantaneamente. Embora haja código para `bcrypt` (comentado ou condicional), o padrão ativo é inseguro.

**Correção Recomendada:**
*   Migrar totalmente para **Bcrypt** ou **Argon2**.
*   Remover o fallback para SHA-256 assim que possível ou implementar uma estratégia de re-hash automática no login.

### 3. Cross-Site Scripting (XSS) (Alto)
**Arquivo:** `frontend/src/components/preview/LivePreviewCanvas.tsx` (Linha 24)

O componente renderiza labels de nós (cargos/setores) diretamente no DOM usando `dangerouslySetInnerHTML`.

```javascript
<div dangerouslySetInnerHTML={{ __html: data.labelHTML }} />
```

A propriedade `labelHTML` é construída concatenando entradas do usuário (nome do cargo, ocupante) sem sanitização prévia.

**Risco:** Um atacante (com permissão de edição) pode inserir um script malicioso no nome de um setor ou cargo (ex: `<img src=x onerror=alert(1)>` ou scripts de roubo de cookie/token). Quando outro usuário (ou admin) visualizar o organograma, o script será executado.

**Correção Recomendada:**
*   Usar uma biblioteca de sanitização como `dompurify` antes de passar o HTML para o React.
    ```javascript
    import DOMPurify from 'dompurify';
    // ...
    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.labelHTML) }} />
    ```
*   Ou evitar `dangerouslySetInnerHTML` e usar componentes React para renderizar a estrutura visual.

### 4. Segredo JWT Fraco (Médio)
**Arquivo:** `backend/routes/auth.ts` (Linha 9)

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';
```

**Risco:** Se a variável de ambiente não estiver configurada (comum em dev ou deploys rápidos), o sistema usa uma string conhecida publicamente. Isso permite que qualquer um forje tokens de autenticação (assinando seus próprios tokens com essa string) e ganhe acesso root.

**Correção Recomendada:**
*   Lançar um erro fatal e não iniciar o servidor se `JWT_SECRET` não estiver definido em produção.

### 5. CORS Permissivo (Baixo)
**Arquivo:** `backend/server.ts` (Linha 20)

```typescript
app.use(cors());
```

**Risco:** Permite que qualquer site na internet faça requisições AJAX para sua API (se o usuário estiver logado e a autenticação permitir, ou para endpoints públicos). Facilita ataques de CSRF ou uso indevido da API.

**Correção Recomendada:**
*   Restringir para domínios confiáveis: `app.use(cors({ origin: 'https://seu-frontend.com' }));`

### 6. Integridade de Dados / Pragma FK (Info)
**Arquivo:** `backend/services/sqliteStorageService.ts`

O código desativa verificação de chaves estrangeiras (`PRAGMA foreign_keys = OFF`) para realizar operações. Embora facilite saves complexos, pode levar a dados órfãos se a transação falhar de forma inesperada ou lógica.

---

**Nota Final:** O código está protegido contra **SQL Injection** na maioria das chamadas de banco de dados verificadas, pois utiliza *parameterized queries* (`?` placeholders) corretamente com o driver do SQLite.
