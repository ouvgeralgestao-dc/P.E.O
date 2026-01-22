# Log de Erros e Aprendizados - Planejador de Estrutura Organizacional

## 📋 Registro de Problemas Resolvidos

### 2026-01-10: Correções de Layout e IDs

**Problema:** Organograma Geral Estrutural perdeu a hierarquia (todos no mesmo nível) enquanto o Funcional estava correto.  
**Causa:** O `layoutService.js` verificava apenas o ID `prefeito-cargo` (Funcional) e ignorava o `prefeito` (Estrutural), caindo num layout genérico.  
**Solução:** Atualizada lógica para aceitar `OR` (`prefeito` || `prefeito-cargo`) em todas as verificações críticas.  
**Aprendizado:** Em sistemas que evoluem para suportar múltiplos contextos (estrutural/funcional), os identificadores base devem ser normalizados ou verificados explicitamente.

**Problema:** Linha de conexão do Gabinete diagonal/feia.  
**Tentativa:** Alterado para `straight`, depois ajustado Y manualmente.  
**Solução Final:** Revertido para padrão curvo (`customEdge`) por preferência estética do usuário.  
**Aprendizado:** Manter a consistência visual do ReactFlow costuma ser superior a hacks manuais pontuais.

---

### 2026-01-09: Correções de Persistência e Estabilidade

**Problema:** Cores de nós funcionais não persistiam após recarregar.  
**Solução:** Atualizado `getOrganogramaByName` no backend para aplicar estilos ao array `organogramasFuncoes`.  
**Aprendizado:** Verificar se novas coleções de dados estão sendo processadas pelos serviços de customização.

**Problema:** Perda de cargos com hierarquia 0-4 no organograma de funções.  
**Solução:** Corrigido `groupCargosByType` para incluir cargos não agrupados no retorno final.  
**Aprendizado:** Algoritmos de agrupamento devem sempre prever o "else" para evitar perda de dados.

**Problema:** Dashboard travando com `ReferenceError: cargosPorSetorNaoNivel1 is not defined`.  
**Solução:** Inicialização correta de variáveis de estatísticas antes do loop de agregação.  
**Aprendizado:** Refatorações de lógica de loops exigem verificação rigorosa de escopo de variáveis.

---

### 2026-01-09 (Tarde): Ajustes de CSS e Layout

**Problema:** Erro de sintaxe no CSS (`} esperado`) causando quebra de layout no Organograma Geral.  
**Solução:** Identificado bloco de código órfão (linhas duplicadas) e removido.  
**Aprendizado:** Ao remover blocos de CSS, verificar sempre se o fechamento de chaves (`}`) do bloco anterior ou posterior não foi afetado.

**Problema:** Botão "Resetar Layout" flutuante e Header interno cobrindo o Menu Principal ao rolar.  
**Solução:** Ajustado `position: sticky` do header interno com `top: 80px` (offset da altura do menu) e `z-index: 900` (menor que o menu).  
**Aprendizado:** Elementos `sticky` múltiplos devem ter offsets coordenados (`top`) e hierarquia de `z-index` clara.

**Problema:** Botão "Deletar" com texto ilegível (vermelho sobre fundo vermelho claro).  
**Solução:** Alterado para vermelho sólido e texto branco.  
**Aprendizado:** Contraste de cor deve ser verificado para estados normais e hover.

---

### 2026-01-08: Melhorias Visuais e UX

