
import { client } from '../src/db/index.js';

console.log('🔄 Iniciando migração para Fluxo de Cadastro...');

try {
    // 1. Criar tabela de solicitações
    console.log('➔ Criando tabela solicitacoes_cadastro...');
    client.exec(`
        CREATE TABLE IF NOT EXISTS solicitacoes_cadastro (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            matricula TEXT NOT NULL,
            orgao_id TEXT REFERENCES orgaos(id),
            email TEXT NOT NULL,
            senha TEXT NOT NULL,
            status TEXT DEFAULT 'pendente',
            token TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME
        );
    `);

    // 2. Adicionar colunas em usuários (Verificar se já existem antes para evitar erro)
    const tableInfo = client.pragma('table_info(usuarios)');
    const hasNome = tableInfo.some((col: any) => col.name === 'nome');
    const hasOrgao = tableInfo.some((col: any) => col.name === 'orgao_id');

    if (!hasNome) {
        console.log('➔ Adicionando coluna "nome" em usuarios...');
        client.exec('ALTER TABLE usuarios ADD COLUMN nome TEXT;');
    } else {
        console.log('✓ Coluna "nome" já existe.');
    }

    if (!hasOrgao) {
        console.log('➔ Adicionando coluna "orgao_id" em usuarios...');
        client.exec('ALTER TABLE usuarios ADD COLUMN orgao_id TEXT REFERENCES orgaos(id);');
    } else {
        console.log('✓ Coluna "orgao_id" já existe.');
    }

    console.log('✅ Migração concluída com sucesso!');

} catch (error) {
    console.error('❌ Erro na migração:', error);
}
