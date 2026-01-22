/**
 * Constantes de Níveis Hierárquicos
 */

// Níveis hierárquicos disponíveis
export const HIERARCHY_LEVELS = {
    ASSESSORIA: 0,
    SUBPREFEITO: 0.5,  // Novo nível entre Assessoria e Nível 1
    NIVEL_1: 1,
    NIVEL_2: 2,
    NIVEL_3: 3,
    NIVEL_4: 4,
    NIVEL_5: 5,
    NIVEL_6: 6,
    NIVEL_7: 7,
    NIVEL_8: 8,
    NIVEL_9: 9,
    NIVEL_10: 10
};

// Cores por hierarquia (Sincronizadas com Legenda Geral Funcional)
export const HIERARCHY_COLORS = {
    0: '#E0E0E0',    // Assessoria - Cinza
    0.5: '#E0E0E0',  // Subprefeito - Cinza
    1: '#4ECDC4',    // Nível 1 - Verde Água Vibrante
    2: '#64B5F6',    // Nível 2 - Azul Pastel
    3: '#FFF59D',    // Nível 3 - Amarelo Pastel
    4: '#E0E0E0',    // Nível 4 - Cinza
    5: '#FFCC80',    // Nível 5 - Laranja Pastel
    6: '#FFCC80',
    7: '#FFCC80',
    8: '#FFCC80',
    9: '#FFCC80',
    10: '#FFCC80'
};

export const HIERARCHY_BORDERS = {
    0: '#9E9E9E',
    0.5: '#9E9E9E',
    1: '#3DBDB4', // Escuro de #4ECDC4
    2: '#1E88E5', // Escuro de #64B5F6
    3: '#FBC02D', // Escuro de #FFF59D
    4: '#9E9E9E', // Escuro de #E0E0E0
    5: '#F57C00', // Escuro de #FFCC80
    6: '#F57C00',
    7: '#F57C00',
    8: '#F57C00',
    9: '#F57C00',
    10: '#F57C00'
};

// Tipos de setor por nível hierárquico
export const SETOR_TYPES = {
    0: ['Assessoria', 'Assessor(a)', 'Gabinete', 'Consultoria'],
    0.5: ['Subprefeitura'],  // Apenas Subprefeitura
    1: ['Secretaria', 'Presidência', 'Procuradoria'],
    2: ['Superintendência', 'Subprocuradoria'],
    3: ['Subsecretaria'],
    // Níveis 4-10: Tipos livres (todos disponíveis, exceto os específicos de 1, 2 e 3)
    4: ['Diretoria', 'Gerência', 'Coordenação', 'Assessor(a)', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo'],
    5: ['Diretoria', 'Gerência', 'Coordenação', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo'],
    6: ['Diretoria', 'Gerência', 'Coordenação', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo'],
    7: ['Diretoria', 'Gerência', 'Coordenação', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo'],
    8: ['Diretoria', 'Gerência', 'Coordenação', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo'],
    9: ['Diretoria', 'Gerência', 'Coordenação', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo'],
    10: ['Diretoria', 'Gerência', 'Coordenação', 'Divisão', 'Departamento', 'Seção', 'Núcleo', 'Setor', 'Unidade', 'Protocolo']
};

// Labels de hierarquia para exibição
export const HIERARCHY_LABELS = {
    0: 'Assessoria (0)',
    0.5: 'Subprefeito(a)',
    1: 'Nível 1 (Topo)',
    2: 'Nível 2',
    3: 'Nível 3',
    4: 'Nível 4',
    5: 'Nível 5',
    6: 'Nível 6',
    7: 'Nível 7',
    8: 'Nível 8',
    9: 'Nível 9',
    10: 'Nível 10 (Base)'
};

// Regras de símbolos por nível hierárquico
export const SIMBOLOS_POR_NIVEL = {
    0: Infinity,    // Assessoria: ilimitado
    0.5: Infinity,  // Subprefeito: ilimitado
    1: Infinity,    // Nível 1: ilimitado
    2: Infinity,    // Nível 2: ilimitado
    3: Infinity,    // Nível 3: ilimitado
    4: Infinity,    // Nível 4: ilimitado
    5: Infinity,    // Nível 5: ilimitado
    6: Infinity,    // Nível 6: ilimitado
    7: Infinity,    // Nível 7: ilimitado
    8: Infinity,    // Nível 8: ilimitado
    9: Infinity,    // Nível 9: ilimitado
    10: Infinity    // Nível 10: ilimitado
};
