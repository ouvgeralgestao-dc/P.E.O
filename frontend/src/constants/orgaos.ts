/**
 * Constantes de Órgãos da PMDC
 * Lista completa de órgãos conforme Boletim Oficial
 */

// Lista de órgãos da Prefeitura Municipal de Duque de Caxias
export const ORGAOS_PMDC = [
    // PODER EXECUTIVO
    {
        id: 'prefeito-municipal',
        nome: 'Prefeito Municipal',
        categoria: 'PODER_EXECUTIVO',
        ordem: 1
    },
    {
        id: 'vice-prefeito-municipal',
        nome: 'Vice-Prefeito Municipal',
        categoria: 'PODER_EXECUTIVO',
        ordem: 2
    },
    {
        id: 'sec-governo',
        nome: 'Secretaria Municipal de Governo',
        categoria: 'SECRETARIA',
        ordem: 3
    },
    {
        id: 'gabinete-prefeito',
        nome: 'Gabinete do Prefeito',
        categoria: 'PODER_EXECUTIVO',
        ordem: 4
    },

    // SUBPREFEITURAS
    {
        id: 'subprefeitura-1-distrito',
        nome: 'Subprefeitura do 1º Distrito',
        categoria: 'SUBPREFEITURA',
        ordem: 5
    },
    {
        id: 'subprefeitura-2-distrito',
        nome: 'Subprefeitura do 2º Distrito',
        categoria: 'SUBPREFEITURA',
        ordem: 6
    },
    {
        id: 'subprefeitura-3-distrito',
        nome: 'Subprefeitura do 3º Distrito',
        categoria: 'SUBPREFEITURA',
        ordem: 7
    },
    {
        id: 'subprefeitura-4-distrito',
        nome: 'Subprefeitura do 4º Distrito',
        categoria: 'SUBPREFEITURA',
        ordem: 8
    },

    // SECRETARIAS MUNICIPAIS
    {
        id: 'sec-articulacao-institucional',
        nome: 'Secretaria Municipal de Articulação Institucional',
        categoria: 'SECRETARIA',
        ordem: 9
    },
    {
        id: 'procuradoria-geral',
        nome: 'Procuradoria Geral do Município',
        categoria: 'SECRETARIA',
        ordem: 10
    },
    {
        id: 'sec-comunicacao-social',
        nome: 'Secretaria Municipal de Comunicação Social',
        categoria: 'SECRETARIA',
        ordem: 11
    },
    {
        id: 'sec-controle-interno',
        nome: 'Secretaria Municipal de Controle Interno',
        categoria: 'SECRETARIA',
        ordem: 12
    },
    {
        id: 'sec-urbanismo-habitacao',
        nome: 'Secretaria Municipal de Urbanismo e Habitação',
        categoria: 'SECRETARIA',
        ordem: 13
    },
    {
        id: 'sec-administracao-orcamento-planejamento',
        nome: 'Secretaria Municipal de Administração, Orçamento e Planejamento',
        categoria: 'SECRETARIA',
        ordem: 14
    },
    {
        id: 'sec-fazenda',
        nome: 'Secretaria Municipal de Fazenda',
        categoria: 'SECRETARIA',
        ordem: 15
    },
    {
        id: 'sec-defesa-civil',
        nome: 'Secretaria Municipal de Defesa Civil',
        categoria: 'SECRETARIA',
        ordem: 16
    },
    {
        id: 'sec-transportes-servicos-publicos',
        nome: 'Secretaria Municipal de Transportes e Serviços Públicos',
        categoria: 'SECRETARIA',
        ordem: 17
    },
    {
        id: 'sec-obras-agricultura',
        nome: 'Secretaria Municipal de Obras e Agricultura',
        categoria: 'SECRETARIA',
        ordem: 18
    },
    {
        id: 'sec-meio-ambiente',
        nome: 'Secretaria Municipal de Meio Ambiente',
        categoria: 'SECRETARIA',
        ordem: 19
    },
    {
        id: 'sec-educacao',
        nome: 'Secretaria Municipal de Educação',
        categoria: 'SECRETARIA',
        ordem: 20
    },
    {
        id: 'sec-saude',
        nome: 'Secretaria Municipal de Saúde',
        categoria: 'SECRETARIA',
        ordem: 21
    },
    {
        id: 'sec-cultura-turismo',
        nome: 'Secretaria Municipal de Cultura e Turismo',
        categoria: 'SECRETARIA',
        ordem: 22
    },
    {
        id: 'sec-assistencia-social-direitos-humanos',
        nome: 'Secretaria Municipal de Assistência Social e Direitos Humanos',
        categoria: 'SECRETARIA',
        ordem: 23
    },
    {
        id: 'sec-seguranca-publica',
        nome: 'Secretaria Municipal de Segurança Pública',
        categoria: 'SECRETARIA',
        ordem: 24
    },
    {
        id: 'sec-esportes-lazer',
        nome: 'Secretaria Municipal de Esportes e Lazer',
        categoria: 'SECRETARIA',
        ordem: 25
    },
    {
        id: 'sec-ciencia-tecnologia',
        nome: 'Secretaria Municipal de Ciência e Tecnologia',
        categoria: 'SECRETARIA',
        ordem: 26
    },
    {
        id: 'sec-gestao-inclusao-mulher',
        nome: 'Secretaria Municipal de Gestão, Inclusão e Mulher',
        categoria: 'SECRETARIA',
        ordem: 27
    },
    {
        id: 'sec-trabalho-renda',
        nome: 'Secretaria Municipal de Trabalho e Renda',
        categoria: 'SECRETARIA',
        ordem: 28
    },
    {
        id: 'sec-desenvolvimento-economico',
        nome: 'Secretaria Municipal de Desenvolvimento Econômico',
        categoria: 'SECRETARIA',
        ordem: 29
    },
    {
        id: 'sec-transportes',
        nome: 'Secretaria Municipal de Transportes',
        categoria: 'SECRETARIA',
        ordem: 30
    },
    {
        id: 'sec-protecao-animal',
        nome: 'Secretaria Municipal de Proteção Animal',
        categoria: 'SECRETARIA',
        ordem: 31
    },
    {
        id: 'sistema-ouvidoria',
        nome: 'Sistema de Ouvidoria',
        categoria: 'SECRETARIA',
        ordem: 32
    },

    // AUTARQUIAS
    {
        id: 'ipmdc',
        nome: 'IPMDC - Instituto de Previdência dos Servidores Públicos',
        categoria: 'AUTARQUIA',
        ordem: 33
    },
    {
        id: 'fundec',
        nome: 'FUNDEC - Fundação de Apoio à Escola Técnica, Ciência, Tecnologia, Esporte, Lazer, Cultura e Políticas Sociais',
        categoria: 'AUTARQUIA',
        ordem: 34
    },
    {
        id: 'funlar',
        nome: 'FUNLAR - Fundação Lar Escola Francisco de Paula',
        categoria: 'AUTARQUIA',
        ordem: 35
    },
    {
        id: 'caxias-serv',
        nome: 'CAXIAS SERV - Empresa Municipal Prestadora de Serviços Gerais',
        categoria: 'AUTARQUIA',
        ordem: 36
    },

    // CONSELHO
    {
        id: 'conselho-contribuintes',
        nome: 'CONSELHO DE CONTRIBUINTES',
        categoria: 'CONSELHO',
        ordem: 37
    }
];

