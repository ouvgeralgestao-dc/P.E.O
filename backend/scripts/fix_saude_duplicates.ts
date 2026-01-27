
import { client } from '../src/db/index.js';

console.log('--- Removendo Secretaria de Saúde Duplicada ---');

const deleteStmt = client.prepare("DELETE FROM orgaos WHERE nome = 'Secretaria Municipal de Saúde'");
const info = deleteStmt.run();

console.log(`Registros deletados da tabela 'orgaos': ${info.changes}`);

// Verificar se sobrou algo
const leftover = client.prepare("SELECT * FROM orgaos WHERE nome = 'Secretaria Municipal de Saúde'").all();
if (leftover.length === 0) {
    console.log('✅ Limpeza concluída com sucesso.');
} else {
    console.log('⚠️ Ainda existem registros:', leftover);
}
