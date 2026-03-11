
import { client } from '../src/db/index.js';

console.log('--- Buscando Solicitações Pendentes ---');

const requests = client.prepare("SELECT * FROM solicitacoes_cadastro WHERE status = 'pendente'").all();

requests.forEach((req: any) => {
    console.log(`\nSolicitante: ${req.nome} (${req.email})`);
    console.log(`Token: ${req.token}`);
    console.log(`Link: http://localhost:5173/admin/aprovar-cadastro/${req.token}`);
});

if (requests.length === 0) {
    console.log('Nenhuma solicitação pendente.');
}
