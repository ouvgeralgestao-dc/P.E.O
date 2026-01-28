import * as storageService from './backend/services/sqliteStorageService.js';
import * as fileSystem from './backend/utils/fileSystem.js';

async function testBusca() {
    const nomes = [
        'Secretaria de Governo',
        'SECRETARIA DE GOVERNO',
        'Secretaria Municipal de Governo',
        'Secretaria de Governo '
    ];

    for (const nome of nomes) {
        const idByName = await storageService.getOrgaoIdByName(nome);
        const normalized = fileSystem.normalizeOrgaoId(nome);
        console.log(`Nome: [${nome}]`);
        console.log(`  - getOrgaoIdByName: ${idByName}`);
        console.log(`  - normalizeOrgaoId: ${normalized}`);
    }
    process.exit(0);
}

testBusca();
