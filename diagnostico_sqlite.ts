
import { dbAsync } from './backend/database/db.js';

interface Orgao {
    id: string;
    nome: string;
    created_at: string;
    updated_at: string;
}

interface Diagrama {
    id: string;
    orgao_id: string;
    nome?: string;
    tamanho_folha?: string;
    created_at: string;
    updated_at: string;
}

interface Cargo {
    nome_cargo: string;
    ocupante: string;
    hierarquia: string;
    simbolos_json: string;
}

async function diagnostico() {
    try {
        console.log("=== DIAGNÓSTICO SQLITE (TS) ===");

        // 1. Listar Órgãos e Datas
        const orgaos = await dbAsync.all('SELECT id, nome, created_at, updated_at FROM orgaos') as Orgao[];
        console.log("\n--- ÓRGÃOS ---");
        orgaos.forEach(o => {
            console.log(`ID: ${o.id}, Nome: ${o.nome}`);
            console.log(`Created: '${o.created_at}' (Type: ${typeof o.created_at})`);
            console.log(`Updated: '${o.updated_at}'`);
        });

        // 2. Pegar organograma funcional da Fazenda (sec-fazenda ou pelo nome)
        const fazenda = orgaos.find(o => o.nome.includes('Fazenda'));
        if (fazenda) {
            console.log(`\n--- FUNCIONAL DE ${fazenda.nome} (${fazenda.id}) ---`);
            const diagrama = await dbAsync.get('SELECT * FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at DESC LIMIT 1', [fazenda.id]) as Diagrama;

            if (diagrama) {
                console.log(`Diagrama ID: ${diagrama.id}`);
                const cargos = await dbAsync.all('SELECT nome_cargo, ocupante, hierarquia, simbolos_json FROM cargos_funcionais WHERE diagrama_id = ?', [diagrama.id]) as Cargo[];
                console.log(`Total Cargos: ${cargos.length}`);
                if (cargos.length > 0) {
                    console.log("Amostra de Cargo 1:");
                    console.log(cargos[0]);
                    if (cargos[1]) {
                        console.log("Amostra de Cargo 2:");
                        console.log(cargos[1]);
                    }
                }
            } else {
                console.log("Nenhum diagrama funcional encontrado.");
            }
        }

    } catch (e) {
        console.error("Erro no diagnóstico:", e);
    }
}

diagnostico();
