# 📑 Índice Técnico: Criador de Organogramas PMDC

Este documento serve como a "Fonte da Verdade" sobre as lógicas, hierarquias e funcionalidades do sistema.

## 1. Entidades Fundamentais

### 1.1 Órgão vs Setor

- **Órgão (Entidade Pai)**: É o container de nível mais alto (ex: Secretaria de Governo). O acesso e a visibilidade dos usuários são travados no nível do Órgão. Organogramas são criados _dentro_ de um Órgão.
- **Setor (Componente)**: São as unidades que compõem a estrutura de um Órgão (ex: Departamento de TI, Divisão de Protocolo).

## 2. Lógica de Organogramas

### 2.1 Organograma Estrutural

- **Propósito**: Define a hierarquia oficial dos Setores do Órgão.
- **Gera**: A base de dados que serve como "Setor de Referência" para o organograma funcional.

### 2.2 Organograma Funcional

- **Propósito**: Mapeia os Cargos e as Pessoas (Ocupantes) dentro de cada Órgão.
- **Integração**: Cada cargo pode (e deve) estar vinculado a um **Setor de Referência** vindo do organograma estrutural.

## 3. Hierarquia e Visualização

### 3.1 Níveis de Hierarquia

- **Formatação**: Exibida com decimal (ex: **Nível 1.0**, **Nível 2.0**) para manter precisão visual.
- **Assessoria**: Cargos ou setores marcados como "Assessoria" possuem ramificações laterais diferenciadas no canvas.

### 3.2 Visualizador (Canvas)

- **Ordem de Exibição no Cargo**:
  1. Nome do Cargo
  2. Nome do Ocupante
  3. Nome do Setor de Referência (Estrutural)
  4. Nível de Hierarquia

## 4. Segurança e Perfis de Acesso

### 4.1 Perfil Administrador (`admin`)

- Visibilidade global de todos os órgãos.
- Gestão de usuários e aprovação de solicitações.
- Edição de configurações críticas (ex: tamanho da folha global).

### 4.2 Perfil Usuário Comum (`user`)

- **Isolamento Absoluto**: Só vê o órgão ao qual está vinculado.
- **Dashboard Local**: As estatísticas da Home refletem apenas os dados da sua unidade administrativa.

## 5. Funcionalidades e Rotas

- **Dashboard**: Centraliza estatísticas de Símbolos (DAS, etc.) e contagem de cargos/setores.
- **Módulo de Criação/Edição**: Wizard passo a passo para montar a árvore hierárquica.
- **Gestão de Ocupantes**: Interface para associar nomes reais aos cargos funcionais.

---

> [!IMPORTANT]
> A manutenção deste índice é obrigatória. Qualquer alteração estrutural no sistema deve ser refletida aqui.
