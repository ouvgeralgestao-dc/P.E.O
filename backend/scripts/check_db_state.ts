
import { client } from '../src/db/index.ts';

async function check() {
    try {
        console.log("🔍 Verificando Órgãos e Setores...");
        const orgaos = client.prepare("SELECT id, nome FROM orgaos").all() as any[];
        console.log(`Total de Órgãos: ${orgaos.length}`);

        for (const orgao of orgaos) {
            const count = client.prepare(`SELECT COUNT(*) as total FROM setores WHERE orgao_id = ?`).get(orgao.id) as { total: number };
            if (count.total > 0) {
                console.log(`Órgão: ${orgao.nome} (ID: ${orgao.id}) - Setores: ${count.total}`);
            }
        }

        const estruturais = client.prepare("SELECT COUNT(*) as total FROM organogramas_estruturais").get() as { total: number };
        console.log(`Total de registros em organogramas_estruturais: ${estruturais.total}`);

    } catch (e) {
        console.error("Erro ao ler banco:", e);
    }
}

check();
