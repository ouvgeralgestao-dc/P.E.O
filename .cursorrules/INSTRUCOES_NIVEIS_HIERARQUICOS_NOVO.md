# 📊 INSTRUÇÕES MESTRAS: NÍVEIS HIERÁRQUICOS (PMDC)

> **Este documento é a FONTE DA VERDADE para qualquer lógica envolvendo hierarquia no Gerador de Organogramas.**

## 1. Definição Conceitual

O sistema utiliza uma escala híbrida numérica/funcional para definir a importância, cor e comportamento de cada nó no organograma. A partir de agora, essas regras são seguidas sem aparecer no front para seleção, pois a lógica de atribuição será automática. Quando criamos a primeira caixinha, automaticamente ela vira nível 1. Depois do nível 1 (primeira) ser criada, o que for criado sem ser Assessoria, vai se colocando abaixo seguindo a ordem sequencial de níveis. Ex: primeira caixa = nivel 1; segunda caixa (se não for assesoria) = níve 2; terceira caixa (se não for assesoria) = níve 3; quarta caixa (se não for assesoria) = níve 4... e assim sucessivamente até nível 10. Colocamos um quadradinho para marcar se é Assessoria ou não o nível. Se for Assessoria, o usuário marca o quadradinho como assessoria (esse quadradinho so aparece se a primeira caixa (nivel 1) já tiver sido adicionada) e então ela segue a lógica de se acomodar ao lado da caixa de nível 1, se for a primeira assessoria de um lado, se for a segunda de outro, seguindo a nossa lógica que já definimos para a posição X,Y de assessoria.

| Nível (Valor)   | Nome Lógico                          | Cor de Fundo              | Borda       | Uso Principal                                                                   |
| :--------------- | :------------------------------------ | :------------------------ | :---------- | :------------------------------------------------------------------------------ |
| **0**      | **Assessoria**                  | `#C0C0C0` (Prata)       | `#9E9E9E` | Chefias de Gabinete, Assessorias Técnicas, Consultorias. Conecta lateralmente. |
| **0.5**    | **Subprefeito(a)**              | `#E0E0E0` (Cinza Claro) | `#9E9E9E` | Somente Subprefeituras e Subprefeito                                            |
| **1**      | **Secretário(a) / Presidente** | `#4ECDC4` (Verde Água) | `#3DBDB4` | TODAS AS OPÇÕES DE SETORES E CARGOS                                           |
| **2**      | **Nível 2**                    | `#45B7D1` (Azul Cyan)   | `#2C8E9E` | TODAS AS OPÇÕES DE SETORES E CARGOS                                           |
| **3**      | **Nível 3**                    | `#96CEB4` (Verde Menta) | `#76A08A` | TODAS AS OPÇÕES DE SETORES E CARGOS                                           |
| **4 - 10** | **Níveis Operacionais**        | `#96CEB4` (Verde Menta) | `#76A08A` | TODAS AS OPÇÕES DE SETORES E CARGOS                                           |

## 2. Regras de Layout e Comportamento (Canvas)

O Engine de Layout (`OrganogramaCanvas.tsx` + `layoutHelpers.ts`) decide a posição (X,Y) e o tipo de conexão baseado nestas regras:

### 2.1 Chefia Vertical (Espinha Dorsal)

* **Quem são:** Níveis 0.5 (Subprefeitura), 1, 2, 3 e qualquer nó cujo nome contenha "Diretoria", "Superintendência", "Subsecretaria".
* **Comportamento:**
  * Posicionam-se **ABAIXO** do pai.
  * Recebem conexão pelo **TOPO** (`Target: Top`).
  * Enviam conexão por **BAIXO** (`Source: Bottom`).
  * Geralmente alinhados ao centro do grupo de filhos.
  * A Unica regra para estabelecimento hierarquico é o estabelecimento de Pais" no formulário

### 2.2 Assessoria Lateral (Staff)

