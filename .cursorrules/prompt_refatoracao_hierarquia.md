# 🎯 PROMPT DE REFATORAÇÃO: SISTEMA DE HIERARQUIA AUTOMÁTICA (PMDC)

## 📋 CONTEXTO

Você é um engenheiro de software sênior responsável por refatorar o sistema de níveis hierárquicos do Gerador de Organogramas da Prefeitura Municipal. Esta é uma alteração **CRÍTICA** que afeta múltiplos componentes do sistema e requer máxima atenção para não quebrar funcionalidades existentes.

### Estado Atual vs. Estado Desejado

**ANTES (Sistema Manual):**
- Usuário seleciona manualmente o nível hierárquico (dropdown 0-10)
- Cada nível tem tipos de setor restritos (ex: Nível 2 só aceita "Superintendência")
- Validação rígida impede flexibilidade

**DEPOIS (Sistema Automático):**
- Sistema atribui níveis **automaticamente** baseado na profundidade hierárquica
- Primeira caixa criada = sempre Nível 1
- Caixas subsequentes (não-assessorias) = incremento automático (2, 3, 4... até 10)
- Usuário apenas marca checkbox "É Assessoria?" (nível 0)
- Níveis 1-10 aceitam **TODOS** os tipos de setor (sem restrição)

---

## 🔧 ALTERAÇÕES NECESSÁRIAS

### 1. FRONTEND - Arquivo de Constantes (`frontend/src/constants/hierarchyLevels.ts`)

#### 1.1 Atualizar `SETOR_TYPES`

**SUBSTITUIR** o objeto `SETOR_TYPES` por:

```typescript
export const SETOR_TYPES: Record<string, string[]> = {
  '0': ['Assessoria', 'Assessor(a)', 'Gabinete', 'Consultoria'],
  '0.5': ['Subprefeitura'],
  '1': ALL_SETOR_TYPES,
  '2': ALL_SETOR_TYPES,
  '3': ALL_SETOR_TYPES,
  '4': ALL_SETOR_TYPES,
  '5': ALL_SETOR_TYPES,
  '6': ALL_SETOR_TYPES,
  '7': ALL_SETOR_TYPES,
  '8': ALL_SETOR_TYPES,
  '9': ALL_SETOR_TYPES,
  '10': ALL_SETOR_TYPES,
};
```

**ONDE:**
- `ALL_SETOR_TYPES` deve ser um array contendo TODAS as opções de tipos de setor disponíveis no sistema (Secretaria, Diretoria, Gerência, Coordenação, Divisão, Seção, Núcleo, Presidência, Procuradoria, Superintendência, Subprocuradoria, Subsecretaria, etc.)

#### 1.2 Manter Cores e Bordas

```typescript
// NÃO ALTERAR - Estas permanecem iguais
export const HIERARCHY_COLORS = {
  '0': '#C0C0C0',    // Assessoria - Prata
  '0.5': '#E0E0E0',  // Subprefeito - Cinza Claro
  '1': '#4ECDC4',    // Secretário - Verde Água
  '2': '#45B7D1',    // Nível 2 - Azul Cyan
  '3': '#96CEB4',    // Nível 3 - Verde Menta
  '4': '#96CEB4',    // Níveis 4-10 - Verde Menta
  // ... (continuar até 10)
};

export const HIERARCHY_BORDERS = {
  '0': '#9E9E9E',
  '0.5': '#9E9E9E',
  '1': '#3DBDB4',
  '2': '#2C8E9E',
  '3': '#76A08A',
  '4': '#76A08A',
  // ... (continuar até 10)
};
```

---

### 2. FRONTEND - Formulários (`SetorForm.jsx` / Wizard)

#### 2.1 Remover Dropdown de Nível Hierárquico

**ANTES:**
```jsx
<select name="hierarquia" value={formData.hierarquia}>
  <option value="0">Assessoria</option>
  <option value="1">Secretário</option>
  <option value="2">Superintendência</option>
  {/* ... */}
</select>
```

**DEPOIS:**
```jsx
{/* REMOVER COMPLETAMENTE O DROPDOWN */}
{/* O campo 'hierarquia' será calculado automaticamente no backend */}
```

#### 2.2 Adicionar Checkbox de Assessoria

**ADICIONAR** este componente no formulário:

