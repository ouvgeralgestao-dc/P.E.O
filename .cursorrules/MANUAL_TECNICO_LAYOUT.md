# Manual Técnico de Layout e Posicionamento - Organograma P.E.O

> **IMPORTANTE PARA AGENTES DE IA:** Leia este documento ANTES de fazer qualquer alteração relacionada a visualização, posição de nós ou linhas do organograma.

Este documento detalha a arquitetura de renderização, cálculo de posição e persistência do Organograma. O sistema utiliza uma estratégia híbrida entre cálculo automático (First Load) e posições salvas (Database), com overrides manuais para correções visuais e "Resets".

---

## 1. Arquitetura Geral de Layout

O layout é gerado no Frontend (React) e, opcionalmente, salvo no Backend (SQLite) como coordenadas fixas (X, Y).

### Fluxo de Dados:

1.  **Frontend (`OrganogramaCanvas.tsx`) carrega dados da API.**
2.  **Verificação de Posições:**
    - Se `data.temPosicoes === true`: O backend retorna posições salvas. O Canvas renderiza os nós exatamente onde estão (Layout Manter Posições).
    - Se `data.temPosicoes === false`: O Canvas chama `applyAutoLayout` para calcular posições iniciais (Layout Automático).
3.  **Reset Layout:** O usuário clica em "Resetar Layout". O frontend ignora as posições salvas e recalcula tudo usando o motor `applyAutoLayout`, depois força um salvamento dessas novas posições.

---

## 2. Arquivos Críticos (Onde a Mágica Acontece)

### A. `frontend/src/utils/layoutHelpers.ts` (O Cérebro)

Este arquivo contém a matemática do posicionamento.

- **Função Principal:** `calculateHierarchicalLayout(setores)`
- **Lógica de "Assessorias":** Assessorias são movidas para as laterais (`x - offset` ou `x + offset`) para não ocupar espaço vertical abaixo do chefe.
- **Lógica de "Chefia":** Nós de Nível 1, 2 e 3 (Superintendência, Subsecretaria, Diretoria) seguem fluxo VERTICAL (Mountain Sort).
- **Lógica de "Nested":** Filhos de Assessorias formam uma cadeia lateral ou "L".
- **Constantes:** `LAYOUT_CONSTANTS` define espaçamentos (GAP).

### B. `frontend/src/components/canvas/OrganogramaCanvas.tsx` (O Renderizador)

Este componente transforma os dados matemáticos em Nós e Arestas do React Flow.

- **`useMemo` (Carga Inicial):** Constrói nós/arestas quando a página abre.
- **`handleResetLayout` (O Perigo):** Reconstrói nós/arestas manualmente quando o botão Reset é clicado.
  - **CRÍTICO:** A lógica de criação de `newNodes` e `newEdges` dentro de `handleResetLayout` **DEVE SER IDÊNTICA** à lógica do `useMemo`.
  - **Ponto de Falha Comum:** Esquecer de definir `edgeType = 'customEdge'` para conexões padrão aqui. Se usar `'smoothstep'`, a linha perde o barramento visual.

### C. `frontend/src/components/canvas/CustomEdge.tsx` (A Linha "Barramento")

Componente personalizado para desenhar as linhas de conexão.

- **Objetivo:** Criar um visual de "Barramento" (Fork) onde a linha sai do pai, desce um pouco (50px), divide horizontalmente, e depois desce para os filhos.
- **Lógica Hardcoded:** Se `sourcePosition === 'bottom'` e `targetPosition === 'top'`, ele **FORÇA** a dobra em `centerY = sourceY + 50`.
- **Erro Comum:** Adicionar condicionais de distância (`if dy > 80`). ISSO QUEBRA O LAYOUT em distâncias curtas. A regra deve ser INCONDICIONAL para conexões verticais.

### D. `frontend/src/components/canvas/SetorNode.tsx` (O Nó)

Define o visual e os pontos de conexão (Handles).

- **Handles:**
  - `Top` / `Bottom`: Conexões verticais padrão.
  - `Left` / `Right`: Conexões laterais para Assessorias.
- **Dimensões:** Controladas por `getDimension()` baseadas na hierarquia.

---

## 3. Guia de Solução de Problemas (Troubleshooting)

### Problema 1: "As linhas estão descendo tortas/padrão após clicar em Resetar"

- **Causa:** O `handleResetLayout` em `OrganogramaCanvas.tsx` está definindo `edgeType = 'smoothstep'` ou `'default'` em vez de `'customEdge'`.
- **Solução:** Vá no `handleResetLayout` e garanta que todas as conexões verticais usem `edgeType = 'customEdge'`. Verifique também se a string `'customEdge'` corresponde à chave definida em `const edgeTypes = { ... }`.