* **Quem são:** Nível 0 (Assessoria) E que NÃO sejam chefias forçadas. Aqueles setores que serão adicionados com a caixinha de Assessoria marcada.
* **Comportamento:**
  * Posicionam-se **AO LADO** do pai (Esquerda ou Direita).
  * Recebem conexão pela **LATERAL** (`Target: Left` ou `Right`).
  * **Exceção Crítica:** Se o pai for Nível >= 3 (ex: Assessor de uma Diretoria), a assessoria se comporta como Vertical para economizar largura.

### 2.3 Subprefeituras (Nível 0.5)

* Embora numericamente < 1, comportam-se visualmente como **Chefias Verticais**.
* Seus filhos (Coordenadorias) descem verticalmente.

---

## 3. Regras de Negócio e Validação

Arquivo de Referência: `frontend/src/constants/hierarchyLevels.ts`

### 3.1 Tipos de Setor Permitidos (`SETOR_TYPES`)

O sistema impede que o usuário selecione tipos incompatíveis com o nível:

* **Nível 0:** Assessoria, Assessor(a), Gabinete, Consultoria.
* **Nível 0.5:** Apenas "Subprefeitura".
* **Nível 1:** TODOS OS SETORES
* **Nível 2:** TODOS OS SETORES
* **Nível 3:** TODOS OS SETORES
* **Nível 4+:** TODOS OS SETORES

### 3.2 Símbolos (DAS/FG)

* Atualmente, todos os níveis permitem quantidade ilimitada (`Infinity`) de símbolos, mas a estrutura `SIMBOLOS_POR_NIVEL` existe para futuras restrições.

---

## 4. Persistência de Dados (Banco de Dados)

### 4.1 Tabelas Envolvidas

* `setores` (Estrutural)
* `cargos_funcionais` (Funcional)
* `sandbox_setores` e `sandbox_cargos_funcionais` (Rascunhos)

### 4.2 Campos Relevantes

* `hierarquia` (TEXT ou REAL): Armazena o valor (ex: "1", "0.5").
  * *Nota:* O Backend aceita TEXT para suportar legados como "1.1", mas o Frontend converte para `parseFloat` para cálculos.
* `is_assessoria` (BOOLEAN): Flag explícita.
  * **Importante:** O Layout considera `isAssessoriaNode = is_assessoria || hierarquia == 0`.

---

## 5. Protocolos de Correção Visual (Auto-Cura)

Para garantir a estética perfeita, o sistema aplica certas correções automáticas em tempo de execução:

1. **Anti-Diagonal (Perfect Pixel):**

   * Se uma Assessoria Lateral tiver um `Y` diferente do pai (o que causaria uma linha torta), o sistema força `Y_filho = Y_pai` ao renderizar.
   * Isso corrige dados "sujos" de arrastar-e-soltar imprecisos.
2. **Anti-Snapback (ForkY):**

   * As linhas horizontais que agrupam filhos ("Barramentos") não usam posições hardcoded.
   * Elas calculam a altura baseada na posição REAL dos filhos menos 60px. Isso evita que a linha "pule" quando o layout é recarregado.

---

## 6. Checklist para Desenvolvedores

**Vai alterar algo nos níveis? Verifique:**

1. [ ] **Constantes:** Atualizou `frontend/src/constants/hierarchyLevels.ts`?
2. [ ] **Cores:** Definiu a nova cor em `HIERARCHY_COLORS`?
3. [ ] **Bordas:** Definiu a cor da borda em `HIERARCHY_BORDERS`?
4. [ ] **Tipos:** Adicionou os tipos permitidos em `SETOR_TYPES`?
5. [ ] **Renderização:** O `OrganogramaCanvas.tsx` sabe lidar com esse novo nível? (Cai no `default` ou precisa de regra especial?)
6. [ ] **Forms:** O `SetorForm.jsx` (ou Wizard) lista o novo nível no dropdown?

---

*Documento gerado em referência à solicitação de análise profunda dos níveis hierárquicos.*
