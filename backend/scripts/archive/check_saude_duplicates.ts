
import { client } from '../src/db/index.js';

console.log('--- Verificando Duplicatas de Saúde ---');
const orgaos = client.prepare("SELECT * FROM orgaos WHERE nome = 'Secretaria Municipal de Saúde'").all();
console.log('Órgãos encontrados:', JSON.stringify(orgaos, null, 2));

orgaos.forEach((o: any) => {
    const setores = client.prepare("SELECT count(*) as qtd FROM setores WHERE orgao_id = ?").get(o.id);
    console.log(`\nID: ${o.id}`);
    console.log(`Setores: ${setores.qtd}`);
});
