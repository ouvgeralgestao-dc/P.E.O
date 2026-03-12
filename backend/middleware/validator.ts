import { body, validationResult } from 'express-validator';

// Regras de quantidade máxima por tipo de cargo DAS
const CARGO_MAX_QUANTITY = {
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

const SIMBOLOS_POR_NIVEL = {
    0: Infinity, // Assessoria - ilimitado
    0.5: Infinity, // Subprefeitura - ilimitado
    1: Infinity, // Nível 1 - ilimitado
    2: Infinity, // Nível 2 - ilimitado
    3: Infinity, // Nível 3 - ilimitado
    4: Infinity, // Nível 4 - ilimitado
    5: Infinity, // Nível 5 - ilimitado
    6: Infinity, // Nível 6 - ilimitado
    7: Infinity, // Nível 7 - ilimitado
    8: Infinity, // Nível 8 - ilimitado
    9: Infinity, // Nível 9 - ilimitado
    10: Infinity // Nível 10 - ilimitado
};

/**
 * Valida regras de cargos DAS
 * @param {Array} cargos - Array de cargos
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateCargosDAS = (cargos) => {
    const errors = [];

    for (const cargo of cargos) {
        const maxQty = CARGO_MAX_QUANTITY[cargo.tipo];

        // Se o cargo não está na lista fixa de DAS, ignoramos a validação de quantidade máxima
        // Isso permite cargos dinâmicos ou cargos DAS identificados pelo nome rico
        if (!maxQty) {
            // Log informativo apenas, sem bloquear a criação
            // console.log(`[Validator] Ignorando limite máximo para cargo customizado: ${cargo.tipo}`);
            continue;
        }

        if (cargo.quantidade > maxQty) {
            errors.push(
                `${cargo.tipo} permite no máximo ${maxQty} cargo(s) por setor. Você tentou adicionar ${cargo.quantidade}.`
            );
        }

        if (cargo.quantidade < 1) {
            errors.push(`Quantidade deve ser no mínimo 1 para ${cargo.tipo}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Valida quantidade de símbolos por nível hierárquico
 * @param {number} hierarquia - Nível hierárquico (0-10)
 * @param {Array} cargos - Array de cargos/símbolos
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateSimbolosPorNivel = (hierarquia, cargos) => {
    const errors = [];
    const maxSimbolos = SIMBOLOS_POR_NIVEL[hierarquia];

    if (maxSimbolos === undefined) {
        errors.push(`Hierarquia inválida: ${hierarquia}. Deve ser entre 0 (Assessoria) e 10.`);
        return { valid: false, errors };
    }

    // Somar QUANTIDADES de símbolos, não contar tipos
    const totalSimbolos = cargos.reduce((sum, cargo) => sum + (cargo.quantidade || 0), 0);

    if (maxSimbolos !== Infinity && totalSimbolos > maxSimbolos) {
        const nivelNome = hierarquia === 0 ? 'Assessoria' : `Nível ${hierarquia}`;
        errors.push(
            `${nivelNome} permite apenas ${maxSimbolos} símbolo(s). Você tentou adicionar ${totalSimbolos}.`
        );
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Middleware de validação para criação de organograma estrutural
 */
export const validateOrganogramaEstrutural = [
    body('nomeOrgao')
        .notEmpty().withMessage('Nome do órgão é obrigatório')
        .isString().withMessage('Nome do órgão deve ser texto'),

    body('tamanhoFolha')
        .notEmpty().withMessage('Tamanho da folha é obrigatório')
        .isIn(['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'])
        .withMessage('Tamanho de folha inválido. Use: A0, A1, A2, A3, A4, A5 ou A6'),

    body('setores')
        .isArray({ min: 1 }).withMessage('Deve haver pelo menos 1 setor'),

    body('setores.*.tipoSetor')
        .notEmpty().withMessage('Tipo de setor é obrigatório'),

    body('setores.*.nomeSetor')
        .notEmpty().withMessage('Nome do setor é obrigatório'),

    body('setores.*.hierarquia')
        .isFloat({ min: 0, max: 10 }).withMessage('Hierarquia deve ser entre 0 (Assessoria) e 10. Subprefeituras usam 0.5.'),

    body('setores.*.cargos')
        .isArray().withMessage('Cargos deve ser um array'),

    body('setores.*.style')
        .optional()
        .isObject().withMessage('Style deve ser um objeto com propriedades CSS'),

    // Validação customizada
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erro de validação',
                errors: errors.array()
            });
        }

        // Validar regras DAS e símbolos por nível
        const validationErrors = [];

        for (const setor of req.body.setores) {
            // Validar regras DAS
            const dasValidation = validateCargosDAS(setor.cargos || []);
            if (!dasValidation.valid) {
                validationErrors.push(...dasValidation.errors.map(err => ({
                    setor: setor.nomeSetor,
                    erro: err
                })));
            }

            // Validar símbolos por nível
            const simbolosValidation = validateSimbolosPorNivel(setor.hierarquia, setor.cargos || []);
            if (!simbolosValidation.valid) {
                validationErrors.push(...simbolosValidation.errors.map(err => ({
                    setor: setor.nomeSetor,
                    erro: err
                })));
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Erro de validação de regras DAS e hierarquia',
                errors: validationErrors
            });
        }

        next();
    }
];

