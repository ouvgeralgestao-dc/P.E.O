# ERROR LOG: Histórico de Erros e Soluções

Este log documenta os principais problemas técnicos encontrados e as correções aplicadas no projeto Criador_Organograma.

## ERRO 01: Nós Invisíveis no Preview Funcional

- **Sintoma**: O preview no lado direito do formulário de criação funcional não exibia as "caixinhas" após o carregamento inicial de edição.
- **Causa**: Inconsistência de nomes (o backend retornava `nome_cargo` e o frontend esperava `nomeCargo`) e falha no timing do `fitView` do React Flow.
- **Solução**: Atualizado `LivePreviewCanvas.tsx` para aceitar múltiplos aliases de campos e adição de `instance.fitView` com delay reduzido no `onInit`.

## ERRO 02: Cores Revertendo para o Padrão

- **Sintoma**: Ao mudar a cor de um nó e fechar o editor, a cor voltava para o azul/cinza padrão segundos depois.
- **Causa**: Condição de corrida (race condition). O `initialNodes` (props) recebia os dados "velhos" do backend antes do auto-save ser processado, e como o editor estava fechado, a lógica de mesclagem sobrescrevia o estado local.
- **Solução**: Implementada lógica de mesclagem robusta no `OrganogramaCanvas.tsx` que prioriza o estilo local se o vindo das props for vazio ou se houver salvamento pendente.

## ERRO 03: Perda de Vínculos Parent-Child no Sandbox

- **Sintoma**: Ao salvar um organograma sandbox, as conexões entre os setores sumiam no próximo carregamento.
- **Causa**: O campo `parentId` não estava sendo mapeado corretamente para o formato esperado pelo banco (`parent_id`) ou estava sendo perdido durante a manipulação de arrays planos no frontend.
- **Solução**: Ajustada a função `saveSandboxPositions` e `getSandboxEstrutural` no backend para garantir a persistência de `parent_id`.

## ERRO 04: Erro de Referência "itemsComPos is not defined"

- **Sintoma**: Crash no React durante a renderização do preview.
- **Causa**: Variável renomeada durante refatoração mas ainda referenciada no retorno da função de mapeamento.
- **Solução**: Restaurada a variável correta e centralizada a lógica de cálculo de layout.

## ERRO 05: IDs como Números vs Strings

- **Sintoma**: Erros intermitentes em conexões de arestas (edges).
- **Causa**: O SQLite retorna IDs numéricos, mas o React Flow exige Strings para as chaves de conexão.
- **Solução**: Implementada conversão forçada `String(id)` em todos os pontos de entrada de dados no Canvas.

---

**Status**: Todos os erros acima foram RESOLVIDOS e VERIFICADOS.
