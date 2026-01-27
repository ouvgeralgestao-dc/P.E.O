
import { client } from '../src/db/index.js';
import { formatTitleCase } from '../src/utils/formatters.js';

console.log('--- Iniciando Correção de Nomes dos Órgãos ---');

// Buscar todos os órgãos
const orgaos = client.prepare('SELECT id, nome FROM orgaos').all();

const updateStmt = client.prepare('UPDATE orgaos SET nome = ? WHERE id = ?');

let count = 0;

client.transaction(() => {
    orgaos.forEach((o: any) => {
        // Formatar o nome: remove underscores e aplica Title Case
        // Primeiro substitui underscore por espaço
        let cleanName = o.nome.replace(/_/g, ' ');
        // Aplica formatação
        let formattedName = formatTitleCase(cleanName);

        if (formattedName !== o.nome) {
            console.log(`[Correção] ID: ${o.id}`);
            console.log(`   De:   "${o.nome}"`);
            console.log(`   Para: "${formattedName}"`);
            
            updateStmt.run(formattedName, o.id);
            count++;
        }
    });
})();

console.log(`--- Concluído: ${count} órgãos atualizados. ---`);
