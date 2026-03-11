# Documentação do Componente Sidebar

Este documento detalha o funcionamento, estilização e comportamento do componente `Sidebar` utilizado no Gerenciador de Projeto Sebrae GPS-DC.

## 1. Visão Geral
A Sidebar é o principal componente de navegação lateral da aplicação. Ela é responsiva, colapsável e adapta seu conteúdo com base no estado de expansão e nas permissões do usuário logado.

*   **Caminho do Arquivo:** `frontend/src/components/Sidebar/index.jsx`
*   **Estilo:** `frontend/src/components/Sidebar/style.css`

## 2. Especificações Visuais

### Cores e Tema
A Sidebar utiliza um tema escuro "Modern Neutral" baseado em tons de **Slate** (azul-acinzentado escuro).

*   **Background:** Gradiente Linear Vertical
    *   Início: `#1e293b` (Slate 800)
    *   Fim: `#0f172a` (Slate 900)
*   **Borda Direita:** `#334155` (Slate 700)
*   **Texto Principal:** `#ffffff` (Branco)
*   **Texto Secundário/Ícones:** `rgba(255, 255, 255, 0.8)`
*   **Hover de Itens:** `rgba(255, 255, 255, 0.1)`
*   **Item Ativo:** `rgba(255, 255, 255, 0.15)` com borda lateral decorativa.

### Dimensões
*   **Largura Expandida (Aberto):** `280px`
*   **Largura Colapsada (Fechado):** `72px`
*   **Altura:** `100vh` (Ocupa toda a altura da tela)
*   **Z-Index:** `200` (Fica acima do conteúdo principal)

## 3. Funcionamento e Lógica (index.jsx)

### Gerenciamento de Estado
O estado de expansão é controlado localmente pelo hook `useState`.

```javascript
const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Padrão: Fechado
```

*   **Toggle (Hambúrguer):** A função `toggleSidebar` inverte esse booleano.
*   **Sincronização CSS:** Um `useEffect` observa a mudança de estado e atualiza a variável CSS global `--sidebar-width` no elemento `html` (widht root), permitindo que outros componentes (como o Layout principal) se ajustem dinamicamente ao tamanho da barra.

### Botão Hambúrguer
Localizado no topo da Sidebar, o botão altera o estado entre "Aberto" e "Fechado".
*   **Ícone:** `IconMenu` (Três linhas horizontais).
*   **Comportamento:** Ao clicar, dispara `toggleSidebar`.
*   **Posicionamento:**
    *   *Fechado:* Centralizado.
    *   *Aberto:* Alinhado à esquerda (`padding-left: 1.5rem`).

## 4. Estados e Estilização (style.css)

A classe CSS `.app-sidebar` recebe dinamicamente modificadores `.collapsed` ou `.expanded` baseados no estado React.

### Estado "Aberto" (.expanded)
*   **Visibilidade:** Todos os textos (nome do menu, descrição, nome do usuário, botões de footer) são visíveis.
*   **Transição:** Utiliza `opacity` e `visibility` com delay (`0.1s`) para criar um efeito suave onde o texto aparece logo após a expansão da largura.
*   **Interação:** `pointer-events: auto`.

### Estado "Fechado" (.collapsed)
*   **Largura:** Reduz para `72px`.
*   **Navegação:** Os itens de menu (`.sidebar-nav-item`) têm seu conteúdo de texto (`.nav-copy`) ocultado (`display: none`), restando apenas os ícones centralizados.
*   **Perfil:** A seção de informações do usuário (`.profile-info`) fica invisível (`opacity: 0`), mantendo apenas o avatar/círculo do usuário.
*   **Footer:** Os botões "Sair" e "Gestão de Acesso" encolhem para quadrados de `40px x 40px`, exibindo apenas os ícones.

### Transições (Animações)
O movimento da Sidebar é governado por curvas de Bézier personalizadas para uma sensação "premium":
*   `transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);`

## 5. Seções do Componente

1.  **Header/Brand:**
    *   Logo (imagem) e Título ("Gestão SEBRAE").
    *   No modo fechado, o texto some e a logo pode ser ajustada/oculta dependendo do design (no CSS atual, a opacidade muda).

2.  **Perfil do Usuário:**
    *   Exibe avatar (inicial do nome) e Cargo (`profile-badge`).
    *   As cores do badge ("Admin", "Gestor", etc.) são definidas dinamicamente via atributos `data-role` no CSS.

3.  **Navegação Principal:**
    *   Lista de links gerada a partir de `navConfig`.
    *   Utiliza `NavLink` do `react-router-dom` para classe `.active` automática.
    *   Exibe Ícone + Título + Descrição curta (apenas quando aberto).

4.  **Footer:**
    *   Botões de ação fixos na parte inferior.
    *   **Gestão de Acesso:** Visível apenas para administradores (`canAccessAdminPanel`).
    *   **Sair:** Realiza o logout e redireciona para `/login`.

## 6. Permissões e Segurança
A Sidebar integra-se com o contexto de autenticação (`useAuth`) e permissões (`PermissionsContext`):
*   **Admin Panel:** O link para criar eixos e o botão de gestão de acesso só aparecem se o usuário tiver `role` de administrador ou permissão específica (`configuracoes`, `acessar_gestao_acesso`).
*   **Filtragem de Acesso:** Verifica `userRole` para determinar se exibe opções avançadas.
