/**
 * Utilitários de formatação de strings e dados para o frontend.
 */

/**
 * Formata o nome do órgão para Title Case com exceções.
 * Ex: secretaria_municipal_de_governo -> Secretaria Municipal de Governo
 * 
 * @param {string} name - O nome original
 * @returns {string} O nome formatado
 */
export const formatOrgaoName = (name) => {
    if (!name) return '';

    // Lista de preposições e artigos que devem permanecer em minúsculo (exceto no início)
    const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com', 'a', 'o', 'as', 'os'];

    return name
        .split(/([\s_+/-]+)/) // Divide capturando os separadores
        .map((word, index, array) => {
            const lowerWord = word.toLowerCase();

            // Se for apenas o separador, converte para espaço
            if (/[\s_+/-]+/.test(word)) return ' ';

            // Determinar se é a primeira palavra REAL
            const previousWords = array.slice(0, index).filter(item => !/[\s_+/-]+/.test(item));
            const isFirstWord = previousWords.length === 0;

            if (!isFirstWord && prepositions.includes(lowerWord)) {
                return lowerWord;
            }

            // Capitaliza a primeira letra e o resto minúsculo
            return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        })
        .join('')
        .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
        .trim();
};

/**
 * Normaliza o nome do cargo para agrupar similares.
 * Remove (a), (o), remove Preposição duplicada, etc.
 * 
 * @param {string} name 
 * @returns {string}
 */
export const normalizeRoleName = (name) => {
    if (!name) return '';

    return name
        .replace(/\([ao]\)/gi, '') // Remove (a), (o)
        .replace(/_/g, ' ') // Remove _
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
};
