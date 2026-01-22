// Teste direto da função getOrgaoEstrutural
import * as storageService from '../backend/services/sqliteStorageService.js';

const test = async () => {
    try {
        console.log('Testando getOrgaoEstrutural...');
        const result = await storageService.getOrgaoEstrutural('secretaria_municipal_de_governo');
        console.log('Resultado:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('ERRO:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
};

test();
