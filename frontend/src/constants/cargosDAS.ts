/**
 * Constantes de Cargos DAS (Direção e Assessoramento Superior)
 */

// Lista de cargos DAS disponíveis
export const CARGOS_DAS = [
    'DAS-S',  // Secretário
    'DAS-9',
    'DAS-8',
    'DAS-7',
    'DAS-6',
    'DAS-5',
    'DAS-4',
    'DAS-3',
    'DAS-2',
    'DAS-1',
    'FC-1'    // Função Comissionada
];

// Regras de quantidade máxima por cargo
export const QUANTIDADE_MAXIMA_DAS = {
    'DAS-S': 1,
    'DAS-9': 1,
    'DAS-8': 1,
    'DAS-7': 10000,
    'DAS-6': 10000,
    'DAS-5': 10000,
    'DAS-4': 10000,
    'DAS-3': 10000,
    'DAS-2': 10000,
    'DAS-1': 10000,
    'FC-1': 10000
};

// Descrições dos cargos
export const DESCRICOES_DAS = {
    'DAS-S': 'Secretário Municipal',
    'DAS-9': 'Subsecretário / Diretor Geral',
    'DAS-8': 'Diretor',
    'DAS-7': 'Coordenador',
    'DAS-6': 'Gerente / Chefe de Departamento',
    'DAS-5': 'Chefe de Divisão',
    'DAS-4': 'Chefe de Seção',
    'DAS-3': 'Supervisor',
    'DAS-2': 'Assistente',
    'DAS-1': 'Auxiliar',
    'FC-1': 'Função Comissionada'
};

// Símbolos visuais para cada cargo (para renderização)
export const SIMBOLOS_DAS = {
    'DAS-S': '⬛',
    'DAS-9': '⬛',
    'DAS-8': '⬛',
    'DAS-7': '▪',
    'DAS-6': '▪',
    'DAS-5': '▪',
    'DAS-4': '▫',
    'DAS-3': '▫',
    'DAS-2': '▫',
    'DAS-1': '○',
    'FC-1': '○'
};
