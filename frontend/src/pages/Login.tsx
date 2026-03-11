import React, { useState, useEffect } from 'react';
import { authService, LoginResponse } from '../services/authService';
import api from '../services/api';
import Icons from '../components/common/Icons';
import './Login.css';

const Login: React.FC = () => {
    const [matricula, setMatricula] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados para Cadastro
    const [showCadastroModal, setShowCadastroModal] = useState(false);
    const [orgaos, setOrgaos] = useState<any[]>([]);
    const [cadastroData, setCadastroData] = useState({
        nome: '',
        matricula: '',
        email: '',
        orgao_id: '',
        senha: '',
        confirmarSenha: ''
    });
    const [cadastroLoading, setCadastroLoading] = useState(false);

    // Estado para Confirmação de Reenvio
    const [showResendConfirm, setShowResendConfirm] = useState(false);

    useEffect(() => {
        if (showCadastroModal) {
            // Carregar órgãos (rota pública)
            api.get('/orgaos/public').then(res => setOrgaos(res.data.data || res.data)).catch(console.error);
        }
    }, [showCadastroModal]);

    const handleCadastroSubmit = async (e: React.FormEvent, force = false) => {
        if (e && e.preventDefault) e.preventDefault();
        setError('');

        if (!force && cadastroData.senha !== cadastroData.confirmarSenha) {
            alert('Senhas não conferem!');
            return;
        }

        setCadastroLoading(true);
        try {
            await authService.registerRequest({
                nome: cadastroData.nome,
                matricula: cadastroData.matricula,
                email: cadastroData.email,
                orgao_id: cadastroData.orgao_id,
                senha: cadastroData.senha,
                force: force // Se true, o backend atualiza a existente
            });
            alert('Solicitação enviada com sucesso! Aguarde aprovação por e-mail.');
            setShowCadastroModal(false);
            setShowResendConfirm(false);
            setCadastroData({ nome: '', matricula: '', email: '', orgao_id: '', senha: '', confirmarSenha: '' });
        } catch (err: any) {
            if (err.response?.status === 409 || (err.response?.data?.code === 'PENDING_EXISTS')) {
                setShowResendConfirm(true); // Exibir modal de reenvio
            } else {
                alert(err.response?.data?.error || 'Erro ao solicitar cadastro');
            }
        } finally {
            setCadastroLoading(false);
        }
    };

    const handleConfirmResend = () => {
        // Tentar novamente forçando atualização
        handleCadastroSubmit({ preventDefault: () => { } } as React.FormEvent, true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response: LoginResponse = await authService.login(matricula, senha);
            authService.saveAuthData(response.token, response.user);
            window.location.href = '/peo/';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Decoração de Fundo Animada */}
            <div className="login-background-decor">
                {/* Ícone 1: Organograma / Estrutura */}
                <svg className="bg-icon icon-structure" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 3V5M12 21V19M5 9V11M19 9V11M5 19V17C5 15.8954 5.89543 15 7 15H17C18.1046 15 19 15.8954 19 17V19M5 5H19" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="2" />
                    <circle cx="5" cy="13" r="2" />
                    <circle cx="19" cy="13" r="2" />
                </svg>

                {/* Ícone 2: Gestão Ágil / Engrenagem */}
                <svg className="bg-icon icon-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>

                {/* Ícone 3: Planejamento / Prancheta */}
                <svg className="bg-icon icon-board" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="2" />
                    <path d="M9 14h6" />
                    <path d="M9 18h6" />
                    <path d="M9 10h2" />
                </svg>

                {/* Ícone 4: Colaboração / Pessoas */}
                <svg className="bg-icon icon-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>

                {/* Ícone 5: Gráfico / Analytics */}
                <svg className="bg-icon icon-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            </div>

            <div className="login-card">

                {/* LADO ESQUERDO: Visual / Logo */}
                <div className="login-branding">
                    <div className="branding-content">
                        <img src="/peo/assets/logo-peo-white.png" alt="Planejador de Estrutura Organizacional" className="branding-logo" />
                        <h1>Planejador de<br />Estrutura Organizacional</h1>
                        <p>Prefeitura Municipal de Duque de Caxias</p>
                    </div>
                </div>

                {/* LADO DIREITO: Inputs */}
                <div className="login-content">
                    <div className="form-header">
                        <img src="/peo/assets/dc-logo-login.png" alt="Prefeitura de Duque de Caxias" className="login-dc-logo" />
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

                    <div style={{ marginTop: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <span
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowCadastroModal(true);
                            }}
                            style={{
                                color: '#64748b',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '14px',
                                display: 'inline-block'
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            Solicite seu cadastro
                        </span>
                        <a
                            href="http://ogm.duquedecaxias.rj.gov.br:8059/"
                            style={{
                                color: '#64748b',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            ⬅ Voltar ao Hub CSG
                        </a>
                    </div>
                </div>
            </div>


            {/* Modal de Cadastro */}
            {showCadastroModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(3px)'
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '30px', borderRadius: '12px',
                        width: '400px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        {showResendConfirm ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '10px', color: '#eab308' }}>
                                    <Icons name="alert" size={48} />
                                </div>
                                <h3 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Solicitação Duplicada</h3>
                                <p style={{ color: '#4b5563', marginBottom: '20px' }}>
                                    Já existe uma solicitação pendente para estes dados (Matrícula/E-mail).
                                    <br /><br />
                                    Deseja reenviar o pedido e receber um novo link por e-mail?
                                </p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button onClick={() => setShowResendConfirm(false)} style={{ flex: 1, padding: '12px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Não, Cancelar</button>
                                    <button onClick={handleConfirmResend} style={{ flex: 1, padding: '12px', background: '#eab308', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        Sim, Reenviar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ color: '#1e3a8a', marginBottom: '20px' }}>Solicitar Cadastro</h2>

                                <form onSubmit={(e) => handleCadastroSubmit(e, false)}>
                                    <div className="form-group">
                                        <label>Nome Completo</label>
                                        <input required type="text" value={cadastroData.nome} onChange={e => setCadastroData({ ...cadastroData, nome: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Matrícula</label>
                                        <input required type="text" value={cadastroData.matricula} onChange={e => setCadastroData({ ...cadastroData, matricula: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>E-mail</label>
                                        <input required type="email" value={cadastroData.email} onChange={e => setCadastroData({ ...cadastroData, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Órgão</label>
                                        <select required value={cadastroData.orgao_id} onChange={e => setCadastroData({ ...cadastroData, orgao_id: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <option value="">Selecione o órgão...</option>
                                            {orgaos.map(org => (
                                                <option key={org.id} value={org.id}>{org.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Senha</label>
                                        <input required type="password" value={cadastroData.senha} onChange={e => setCadastroData({ ...cadastroData, senha: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Repetir Senha</label>
                                        <input required type="password" value={cadastroData.confirmarSenha} onChange={e => setCadastroData({ ...cadastroData, confirmarSenha: e.target.value })} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                        <button type="button" onClick={() => setShowCadastroModal(false)} style={{ flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                                        <button type="submit" disabled={cadastroLoading} style={{ flex: 1, padding: '10px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                            {cadastroLoading ? 'Enviando...' : 'Solicitar Cadastro'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;