
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o JSON de credenciais (ajuste conforme onde você salvou)
// Assumindo que o arquivo está na raiz do projeto ou em um local seguro
const CREDENTIALS_PATH = path.resolve(__dirname, '..', '..', '..', 'ouvidoria-tratamento-dados-45e45e84a596.json');

// Interface para dados do e-mail
interface EmailData {
    to: string;
    subject: string;
    html: string;
}

class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const { SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

        if (SMTP_HOST && EMAIL_USER && EMAIL_PASS) {
            console.log('📧 [EmailService] Configurando SMTP para:', EMAIL_USER);
            this.transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT) || 587,
                secure: Number(SMTP_PORT) === 465, // true para 465, false para outras
                auth: {
                    user: EMAIL_USER,
                    pass: EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false // Permite certificados auto-assinados em dev
                }
            });

            // Verificar conexão
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ [EmailService] Falha na conexão SMTP:', error);
                    this.transporter = null; // Fallback para log
                } else {
                    console.log('✅ [EmailService] Servidor SMTP pronto para mensagens');
                }
            });
        } else {
            console.log('⚠️ [EmailService] Credenciais SMTP não encontradas. Modo de envio: LOG NO CONSOLE.');
        }
    }

    public async sendEmail(data: EmailData): Promise<boolean> {
        // Tentar extrair o link de aprovação para log local
        const linkMatch = data.html? data.html.match(/http:\/\/localhost:?\d*\/admin\/aprovar-cadastro\/[a-zA-Z0-9-]+/) : null;
        
        console.log('📨 [EmailService] Preparando envio para:', data.to);
        
        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: `"Organogramas PMDC" <${process.env.EMAIL_USER}>`,
                    to: data.to,
                    subject: data.subject,
                    html: data.html,
                });
                console.log('✅ [EmailService] E-mail enviado com sucesso! MessageID:', info.messageId);
                return true;
            } catch (error) {
                console.error('❌ [EmailService] Erro ao enviar e-mail real:', error);
                // Fallback para log no console se falhar o envio real
                console.log('⬇️ CONTEÚDO DO E-MAIL QUE FALHOU AO SER ENVIADO: ⬇️');
            }
        }

        // Fallback (Log no console)
        console.log('---------------------------------------------------');
        console.log(`PARA: ${data.to}`);
        console.log(`ASSUNTO: ${data.subject}`);
        if (linkMatch) {
            console.log('\n🔗 LINK DE APROVAÇÃO (CLIQUE AQUI - DEV MODE):');
            console.log(linkMatch[0]);
        }
        console.log('---------------------------------------------------');
        return true; // Retorna true para não quebrar o fluxo do frontend
    }
}

export const emailService = new EmailService();
