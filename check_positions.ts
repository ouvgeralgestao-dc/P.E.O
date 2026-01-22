
import Database from 'better-sqlite3';

const db = new Database('backend/data/organograma.sqlite', { readonly: true });

console.log('=== 📊 SETORES (Estrutural) ===');
try {
    const setores = db.prepare('SELECT id, nome, position_json FROM setores WHERE orgao_id = ? LIMIT 10').all('secretaria_municipal_de_governo') as any[];
    setores.forEach(s => {
        console.log(`${s.nome}: ${s.position_json}`);
    });

    console.log('\n=== 💡 CARGOS FUNCIONAIS ===');
    const diagrama = db.prepare('SELECT id FROM diagramas_funcionais WHERE orgao_id = ? ORDER BY created_at DESC LIMIT 1').get('secretaria_municipal_de_governo') as any;

    if (diagrama) {
        const cargos = db.prepare('SELECT id, nome_cargo, position_json FROM cargos_funcionais WHERE diagrama_id = ? LIMIT 10').all(diagrama.id) as any[];
        cargos.forEach(c => {
            console.log(`${c.nome_cargo}: ${c.position_json}`);
        });
    } else {
        console.log('No functional diagram found for this organ.');
    }
} catch (e: any) {
    console.error('Error:', e.message);
} finally {
    db.close();
}
