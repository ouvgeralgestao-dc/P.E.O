
import { client } from '../src/db/index.js';
import { formatTitleCase } from '../utils/formatters.js';

console.log('--- [START] Normalizando Nomes de Órgãos ---');

try {
    const orgaos = client.prepare('SELECT id, nome FROM orgaos').all();
    const updateStmt = client.prepare('UPDATE orgaos SET nome = ? WHERE id = ?');

    let count = 0;

    const runTransaction = client.transaction(() => {
        orgaos.forEach((o: any) => {
            // Substituir underscores e hífens por espaços
            // Ex: "secretaria_municipal" -> "secretaria municipal"
            // Ex: "sec-assistencia" -> "sec assistencia"
            let cleanName = o.nome.replace(/[-_]/g, ' ');

            // Remover espaços extras
            cleanName = cleanName.replace(/\s+/g, ' ').trim();

            // Formatar para Title Case
            let formattedName = formatTitleCase(cleanName);

            // Ajustes manuais específicos (opcional, se formatTitleCase não cobrir tudo)
            // Ex: "Fundec" está ok. "Pgm" -> "PGM" talvez?
            if (formattedName.toUpperCase() === 'PGM') formattedName = 'PGM';
            if (formattedName.toUpperCase() === 'IPM') formattedName = 'IPM';
            if (formattedName.toUpperCase() === 'IPMDC') formattedName = 'IPMDC';
            if (formattedName.toUpperCase() === 'FUNLAR') formattedName = 'FUNLAR';

            if (formattedName !== o.nome) {
                console.log(`[FIX] ${o.id}:`);
                console.log(`      "${o.nome}" -> "${formattedName}"`);
                
                updateStmt.run(formattedName, o.id);
                count++;
            }
        });
    });

    runTransaction();
    console.log(`--- [DONE] ${count} órgãos atualizados com sucesso. ---`);

} catch (error) {
    console.error('Erro ao executar script:', error);
    process.exit(1);
}
