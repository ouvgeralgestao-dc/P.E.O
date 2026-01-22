# 🚀 Plano de Metas Finais - Entrega do Sistema PMDC

Este documento estabelece o roteiro técnico final para a estabilização, automação e implantação do Planejador de Estrutura Organizacional em ambiente de produção (Intranet).

---

## 🔍 Meta 1: Dashboard Dinâmico e Filtros Integrados ✅
**(Concluída em: 22/01/2026)**

**Objetivo:** Tornar o Dashboard uma central de inteligência viva, onde todos os dados respondem instantaneamente aos filtros aplicados.

1. **Interatividade Total (FEITO):** Garantir que todos os gráficos (Símbolos, Cargos, Setores) e a lista de cards de órgãos sejam atualizados em tempo real ao selecionar filtros de Órgão, Setor, Símbolo ou Prefixo.
2. **Conexão com Banco de Dados (FEITO):** Vincular os filtros diretamente à lógica de agregação do banco de dados, assegurando que o que o usuário vê na tela seja o reflexo fiel e filtrado de toda a base de dados.
3. **Persistência e Fluidez (FEITO):** Otimizar as buscas para que a experiência de filtragem seja instantânea e precisa.

---

## 🏗️ Meta 2: Sincronização Inteligente e Automação dos Organogramas Gerais

**Objetivo:** Eliminar a necessidade de atualização manual. O Organograma Geral deve se autoconstruir dinamicamente com base nos dados mais recentes dos órgãos.

1. **Trigger de Carregamento:** Ao abrir o Organograma Geral (Estrutural ou Funcional), o sistema deve realizar o "Pull" automático dos dados de todos os órgãos cadastrados.
2. **Separação por Contexto:** Manter distinção clara entre "Geral Estrutural" (apenas estruturas) e "Geral Funcional" (apenas funções/cargos).
3. **Hierarquia e Conexões Dinâmicas:** Posicionamento inteligente de setores Nível 1 e cargos de liderança abaixo do nó **Prefeito**, respeitando a árvore hierárquica.
4. **Preservação de Posicionamento:** Priorizar coordenadas (X, Y) customizadas salvas individualmente em cada órgão.

---

## 🔐 Meta 3: Autenticação Segura e Controle de Acesso (LGPD)

**Objetivo:** Implementar um sistema de login robusto com fluxo de aprovação controlado e restrição de visibilidade por órgão.

1. **Fluxo de Cadastro com Aprovação:**
   - Tela de cadastro solicitando: Nome Completo, Matrícula, E-mail, Senha e Órgão de Alocação.
   - **Gatilho de Autorização:** Ao solicitar cadastro, um e-mail é enviado para `ouvgeral.gestão@gmail.com` com um link de autorização. O cadastro só é efetivado no banco de dados após a confirmação manual.
2. **Segurança de Dados por Órgão:**
   - Usuários comuns visualizam apenas os cards e organogramas do órgão ao qual estão alocados.
   - Restrição absoluta de acesso a dados de outros órgãos.
3. **Gestão de Acesso (Status Master):**
   - **Perfil Master:** Acesso total a todos os órgãos, cargos e configurações do sistema.
   - **Painel Administrativo:** Localizado na aba "Configurações", acessível apenas por usuários Master, para criar, editar e excluir usuários.

---

## 🎨 Meta 4: Padronização Visual e Tipografia (Caixa Alta)

**Objetivo:** Elevar a autoridade visual e consistência da interface.

1. **Normalização Textual:** Converter todos os títulos principais (H1) para **CAIXA ALTA (UPPERCASE)** em todo o sistema.
2. **Consistência de Layout:** Revisar alinhamentos, margens e tipografia para garantir uma experiência premium e profissional em todas as páginas.

---

## 🧹 Meta 5: Sanitização e Preparação para Deploy

**Objetivo:** Empacotar o sistema para distribuição, removendo ruídos de desenvolvimento.

1. **Estrutura Limpa (Build):** Separar apenas o essencial para produção: Frontend (dist), Backend e Banco de Dados (SQLite).
2. **Remoção de Artefatos:** Excluir arquivos de instrução, logs de IA e backups temporários.

---

## 📦 Meta 6: Instalação e Executável Intranet

**Objetivo:** Garantir a operação autônoma em servidor Intranet Windows (Offline).

1. **Lançador Automático:** Criar um executável ou script `.bat` que inicie os serviços e abra o app no servidor.
2. **Configuração de URL Amigável:** Ajustar variáveis de ambiente para resposta via URL da Intranet (ex: `http://peopmdc:6002`) em vez de localhost/IPs fixos.
