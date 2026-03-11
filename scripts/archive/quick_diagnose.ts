// Script de diagnóstico direto - verificar dados brutos
import { dbAsync } from '../backend/database/db.js';

const diagnose = async () => {
    try {
        console.log('=== DIAGNÓSTICO RÁPIDO ===\n');

        // Contar órgãos
        const orgaosCount = await dbAsync.get('SELECT COUNT(*) as c FROM orgaos');
        console.log(`Total de Órgãos: ${orgaosCount.c}`);

        // Contar setores
        const setoresCount = await dbAsync.get('SELECT COUNT(*) as c FROM setores');
        console.log(`Total de Setores: ${setoresCount.c}`);

        // Listar setores com seus parentIds
        console.log('\n--- Setores com parentId ---');
        const setores = await dbAsync.all(`
            SELECT id, orgao_id, nome, parent_id 
            FROM setores 
            WHERE orgao_id LIKE '%governo%'
            LIMIT 10
        `);

        if (setores.length === 0) {
            console.log('NENHUM setor encontrado para "governo"!');

            // Listar qualquer setor
            const anySetores = await dbAsync.all('SELECT id, orgao_id, nome FROM setores LIMIT 5');
            console.log('\nSetores existentes (qualquer):');
            console.table(anySetores);
        } else {
            console.table(setores);

            // Verificar órfãos
            console.log('\n--- Verificando parentIds órfãos ---');
            const orphans = await dbAsync.all(`
                SELECT s1.id, s1.nome, s1.parent_id 
                FROM setores s1 
                WHERE s1.parent_id IS NOT NULL 
                AND s1.parent_id NOT IN (SELECT id FROM setores)
            `);

            if (orphans.length > 0) {
                console.log('⚠️ ÓRFÃOS ENCONTRADOS (parentId aponta para ID inexistente):');
                console.table(orphans);
            } else {
                console.log('✅ Nenhum órfão encontrado.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Erro:', err.message);
        process.exit(1);
    }
};

diagnose();
