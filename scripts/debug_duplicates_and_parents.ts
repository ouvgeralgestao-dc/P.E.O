
import { dbAsync } from '../backend/database/db.js';

async function audit() {
    console.log("=== AUDITORIA DE DUPLICATAS ===");
    const orgaos = await dbAsync.all('SELECT id, nome FROM orgaos');
    const nomeCount = {};
    orgaos.forEach(o => {
        nomeCount[o.nome] = (nomeCount[o.nome] || 0) + 1;
    });

    const duplicados = Object.entries(nomeCount).filter(([k, v]) => v > 1);

    if (duplicados.length > 0) {
        console.log("⚠️ ÓRGÃOS DUPLICADOS ENCONTRADOS:");
        for (const [nome, count] of duplicados) {
            console.log(`- "${nome}": ${count} registros`);
            const ids = orgaos.filter(o => o.nome === nome).map(o => o.id);
            console.log(`  IDs: ${ids.join(', ')}`);

            // Verificar conteúdo de cada um
            for (const id of ids) {
                const estrutural = await dbAsync.get('SELECT count(*) as qtd FROM setores WHERE orgao_id = ?', [id]);
                const funcionais = await dbAsync.get('SELECT count(*) as qtd FROM diagramas_funcionais WHERE orgao_id = ?', [id]);
                console.log(`    [${id}]: Estrutural=${estrutural.qtd}, Funcionais=${funcionais.qtd}`);
            }
        }
    } else {
        console.log("✅ Nenhum órgão duplicado encontrado.");
    }

    console.log("\n=== AUDITORIA DE HIERARQUIA FUNCIONAL (NÍVEL 2+ SEM PAI) ===");
    // Buscar cargos de nível 2 ou mais que não tenham pai (Orphans)
    const orfaos = await dbAsync.all(`
        SELECT c.id, c.nome_cargo, c.hierarquia, c.diagrama_id
        FROM cargos_funcionais c
        WHERE CAST(c.hierarquia AS INTEGER) > 1 AND c.parent_id IS NULL
    `);

    if (orfaos.length > 0) {
        console.log(`⚠️ ${orfaos.length} CARGOS ÓRFÃOS ENCONTRADOS (Nível > 1 mas sem pai):`);
        orfaos.slice(0, 10).forEach(o => console.log(`- ${o.nome_cargo} (Nível ${o.hierarquia}) [Diagrama: ${o.diagrama_id}]`));
    } else {
        console.log("✅ Hierarquia parece consistente (sem órfãos óbvios).");
    }

    console.log("\n=== AUDITORIA DE PARENT_ID INVÁLIDO ===");
    // Buscar cargos cujo pai não existe no mesmo diagrama
    const parentInvalido = await dbAsync.all(`
        SELECT c.id, c.nome_cargo, c.parent_id, c.diagrama_id
        FROM cargos_funcionais c
        WHERE c.parent_id IS NOT NULL 
        AND c.parent_id NOT IN (SELECT id FROM cargos_funcionais WHERE diagrama_id = c.diagrama_id)
    `);

    if (parentInvalido.length > 0) {
        console.log(`⚠️ ${parentInvalido.length} PARENT_IDs INVÁLIDOS (Link quebrado):`);
        parentInvalido.slice(0, 10).forEach(o => console.log(`- ${o.nome_cargo} aponta para ${o.parent_id} (inexistente)`));
    } else {
        console.log("✅ Links de Parent ID parecem válidos.");
    }
}

audit();
