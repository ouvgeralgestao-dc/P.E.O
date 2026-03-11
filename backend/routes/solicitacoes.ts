import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { client } from '../src/db/index.js';
import { emailService } from '../src/services/emailService.js';
import { getNetworkAddress } from '../src/utils/network.js';

const router = express.Router();

// 1. Solicitar Cadastro
router.post('/register', async (req, res) => {
    try {
        const { nome, matricula, orgao_id, email, senha, force } = req.body;

        // Validar se matrícula, email ou nome já existem em usuarios
        const existingUser = client.prepare('SELECT id FROM usuarios WHERE matricula = ? OR email = ? OR nome = ?').get(matricula, email, nome);
        if (existingUser) {
            return res.status(400).json({ error: 'Usuário já cadastrado (Matrícula, E-mail ou Nome indisponíveis).' });
        }

        // Validar solicitações pendentes
        const existingReq = client.prepare("SELECT * FROM solicitacoes_cadastro WHERE (matricula = ? OR email = ? OR nome = ?) AND status = 'pendente'").get(matricula, email, nome);

        let tokenId = uuidv4(); // Novo token por padrão
        let reqId = uuidv4();

        if (existingReq) {
            if (force) {
                // Atualizar solicitação existente
                tokenId = uuidv4(); // Gerar novo token para invalidar anterior
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(senha, salt);

                client.prepare(`
                    UPDATE solicitacoes_cadastro 
                    SET nome = ?, matricula = ?, orgao_id = ?, email = ?, senha = ?, token = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(nome, matricula, orgao_id, email, hashedPassword, tokenId, existingReq.id);

                reqId = existingReq.id; // Manter ID original
                console.log(`[Solicitacao] Atualizando solicitação existente para ${email}`);
            } else {
                return res.status(409).json({
                    error: 'Já existe uma solicitação pendente para este usuário.',
                    code: 'PENDING_EXISTS'
                });
            }
        } else {
            // Hash da senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(senha, salt);

            // Inserir solicitação
            const stmt = client.prepare(`
                INSERT INTO solicitacoes_cadastro (id, nome, matricula, orgao_id, email, senha, token, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')
            `);
            stmt.run(reqId, nome, matricula, orgao_id, email, hashedPassword, tokenId);
        }

        const token = tokenId; // Usar o token definido (novo ou atualizado)

        // Configuração de URLs Públicas (Gateway / Nginx)
        const GATEWAY_URL = 'http://ogm.duquedecaxias.rj.gov.br';

        // Link para o Painel (Frontend) - Passa pelo Nginx /peo/
        const linkPainel = `${GATEWAY_URL}/peo/admin/aprovar-cadastro/${token}`;

        // Links para API (Backend) - Passa pelo Nginx /peo/api/
        const linkAprovarRapido = `${GATEWAY_URL}/peo/api/solicitacoes/quick-action?token=${token}&acao=aprovar`;
        const linkRejeitarRapido = `${GATEWAY_URL}/peo/api/solicitacoes/quick-action?token=${token}&acao=rejeitar`;

        await emailService.sendEmail({
            to: 'ouvgeral.gestao@gmail.com',
            subject: 'Nova Solicitação de Cadastro - P.E.O',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #1e3a8a; margin-top: 0;">Nova Solicitação de Cadastro</h2>
                    <p>Um novo usuário solicitou acesso ao sistema.</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Nome:</strong> ${nome}</p>
                        <p style="margin: 5px 0;"><strong>Matrícula:</strong> ${matricula}</p>
                        <p style="margin: 5px 0;"><strong>E-mail:</strong> ${email}</p>
                        <p style="margin: 5px 0;"><strong>Órgão ID:</strong> ${orgao_id}</p>
                    </div>

                    <h3 style="color: #475569;">Ações Rápidas:</h3>
                    <p style="font-size: 14px; color: #64748b;">(Clique para processar imediatamente)</p>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                        <a href="${linkPainel}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            ANALISAR SOLICITAÇÃO
                        </a>
                        <a href="${linkRejeitarRapido}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                            REJEITAR
                        </a>
                    </div>

                    <p style="font-size: 13px; color: #94a3b8; margin-top: 20px;">
                        Clique em "Analisar Solicitação" para definir as permissões de acesso e finalizar o cadastro.
                    </p>
                </div>
            `
        });

        res.json({ message: 'Solicitação enviada com sucesso! Aguarde a aprovação.' });

    } catch (error) {
        console.error('Erro ao solicitar cadastro:', error);
        res.status(500).json({ error: 'Erro interno ao processar solicitação.' });
    }
});

// 2. Ação Rápida via Link (GET para funcionar no anchor tag do email)
router.get('/quick-action', async (req, res) => {
    try {
        const { token, acao } = req.query;

        const request = client.prepare("SELECT * FROM solicitacoes_cadastro WHERE token = ?").get(token);

        // Templates HTML de Resposta
        const htmlResponse = (title: string, msg: string, color: string) => `
            <html>
                <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f1f5f9; margin: 0;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px;">
                        <div style="margin-bottom: 20px;">
                            ${title === 'CHECK' ?
                `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` :
                title === 'X' ?
                    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>` :
                    title === 'INFO' ?
                        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>` :
                        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
            }
                        </div>
                        <h2 style="color: ${color}; margin-bottom: 15px;">${msg}</h2>
                        <p style="color: #64748b;">Você pode fechar esta janela.</p>
                    </div>
                </body>
            </html>
        `;

        if (!request) {
            return res.send(htmlResponse('QUESTION', 'Solicitação inválida ou expirada.', '#ef4444'));
        }

        if (request.status !== 'pendente') {
            return res.send(htmlResponse('INFO', `Esta solicitação já foi ${request.status}.`, '#3b82f6'));
        }

        if (acao === 'rejeitar') {
            client.prepare("UPDATE solicitacoes_cadastro SET status = 'rejeitado' WHERE id = ?").run(request.id);
            return res.send(htmlResponse('X', 'Solicitação REJEITADA com sucesso.', '#ef4444'));
        }

        if (acao === 'aprovar') {
            // Aprovação Rápida: Cria usuário com perfil 'user' e vinculado ao órgão solicitado
            // A senha já vem com hash do cadastro
            client.prepare(`
                INSERT INTO usuarios (matricula, email, senha, nome, orgao_id, tipo, setor, created_at)
                VALUES (?, ?, ?, ?, ?, 'user', null, CURRENT_TIMESTAMP)
            `).run(
                request.matricula,
                request.email,
                request.senha,
                request.nome,
                request.orgao_id
            );

            client.prepare("UPDATE solicitacoes_cadastro SET status = 'aprovado' WHERE id = ?").run(request.id);

            return res.send(htmlResponse('✅', 'Solicitação APROVADA com sucesso!', '#10b981'));
        }

        res.status(400).send('Ação inválida.');

    } catch (error) {
        console.error('Erro na ação rápida:', error);
        res.status(500).send('Erro interno ao processar.');
    }
});

// 3. Obter dados da solicitação (para tela de aprovação)
router.get('/request/:token', (req, res) => {
    try {
        const { token } = req.params;
        const request = client.prepare("SELECT * FROM solicitacoes_cadastro WHERE token = ?").get(token);

        if (!request) {
            return res.status(404).json({ error: 'Solicitação não encontrada.' });
        }

        if (request.status !== 'pendente') {
            return res.status(400).json({ error: `Esta solicitação já foi ${request.status}.` });
        }

        // Retornar dados (sem a senha)
        const { senha, ...data } = request;
        res.json(data);

    } catch (error) {
        console.error('Erro ao buscar solicitação:', error);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// 4. Aprovar ou Rejeitar (Painel Admin)
router.post('/approve', async (req, res) => {
    try {
        const { token, acao, perfil, setor } = req.body; // acao: 'aprovar' | 'rejeitar'

        const request = client.prepare("SELECT * FROM solicitacoes_cadastro WHERE token = ?").get(token);
        if (!request) {
            return res.status(404).json({ error: 'Solicitação não encontrada.' });
        }

        if (acao === 'rejeitar') {
            client.prepare("UPDATE solicitacoes_cadastro SET status = 'rejeitado' WHERE id = ?").run(request.id);
            return res.json({ message: 'Solicitação rejeitada.' });
        }

        if (acao === 'aprovar') {
            if (!perfil) return res.status(400).json({ error: 'Perfil de acesso é obrigatório.' });

            const insertUser = client.prepare(`
                INSERT INTO usuarios (matricula, email, senha, nome, orgao_id, tipo, setor, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            insertUser.run(
                request.matricula,
                request.email,
                request.senha,
                request.nome,
                request.orgao_id,
                perfil,
                setor || null
            );

            client.prepare("UPDATE solicitacoes_cadastro SET status = 'aprovado' WHERE id = ?").run(request.id);
            return res.json({ message: 'Cadastro aprovado e usuário criado com sucesso!' });
        }

    } catch (error) {
        console.error('Erro ao aprovar:', error);
        res.status(500).json({ error: 'Erro interno na aprovação.' });
    }
});

export default router;
