# Guia de Funcionalidades do Projeto P.E.O 🚀

Este documento serve como referência rápida para as melhorias implementadas em 27/01/2026.

## 👥 Perfil de Usuário

O menu lateral agora identifica você:

- **Nome em Negrito**: Exibe o seu primeiro nome em destaque.
- **Matrícula**: Exibida em um badge discreto ao lado.
- **Exemplo**: **Nilton** `[370517]`

## 📋 Aprovação de Cadastro (Administrador)

Ao receber um e-mail de nova solicitação:

1. Clique em **"🔍 Analisar Solicitação"**.
2. No campo **"Vincular ao Setor"**, não é mais necessário digitar. Selecione a categoria correta diretamente do menu suspenso (carregado via Dicionário).
3. Defina se o usuário será **Administrador** ou **Usuário Comum**.

## 🏛️ Dashboard e Filtros

- **Gestores (Usuários Comuns)**: Só verão organogramas do próprio órgão ou que correspondam ao seu setor.
- **Administradores**: Continuam com acesso total a todos os registros.

## 💾 Segurança de Dados

- **Banco de Dados**: Fica salvo localmente em `backend/data/organograma.sqlite`.
- **Backup**: Recomenda-se copiar a pasta `backend/data` periodicamente.
- **Credenciais**: Nunca compartilhe o arquivo `.env` ou chaves JSON da raiz.

## 🚀 Como Executar em Novo PC

1. Instale o Node.js v20+.
2. Clone o repositório.
3. Copie o arquivo `.env` para a raiz do `backend`.
4. Digite `npm install` na pasta principal.
5. Digite `npm start` para abrir o site.

---

_Atualizado em: 27 de Janeiro de 2026_
