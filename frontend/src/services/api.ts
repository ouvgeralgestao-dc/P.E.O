import axios from 'axios';
import { logger } from '../utils/logger';

// URL base da API
// URL base da API
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_PORT = 6001;
const API_BASE_URL = `http://${window.location.hostname}:${API_PORT}/api`;

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
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default api;