**Problema:** Paleta de cores roxas com baixo contraste  
**Solução:** Implementada paleta azul marinho (#1e3a8a → #3b82f6)  
**Aprendizado:** Sempre priorizar contraste e legibilidade em sistemas profissionais

**Problema:** Logo com fundo indesejado  
**Solução:** Gerada nova logo com fundo transparente  
**Aprendizado:** Especificar "transparent background" e "PNG with alpha channel" nos prompts

**Problema:** Logo pequena e sem destaque  
**Solução:** Aumentada para 64px (Header) e 120px (Dashboard) com drop-shadow  
**Aprendizado:** Tamanhos diferentes para contextos diferentes melhoram a hierarquia visual

**Problema:** Container limitado (1400px)  
**Solução:** Expandido para 1600px  
**Aprendizado:** Aproveitar melhor o espaço disponível em telas modernas

**Problema:** Todos os nós do mesmo tamanho  
**Solução:** Implementados tamanhos variáveis por hierarquia via CSS `data-hierarquia`  
**Aprendizado:** Hierarquia visual reforça hierarquia organizacional

---

### Sessões Anteriores

**Problema:** Função duplicada `groupCargosByType`  
**Solução:** Removida duplicata, mantida apenas a versão original  
**Aprendizado:** Sempre verificar se funcionalidade já existe antes de criar

**Problema:** Exportação sem qualidade profissional  
**Solução:** Implementado html2canvas com scale 3 (300 DPI)  
**Aprendizado:** Scale adequado é crucial para impressão de qualidade

**Problema:** Dashboard genérico  
**Solução:** Redesign completo com cards estatísticos, busca e filtros  
**Aprendizado:** Dashboard é a primeira impressão - investir em design

**Problema:** Organograma Geral sem estrutura fixa  
**Solução:** Implementada estrutura fixa (Prefeito + Gabinete + Subprefeituras)  
**Aprendizado:** Estruturas fixas facilitam compreensão e navegação

---

## 🔧 Boas Práticas Identificadas

### Frontend
- ✅ Usar `data-*` attributes para aplicar estilos CSS dinâmicos
- ✅ Componentes React devem ser memoizados quando possível
- ✅ Importação dinâmica para bibliotecas pesadas (html2canvas, jsPDF)
- ✅ Feedback visual durante operações assíncronas
- ✅ Validações no frontend E backend

### Backend
- ✅ Validações de regras de negócio centralizadas
- ✅ Armazenamento JSON estruturado por órgão
- ✅ Controllers separados de services
- ✅ Middleware de validação reutilizável

### Design
- ✅ Paleta de cores com alto contraste
- ✅ Tamanhos responsivos e hierárquicos
- ✅ Animações suaves (0.3s ease)
- ✅ Drop shadows para profundidade
- ✅ Glassmorphism para modernidade

---

## ⚠️ Armadilhas Evitadas

1. **Não usar cores de baixo contraste em backgrounds gradientes**
   - Sempre testar legibilidade com texto escuro E claro

2. **Não fazer todos os elementos do mesmo tamanho**
   - Hierarquia visual é essencial

3. **Não esquecer de adicionar estados de loading**
   - Usuário precisa de feedback visual

4. **Não duplicar código sem verificar existência**
   - Sempre buscar por funcionalidades similares primeiro

5. **Não usar imagens com fundo quando logo deve ser transparente**
   - Especificar claramente nos prompts de geração

---

## 📚 Lições Aprendidas

### UX
- Logo deve ter destaque e tamanho adequado ao contexto
- Contraste é mais importante que "beleza" das cores
- Espaçamento adequado melhora significativamente a legibilidade
- Feedback visual é essencial em todas as ações

### Performance
- Lazy loading de bibliotecas pesadas
- Memoização de componentes React
- Debounce em operações de busca
- Virtualização para listas grandes

### Arquitetura
- Separação clara de responsabilidades
- Validações duplicadas (frontend + backend)
- Armazenamento estruturado facilita manutenção
- Componentes reutilizáveis economizam tempo

---

## 🎯 Próximas Melhorias Sugeridas

1. **Testes Automatizados**
   - Unit tests para validações
   - Integration tests para API
   - E2E tests para fluxos críticos

2. **Acessibilidade**
   - ARIA labels
   - Navegação por teclado
   - Contraste WCAG AAA

3. **Performance**
   - Code splitting
   - Lazy loading de rotas
   - Service Worker para cache

4. **Funcionalidades**
   - Histórico de versões
   - Comparação de organogramas
   - Importação de dados
   - Colaboração em tempo real

---

---

### 2026-01-11: Erro de Navegação e UI em Modais

**Problema:** Botão "Cancelar" do modal de edição de senhas desapareceu, sendo substituído por um botão de retorno ao Hub.
**Causa:** Durante a refatoração masiva das páginas de configuração, o `TargetContent` da ferramenta de edição substituiu incorretamente o botão de ação do modal em vez do botão de cabeçalho da página.
**Solução:** Reversão cirúrgica do botão do modal para `handleCancelEdit` e atualização correta do componente `<BackButton>` no topo da página.
**Aprendizado:** Ao fazer edições em arquivos com múltiplos botões similares, usar `StartLine` e `EndLine` mais restritos para garantir que o contexto alvo seja o correto.

---

### 2026-01-14: Migração TypeScript e Banco de Dados

**Problema:** Erro 500 ao acessar API de organogramas (`SQLITE_ERROR: no such table`).
**Causa:** O arquivo `backend/src/db/index.ts` apontava para `database/organograma.sqlite` (arquivo vazio criado por acidente) em vez de `data/organograma.sqlite` (onde os dados residem).
**Solução:** Correção do caminho no arquivo de conexão.
**Aprendizado:** Em projetos legados/híbridos, verificar sempre a existência e tamanho do arquivo de banco de dados antes de assumir corrupção de código.

**Problema:** Aplicação rodando, mas Dashboard exibe cards "Vazios" e "Invalid Date".
**Causa:** Discrepância de contrato entre Frontend e Backend. O Frontend migrado esperava propriedades camelCase (`orgao`), mas o Backend SQLite cru retornava snake_case (`nome`).
**Solução:** Adicionado adapter no Controller para mapear `nome` -> `orgao` e `updated_at` -> `updatedAt`.
**Aprendizado:** Ao trabalhar com drivers SQL diretos (como `better-sqlite3`), o mapeamento objeto-relacional deve ser feito manualmente se não houver um ORM completo intermediando.

**Problema:** Gráficos de "Cargos" vazios enquanto outros funcionavam.
**Causa:** O serviço `reconstructTreeFuncional` escondia a propriedade `nomeCargo` dentro de um objeto `data`, mas os consumidores (dashboard service) esperavam a propriedade na raiz.
**Solução:** Atribuição explícita `node.nomeCargo = nome_cargo` antes da limpeza de propriedades temporárias.

---

### 2026-01-17: Integridade e Persistência Avançada

**Problema:** Script de verificação falhava com `ReferenceError: __dirname is not defined`
**Causa:** Scripts rodando em ambiente Node.js configurado como ES Module (`"type": "module"` no package.json) não possuem a global `__dirname`.
**Solução:** Substituição pela construção manual usando `import.meta.url`:
```javascript
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```
**Aprendizado:** Em projetos modernos com ESM, evitar sempre o uso de globais puras do CommonJS (`require`, `__dirname`, `__filename`).

---

### 2026-01-18: Travamento do Visualizador (NaN Layout)

**Problema:** Ao adicionar filhos em setores de assessoria e salvar, a tela de visualização travava ou exibia erros de renderização (`<rect> attribute x: Expected length, "NaN"`).
**Causa:** Novos nós criados via formulário de edição chegavam ao frontend sem posição definida. O validador de layout anterior aceitava `NaN` como número válido (`typeof NaN === 'number'`), impedindo o disparo do auto-layout corretivo.
**Solução:** Reforço na validação em `OrganogramaCanvas.tsx`:
```typescript
const positionsWithY = setores.filter(s =>
    s.position &&
    typeof s.position.x === 'number' && !isNaN(s.position.x) &&
    typeof s.position.y === 'number' && !isNaN(s.position.y)
);
```
**Aprendizado:** Em JavaScript/TypeScript, sempre validar `!isNaN()` ao checar integridade numérica, pois `typeof NaN` é `'number'`.

**Problema:** "Reset Layout" no organograma funcional salvava o visual correto, mas ao recarregar a página o layout quebrava (ficava linear).
**Causa:** A função `handleResetLayout` construía um payload de salvamento que **não incluía** a propriedade `parentId`. O backend recebia os dados e, por serem novos IDs, salvava-os como nós raiz (sem pai), perdendo a árvore.
**Solução:** Incluído explicitamente `parentId: node.data.parentId` no objeto de reset enviado para `onSavePositions`.
**Aprendizado:** Em sistemas que persistem coordenadas visuais e estrutura lógica simultaneamente, *nunca* confiar que o backend inferirá a estrutura se ela não for enviada explicitamente no payload de update.

**Problema:** Linhas de conexão para assessorias ficavam levemente diagonais na carga inicial.
**Causa:** O ponto de conexão (Handle) estava fixo em 55px (centro de 110px), mas os nós de assessoria tinham apenas 80px de altura.
**Solução:** Implementado cálculo dinâmico de `handleY` na inicialização, idêntico ao do `layoutService`.
**Aprendizado:** Valores hardcoded (números mágicos) em renderização visual quase sempre causam dívida técnica visual.

---

### 2026-01-18: Style Editor e Hooks do React

**Problema:** `ReferenceError: Cannot access 'setNodes' before initialization` ao carregar o organograma.
**Causa:** Hooks do ReactFlow (`useNodesState`) estavam sendo chamados após a declaração de callbacks (`onStyleChange`) que os utilizavam em seu escopo de dependência, ou após efeitos que tentavam dispará-los.
**Solução:** Reordenação rigorosa dos hooks no topo de `OrganogramaCanvasInner`, garantindo que estados (`nodes`, `setNodes`) sejam inicializados antes de qualquer lógica que os referencie.
**Aprendizado:** A ordem de declaração de hooks em componentes React complexos é semântica e funcional; estados e setters devem vir antes de callbacks e efeitos.

**Problema:** O Style Editor fechava imediatamente ou não permitia interagir com o seletor de cores.
**Causa:** Uso de `onClickCapture` no `SetorNode.tsx` interceptava o evento de clique antes que o componente interno do seletor de cores pudesse processá-lo, disparando a lógica de fechamento do editor no pai. Além disso, o `stopPropagation` no nó impedia o ReactFlow de detectar o clique para seleção.
**Solução:** Substituição por `onClick` simples em um botão dedicado (🎨) com `e.stopPropagation()`, mantendo o corpo do nó livre para as interações nativas do ReactFlow.
**Aprendizado:** Eventos capturados (`Capture`) são agressivos e devem ser evitados em componentes aninhados interativos. Interações nativas de bibliotecas (como seleção no ReactFlow) exigem que o bubble de eventos não seja interrompido no contêiner principal.

---

### 2026-01-18: Refinamentos de Dashboard e Gráficos

**Problema:** Gráfico de "Quantitativo de Cargos" exibia "Sem dados disponíveis" mesmo com dados presentes.
**Causa:** O componente `ChartCard` possuía uma guarda que retornava o estado vazio se `data.length === 0`, ignorando se havia `children` (tabelas customizadas) sendo passados.
**Solução:** Atualizada a lógica do `ChartCard` para permitir a renderização se houver `children`, independentemente do estado do array `data`.
**Aprendizado:** Componentes de layout (Wrappers) devem ser flexíveis o suficiente para aceitar tanto dados estruturados quanto conteúdo customizado via children.

**Problema:** Dados de cargos e símbolos no Dashboard apareciam zerados ou incompletos.
**Causa:** A lógica de agregação no `useMemo` do Dashboard não tratava corretamente a propriedade `quantidade` (que pode vir como string ou estar ausente em alguns nós legados).
**Solução:** Adicionada normalização rigorosa: `const qtd = parseInt(cargo.quantidade || cargo.qtd || '1') || 1;` e correção do escopo da variável de contagem durante o refactoring.
**Aprendizado:** Ao agregar dados de fontes heterogêneas (SQLite + JSON legatário), a normalização de tipos e valores padrão é obrigatória.

**Problema:** Erros de lint `any` e `property does not exist` em arquivos migrados para TSX.
**Causa:** Migração parcial para TypeScript sem definição de interfaces para os dados vindos da API.
**Solução:** Adicionadas definições de tipos básicas e casts explícitos para silenciar erros de compilação e melhorar a autocomplementação.
**Aprendizado:** A migração de JS para TS em componentes complexos deve ser acompanhada da definição de contratos (Interfaces) claros para os dados globais.

---

### 2026-01-22: Lógica de Filtros e Cross-Filtering

**Problema:** Gráfico "Setores por Órgão" exibia setores que não continham o símbolo filtrado (ex: filtrando "DAS-5", apareciam setores sem DAS-5).
**Causa:** A lógica de agregação `orgaoStats` incluía todos os setores que passavam no filtro de *Nome de Setor*, ignorando o filtro de *Símbolo* que deveria agir como um refinamento (AND logic).
**Solução:** Adicionada verificação `setorTemSimbolo` dentro do loop de coleta de setores. O setor só é adicionado ao Set se contiver pelo menos um cargo com o símbolo selecionado.
**Aprendizado:** Em dashboards com múltiplos filtros correlacionados, a lógica de "Exibição" deve testar a intersecção de **todos** os filtros ativos, não apenas o filtro correspondente à entidade exibida.

**Problema:** Filtros de Setor (Estrutural) não afetavam contagem de Cargos (Funcional).
**Causa:** As estruturas de dados são independentes. Filtrar por "Gabinete" removia o organograma funcional visualmente, mas não tinha como saber quais cargos pertenciam ao Gabinete, pois a ligação não existia.
**Solução:** Implementado campo `setor_ref` no banco de dados e lógica de "Cross-Filtering" no Frontend, onde o filtro de setor verifica tanto a estrutura (nomeSetor) quanto a função (setor_ref).
**Aprendizado:** Para dashboards unificados, "Foreign Keys" lógicas (referências) são essenciais para permitir filtragem cruzada entre dimensões diferentes (Estrutura vs Função).

---

### 📅 22/01/2026 - Erro de CLI PowerShell (Git Init)
- **Erro:** `CategoryInfo : ParserError` ao tentar executar comandos encadeados `git init && git add .` no PowerShell.
- **Causa:** Sintaxe de encadeamento `&&` não suportada nativamente em algumas versões ou configurações de terminal PowerShell v1/v2 ou restrições de parser.
- **Solução:** Execução sequencial dos comandos (`git init` <enter> `git add .` <enter>).
- **Status:** ✅ Resolvido.
