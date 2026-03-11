
import { client } from '../src/db/index.js';

console.log('--- Diagnóstico de Nomes ---');
const orgaos = client.prepare("SELECT id, nome FROM orgaos WHERE nome LIKE 'Secretaria%'").all();
console.log(JSON.stringify(orgaos, null, 2));
