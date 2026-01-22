/**
 * Utilitários de Validação Frontend
 */
import { QUANTIDADE_MAXIMA_DAS } from '../constants/cargosDAS';
import { SIMBOLOS_POR_NIVEL } from '../constants/hierarchyLevels';

/**
 * Valida regras de quantidade máxima de cargos DAS
 * @param {string} tipoCargo - Tipo do cargo (ex: 'DAS-9')
 * @param {number} quantidade - Quantidade solicitada
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateQuantidadeDAS = (tipoCargo, quantidade) => {
    const maxima = QUANTIDADE_MAXIMA_DAS[tipoCargo];

    if (!maxima) {
        return {
            valid: false,
            message: `Tipo de cargo "${tipoCargo}" não reconhecido`
        };
    }

    if (quantidade > maxima) {
        return {
            valid: false,
            message: `${tipoCargo} permite no máximo ${maxima} cargo(s) por setor`
        };
    }

    return {
        valid: true,
        message: ''
    };
};

/**
 * Valida regras de símbolos por nível hierárquico
 * @param {number} hierarquia - Nível hierárquico (0-10)
 * @param {number} quantidadeSimbolos - Quantidade de símbolos
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateSimbolosPorNivel = (hierarquia, quantidadeSimbolos) => {
    const maxima = SIMBOLOS_POR_NIVEL[hierarquia];

    if (maxima === undefined) {
        return {
            valid: false,
            message: `Hierarquia ${hierarquia} não reconhecida`
        };
    }

    if (maxima === Infinity) {
        return {
            valid: true,
            message: ''
        };
    }

    if (quantidadeSimbolos > maxima) {
        return {
            valid: false,
            message: `Nível ${hierarquia} permite no máximo ${maxima} símbolo(s)`
        };
    }

    return {
        valid: true,
        message: ''
    };
};

/**
 * Valida hierarquia (0-10)
 * @param {number} hierarquia - Nível hierárquico
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateHierarquia = (hierarquia) => {
    const nivel = parseInt(hierarquia);

    if (isNaN(nivel)) {
        return {
            valid: false,
            message: 'Hierarquia deve ser um número'
        };
    }

    if (nivel < 0 || nivel > 10) {
        return {
            valid: false,
            message: 'Hierarquia deve estar entre 0 (Assessoria) e 10'
        };
    }

    return {
        valid: true,
        message: ''
    };
};

/**
 * Valida nome de setor/cargo (não vazio, mínimo 3 caracteres)
 * @param {string} nome - Nome do setor ou cargo
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateNome = (nome) => {
    if (!nome || nome.trim().length === 0) {
        return {
            valid: false,
            message: 'Nome é obrigatório'
        };
    }

    if (nome.trim().length < 3) {
        return {
            valid: false,
            message: 'Nome deve ter no mínimo 3 caracteres'
        };
    }

    return {
        valid: true,
        message: ''
    };
};

/**
 * Valida formulário de setor completo
 * @param {Object} setor - Dados do setor
 * @returns {Object} - { valid: boolean, errors: Object }
 */
export const validateSetor = (setor) => {
    const errors = {};

    // Validar nome
    const nomeValidation = validateNome(setor.nomeSetor);
    if (!nomeValidation.valid) {
        errors.nomeSetor = nomeValidation.message;
    }

    // Validar hierarquia
    const hierarquiaValidation = validateHierarquia(setor.hierarquia);
    if (!hierarquiaValidation.valid) {
        errors.hierarquia = hierarquiaValidation.message;
    }

    // Validar cargos (OPCIONAIS - apenas valida se existirem)
    if (setor.cargos && setor.cargos.length > 0) {
        // Validar cada cargo
        setor.cargos.forEach((cargo, index) => {
            const cargoValidation = validateQuantidadeDAS(cargo.tipo, cargo.quantidade);
            if (!cargoValidation.valid) {
                errors[`cargo_${index}`] = cargoValidation.message;
            }
        });

        // Validar quantidade TOTAL de símbolos por nível (somar quantidades)
        const totalSimbolos = setor.cargos.reduce((sum, cargo) => sum + (cargo.quantidade || 0), 0);
        const simbolosValidation = validateSimbolosPorNivel(setor.hierarquia, totalSimbolos);
        if (!simbolosValidation.valid) {
            errors.simbolos = simbolosValidation.message;
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida formulário de cargo completo (modo funções)
 * @param {Object} cargo - Dados do cargo
 * @returns {Object} - { valid: boolean, errors: Object }
 */
export const validateCargo = (cargo) => {
    const errors = {};

    // Validar nome
    const nomeValidation = validateNome(cargo.nomeCargo);
    if (!nomeValidation.valid) {
        errors.nomeCargo = nomeValidation.message;
    }

    // Validar hierarquia
    const hierarquiaValidation = validateHierarquia(cargo.hierarquia);
    if (!hierarquiaValidation.valid) {
        errors.hierarquia = hierarquiaValidation.message;
    }

    // Validar símbolos
    if (!cargo.simbolos || cargo.simbolos.length === 0) {
        errors.simbolos = 'Pelo menos um símbolo é obrigatório';
    } else {
        // Validar cada símbolo
        cargo.simbolos.forEach((simbolo, index) => {
            const simboloValidation = validateQuantidadeDAS(simbolo.tipo, simbolo.quantidade);
            if (!simboloValidation.valid) {
                errors[`simbolo_${index}`] = simboloValidation.message;
            }
        });
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};