/**
 * Middleware de validação para ATUALIZAÇÃO de organograma estrutural
 * (Não valida nomeOrgao pois vem na URL)
 */
export const validateUpdateOrganogramaEstrutural = [
    body('tamanhoFolha')
        .notEmpty().withMessage('Tamanho da folha é obrigatório')
        .isIn(['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'])
        .withMessage('Tamanho de folha inválido. Use: A0, A1, A2, A3, A4, A5 ou A6'),

    body('setores')
        .isArray().withMessage('Setores deve ser um array'),

    body('setores.*.tipoSetor')
        .notEmpty().withMessage('Tipo de setor é obrigatório'),

    body('setores.*.nomeSetor')
        .notEmpty().withMessage('Nome do setor é obrigatório'),

    body('setores.*.hierarquia')
        .isFloat({ min: 0, max: 10 }).withMessage('Hierarquia deve ser entre 0 (Assessoria) e 10. Subprefeituras usam 0.5.'),

    body('setores.*.cargos')
        .isArray().withMessage('Cargos deve ser um array'),

    body('setores.*.style')
        .optional()
        .isObject().withMessage('Style deve ser um objeto com propriedades CSS'),

    // Validação customizada
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('[Validator] Erros de validação (Update Estrutura):', JSON.stringify(errors.array(), null, 2));
            return res.status(400).json({
                success: false,
                message: 'Erro de validação',
                errors: errors.array()
            });
        }

        // Validar regras DAS e símbolos por nível
        const validationErrors = [];

        for (const setor of req.body.setores) {
            // Validar regras DAS
            const dasValidation = validateCargosDAS(setor.cargos || []);
            if (!dasValidation.valid) {
                validationErrors.push(...dasValidation.errors.map(err => ({
                    setor: setor.nomeSetor,
                    erro: err
                })));
            }

            // Validar símbolos por nível
            const simbolosValidation = validateSimbolosPorNivel(setor.hierarquia, setor.cargos || []);
            if (!simbolosValidation.valid) {
                validationErrors.push(...simbolosValidation.errors.map(err => ({
                    setor: setor.nomeSetor,
                    erro: err
                })));
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Erro de validação de regras DAS e hierarquia',
                errors: validationErrors
            });
        }

        next();
    }
];

/**
 * Middleware de validação para criação de organograma de funções
 */
