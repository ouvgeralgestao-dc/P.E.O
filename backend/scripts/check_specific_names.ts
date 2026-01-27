
import { client } from '../src/db/index.js';

console.log('--- Verificando Casos Específicos ---');
// Buscar todos que contenham "governo" ou "saude"
const specific = client.prepare("SELECT id, nome FROM orgaos WHERE nome LIKE '%governo%' OR nome LIKE '%saude%' OR nome LIKE '%saúde%'").all();
console.log(JSON.stringify(specific, null, 2));

console.log('--- Verificando Conselhos ---');
const conselhos = client.prepare("SELECT id, nome FROM orgaos WHERE nome LIKE '%conselho%'").all();
console.log(JSON.stringify(conselhos, null, 2));
