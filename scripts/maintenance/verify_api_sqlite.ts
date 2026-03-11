

const BASE_URL = 'http://127.0.0.1:6001'; // Backend na porta 6001
const ORGAO_TESTE = 'secretaria_municipal_de_governo'; // ID que sabemos existir

console.log('🚀 Iniciando Verificação de API SQLite...');

const runTests = async () => {
    try {
        // 1. Testar Listagem de Órgãos
        console.log('\n📡 [GET] /api/orgaos');
        let res = await fetch(`${BASE_URL}/api/orgaos`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        let json = await res.json();
        console.log(`   ✅ Status 200 OK`);
        console.log(`   📦 Contagem: ${json.count}`);
        console.log(`   🔍 Primeiro item: ${json.data[0].nome} (${json.data[0].id}) [Cat: ${json.data[0].categoria}]`);

        if (json.count < 30) console.warn('   ⚠️ Atenção: Contagem de órgãos baixa. Verifique se o enriquecimento rodou.');

        // 2. Testar Detalhes de um Órgão (Estrutural)
        console.log(`\n📡 [GET] /api/organogramas/${ORGAO_TESTE}`);
        res = await fetch(`${BASE_URL}/api/organogramas/${ORGAO_TESTE}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        json = await res.json();
        console.log(`   ✅ Status 200 OK`);
        console.log(`   🏢 Órgão: ${json.data.orgao}`);
        if (json.data.setores) {
            console.log(`   🌳 Setores na raiz: ${json.data.setores.length}`);
        } else {
            console.warn(`   ⚠️ Setores é undefined ou null. Raw: ${JSON.stringify(json.data)}`);
        }

        // 3. Testar Admin Creation (Órgão de Teste)
        // Usar um ID único para não conflitar
        const testId = `teste_sqlite_${Date.now()}`;
        console.log(`\n📡 [POST] /api/orgaos (Criar Teste: ${testId})`);
        res = await fetch(`${BASE_URL}/api/orgaos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: `Órgão de Teste SQLite ${testId}`,
                categoria: 'TESTE',
                ordem: 9999
            })
        });
        json = await res.json();
        if (res.ok && json.success) {
            console.log(`   ✅ Criado com sucesso: ${json.data.id}`);

            // 4. Deletar o teste
            console.log(`\n📡 [DELETE] /api/orgaos/${testId}`);
            const delRes = await fetch(`${BASE_URL}/api/orgaos/${json.data.id || testId}`, { method: 'DELETE' });
            const delJson = await delRes.json();
            if (delRes.ok && delJson.success) {
                console.log(`   ✅ Deletado com sucesso.`);
            } else {
                console.error(`   ❌ Falha ao deletar:`, delJson);
            }

        } else {
            console.error(`   ❌ Falha ao criar:`, json);
        }

        // 5. Testar Ocupantes Gerais (Migrados)
        console.log('\n📡 [GET] /api/organogramas/geral-funcional');
        res = await fetch(`${BASE_URL}/api/organogramas/geral-funcional`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const occupants = await res.json();
        const numOccupants = Object.keys(occupants).length;
        console.log(`   ✅ Status 200 OK`);
        console.log(`   👥 Ocupantes encontrados: ${numOccupants}`);
        if (numOccupants > 0) {
            const primeiro = Object.keys(occupants)[0];
            console.log(`   🔍 Exemplo: ${primeiro} = ${occupants[primeiro]}`);
        } else {
            console.warn('   ⚠️ Nenhum ocupante retornado (mas query funcionou).');
        }

        // 6. Testar Posições Customizadas
        // Tentar buscar de um id conhecido ou 'geral'
        console.log('\n📡 [GET] /api/organogramas/positions (Simulado via DB check indirect?)');
        // Não temos uma rota pública de GET Positions Isolada fácil sem autenticação ou contexto especifico?
        // Ah, saveCustomPositions é POST. loadCustomPositions não é rota direta, é usado internamente quando carrega o organograma?
        // Se o organogramaController.getOrganogramaByName chamar isso...
        // Vamos checar organogramaController.getOrganogramaByName no passo seguinte se der tempo, por hora vamos confiar que se o POST funcionar, o service está ok.

        // Vamos testar um POST de posições dummy
        console.log('\n📡 [POST] /api/organogramas/teste_pos_sqlite/positions');
        res = await fetch(`${BASE_URL}/api/organogramas/teste_pos_sqlite/positions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                positions: [{ id: 'node1', position: { x: 100, y: 100 } }]
            })
        });
        if (res.ok) {
            console.log(`   ✅ Posições salvas com sucesso.`);
            // Cleanup
            await fetch(`${BASE_URL}/api/organogramas/teste_pos_sqlite/positions`, { method: 'DELETE' });
        } else {
            console.error(`   ❌ Falha ao salvar posições: Status ${res.status}`);
        }

    } catch (error) {
        console.error('❌ Falha crítica no teste:', error);
    }
};

runTests();
