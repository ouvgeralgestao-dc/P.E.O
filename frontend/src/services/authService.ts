import axios from 'axios';
import api from './api';


export interface User {
    id: number;
    matricula: string;
    email: string;
    setor: string;
    cargo: string;
    tipo: 'admin' | 'user';
}

export interface LoginResponse {
    message: string;
    token: string;
    user: User;
}

export const authService = {
    async login(matricula: string, senha: string): Promise<LoginResponse> {
        const response = await api.post('/auth/login', {
            matricula,
            senha
        });
        return response.data;
    },

    async registerRequest(data: any) {
        const response = await api.post('/solicitacoes/register', data);
        return response.data;
    },

    async getCurrentUser(): Promise<User> {
        const response = await api.get('/auth/me');
        return response.data.user;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/peo/login';
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    getUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    saveAuthData(token: string, user: User) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    isAdmin(): boolean {
        const user = this.getUser();
        return user?.tipo === 'admin';
    },

    getUserSetor(): string | null {
        const user = this.getUser();
        return user?.setor || null;
    }
};

export default authService;
