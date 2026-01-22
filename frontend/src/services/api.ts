import axios from 'axios';
import { logger } from '../utils/logger';

// URL base da API
const API_BASE_URL = 'http://localhost:6001/api';

// Criar instância do axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de requisição (logging)
api.interceptors.request.use(
    (config) => {
        logger.api.request(config.method, config.url, config.data);
        return config;
    },
    (error) => {
        logger.error('API', 'Erro ao preparar requisição', error);
        return Promise.reject(error);
    }
);

// Interceptor de resposta (logging)
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
        return Promise.reject(error);
    }
);

export default api;
