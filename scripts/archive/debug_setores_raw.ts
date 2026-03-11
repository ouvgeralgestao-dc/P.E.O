
import { dbAsync } from '../backend/database/db.js';

const debug = async () => {
    try {
        console.log('--- DEBUG SETORES RAW ---');
        // Tentar pegar governo
        const orgaoId = 'sec-governo'; // ID padronizado novo ou antigo?
        // Vou buscar qualquer setor que tenha orgao_id parecido com governo

        const setores = await dbAsync.all(
            "SELECT id, orgao_id, nome, cargos_json, position_json FROM setores WHERE orgao_id LIKE '%governo%' LIMIT 3"
        );

        if (setores.length === 0) {
            console.log("Nenhum setor encontrado para 'governo'. Listando 5 setores quaisquer:");
            const random = await dbAsync.all("SELECT id, orgao_id, nome FROM setores LIMIT 5");
            console.table(random);
            return;
        }

        setores.forEach(s => {
            console.log(`\nSetor: ${s.nome} (${s.orgao_id})`);
            console.log(`Cargos Raw: ${s.cargos_json}`);
            console.log(`Position Raw: ${s.position_json}`);
        });

    } catch (err) {
        console.error(err);
    }
};

debug();