// Opções para dropdown (ordenado e sem Prefeito/Vice-Prefeito)
export const ORGAOS_OPTIONS = ORGAOS_PMDC
    .filter(orgao => orgao.id !== 'prefeito-municipal' && orgao.id !== 'vice-prefeito-municipal')
    .sort((a, b) => a.ordem - b.ordem)
    .map(orgao => ({
        value: orgao.id,
        label: orgao.nome
    }));

// IDs das Subprefeituras (para verificação condicional)
export const SUBPREFEITURAS_IDS = [
    'subprefeitura-1-distrito',
    'subprefeitura-2-distrito',
    'subprefeitura-3-distrito',
    'subprefeitura-4-distrito'
];

// Categorias de órgãos (atualizadas conforme FASE 11.6)
export const CATEGORIAS_ORGAOS = {
    PODER_EXECUTIVO: 'Poder Executivo',
    SECRETARIA: 'Secretaria Municipal',
    AUTARQUIA: 'Autarquia',
    FUNDACAO: 'Fundação',
    INSTITUTO: 'Instituto',
    EMPRESA_PUBLICA: 'Empresa Pública',
    SUBPREFEITURA: 'Subprefeitura',
    CONSELHO: 'Conselho'
};

// Subprefeituras (para uso específico)
export const SUBPREFEITURAS = [
    '1º Distrito',
    '2º Distrito',
    '3º Distrito',
    '4º Distrito'
];

// Função helper para buscar órgão por ID
export const getOrgaoById = (id) => {
    return ORGAOS_PMDC.find(orgao => orgao.id === id);
};

// Função helper para buscar órgão por nome
export const getOrgaoByNome = (nome) => {
    return ORGAOS_PMDC.find(orgao => orgao.nome === nome);
};
