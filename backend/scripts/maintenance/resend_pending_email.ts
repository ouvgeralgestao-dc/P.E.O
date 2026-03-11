
import { client } from '../src/db/index.js';
import { emailService } from '../src/services/emailService.js';
import { getNetworkAddress } from '../src/utils/network.js';
import 'dotenv/config'; // Carregar .env para garantir que o emailService funcione

console.log('--- Buscando solicitação pendente para reenvio ---');

// Buscar solicitação pendente do Nilton (ou a mais recente pendente)
const request = client.prepare("SELECT * FROM solicitacoes_cadastro WHERE status = 'pendente' AND nome LIKE '%Nilton%'").get();

if (request) {
    console.log('Solicitação encontrada:', request.nome, request.email);

    // Configuração de URLs Públicas (Gateway / Nginx)
    const GATEWAY_URL = 'http://ogm.duquedecaxias.rj.gov.br';

    // Link para o Painel (Frontend) - Passa pelo Nginx /peo/
    const linkPainel = `${GATEWAY_URL}/peo/admin/aprovar-cadastro/${request.token}`;

    // Links para API (Backend) - Passa pelo Nginx /peo/api/
    const linkAprovarRapido = `${GATEWAY_URL}/peo/api/solicitacoes/quick-action?token=${request.token}&acao=aprovar`;
    const linkRejeitarRapido = `${GATEWAY_URL}/peo/api/solicitacoes/quick-action?token=${request.token}&acao=rejeitar`;

    console.log(`\nIP Local Detectado: ${localIP}`);
    console.log(`Link Aprovação Rápida: ${linkAprovarRapido}`);

    // Reenviar E-mail
    try {
        await emailService.sendEmail({
            to: 'ouvgeral.gestao@gmail.com',
            subject: 'REENVIO: Nova Solicitação de Cadastro - P.E.O',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #1e3a8a; margin-top: 0;">Nova Solicitação de Cadastro (Reenvio)</h2>
                    <p>Um novo usuário solicitou acesso ao sistema.</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Nome:</strong> ${request.nome}</p>
                        <p style="margin: 5px 0;"><strong>Matrícula:</strong> ${request.matricula}</p>
                        <p style="margin: 5px 0;"><strong>E-mail:</strong> ${request.email}</p>
                        <p style="margin: 5px 0;"><strong>Órgão ID:</strong> ${request.orgao_id}</p>
                    </div>

                    <h3 style="color: #475569;">Ações Rápidas:</h3>
                    <p style="font-size: 14px; color: #64748b;">(Clique para processar imediatamente)</p>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                        <a href="${linkAprovarRapido}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            APROVAR ACESSO
                        </a>
                        <a href="${linkRejeitarRapido}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                            REJEITAR
                        </a>
                    </div>

                    <p style="font-size: 13px; color: #94a3b8; margin-top: 20px;">
                        * A opção "Aprovar Acesso" cria um usuário com perfil padrão. Para configurar permissões avançadas, acesse o painel:
                        <br>
                        <a href="${linkPainel}">${linkPainel}</a>
                    </p>
                </div>
            `
        });
        console.log('✅ E-mail reenviado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao reenviar e-mail:', error);
    }

} else {
    console.log('⚠️ Nenhuma solicitação pendente encontrada para Nilton.');
}
