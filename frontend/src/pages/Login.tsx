import React, { useState } from 'react';
import { authService, LoginResponse } from '../services/authService';
import './Login.css';

const Login: React.FC = () => {
    const [matricula, setMatricula] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response: LoginResponse = await authService.login(matricula, senha);
            authService.saveAuthData(response.token, response.user);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                
                {/* LADO ESQUERDO: Visual / Logo */}
                <div className="login-branding">
                    <div className="branding-content">
                        <img src="/public/dc-logo.png" alt="Logo Duque de Caxias" className="branding-logo" />
                        <h1>Sistema de<br />Organogramas</h1>
                        <p>Prefeitura Municipal de Duque de Caxias</p>
                    </div>
                </div>

                {/* LADO DIREITO: Inputs */}
                <div className="login-content">
                    <div className="form-header">
                        <h2>Bem-vindo</h2>
                        <span>Faça login para continuar</span>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="matricula">Matrícula</label>
                            <input
                                type="text"
                                id="matricula"
                                value={matricula}
                                onChange={(e) => setMatricula(e.target.value)}
                                required
                                placeholder="000000"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="senha">Senha</label>
                            <input
                                type="password"
                                id="senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? 'Acessando...' : 'Acessar Sistema'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;