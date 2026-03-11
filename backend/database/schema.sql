-- TABELA 01: ÓRGÃOS (Entidade Principal)
CREATE TABLE IF NOT EXISTS orgaos (
    id TEXT PRIMARY KEY,           -- Slug único (ex: 'secretaria_de_governo')
    nome TEXT NOT NULL,
    categoria TEXT DEFAULT 'OUTROS', -- Secretaria, Subprefeitura, etc
    ordem INTEGER DEFAULT 999,      -- Ordem de exibição
    auth_hash TEXT,                -- Hash da senha (se houver)
    auth_salt TEXT,                -- Salt da senha
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 02: ORGANOGRAMAS_ESTRUTURAIS (1:1 com Órgãos)
CREATE TABLE IF NOT EXISTS organogramas_estruturais (
    orgao_id TEXT PRIMARY KEY REFERENCES orgaos(id) ON DELETE CASCADE,
    tamanho_folha TEXT DEFAULT 'A4',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- TABELA 03: SETORES (Nós da árvore estrutural)
CREATE TABLE IF NOT EXISTS setores (
    id TEXT PRIMARY KEY,           -- UUID
    orgao_id TEXT REFERENCES orgaos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT,                     -- Secretaria, Diretoria, etc.
    hierarquia TEXT,               -- "1", "1.1", "2"
    parent_id TEXT REFERENCES setores(id) ON DELETE CASCADE, -- Auto-referência para árvore
    is_assessoria BOOLEAN DEFAULT 0,
    ordem INTEGER,                 -- Para manter ordem visual
    style_json TEXT,               -- Configurações visuais {color, background...}
    position_json TEXT,            -- Coordenadas {x, y}
    cargos_json TEXT               -- Array simples de cargos [{tipo: 'DAS-1', qtd: 1}]
);

-- INSERIR ÍNDICE PARA BUSCA RÁPIDA DE SETORES POR ÓRGÃO
CREATE INDEX IF NOT EXISTS idx_setores_orgao ON setores(orgao_id);

-- TABELA 04: DIAGRAMAS_FUNCIONAIS (1:N com Órgãos - permite histórico)
CREATE TABLE IF NOT EXISTS diagramas_funcionais (
    id TEXT PRIMARY KEY,
    orgao_id TEXT REFERENCES orgaos(id) ON DELETE CASCADE,
    nome TEXT,                     -- Opcional (ex: 'Versão 2026')
    tamanho_folha TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- TABELA 05: CARGOS_FUNCIONAIS (Nós da árvore funcional)
CREATE TABLE IF NOT EXISTS cargos_funcionais (
    id TEXT PRIMARY KEY,
    diagrama_id TEXT REFERENCES diagramas_funcionais(id) ON DELETE CASCADE,
    nome_cargo TEXT NOT NULL,
    ocupante TEXT,                 -- Nome da pessoa
    hierarquia TEXT,
    parent_id TEXT,                -- ID do cargo pai (neste mesmo diagrama)
    is_assessoria BOOLEAN DEFAULT 0,
    style_json TEXT,
    position_json TEXT,
    simbolos_json TEXT,            -- Array [{tipo: 'DAS-S', qtd: 1}]
    setor_ref TEXT                 -- Referência ao setor estrutural (ID do setor)
);

-- INSERIR ÍNDICE PARA BUSCA RÁPIDA DE CARGOS POR DIAGRAMA
CREATE INDEX IF NOT EXISTS idx_cargos_diagrama ON cargos_funcionais(diagrama_id);

-- TABELA 06: ORGANOGRAMAS_GERAIS (Estrutura consolidada Prefeito/Gabinete/Subprefeituras/Secretarias)
CREATE TABLE IF NOT EXISTS organogramas_gerais (
    tipo TEXT PRIMARY KEY,          -- 'estrutural' ou 'funcional'
    data_json TEXT NOT NULL,        -- JSON blob com estrutura completa
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 07: OCUPANTES_GERAIS (Mapeamento cargo_id -> nome do ocupante)
CREATE TABLE IF NOT EXISTS ocupantes_gerais (
    cargo_id TEXT PRIMARY KEY,
    nome_ocupante TEXT NOT NULL
);

-- TABELA 08: LAYOUT_PERSONALIZADO (Posições customizadas por nó)
CREATE TABLE IF NOT EXISTS layout_personalizado (
    orgao_id TEXT NOT NULL,          -- 'geral' ou orgao_id específico
    node_id TEXT NOT NULL,           -- ID do nó (setor ou cargo)
    x REAL NOT NULL,                 -- Coordenada X
    y REAL NOT NULL,                 -- Coordenada Y
    custom_style_json TEXT,          -- Estilos customizados {backgroundColor, etc}
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (orgao_id, node_id)
);

-- TABELA 09: TIPOS_SETOR (Dicionário de nomes de setor por hierarquia)
CREATE TABLE IF NOT EXISTS tipos_setor (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    hierarquias TEXT NOT NULL,      -- Lista separada por vírgula (ex: "4,5,6,7,8,9,10")
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_setor_nome ON tipos_setor(nome);

-- TABELA 09B: TIPOS_CARGO (Dicionário de nomes de cargo e níveis padrão)
CREATE TABLE IF NOT EXISTS tipos_cargo (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    hierarquia_padrao REAL DEFAULT 1, -- Nível sugerido (DAS-S=1, DAS-9=2...)
    simbolo TEXT,                     -- Símbolo padrão (ex: ⬛, ▪, ▫, ○)
    ordem INTEGER DEFAULT 999,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_cargo_nome ON tipos_cargo(nome);

-- TABELA 10: USUÁRIOS (Gestão de Acesso)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula TEXT NOT NULL UNIQUE,
    nome TEXT,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    orgao_id TEXT,                          -- Órgão ao qual o usuário pertence
    setor TEXT,
    cargo TEXT,
    tipo TEXT NOT NULL DEFAULT 'user' CHECK (tipo IN ('admin', 'user')),
    ativo INTEGER DEFAULT 1,                -- 1 = ativo, 0 = inativo
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orgao_id) REFERENCES orgaos(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON usuarios(matricula);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);

-- TABELA 11: SANDBOX_SETORES (Organogramas estruturais sandbox - referencia órgãos institucionais)
CREATE TABLE IF NOT EXISTS sandbox_setores (
    id TEXT PRIMARY KEY,                   -- UUID
    user_id INTEGER NOT NULL,
    orgao_id TEXT NOT NULL,             -- Referência a orgaos INSTITUCIONAL
    nome_setor TEXT NOT NULL,
    tipo_setor TEXT NOT NULL,
    hierarquia REAL NOT NULL,
    parent_id TEXT,                        -- Hierarquia de setores
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    custom_style TEXT,                     -- JSON de estilos customizados
    cargos TEXT,                           -- JSON de cargos DAS
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (orgao_id) REFERENCES orgaos(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES sandbox_setores(id) ON DELETE SET NULL
);

-- TABELA 12: SANDBOX_CARGOS_FUNCIONAIS (Organogramas funcionais sandbox - referencia órgãos institucionais)
CREATE TABLE IF NOT EXISTS sandbox_cargos_funcionais (
    id TEXT PRIMARY KEY,                   -- UUID
    user_id INTEGER NOT NULL,
    orgao_id TEXT NOT NULL,             -- Referência a orgaos INSTITUCIONAL
    nome_cargo TEXT NOT NULL,
    ocupante TEXT,
    hierarquia REAL,
    nivel REAL,
    parent_id TEXT,
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    custom_style TEXT,                     -- JSON de estilos
    simbolos TEXT,                         -- JSON de símbolos
    setor_ref TEXT,                        -- Referência cruzada com setores
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (orgao_id) REFERENCES orgaos(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES sandbox_cargos_funcionais(id) ON DELETE SET NULL
);

-- Índices para Sandbox (Performance)
CREATE INDEX IF NOT EXISTS idx_sandbox_setores_user ON sandbox_setores(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_setores_orgao ON sandbox_setores(orgao_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_cargos_user ON sandbox_cargos_funcionais(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_cargos_orgao ON sandbox_cargos_funcionais(orgao_id);
