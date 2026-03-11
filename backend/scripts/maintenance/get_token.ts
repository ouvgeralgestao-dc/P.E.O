
import { client } from '../src/db/index.js';
const req = client.prepare("SELECT token FROM solicitacoes_cadastro WHERE status = 'pendente' LIMIT 1").get();
if (req) console.log(`TOKEN:${req.token}`);
