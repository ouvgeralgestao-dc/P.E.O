import { dbAsync } from './backend/database/db.js';

async function checkConselho() {
    console.log('=== Verificando Conselho de Contribuintes ===\n');
    
    try {
        // Verificar na tabela orgaos
        const orgao = await dbAsync.get('SELECT * FROM orgaos WHERE id = ?', ['conselho_de_contribuintes']);
        console.log('1. Tabela orgaos:', orgao || 'NÃO ENCONTRADO ✅');
        
        // Verificar por nome
        const orgaoByName = await dbAsync.get('SELECT * FROM orgaos WHERE UPPER(nome) = UPPER(?)', ['Conselho de Contribuintes']);
        console.log('2. Busca por nome:', orgaoByName || 'NÃO ENCONTRADO ✅');
        
        // Verificar organogramas estruturais
        const estrutural = await dbAsync.get('SELECT * FROM organogramas_estruturais WHERE orgao_id = ?', ['conselho_de_contribuintes']);
        console.log('3. Organograma estrutural:', estrutural || 'NÃO ENCONTRADO ✅');
        
        // Verificar setores
        const setores = await dbAsync.get('SELECT COUNT(*) as count FROM setores WHERE orgao_id = ?', ['conselho_de_contribuintes']);
        console.log('4. Setores:', setores.count > 0 ? `${setores.count} encontrados ❌` : 'NÃO ENCONTRADO ✅');
        
        // Listar todos os órgãos
        console.log('\n=== Todos os órgãos no banco ===');
        const allOrgaos = await dbAsync.all('SELECT id, nome FROM orgaos ORDER BY nome');
        console.log(`Total: ${allOrgaos.length} órgãos`);
        
        // Procurar por "conselho"
        const conselhos = allOrgaos.filter(o => o.nome.toLowerCase().includes('conselho'));
        console.log(`\nÓrgãos com "conselho" no nome: ${conselhos.length}`);
        conselhos.forEach(o => console.log(`  - ${o.nome} (${o.id})`));
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

checkConselho();