```jsx
{primeiroSetorJaCriado && (
  <div className="form-field">
    <label>
      <input
        type="checkbox"
        name="is_assessoria"
        checked={formData.is_assessoria || false}
        onChange={(e) => setFormData({
          ...formData,
          is_assessoria: e.target.checked
        })}
      />
      É Assessoria?
    </label>
    <small className="help-text">
      Marque se este setor é uma assessoria lateral (não segue hierarquia vertical)
    </small>
  </div>
)}
```

**LÓGICA DE EXIBIÇÃO:**
- Checkbox só aparece se `primeiroSetorJaCriado === true`
- `primeiroSetorJaCriado` deve ser verificado consultando se existe algum setor com `hierarquia = 1` no banco

#### 2.3 Atualizar Lógica de Submissão

```javascript
const handleSubmit = async (formData) => {
  // REMOVER: Não enviar 'hierarquia' manualmente
  // ADICIONAR: Enviar flag 'is_assessoria'
  
  const payload = {
    ...formData,
    is_assessoria: formData.is_assessoria || false,
    // hierarquia será calculado no backend
  };
  
  await api.post('/setores', payload);
};
```

---

### 3. BACKEND - Endpoints de Criação/Edição

#### 3.1 Criar Função de Cálculo Automático de Hierarquia

```python
def calcular_hierarquia_automatica(parent_id, is_assessoria, db_session):
    """
    Calcula o nível hierárquico automaticamente.
    
    Regras:
    - Se is_assessoria = True → retorna 0
    - Se parent_id is None → retorna 1 (primeiro setor)
    - Se parent_id existe → retorna (hierarquia_do_pai + 1), limitado a 10
    """
    
    if is_assessoria:
        return 0
    
    if parent_id is None:
        return 1
    
    # Buscar hierarquia do pai
    parent = db_session.query(Setor).filter_by(id=parent_id).first()
    if not parent:
        return 1
    
    nova_hierarquia = float(parent.hierarquia) + 1
    return min(nova_hierarquia, 10)  # Máximo é nível 10
```

#### 3.2 Atualizar Endpoint de Criação

```python
@router.post('/setores')
def criar_setor(setor_data: SetorCreate, db: Session):
    # ADICIONAR antes de salvar no banco:
    hierarquia_calculada = calcular_hierarquia_automatica(
        parent_id=setor_data.parent_id,
        is_assessoria=setor_data.is_assessoria,
        db_session=db
    )
    
    novo_setor = Setor(
        **setor_data.dict(exclude={'hierarquia'}),  # IGNORAR hierarquia enviada pelo frontend
        hierarquia=hierarquia_calculada,  # USAR o valor calculado
        is_assessoria=setor_data.is_assessoria or False
    )
    
    db.add(novo_setor)
    db.commit()
    return novo_setor
```

#### 3.3 Atualizar Endpoint de Edição

```python
@router.put('/setores/{setor_id}')
def editar_setor(setor_id: int, setor_data: SetorUpdate, db: Session):
    setor = db.query(Setor).filter_by(id=setor_id).first()
    
    # Se mudou o parent_id ou is_assessoria, recalcular hierarquia
    recalcular = (
        setor_data.parent_id != setor.parent_id or
        setor_data.is_assessoria != setor.is_assessoria
    )
    
    if recalcular:
        setor.hierarquia = calcular_hierarquia_automatica(
            parent_id=setor_data.parent_id,
            is_assessoria=setor_data.is_assessoria,
            db_session=db
        )
    
    # Atualizar demais campos...
    setor.is_assessoria = setor_data.is_assessoria
    db.commit()
    return setor
```

---

### 4. BACKEND - Validação de Tipos de Setor

#### 4.1 Atualizar Função de Validação

```python
def validar_tipo_setor(hierarquia: float, tipo_setor: str):
    """
    Valida se o tipo de setor é permitido para o nível hierárquico.
    
    Nova regra: Níveis 1-10 aceitam QUALQUER tipo.
    """
    hierarquia_str = str(int(hierarquia)) if hierarquia >= 1 else str(hierarquia)
    
    # Níveis 1-10: aceitar tudo
    if hierarquia >= 1:
        return True
    
    # Nível 0 (Assessoria): apenas tipos específicos
    if hierarquia == 0:
        tipos_permitidos = ['Assessoria', 'Assessor(a)', 'Gabinete', 'Consultoria']
        return tipo_setor in tipos_permitidos
    
    # Nível 0.5 (Subprefeitura): apenas Subprefeitura
    if hierarquia == 0.5:
        return tipo_setor == 'Subprefeitura'
    
    return False
```

