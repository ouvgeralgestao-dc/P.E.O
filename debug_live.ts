
import { getOrgaoMetadata, addOrganogramaFuncoes, getOrganogramaFuncoes, getOrgaoIdByName } from './backend/services/sqliteStorageService.js';
import { dbAsync } from './backend/database/db.js';

async function testLive() {
    try {
        console.log("=== TESTE LIVE DO CÓDIGO ATUAL (TS) ===");

        // 1. Verificar ID
        const fakeName = 'Secretaria Municipal de Fazenda';
        const id = await getOrgaoIdByName(fakeName);
        console.log(`1. ID Recuperado para '${fakeName}': ${id}`);

        if (!id) throw new Error("ID não encontrado. Abortando.");

        // 2. Verificar Metadados (Datas)
        console.log("\n2. Testando getOrgaoMetadata...");
        const meta = await getOrgaoMetadata(id) as any;
        console.log("Retorno Metadata:", meta);

        if (meta.createdAt && meta.createdAt.toString().includes('T')) {
            console.log("✅ Data CreatedAt está em formato ISO!");
        } else {
            console.error("❌ Data CreatedAt INVÁLIDA:", meta.createdAt);
        }

        // 3. Simular Salvamento com 'nomeCargo' (formato novo)
        console.log("\n3. Simulando Salvamento de Funcional...");
        const payload = {
            tamanhoFolha: 'A3',
            cargos: [
                {
                    nomeCargo: 'TESTE_CARGO_RIGOROSO', // Campo que estava falhando
                    nome: 'NOME_ANTIGO_IGNORAR',
                    ocupante: 'TESTE_OCUPANTE',
                    hierarquia: "1",
                    simbolos: [{ tipo: 'DAS-Test', quantidade: 1 }],
                    position: { x: 100, y: 100 },
                    style: {}
                } as any
            ]
        };

        const saveResult = await addOrganogramaFuncoes(id, 'Versao Debug', payload);
        console.log("Save Result:", saveResult);

        // 4. Ler de volta
        console.log("\n4. Lendo Organograma Funcional...");
        const func = await getOrganogramaFuncoes(id, saveResult.id);

        const cargoSalvo = func.cargos[0];
        console.log("Cargo Lido:", cargoSalvo);

        if (cargoSalvo.data.label === 'TESTE_CARGO_RIGOROSO') {
            console.log("✅ Nome do cargo salvo CORRETAMENTE (leu nomeCargo)!");
        } else if (cargoSalvo.data.label === 'NOME_ANTIGO_IGNORAR') {
            console.error("❌ Leu o campo 'nome' antigo!");
        } else {
            console.error("❌ Leu valor inesperado:", cargoSalvo.data.label);
        }

    } catch (e: any) {
        console.error("ERRO FATAL:", e);
    }
}

testLive();
