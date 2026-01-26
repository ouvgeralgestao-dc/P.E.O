import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/common/BackButton';
import { logger } from '../utils/logger';
import api from '../services/api';
import './GerenciarSenhas.css';

/**
 * Página de Gerenciamento de Senhas dos Órgãos
 * Acesso restrito com senha master
 */
function GerenciarSenhas() {
    const navigate = useNavigate();
    const [orgaos, setOrgaos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingOrgao, setEditingOrgao] = useState<any>(null);
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmaSenha, setConfirmaSenha] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        carregarOrgaos();
    }, []);

    const carregarOrgaos = async () => {
        try {
            logger.info('GerenciarSenhas', 'Carregando lista de órgãos');
            const response = await api.get('/organogramas');

            const orgaosList = response.data.data || response.data || [];
            setOrgaos(orgaosList);
            logger.success('GerenciarSenhas', 'Órgãos carregados', { total: orgaosList.length });
        } catch (err: any) {
            logger.error('GerenciarSenhas', 'Erro ao carregar órgãos', err);
            if (err.response?.status === 401) {
                // Erro de autenticação será tratado pelo interceptor
                return;
            }
            setError('Erro ao carregar lista de órgãos');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (orgao: any) => {
        setEditingOrgao(orgao);
        setNovaSenha('');
        setConfirmaSenha('');
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setEditingOrgao(null);
        setNovaSenha('');
        setConfirmaSenha('');
        setError('');
    };

    const handleSavePassword = async () => {
        // Validações
        if (!novaSenha || !confirmaSenha) {
            setError('Preencha todos os campos');
            return;
        }

        if (novaSenha.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (novaSenha !== confirmaSenha) {
            setError('As senhas não coincidem');
            return;
        }

        try {
            logger.info('GerenciarSenhas', 'Atualizando senha do órgão', { orgao: editingOrgao?.orgao });

            const response = await api.put(`/organogramas/${editingOrgao?.orgaoId}/update-password`, { novaSenha });

            setSuccess(`Senha do órgão "${editingOrgao?.orgao}" atualizada com sucesso!`);
            setEditingOrgao(null);
            setNovaSenha('');
            setConfirmaSenha('');
            setError('');

            logger.success('GerenciarSenhas', 'Senha atualizada', { orgao: editingOrgao?.orgao });

            // Limpar mensagem de sucesso após 3 segundos
            setTimeout(() => setSuccess(''), 3000);

            // Recarregar lista
            carregarOrgaos();
        } catch (err) {
            logger.error('GerenciarSenhas', 'Erro ao atualizar senha', err);
            setError('Erro ao atualizar senha. Tente novamente.');
        }
    };

    if (loading) {
        return (
            <div className="gerenciar-senhas-page">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Carregando órgãos...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="gerenciar-senhas-page">
            <div className="container">
                <div className="page-header">
                    <BackButton to="/configuracoes" />
                    <div className="page-title-section">
                        <h1 className="page-title">🔐 Gerenciar Senhas</h1>
                        <p className="page-subtitle">Altere as senhas de acesso dos órgãos cadastrados</p>
                    </div>
                </div>

                {success && (
                    <div className="alert alert-success">
                        ✅ {success}
                    </div>
                )}

                {error && !editingOrgao && (
                    <div className="alert alert-error">
                        ❌ {error}
                    </div>
                )}

                <div className="orgaos-grid">
                    {orgaos.length === 0 ? (
                        <div className="empty-state">
                            <p>📂 Nenhum órgão cadastrado ainda</p>
                        </div>
                    ) : (
                        orgaos.map((orgao) => (
                            <div key={orgao.orgaoId} className="orgao-card">
                                <div className="orgao-header">
                                    <h3 className="orgao-nome">{orgao.orgao}</h3>
                                    <span className="orgao-categoria">{orgao.categoria || 'Sem categoria'}</span>
                                </div>

                                <div className="orgao-info">
                                    <div className="info-item">
                                        <span className="info-label">ID:</span>
                                        <span className="info-value">{orgao.orgaoId}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Criado em:</span>
                                        <span className="info-value">
                                            {new Date(orgao.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className="btn-edit-password"
                                    onClick={() => handleEditClick(orgao)}
                                >
                                    🔑 Alterar Senha
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal de Edição de Senha */}
                {editingOrgao && (
                    <div className="modal-overlay" onClick={handleCancelEdit}>
                        <div className="modal-content password-edit-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>🔑 Alterar Senha</h3>
                                <button className="modal-close" onClick={handleCancelEdit}>✕</button>
                            </div>

                            <div className="modal-body">
                                <p className="modal-orgao-name">{editingOrgao.orgao}</p>

                                <div className="form-group">
                                    <label htmlFor="nova-senha">Nova Senha</label>
                                    <input
                                        id="nova-senha"
                                        type="password"
                                        value={novaSenha}
                                        onChange={(e) => setNovaSenha(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className="modal-input"
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirma-senha">Confirmar Senha</label>
                                    <input
                                        id="confirma-senha"
                                        type="password"
                                        value={confirmaSenha}
                                        onChange={(e) => setConfirmaSenha(e.target.value)}
                                        placeholder="Digite a senha novamente"
                                        className="modal-input"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSavePassword()}
                                    />
                                </div>

                                {error && (
                                    <div className="error-text">
                                        ❌ {error}
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button onClick={handleCancelEdit} className="btn-cancel">
                                    Cancelar
                                </button>
                                <button onClick={handleSavePassword} className="btn-submit">
                                    Salvar Nova Senha
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GerenciarSenhas;