---

### 5. LAYOUT ENGINE - Componentes Canvas

#### 5.1 Verificar Lógica de Posicionamento (`OrganogramaCanvas.tsx`)

**GARANTIR** que a lógica de detecção de assessoria continue funcionando:

```typescript
// NÃO ALTERAR - Esta lógica deve continuar funcionando
const isAssessoriaNode = (node) => {
  return node.is_assessoria === true || parseFloat(node.hierarquia) === 0;
};

// A lógica de posicionamento lateral (X,Y) para assessorias já existe
// Apenas verificar que usa corretamente is_assessoria || hierarquia === 0
```

#### 5.2 Verificar Cálculo de Posição de Assessorias

```typescript
// VERIFICAR que esta lógica de alternância esquerda/direita está funcionando:
const posicionarAssessorias = (parentNode, assessorias) => {
  let leftCount = 0;
  let rightCount = 0;
  
  assessorias.forEach((assessoria, index) => {
    if (index % 2 === 0) {
      // Primeira assessoria vai para a esquerda
      assessoria.position.x = parentNode.position.x - 300;
      leftCount++;
    } else {
      // Segunda assessoria vai para a direita
      assessoria.position.x = parentNode.position.x + 300;
      rightCount++;
    }
    
    // Y sempre alinhado com o pai (Anti-Diagonal)
    assessoria.position.y = parentNode.position.y;
  });
};
```

---

### 6. TESTES E VALIDAÇÕES

#### 6.1 Cenários de Teste Obrigatórios

**Teste 1: Criação da Primeira Caixa**
```
Input: Criar setor sem parent_id, is_assessoria=false
Expected: hierarquia = 1
```

**Teste 2: Criação de Filho Vertical**
```
Input: Criar setor com parent_id=X (hierarquia 1), is_assessoria=false
Expected: hierarquia = 2
```

**Teste 3: Criação de Assessoria**
```
Input: Criar setor com parent_id=X, is_assessoria=true
Expected: hierarquia = 0, posicionamento lateral
```

**Teste 4: Limite de Níveis**
```
Input: Criar setor com pai de hierarquia 10
Expected: hierarquia = 10 (não passa de 10)
```

**Teste 5: Tipos de Setor**
```
Input: Criar setor nível 2 com tipo "Secretaria"
Expected: Aceitar (antes rejeitava)
```

**Teste 6: Checkbox de Assessoria**
```
Input: Criar primeiro setor
Expected: Checkbox NÃO aparece
Input: Criar segundo setor
Expected: Checkbox APARECE
```

---

### 7. MIGRATIONS E DADOS EXISTENTES

#### 7.1 Script de Migração (SQL)

```sql
-- NÃO É NECESSÁRIO ALTERAR ESTRUTURA DA TABELA
-- Campos 'hierarquia' e 'is_assessoria' já existem

-- OPCIONAL: Recalcular hierarquias de setores existentes (SE NECESSÁRIO)
-- CUIDADO: Só executar se quiser forçar recálculo de todos os níveis

UPDATE setores
SET hierarquia = (
    CASE
        WHEN is_assessoria = TRUE THEN 0
        WHEN parent_id IS NULL THEN 1
        ELSE (
            SELECT hierarquia + 1
            FROM setores AS parent
            WHERE parent.id = setores.parent_id
        )
    END
)
WHERE hierarquia IS NULL OR hierarquia = '';

-- Limitar hierarquia máxima a 10
UPDATE setores
SET hierarquia = 10
WHERE CAST(hierarquia AS REAL) > 10;
```

---

### 8. CHECKLIST DE SEGURANÇA

Antes de deployar, **CONFIRME** que:

