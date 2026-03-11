import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css'; // Reutilizar estilos de login para consistência

const AprovarCadastro: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [solicitacao, setSolicitacao] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    // Formulário de Aprovação
    const [perfil, setPerfil] = useState('user');
    const [setor, setSetor] = useState('');
    const [listaSetores, setListaSetores] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        
        // Buscar dados da solicitação
        api.get(`/solicitacoes/request/${token}`)
            .then(res => {
                setSolicitacao(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.error || 'Erro ao carregar solicitação.');
                setLoading(false);
            });

        // Buscar lista de setores (Dicionário)
        api.get('/setores/config')
            .then(res => {
                if (res.data && res.data.success) {
                    setListaSetores(res.data.data);
                }
            })
            .catch(err => {
                console.error('⚠️ [AprovarCadastro] Erro ao buscar setores:', err);
            });
    }, [token]);

    const handleAction = async (acao: 'aprovar' | 'rejeitar') => {
        setActionLoading(true);
        try {
            await api.post('/solicitacoes/approve', {
                token,
                acao,
                perfil,
                setor
            });
            alert(`Solicitação ${acao === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso!`);
            navigate('/login');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao processar.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="login-container"><div className="login-card" style={{padding: '40px', textAlign: 'center'}}>Carregando...</div></div>;
    
    if (error) return (
        <div className="login-container">
            <div className="login-card" style={{padding: '40px', textAlign: 'center'}}>
                <h2 style={{color: '#ef4444'}}>Erro</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/login')} className="login-button" style={{marginTop: '20px'}}>Voltar ao Login</button>
            </div>
        </div>
    );

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="login-branding" style={{ padding: '30px', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1>Aprovação de<br/>Cadastro</h1>
                    <p style={{ marginTop: '15px', color: '#bfdbfe' }}>Revise os dados antes de conceder acesso.</p>
                </div>
                
                <div className="login-content" style={{ padding: '30px' }}>
                    <div className="form-group">
                        <label>Nome</label>
                        <p style={{ padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>{solicitacao.nome}</p>
                    </div>
                    <div className="form-group">
                        <label>Matrícula</label>
                        <p style={{ padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>{solicitacao.matricula}</p>
                    </div>
                    <div className="form-group">
                        <label>E-mail</label>
                        <p style={{ padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>{solicitacao.email}</p>
                    </div>
                    <div className="form-group">
                        <label>Órgão Solicitado (ID)</label>
                        <p style={{ padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>{solicitacao.orgao_id}</p>
                    </div>

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                    <h3 style={{ marginBottom: '15px', color: '#1e3a8a' }}>Configurar Acesso</h3>
                    
                    <div className="form-group">
                        <label>Perfil de Acesso</label>
                        <select value={perfil} onChange={e => setPerfil(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <option value="user">Gestor do Órgão (Acesso Restrito)</option>
                            <option value="admin">Administrador Geral (Acesso Total)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Vincular ao Setor (Filtro do Dashboard)</label>
                        <select 
                            value={setor} 
                            onChange={e => setSetor(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">-- Sem Setor Específico --</option>
                            {listaSetores.map((s: any) => (
                                <option key={s.id} value={s.nome}>{s.nome}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                            * O usuário só verá organogramas deste setor (ou que contenham este termo no nome).
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                        <button 
                            onClick={() => handleAction('rejeitar')} 
                            disabled={actionLoading}
                            style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Rejeitar
                        </button>
                        <button 
                            onClick={() => handleAction('aprovar')} 
                            disabled={actionLoading}
                            style={{ flex: 1, padding: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {actionLoading ? 'Processando...' : 'Aprovar Cadastro'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AprovarCadastro;
