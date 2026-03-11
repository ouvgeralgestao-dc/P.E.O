# 📋 Auditoria de Desenvolvimento - PMDC

## 📅 27/01/2026 - Correção de Lógica de Deleção e Saneamento de Dados

### 1. Refatoração da Deleção de Organogramas

**Contexto:** A deleção de organogramas estava apagando o registro do órgão na tabela `orgaos`, impedindo recriação e causando perda de histórico.
**Solução:**

- Implementada lógica de "Deleção Seletiva":
  - **Estrutural:** Deleta estrutura + funcional, mas mantém registro do órgão.
  - **Funcional:** Deleta apenas funcional.
- Criadas rotas separadas no backend (`DELETE /:nomeOrgao/estrutura`, `DELETE /:nomeOrgao/funcoes`).
- Atualizado frontend com mensagens de alerta diferenciadas e rotas específicas.
  **Status:** ✅ Concluído

### 2. Saneamento de Dados (Conselho de Contribuintes)

**Contexto:** O órgão "Conselho de Contribuintes" aparecia com nome normalizado (`conselho_de_contribuintes`) nos dropdowns, divergindo da lista de configuração.
**Causa Raiz:** O campo `nome` na tabela `orgaos` foi salvo como slug em algum momento passado.
**Solução:**

- Criado script de correção direta no banco (SQLite).
- Executada correção manual via script.
- Verificado código de criação para garantir que novos registros usem o nome correto.
  **Status:** ✅ Concluído

### 3. Correção de UX: Visualização de Organogramas Fantasmas

**Contexto:** Após deletar o organograma funcional, a opção de visualizá-lo ainda aparecia no modal de seleção.
**Solução:**

- Adicionado controle de props `hasEstrutural` e `hasFuncional` no `ViewSelectionModal`.
- Atualizado `Dashboard.tsx` para passar essas flags baseadas na existência real de dados (`organogramasFuncoes.length > 0`).
  **Status:** ✅ Concluído

### 4. Correção: Alerta de Deleção Invertido

**Contexto:** Ao tentar deletar um organograma estrutural, o alerta perguntava sobre funcional "Deseja deletar o organograma funcional?".
**Causa Raiz:** Erro de digitação na verificação condicional (`tipo === 'estrutural'` ao invés de `'estrutura'`) no arquivo `VisualizarOrganograma.tsx`.
**Solução:**

- Corrigido para comparar com a string literal correta vinda da URL (`estrutura`).
  **Status:** ✅ Concluído

### 5. Blindagem de Integridade de Dados (V4)

**Contexto:** O nome do órgão era revertido para seu slug (`conselho_de_contribuintes`) ao tentar criar novos organogramas, mesmo após correção manual. O frontend enviava o slug como nome, sobrescrevendo a correção.
**Solução:**

- Implementada **Blindagem Anti-Downgrade** no `sqliteStorageService.ts`: O backend agora bloqueia atualizações que tentam substituir um nome formatado (ex: "Conselho...") pelo seu slug (ex: "conselho\_...").
- Dados saneados novamente via script direto.
  **Status:** ✅ Concluído

### 6. Recuperação Inteligente de Nome (Smart Retrieval)

**Contexto:** O formulário de criação envia o ID do órgão no lugar do nome quando usado o dropdown, o que causava a tentativa de sobrescrita bloqueada pela Blindagem V4.
**Solução:**

- Implementada lógica no `organogramaController.ts`: Se o backend receber um slug/id como nome de órgão, ele verifica se o órgão já existe e recupera o nome correto (Title Case) do banco antes de processar, garantindo que o nome oficial seja preservado e propagado.
  **Status:** ✅ Concluído

### 7. Reforço de Blindagem em Metadados (V4 Extendida)

**Contexto:** A rota de atualização simples de metadados (`PUT /orgaos`) ainda permitia a reversão do nome via "auto-update" inadvertido pelo frontend.
**Solução:**

- Estendida a **Blindagem Anti-Downgrade** para a função `updateOrgaoMetadata` no backend. Agora, NENHUMA rota do sistema consegue reverter um nome formatado para seu slug técnico.
  **Status:** ✅ Concluído

### 8. Blindagem Heurística de Qualidade (Smart Retrieval V2)

**Contexto:** Variações sutis no input (espaços, caracteres invisíveis) estavam permitindo que slugs técnicos passassem pela validação de igualdade exata e sobrescrevessem o nome formatado.
**Solução:**

- Implementada verificação heurística no Controller: O sistema agora analisa a "riqueza" do texto. Se o nome armazenado possui formatação humana (maiúsculas, acentos, espaços) e o input recebido parece um identificador técnico (só minúsculas e underscores), o input é ignorado em favor do nome armazenado.
  **Status:** ✅ Concluído

### 9. Correção do Bug de Auto-Save Pós-Deleção (Update)

**Contexto:** Ao deletar o organograma, o frontend disparava um Auto-Save final usando a URL (que contém o slug) como identificador. Como o endpoint de UPDATE (`PUT /:nomeOrgao`) ainda não tinha a heurística do CREATE, ele aceitava o slug como nome e revertia a formatação no banco milissegundos antes da deleção.
**Solução:**

- Aplicada a mesma **Heurística de Qualidade (Smart Retrieval V2)** no handler `updateOrganogramaEstrutural`. O sistema agora detecta que o slug enviado na URL do Auto-Save é "pobre" comparado ao nome do banco e impede a reversão.
  **Status:** ✅ Concluído

### 10. Implementação de Gestão de Acesso

**Contexto:** Implementar controle completo de usuários e bloqueio de acesso (Ativar/Desativar), substituindo funcionalidade simples de alterar senha.
**Solução:**

- **Database:** Adicionada coluna `ativo` na tabela `usuarios`.
- **Backend (Auth):** Atualizado login para bloquear usuários com `ativo = 0`.
- **Backend (CRUD):** Atualizados endpoints de `usuarios` para listagem completa, edição de perfil e toggle de status.
- **Frontend:** Criada nova tela `GerenciarAcesso.tsx` com tabela de usuários, modal de edição e botões de ação (Ativar/Desativar). Menu de Configurações atualizado.
  **Status:** ✅ Concluído

### 11. Exclusão Permanente de Usuários

**Contexto:** Solicitação para permitir a exclusão completa de usuários do sistema, uma vez que a desativação apenas bloqueia o login.
**Solução:**

- **Frontend (UX/UI):** Implementado fluxo de "Exclusão Segura" na tela Gerenciar Acesso.
  - Adicionado botão de ação "Excluir" (Lixeira) na lista de usuários.
  - Implementado **Modal de Segurança** (Danger Mode) que exige confirmação explícita com avisos visuais de irreversibilidade.
- **Frontend (Core):** Refatorado componente `Button.tsx` para aceitar propriedades estendidas (`...rest`), permitindo injeção de estilos customizados.
- **Backend:** Utilizada rota `DELETE` existente.
  **Status:** ✅ Concluído

### Arquivos Modificados:

- `backend/services/sqliteStorageService.ts`
- `backend/controllers/organogramaController.ts`
- `backend/routes/organogramas.ts`
- `backend/routes/auth.ts`
- `backend/routes/usuarios.ts`
- `backend/scripts/migrate_users_active_v2.cjs`
- `frontend/src/pages/VisualizarOrganograma.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/common/ViewSelectionModal.tsx`
- `frontend/src/pages/GerenciarAcesso.tsx`
- `frontend/src/pages/Configuracoes.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/common/Button.tsx`