- [ ] ✅ Dropdown de nível foi REMOVIDO do formulário
- [ ] ✅ Checkbox "É Assessoria?" foi ADICIONADO
- [ ] ✅ Checkbox só aparece após primeiro setor criado
- [ ] ✅ Backend calcula `hierarquia` automaticamente
- [ ] ✅ Backend IGNORA o campo `hierarquia` se vier do frontend
- [ ] ✅ Função `calcular_hierarquia_automatica()` está implementada
- [ ] ✅ `SETOR_TYPES` foi atualizado (níveis 1-10 aceitam tudo)
- [ ] ✅ Validação de tipos foi ajustada
- [ ] ✅ Layout de assessorias continua funcionando (lateral)
- [ ] ✅ Cores e bordas permanecem iguais
- [ ] ✅ Protocolos Anti-Diagonal e Anti-Snapback intactos
- [ ] ✅ Todos os 6 cenários de teste foram executados
- [ ] ✅ Dados existentes foram migrados (se necessário)
- [ ] ✅ Tabelas `sandbox_*` também foram atualizadas

---

### 9. ARQUIVOS A SEREM MODIFICADOS (RESUMO)

| Arquivo | Tipo de Mudança | Prioridade |
|---------|----------------|-----------|
| `frontend/src/constants/hierarchyLevels.ts` | Atualizar `SETOR_TYPES` | 🔴 CRÍTICA |
| `frontend/src/components/SetorForm.jsx` | Remover dropdown, adicionar checkbox | 🔴 CRÍTICA |
| `backend/routes/setores.py` | Adicionar cálculo automático | 🔴 CRÍTICA |
| `backend/utils/hierarchy.py` | Criar função `calcular_hierarquia_automatica()` | 🔴 CRÍTICA |
| `backend/validators/setor.py` | Atualizar validação de tipos | 🟠 ALTA |
| `frontend/src/components/OrganogramaCanvas.tsx` | Verificar lógica de assessorias | 🟡 MÉDIA |
| `frontend/src/utils/layoutHelpers.ts` | Verificar posicionamento lateral | 🟡 MÉDIA |

---

### 10. TRATAMENTO DE ERROS E EDGE CASES

#### Edge Case 1: Usuário tenta criar setor órfão (sem pai) depois do primeiro
```javascript
// Frontend: Forçar seleção de pai se já existe nível 1
if (existeNivel1 && !formData.parent_id && !formData.is_assessoria) {
  alert('Selecione um setor pai ou marque como Assessoria');
  return;
}
```

#### Edge Case 2: Mudar setor de assessoria para vertical (ou vice-versa)
```python
# Backend: Recalcular hierarquia ao mudar is_assessoria
if setor_existente.is_assessoria != novo_is_assessoria:
    setor_existente.hierarquia = calcular_hierarquia_automatica(...)
    # IMPORTANTE: Recalcular também todos os filhos!
    recalcular_hierarquia_filhos(setor_existente.id, db)
```

#### Edge Case 3: Mudar parent_id de um setor com filhos
```python
# Backend: Ao mudar pai, propagar mudança para toda a subárvore
def recalcular_hierarquia_filhos(setor_id, db):
    filhos = db.query(Setor).filter_by(parent_id=setor_id).all()
    for filho in filhos:
        filho.hierarquia = calcular_hierarquia_automatica(
            parent_id=setor_id,
            is_assessoria=filho.is_assessoria,
            db_session=db
        )
        recalcular_hierarquia_filhos(filho.id, db)  # Recursivo
```

---

### 11. LOGS E MONITORAMENTO

**ADICIONAR** logs em pontos críticos:

```python
import logging

logger.info(f"Calculando hierarquia: parent_id={parent_id}, is_assessoria={is_assessoria}")
logger.info(f"Hierarquia calculada: {hierarquia_calculada}")

if hierarquia_calculada != hierarquia_anterior:
    logger.warning(f"Hierarquia mudou de {hierarquia_anterior} para {hierarquia_calculada}")
```

---

### 12. DOCUMENTAÇÃO PARA O USUÁRIO

**ATUALIZAR** a documentação/ajuda do sistema:

> **Como funciona a hierarquia agora?**
> 
> 1. A primeira caixa que você criar será automaticamente o **Nível 1** (topo da hierarquia)
> 2. Cada nova caixa criada **abaixo** de outra aumenta automaticamente o nível (2, 3, 4...)
> 3. Se quiser criar uma **Assessoria** (que fica ao lado, não abaixo), marque o checkbox "É Assessoria?"
> 4. Você pode escolher qualquer tipo de setor (Secretaria, Diretoria, etc.) em qualquer nível!

---

## 🚨 SEÇÃO CRÍTICA: PRESERVAÇÃO DE POSICIONAMENTO E LAYOUT

