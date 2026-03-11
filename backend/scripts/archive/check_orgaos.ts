
import { client } from '../src/db/index.js';

const orgaos = client.prepare('SELECT * FROM orgaos').all();
console.log('--- Órgãos Atuais ---');
orgaos.forEach((o: any) => {
    console.log(`ID: ${o.id} | Nome: ${o.orgao}`);
});
