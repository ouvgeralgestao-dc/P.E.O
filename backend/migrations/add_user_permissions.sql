-- Tabela de Permissões por Usuário
CREATE TABLE IF NOT EXISTS permissoes_usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    modulo TEXT NOT NULL,  -- 'criar_institucional', 'criacao_livre', 'geral_estrutural', 'geral_funcional', 'configuracoes'
    permitido INTEGER DEFAULT 0,  -- 0 = bloqueado, 1 = permitido
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(user_id, modulo)  -- Um usuário não pode ter permissão duplicada para o mesmo módulo
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_permissoes_user ON permissoes_usuario(user_id);

-- Inserir permissões padrão para usuários existentes do tipo 'user'
INSERT INTO permissoes_usuario (user_id, modulo, permitido)
SELECT 
    id,
    modulo,
    CASE 
        WHEN modulo IN ('criar_institucional', 'criacao_livre') THEN 1
        ELSE 0
    END as permitido
FROM usuarios
CROSS JOIN (
    SELECT 'criar_institucional' as modulo
    UNION SELECT 'criacao_livre'
    UNION SELECT 'geral_estrutural'
    UNION SELECT 'geral_funcional'
    UNION SELECT 'configuracoes'
) modulos
WHERE tipo = 'user'
ON CONFLICT(user_id, modulo) DO NOTHING;