### ⚠️ ATENÇÃO MÁXIMA - REGRA INVIOLÁVEL ⚠️

**NENHUMA** lógica que dependa dos valores numéricos de `hierarquia` para posicionamento, conexões ou comportamento visual deve ser alterada ou removida. Esta refatoração muda APENAS:
- ✅ Como o valor de `hierarquia` é **atribuído** (manual → automático)
- ✅ Quais tipos de setor são **permitidos** por nível (restrito → livre)

**O que NÃO PODE MUDAR:**
- ❌ Lógica de posicionamento X,Y baseada em `hierarquia`
- ❌ Lógica de conexões (Top/Bottom/Left/Right) baseada em `hierarquia`
- ❌ Comportamento vertical vs lateral baseado em `hierarquia`
- ❌ Cores e bordas baseadas em `hierarquia`
- ❌ Qualquer cálculo de layout que use `parseFloat(hierarquia)`

### 🔍 Checklist de Preservação Obrigatória

Antes de commitar código, **VERIFICAR** que estas funcionalidades continuam **EXATAMENTE IGUAIS**:

#### 1. Posicionamento Vertical (Chefias)
```typescript
// DEVE CONTINUAR FUNCIONANDO:
const isChefiaVertical = (node) => {
  const nivel = parseFloat(node.hierarquia);
  return (
    nivel === 0.5 || // Subprefeitura
    nivel >= 1 ||    // Todos os níveis 1+
    node.nome.includes('Diretoria') ||
    node.nome.includes('Superintendência') ||
    node.nome.includes('Subsecretaria')
  );
};

// SE este código quebrar, TODA a espinha dorsal do organograma quebra!
```

#### 2. Posicionamento Lateral (Assessorias)
```typescript
// DEVE CONTINUAR FUNCIONANDO:
const isAssessoriaLateral = (node) => {
  return node.is_assessoria === true || parseFloat(node.hierarquia) === 0;
};

// Assessorias SEMPRE ficam ao lado (esquerda/direita), NUNCA embaixo
// Se isso quebrar, assessorias vão aparecer na vertical!
```

#### 3. Exceção Crítica: Assessoria de Nível >= 3
```typescript
// DEVE CONTINUAR FUNCIONANDO:
const usarLayoutVertical = (node, parent) => {
  const nivelPai = parseFloat(parent.hierarquia);
  const isAssessoria = node.is_assessoria || parseFloat(node.hierarquia) === 0;
  
  // Se assessoria está subordinada a nível >= 3, vai para vertical
  if (isAssessoria && nivelPai >= 3) {
    return true; // Economiza largura horizontal
  }
  
  return false;
};

// Esta regra evita organogramas muito largos!
```

#### 4. Cálculo de Conexões (Handles)
```typescript
// DEVE CONTINUAR FUNCIONANDO:
const calcularHandles = (node) => {
  const nivel = parseFloat(node.hierarquia);
  const isAssessoria = node.is_assessoria || nivel === 0;
  
  if (isAssessoria && !forcaVertical) {
    return {
      source: 'left',  // ou 'right'
      target: 'left'   // ou 'right'
    };
  } else {
    return {
      source: 'bottom',
      target: 'top'
    };
  }
};

// As linhas conectam baseado nisso! Não quebrar!
```

#### 5. Cores por Nível
```typescript
// DEVE CONTINUAR FUNCIONANDO:
const getNodeColor = (hierarquia) => {
  const nivel = String(parseFloat(hierarquia));
  return HIERARCHY_COLORS[nivel] || HIERARCHY_COLORS['4']; // default verde menta
};

// Cores visuais identificam a hierarquia! Preservar!
```

#### 6. Protocolos de Auto-Cura

**Anti-Diagonal (Perfect Pixel):**
```typescript
// DEVE CONTINUAR FUNCIONANDO:
if (isAssessoriaLateral && node.position.y !== parent.position.y) {
  node.position.y = parent.position.y; // Força alinhamento horizontal
}

// Sem isso, linhas ficam tortas!
```

**Anti-Snapback (ForkY):**
```typescript
// DEVE CONTINUAR FUNCIONANDO:
const calcularAlturaBarramento = (filhos) => {
  const menorY = Math.min(...filhos.map(f => f.position.y));
  return menorY - 60; // Posição dinâmica do barramento
};

// Sem isso, barramentos "pulam" no reload!
```

