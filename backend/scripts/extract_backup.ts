
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

try {
    const backupDbPath = 'c:/Users/CroSS/Desktop/Criador_Organograma/backup/backup_completo_14.01.26/Criador_Organograma/backend/data/organograma.sqlite';
    const outputPath = 'c:/Users/CroSS/Desktop/Criador_Organograma/extracted_backup_data.json';

    console.log(`🔍 Lendo backup de: ${backupDbPath}`);
    const dbBackup = new Database(backupDbPath, { readonly: true });

    // Pegar setores com foco especial em parent_id e position_json
    const rows = dbBackup.prepare('SELECT id, orgao_id, nome, parent_id, position_json, hierarquia, style_json FROM setores').all();

    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));
    console.log(`✅ Dados extraídos com sucesso: ${rows.length} setores salvos em ${outputPath}`);

    dbBackup.close();
} catch (err: any) {
    console.error('❌ Erro na extração:', err.message);
    process.exit(1);
}
