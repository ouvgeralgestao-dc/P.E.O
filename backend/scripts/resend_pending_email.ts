
import { client } from '../src/db/index.js';
import { emailService } from '../src/services/emailService.js';
import { getNetworkAddress } from '../src/utils/network.js';
import 'dotenv/config'; // Carregar .env para garantir que o emailService funcione

console.log('--- Buscando solicitação pendente para reenvio ---');

// Buscar solicitação pendente do Nilton (ou a mais recente pendente)
const request = client.prepare("SELECT * FROM solicitacoes_cadastro WHERE status = 'pendente' AND nome LIKE '%Nilton%'").get();

if (request) {
    console.log('Solicitação encontrada:', request.nome, request.email);

    const localIP = getNetworkAddress();
    const port = process.env.PORT || 6001; // Ajuste conforme porta real do backend
    const frontendPort = 5173;

    // Construir URLs com IP Local
    const frontendUrl = `http://${localIP}:${frontendPort}`;
    const backendUrl = `http://${localIP}:${port}`;

    const linkPainel = `${frontendUrl}/admin/aprovar-cadastro/${request.token}`;
    const linkAprovarRapido = `${backendUrl}/api/solicitacoes/quick-action?token=${request.token}&acao=aprovar`;
    const linkRejeitarRapido = `${backendUrl}/api/solicitacoes/quick-action?token=${request.token}&acao=rejeitar`;

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
                        <a href="${linkAprovarRapido}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">✅ APROVAR ACESSO</a>
                        <a href="${linkRejeitarRapido}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">❌ REJEITAR</a>
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
