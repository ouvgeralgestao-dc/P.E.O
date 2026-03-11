// Utilitário de logging com cores e formatação clara
// Uso: import { logger } from '../utils/logger';

const COLORS = {
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    debug: '#9C27B0'
};

export const logger = {
    info: (component: string, message: string, data?: any) => {
        console.log(
            `%cℹ️ [${component}] ${message}`,
            `color: ${COLORS.info}; font-weight: bold`,
            data || ''
        );
    },

    success: (component: string, message: string, data?: any) => {
        console.log(
            `%c✅ [${component}] ${message}`,
            `color: ${COLORS.success}; font-weight: bold`,
            data || ''
        );
    },

    warn: (component: string, message: string, data?: any) => {
        console.warn(
            `%c⚠️ [${component}] ${message}`,
            `color: ${COLORS.warning}; font-weight: bold`,
            data || ''
        );
    },

    error: (component: string, message: string, error?: any) => {
        console.error(
            `%c❌ [${component}] ${message}`,
            `color: ${COLORS.error}; font-weight: bold`,
            {
                mensagem: error?.message,
                stack: error?.stack,
                detalhes: error?.response?.data
            }
        );
    },

    debug: (component: string, message: string, data?: any) => {
        if (import.meta.env.DEV) {
            console.debug(
                `%c🔍 [${component}] ${message}`,
                `color: ${COLORS.debug}; font-weight: bold`,
                data || ''
            );
        }
    },

    api: {
        request: (method, url, data) => {
            const sanitizedData = sanitizeData(data);
            console.log(
                `%c🌐 [API] ${method.toUpperCase()} ${url}`,
                'color: #00BCD4; font-weight: bold',
                sanitizedData || ''
            );
        },

        response: (method, url, data) => {
            // Em respostas, geralmente não vem senha, mas o token pode ser longo. 
            // Se quiser sanitizar também:
            // const sanitizedData = sanitizeData(data);
            console.log(
                `%c✅ [API] Resposta ${method.toUpperCase()} ${url}`,
                'color: #4CAF50; font-weight: bold',
                data
            );
        },

        error: (method, url, error) => {
            console.error(
                `%c❌ [API] Erro ${method.toUpperCase()} ${url}`,
                'color: #F44336; font-weight: bold',
                {
                    status: error.response?.status,
                    mensagem: error.response?.data?.error || error.response?.data?.message || error.message,
                    url: error.config?.url
                }
            );
        }
    }
};

// Função auxiliar para mascarar dados sensíveis
const sanitizeData = (data: any) => {
    if (!data || typeof data !== 'object') return data;

    // Lista de campos para mascarar
    const sensitiveFields = ['senha', 'password', 'confirmarSenha', 'token', 'authorization'];

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '*** [OCULTO] ***';
        } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeData(sanitized[key]);
        }
    });

    return sanitized;
};
