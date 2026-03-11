
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

async function restore() {
    const backupFilePath = 'c:/Users/CroSS/Desktop/Criador_Organograma/extracted_backup_data.json';
    const dbPath = 'c:/Users/CroSS/Desktop/Criador_Organograma/backend/data/organograma.sqlite';

    if (!fs.existsSync(backupFilePath)) {
        console.error('❌ Arquivo de backup extraído não encontrado!');
        return;
    }

    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    console.log(`📂 Carregados ${backupData.length} setores do backup.`);

    const db = new Database(dbPath, { timeout: 15000 });
    db.pragma('journal_mode = WAL');

    try {
        const updateStmt = db.prepare(`
            UPDATE setores 
            SET parent_id = ?, 
                position_json = ?, 
                style_json = ?, 
                hierarquia = ? 
            WHERE id = ?
        `);

        // Também precisamos garantir que se o ID não existir, ele seja inserido (opcional, dependendo da necessidade)
        // Mas o usuário pediu para "repor a posição", implicando que os setores existem ou devem voltar a existir.

        const insertStmt = db.prepare(`
            INSERT INTO setores (id, orgao_id, nome, parent_id, position_json, hierarquia, style_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        let updated = 0;
        let inserted = 0;

        const runRestore = db.transaction(() => {
            for (const row of backupData) {
                const result = updateStmt.run(
                    row.parent_id,
                    row.position_json,
                    row.style_json,
                    row.hierarquia,
                    row.id
                );

                if (result.changes === 0) {
                    // Se não atualizou, tenta inserir (garante que a hierarquia volte completa)
                    try {
                        insertStmt.run(
                            row.id,
                            row.orgao_id,
                            row.nome,
                            row.parent_id,
                            row.position_json,
                            row.hierarquia,
                            row.style_json
                        );
                        inserted++;
                    } catch (e) {
                        console.warn(`⚠️ Falha ao inserir/atualizar ID ${row.id}: ${e.message}`);
                    }
                } else {
                    updated++;
                }
            }
        });

        runRestore();
        console.log(`✅ Restauração concluída!`);
        console.log(`📈 Atualizados: ${updated}`);
        console.log(`🆕 Inseridos: ${inserted}`);

    } catch (error) {
        console.error('❌ Erro durante a restauração:', error);
    } finally {
        db.close();
    }
}

restore();
