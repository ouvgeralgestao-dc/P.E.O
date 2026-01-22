/**
 * Utilitários de formatação de texto para o backend
 */

/**
 * Formata texto para Title Case com exceções para preposições e contrações.
 * Preserva hífens e outros separadores.
 * 
 * @param {string} text - O texto original
 * @returns {string} O texto formatado
 */
export const formatTitleCase = (text) => {
    if (!text) return '';

    // Lista de preposições e artigos que devem permanecer em minúsculo (exceto no início)
    const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com', 'a', 'o', 'as', 'os'];

    return text
        .split(/([\s_+/-]+)/) // Divide capturando os separadores
        .map((word, index, array) => {
            const lowerWord = word.toLowerCase();

            // Se for apenas o separador, mantém como está
            if (/[\s_+/-]+/.test(word)) return word;

            // Determinar se é a primeira palavra REAL (não apenas o primeiro item do split)
            const previousWords = array.slice(0, index).filter(item => !/[\s_+/-]+/.test(item));
            const isFirstWord = previousWords.length === 0;

            if (!isFirstWord && prepositions.includes(lowerWord)) {
                return lowerWord;
            }

            // Capitaliza a primeira letra e força o resto para minúsculo
            return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        })
        .join('');
};
