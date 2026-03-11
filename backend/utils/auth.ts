import crypto from 'crypto';

/**
 * Gera hash e salt para a senha
 * @param {string} password 
 * @returns {{salt: string, hash: string}}
 */
export const hashPassword = (password) => {
    // Trim whitespace to prevent accidental spaces
    const cleanPassword = (password || '').trim();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(cleanPassword, salt, 1000, 64, 'sha512').toString('hex');
    console.log(`[AUTH] Hash criado para senha com ${cleanPassword.length} caracteres`);
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
    // Trim whitespace to prevent accidental spaces
    const cleanPassword = (password || '').trim();
    console.log(`[AUTH] Verificando senha com ${cleanPassword.length} caracteres | Salt: ${salt ? salt.substring(0, 8) + '...' : 'NULL'} | Hash: ${hash ? hash.substring(0, 8) + '...' : 'NULL'}`);

    if (!salt || !hash) {
        console.log('[AUTH] Salt ou Hash vazios - retornando false');
        return false;
    }

    const verifyHash = crypto.pbkdf2Sync(cleanPassword, salt, 1000, 64, 'sha512').toString('hex');
    const isMatch = hash === verifyHash;
    console.log(`[AUTH] Match: ${isMatch}`);
    return isMatch;
};
