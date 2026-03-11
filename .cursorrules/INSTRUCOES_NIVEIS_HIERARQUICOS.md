# 📊 INSTRUÇÕES MESTRAS: NÍVEIS HIERÁRQUICOS (PMDC)

> **Este documento é a FONTE DA VERDADE para qualquer lógica envolvendo hierarquia no Gerador de Organogramas.**

## 1. Definição Conceitual

O sistema utiliza uma escala híbrida numérica/funcional para definir a importância, cor e comportamento de cada nó no organograma.

| Nível (Valor)   | Nome Lógico                          | Cor de Fundo              | Borda       | Uso Principal                                                                   |
| :--------------- | :------------------------------------ | :------------------------ | :---------- | :------------------------------------------------------------------------------ |
| **0**      | **Assessoria**                  | `#C0C0C0` (Prata)       | `#9E9E9E` | Chefias de Gabinete, Assessorias Técnicas, Consultorias. Conecta lateralmente. |
| **0.5**    | **Subprefeito(a)**              | `#E0E0E0` (Cinza Claro) | `#9E9E9E` | Exclusivo para entidades do tipo "Subprefeitura".                               |
| **1**      | **Secretário(a) / Presidente** | `#4ECDC4` (Verde Água) | `#3DBDB4` | Nível máximo de uma pasta (Secretaria, Autarquia).                            |
| **2**      | **Nível 2**                    | `#45B7D1` (Azul Cyan)   | `#2C8E9E` | Superintendências, Subprocuradorias.                                           |
| **3**      | **Nível 3**                    | `#96CEB4` (Verde Menta) | `#76A08A` | Subsecretarias, Diretorias Executivas.                                          |
| **4 - 10** | **Níveis Operacionais**        | `#96CEB4` (Verde Menta) | `#76A08A` | Diretorias, Gerências, Coordenações, Divisões, Seções.                    |

---

## 2. Regras de Layout e Comportamento (Canvas)

O Engine de Layout (`OrganogramaCanvas.tsx` + `layoutHelpers.ts`) decide a posição (X,Y) e o tipo de conexão baseado nestas regras:

### 2.1 Chefia Vertical (Espinha Dorsal)

* **Quem são:** Níveis 0.5 (Subprefeitura), 1, 2, 3 e qualquer nó cujo nome contenha "Diretoria", "Superintendência", "Subsecretaria".
* **Comportamento:**
  * Posicionam-se **ABAIXO** do pai.
  * Recebem conexão pelo **TOPO** (`Target: Top`).
  * Enviam conexão por **BAIXO** (`Source: Bottom`).
  * Geralmente alinhados ao centro do grupo de filhos.

### 2.2 Assessoria Lateral (Staff)

* **Quem são:** Nível 0 (Assessoria) E que NÃO sejam chefias forçadas.
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
* **Nível 1:** Secretaria, Presidência, Procuradoria.
* **Nível 2:** Superintendência, Subprocuradoria.
* **Nível 3:** Subsecretaria.
* **Nível 4+:** Diretoria, Gerência, Coordenação, Divisão, Seção, Núcleo, etc.

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