export const validateOrganogramaFuncoes = [
    body('nomeOrgao')
        .notEmpty().withMessage('Nome do órgão é obrigatório'),

    body('tamanhoFolha')
        .notEmpty().withMessage('Tamanho da folha é obrigatório')
        .isIn(['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'])
        .withMessage('Tamanho de folha inválido'),

    body('cargos')
        .isArray({ min: 1 }).withMessage('Deve haver pelo menos 1 cargo'),

    body('cargos.*.nomeCargo')
        .notEmpty().withMessage('Nome do cargo é obrigatório')
        .isLength({ max: 500 }).withMessage('Nome do cargo deve ter no máximo 500 caracteres'),

    body('cargos.*.hierarquia')
        .isFloat({ min: 0, max: 10 }).withMessage('Hierarquia deve ser entre 0 e 10'),

    body('cargos.*.simbolos')
        .isArray().withMessage('Símbolos deve ser um array'),

    // Validação customizada
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erro de validação',
                errors: errors.array()
            });
        }

        // Validar regras DAS e símbolos por nível
        const validationErrors = [];

        for (const cargo of req.body.cargos) {
            // Validar regras DAS
            const dasValidation = validateCargosDAS(cargo.simbolos || []);
            if (!dasValidation.valid) {
                validationErrors.push(...dasValidation.errors.map(err => ({
                    cargo: cargo.nomeCargo,
                    erro: err
                })));
            }

            // Validar símbolos por nível
            const simbolosValidation = validateSimbolosPorNivel(cargo.hierarquia, cargo.simbolos || []);
            if (!simbolosValidation.valid) {
                validationErrors.push(...simbolosValidation.errors.map(err => ({
                    cargo: cargo.nomeCargo,
                    erro: err
                })));
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Erro de validação de regras DAS e hierarquia',
                errors: validationErrors
            });
        }

        next();
    }
];

/**
 * Middleware de validação para ATUALIZAÇÃO de organograma de funções
 */
export const validateUpdateOrganogramaFuncoes = [
    body('tamanhoFolha')
        .notEmpty().withMessage('Tamanho da folha é obrigatório')
        .isIn(['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'])
        .withMessage('Tamanho de folha inválido'),

    body('cargos')
        .isArray().withMessage('Cargos deve ser um array'),

    body('cargos.*')
        .custom((cargo) => {
            const nome = cargo.nomeCargo || cargo.nome || cargo.label || cargo.data?.label;
            if (!nome || typeof nome !== 'string' || !nome.trim()) {
                throw new Error('Nome do cargo é obrigatório');
            }
            if (nome.length > 500) {
                throw new Error('Nome do cargo deve ter no máximo 500 caracteres');
            }
            return true;
        }),

    body('cargos.*.hierarquia')
        .customSanitizer(value => parseFloat(value))
        .isFloat({ min: 0, max: 10 }).withMessage('Hierarquia deve ser entre 0 e 10'),

    // Validação customizada para aceitar simbolos (array) OU simbolo (string) + quantidade (number)
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('[Validator] Erros de validação (Update Funcoes):', JSON.stringify(errors.array(), null, 2));
            return res.status(400).json({
                success: false,
                message: 'Erro de validação',
                errors: errors.array()
            });
        }

        const validationErrors = [];

        for (const cargo of req.body.cargos) {
            // Normalizar para validação: se tiver simbolo+quantidade, converter em array temporário
            let simbolosParaValidar = [];

            if (Array.isArray(cargo.simbolos)) {
                simbolosParaValidar = cargo.simbolos;
            } else if (cargo.simbolo && cargo.quantidade !== undefined) {
                simbolosParaValidar = [{ tipo: cargo.simbolo, quantidade: cargo.quantidade }];
            } else {
                validationErrors.push({
                    cargo: cargo.nomeCargo,
                    erro: 'Cargo deve conter um array de "simbolos" ou um par "simbolo"/"quantidade"'
                });
                continue;
            }

            // Validar regras DAS
            const dasValidation = validateCargosDAS(simbolosParaValidar);
            if (!dasValidation.valid) {
                validationErrors.push(...dasValidation.errors.map(err => ({
                    cargo: cargo.nomeCargo,
                    erro: err
                })));
            }

            // Validar símbolos por nível
            const simbolosValidation = validateSimbolosPorNivel(cargo.hierarquia, simbolosParaValidar);
            if (!simbolosValidation.valid) {
                validationErrors.push(...simbolosValidation.errors.map(err => ({
                    cargo: cargo.nomeCargo,
                    erro: err
                })));
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Erro de validação de regras DAS e hierarquia',
                errors: validationErrors
            });
        }

        next();
    }
];
