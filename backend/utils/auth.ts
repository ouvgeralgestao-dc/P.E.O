import crypto from 'crypto';

/**
 * Gera hash e salt para a senha
 * @param {string} password 
 * @returns {{salt: string, hash: string}}
 */
export const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
};

/**
 * Verifica se a senha corresponde ao hash/salt armazenado
 * @param {string} password 
 * @param {string} salt 
 * @param {string} hash 
 * @returns {boolean}
 */
export const verifyPassword = (password, salt, hash) => {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
};
