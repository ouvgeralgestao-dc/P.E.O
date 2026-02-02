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
    0: '#C0C0C0',    // Assessoria - Prata (Legend)
    0.5: '#E0E0E0',  // Subprefeito - Cinza
    1: '#4ECDC4',    // Nível 1 - Verde Água (Legend)
    2: '#45B7D1',    // Nível 2 - Azul Cyan (Legend)
    3: '#96CEB4',    // Nível 3 - Verde Menta (Legend)
    4: '#96CEB4',    // Nível 4+ - Verde Menta (Legend)
    5: '#96CEB4',
    6: '#96CEB4',
    7: '#96CEB4',
    8: '#96CEB4',
    9: '#96CEB4',
    10: '#96CEB4'
};

export const HIERARCHY_BORDERS = {
    0: '#9E9E9E',
    0.5: '#9E9E9E',
    1: '#3DBDB4', // Escuro de #4ECDC4
    2: '#2C8E9E', // Escuro de #45B7D1
    3: '#76A08A', // Escuro de #96CEB4
    4: '#76A08A',
    5: '#76A08A',
    6: '#76A08A',
    7: '#76A08A',
    8: '#76A08A',
    9: '#76A08A',
    10: '#76A08A'
};

// Tipos de setor por nível hierárquico
// Lista completa de tipos para níveis 1-10
const ALL_SETOR_TYPES = [
    'Secretaria', 'Presidência', 'Procuradoria',
    'Superintendência', 'Subprocuradoria', 'Subsecretaria',
    'Diretoria', 'Gerência', 'Coordenação', 'Assessor(a)',
    'Divisão', 'Departamento', 'Seção', 'Núcleo',
    'Setor', 'Unidade', 'Protocolo', 'Gabinete'
];

// Tipos de setor por nível hierárquico
export const SETOR_TYPES = {
    0: ['Assessoria', 'Assessor(a)', 'Gabinete', 'Consultoria'],
    0.5: ['Subprefeitura'],  // Apenas Subprefeitura
    1: ALL_SETOR_TYPES,
    2: ALL_SETOR_TYPES,
    3: ALL_SETOR_TYPES,
    4: ALL_SETOR_TYPES,
    5: ALL_SETOR_TYPES,
    6: ALL_SETOR_TYPES,
    7: ALL_SETOR_TYPES,
    8: ALL_SETOR_TYPES,
    9: ALL_SETOR_TYPES,
    10: ALL_SETOR_TYPES
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