#### 7. Alternância Esquerda/Direita de Assessorias
```typescript
// DEVE CONTINUAR FUNCIONANDO:
const posicionarAssessorias = (parentNode, assessorias) => {
  assessorias.forEach((assessoria, index) => {
    if (index % 2 === 0) {
      assessoria.position.x = parentNode.position.x - 300; // Esquerda
    } else {
      assessoria.position.x = parentNode.position.x + 300; // Direita
    }
    assessoria.position.y = parentNode.position.y; // Mesmo Y do pai
  });
};

// Padrão visual estabelecido! Não mudar!
```

### 🎯 Arquivos Onde Essas Lógicas DEVEM Permanecer Intactas

| Arquivo | O que NÃO pode quebrar |
|---------|------------------------|
| `OrganogramaCanvas.tsx` | Toda lógica de detecção `isAssessoriaNode`, `isChefiaVertical` |
| `layoutHelpers.ts` | Funções `calcularPosicaoVertical()`, `calcularPosicaoLateral()` |
| `nodeHelpers.ts` | Função `getNodeColor()`, `getNodeBorder()` |
| `connectionHelpers.ts` | Função `calcularHandles()`, lógica de source/target |
| `hierarchyLevels.ts` | Objetos `HIERARCHY_COLORS`, `HIERARCHY_BORDERS` |

### 🧪 Testes de Regressão Obrigatórios

Execute estes testes ANTES e DEPOIS da refatoração. Os resultados visuais devem ser **IDÊNTICOS**:

**Teste Visual 1: Estrutura Vertical**
```
Criar: Nível 1 → Nível 2 → Nível 3
Verificar: Todas as caixas estão ABAIXO umas das outras
Verificar: Linhas conectam Top/Bottom
```

**Teste Visual 2: Assessoria Lateral**
```
Criar: Nível 1 + Assessoria (nível 0)
Verificar: Assessoria está AO LADO do nível 1
Verificar: Linha conecta Left/Right (não Top/Bottom)
Verificar: Y da assessoria = Y do nível 1 (mesma altura)
```

**Teste Visual 3: Múltiplas Assessorias**
```
Criar: Nível 1 + 2 Assessorias
Verificar: Primeira assessoria à ESQUERDA
Verificar: Segunda assessoria à DIREITA
```

**Teste Visual 4: Cores por Nível**
```
Criar: Níveis 0, 0.5, 1, 2, 3, 4
Verificar: Cada um tem a cor correta da tabela
```

**Teste Visual 5: Assessoria de Nível >= 3**
```
Criar: Nível 1 → Nível 2 → Nível 3 → Nível 4 + Assessoria do Nível 4
Verificar: Assessoria vai para VERTICAL (não lateral)
```

### 📸 Evidência Fotográfica Recomendada

1. Tire screenshots do organograma ANTES da refatoração
2. Aplique as mudanças
3. Recrie o MESMO organograma
4. Compare as screenshots - devem ser **pixel-perfect iguais**

Se houver QUALQUER diferença visual:
- 🚨 **PARE IMEDIATAMENTE**
- 🔍 Investigue o que quebrou
- 🔧 Corrija antes de prosseguir

---

## ⚠️ AVISOS FINAIS

1. **NÃO remova** a lógica de posicionamento X,Y de assessorias - ela deve continuar funcionando
2. **NÃO altere** as cores e bordas dos níveis
3. **NÃO mude** nenhuma função que use `parseFloat(hierarquia)` para decisões de layout
4. **NÃO toque** nos protocolos Anti-Diagonal e Anti-Snapback
5. **TESTE** exaustivamente o recálculo de hierarquia ao mover setores
6. **BACKUP** do banco de dados antes de rodar migrations
7. **COMUNIQUE** a equipe sobre a mudança de comportamento (usuários podem estranhar)
8. **COMPARE** screenshots antes/depois para garantir identidade visual

---

## 🎯 OBJETIVO FINAL

Após esta refatoração, o sistema deve:
- ✅ Calcular níveis automaticamente sem intervenção do usuário
- ✅ Permitir qualquer tipo de setor em níveis 1-10
- ✅ Manter o checkbox simples "É Assessoria?" como única escolha do usuário
- ✅ Preservar toda a lógica de layout visual existente
- ✅ Funcionar perfeitamente com dados legados

**Boa sorte e código limpo! 🚀**
