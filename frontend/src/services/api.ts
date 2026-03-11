import axios from 'axios';
import { logger } from '../utils/logger';

// URL base da API
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '/api' : (import.meta.env.VITE_API_URL || '/peo/api');


// Criar instância do axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de requisição (adicionar token e logging)
api.interceptors.request.use(
    (config) => {
        // Adicionar token de autenticação
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        logger.api.request(config.method, config.url, config.data);
        return config;
    },
    (error) => {
        logger.error('API', 'Erro ao preparar requisição', error);
        return Promise.reject(error);
    }
);

// Interceptor de resposta (logging e tratamento de erros de autenticação)
api.interceptors.response.use(
    (response) => {
        logger.api.response(response.config.method, response.config.url, response.data);
        return response;
    },
    (error) => {
        logger.api.error(
            error.config?.method || 'unknown',
            error.config?.url || 'unknown',
            error
        );

        // Tratar erros de autenticação
        if (error.response?.status === 401) {
            // Token expirado ou inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/peo/login';
        }

        return Promise.reject(error);
    }
);

export default api;