### Problema 2: "A linha sai do lado do nó em vez de baixo"

- **Causa:** O `SetorNode` não tem o Handle correto ou o `OrganogramaCanvas` está pedindo um `sourceHandle` errado.
- **Solução:** Verifique a lógica `isAssessoriaNode` vs `isChefiaForcada`. Chefe nunca deve ser assessoria.
  - Superintendência, Diretoria, Subsecretaria -> Sempre Vertical (`source: bottom`).

### Problema 3: "O nó da assessoria está trepado em cima do outro"

- **Causa:** Cálculo de Y em `layoutHelpers.ts`.
- **Solução:** Verifique `maxAssessoriaY` e os loops de incremento de Y nas assessorias laterais.

### Problema 4: "Alterações no código não refletem no Reset"

- **Causa:** HMR (Hot Module Replacement) do Vite falhou ou cache do navegador.
- **Solução:** Reiniciar `npm start` e dar Ctrl+F5 no navegador. O código de layout é sensível e às vezes trava na memória.

---

### E. Lógica de "Anti-Snapback" (Visual Persistence)

Para resolver o problema onde as linhas horizontais voltavam para a posição errada após o salvamento automático (_snapback_), implementamos uma lógica **baseada no destino**:

1.  **Pré-cálculo de `minChildY`:** Antes de renderizar as arestas, o canvas varre todos os nós para encontrar a posição `Y` mínima (o topo) do grupo de filhos de cada pai.
2.  **Cálculo Dinâmico:** A aresta não depende mais apenas do que foi calculado pelo `layoutHelpers.ts`. Ela verifica onde os filhos estão **realmente** posicionados no canvas.
3.  **Offset de Margem:** O `customForkY` é definido como `minChildY - 60px`. Isso garante que a barra horizontal do "fork" flutue sempre à mesma distância acima dos filhos, ignorando se o layout veio de um reset fresco ou de um carregamento do banco de dados.

---

## 4. Regras de Ouro para Manutenção

1.  **Paridade:** Sempre que alterar a lógica de criação de edges no `useMemo`, copie EXATAMENTE a mesma lógica para `handleResetLayout`.
2.  **CustomEdge:** Nunca coloque condicionais baseadas em distância (`dy`) para ativar o barramento visual. O visual deve ser determinístico baseada na topologia (Top-Bottom), não na geometria.
3.  **Anti-Snapback:** Se as linhas horizontais subirem ou descerem demais após um refresh, ajuste o offset no cálculo do `parentMinChildY` dentro do `OrganogramaCanvas.tsx` (atualmente fixado em -60px).
4.  **Nomenclatura:** Use sempre `customEdge` (o nome registrado no objeto `edgeTypes`). Não use `custom` ou `customLine`.
5.  **Backend "Blindado":** O Backend deve salvar o que o Frontend manda. Não tente recalcular posições no backend, pois ele não tem contexto de renderização (tamanho de fonte, CSS, etc).

---

## 5. Alinhamento Perfect-Pixel (Anti-Diagonal)

Para garantir que as linhas de assessoria sejam **100% horizontais** (sem inclinação de 1px), o sistema segue três leis físicas:

1.  **Handles Fixos em Pixels (SetorNode.tsx):** Os handles laterais (`left`, `right`) NUNCA devem usar porcentagem (`top: 50%`). Eles são fixados em **45px do topo**. Isso compensa variações de altura causadas por textos de tamanhos diferentes nas caixas.
2.  **Sincronização de Y (Auto-Cura):** No carregamento dos dados (`OrganogramaCanvas.tsx`), o sistema ignora o Y original de uma assessoria lateral se ele for diferente do Y do pai. Ele força `cargo.y = pai.y`.
    - **Por que?** Dados legados no banco podem conter um offset de 15px-20px que causa diagonais. A auto-cura limpa isso em tempo de execução.
3.  **Mapa de Posições Prévio:** O canvas deve construir um `positionMap` de todos os IDs antes de iterar sobre os nós. Isso garante que, se um filho aparecer no array antes do pai, ele ainda consiga encontrar o Y do pai para se alinhar corretamente.
4.  **Arestas 'straight':** Conexões de assessoria devem usar `type: 'straight'`. Como o Y inicial e final são idênticos, o React Flow renderiza uma linha perfeitamente horizontal.

---

**Gerado por:** Agente Antigravity (Google Deepmind)
**Data Atualização:** 31/01/2026 (Fix: Perfect-Pixel & Auto-Cura Y)
