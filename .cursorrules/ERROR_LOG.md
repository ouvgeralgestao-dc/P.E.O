# Error Log - Registro de Bugs e Soluções 🐞

## 27/01/2026

### 1. Erro 500 no Dashboard (getAllOrganogramas)

- **Causa**: O código tentava fazer `.toUpperCase()` em um campo `setor` que vinha nulo do banco quando o usuário era comum.
- **Solução**: Adicionada verificação de nulidade e alterada a ordem de prioridade dos filtros (primeiro `orgao_id`, depois `setor`).

### 2. Porta do Backend Travada

- **Causa**: O Node.js não estava liberando o processo anterior corretamente ou tentando usar portas privilegiadas/bloqueadas (80).
- **Solução**: Fixado o backend na porta **6001** e frontend na **6002** via `.env` e `server.ts`.

### 3. Nome do Usuário "Usuário" no Perfil

- **Causa**: As queries SQL nas rotas de autenticação (`/login` e `/me`) e no middleware não incluíam a coluna `nome`.
- **Solução**: Atualizadas todas as queries SQL para incluir o campo `nome`.

### 4. Select de Setores Vazio na Aprovação

- **Causa**: O frontend tentava buscar a lista de setores em uma rota protegida por JWT, mas o administrador não estava logado ao abrir o link do e-mail.
- **Solução**: Liberado o `GET` da rota `/api/setores/config` para acesso público (leitura).

### 5. Erro de Permissão no Git Push

- **Causa**: Tentativa de enviar arquivos sensíveis (chaves privadas) ou conflitos de remote.
- **Solução**: Atualizado o `.gitignore` e configurado corretamente o remote origin.
