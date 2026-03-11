import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Icons from '../components/common/Icons';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { logger } from '../utils/logger';
import api from '../services/api';
import './CriarOrganograma.css';

interface Orgao {
    id: string;
    nome: string;
    categoria: string;
}

interface SandboxItem {
    orgaoId: string;
    nome: string;
    categoria: string;
    hasEstrutural: boolean;
    hasFuncional: boolean;
}

function SandboxList() {
    const navigate = useNavigate();
    const [orgaos, setOrgaos] = useState<Orgao[]>([]);
    const [existingSandboxes, setExistingSandboxes] = useState<SandboxItem[]>([]);
    const [selectedOrgao, setSelectedOrgao] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [userOrgaoId, setUserOrgaoId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Carregar lista de órgãos gerais
            const orgaosRes = await api.get('/orgaos');
            const orgaosList = orgaosRes.data.data || [];
            setOrgaos(orgaosList);

            // Carregar sandboxes existentes do usuário
            const sandboxesRes = await api.get('/sandbox/list');
            const sandboxes = sandboxesRes.data || [];
            setExistingSandboxes(sandboxes);

            // Tentar identificar órgão do usuário (simples match por enquanto)
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                // Lógica simples: se o user.setor corresponder a um órgão, usar ele
                if (user.setor) {
                    const match = orgaosList.find((o: Orgao) =>
                        user.setor.toLowerCase().includes(o.nome.toLowerCase()) ||
                        o.nome.toLowerCase().includes(user.setor.toLowerCase())
                    );
                    if (match) {
                        setUserOrgaoId(match.id);
                        setSelectedOrgao(match.id); // Auto-select para criação
                    }
                }
            }

            // Se não houver sandboxes, ir direto para criação
            if (sandboxes.length === 0) {
                setViewMode('create');
            } else {
                setViewMode('list');
            }

            logger.info('SandboxList', 'Dados carregados', {
                orgaos: orgaosList.length,
                sandboxes: sandboxes.length
            });

        } catch (error) {
            logger.error('SandboxList', 'Erro ao carregar dados', error);
            // Fallback
            setViewMode('create');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEstrutura = () => {
        if (!selectedOrgao) {
            alert('Selecione um órgão para criar o organograma.');
            return;
        }
        const orgao = orgaos.find(o => o.id === selectedOrgao);
        if (orgao) {
            navigate(`/criacao-livre/${encodeURIComponent(orgao.nome)}/criar-estrutural`);
        }
    };

    const handleDelete = async (orgaoId: string, tipo: 'estrutural' | 'funcional') => {
        if (!confirm(`Tem certeza que deseja excluir o organograma ${tipo}?`)) return;
        try {
            await api.delete(`/sandbox/${tipo}/${orgaoId}`);
            logger.success('SandboxList', `Organograma ${tipo} excluído`);
            loadData(); // Recarregar lista
        } catch (error) {
            logger.error('SandboxList', 'Erro ao excluir', error);
            alert('Erro ao excluir organograma.');
        }
    };

    if (loading) {
        return <div className="loading-state"><div className="spinner"></div>Carregando...</div>;
    }

    // Modo LISTA: Mostrar cards dos órgãos que já têm sandbox
    if (viewMode === 'list') {
        return (
            <div className="criar-organograma textured-bg">
                <div className="container">
                    <div className="header-section" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            Meus Rascunhos de Organograma
                        </h1>
                        <p className="subtitle" style={{ color: 'var(--text-secondary)' }}>
                            Gerencie seus organogramas em modo rascunho (Sandbox)
                        </p>
                    </div>

                    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Botão para Criar Novo */}
                        <div
                            className="card-new-sandbox"
                            onClick={() => setViewMode('create')}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '2px dashed rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                minHeight: '200px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ color: 'white', marginBottom: '1rem' }}>
                                <Icons name="plus" size={48} />
                            </div>
                            <h3 style={{ color: 'white' }}>Novo Rascunho</h3>
                        </div>

                        {existingSandboxes.map(sb => (
                            <Card key={sb.orgaoId} className="sandbox-card">
                                <div style={{ padding: '1.5rem' }}>
                                    <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>{sb.nome}</h3>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        background: '#e0f2fe',
                                        color: '#0369a1',
                                        fontSize: '0.8rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {sb.categoria}
                                    </span>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {sb.hasEstrutural ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button
                                                    style={{ flex: 1, fontSize: '0.9rem' }}
                                                    onClick={() => navigate(`/criacao-livre/${encodeURIComponent(sb.nome)}/estrutural`)}
                                                >
                                                    Estrutural
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    style={{ padding: '0.5rem' }}
                                                    onClick={() => handleDelete(sb.orgaoId, 'estrutural')}
                                                >
                                                    <Icons name="trash" size={16} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                style={{ width: '100%', fontSize: '0.9rem', borderStyle: 'dashed' }}
                                                onClick={() => navigate(`/criacao-livre/${encodeURIComponent(sb.nome)}/criar-estrutural`)}
                                            >
                                                + Criar Estrutural
                                            </Button>
                                        )}

                                        {sb.hasFuncional ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button
                                                    style={{ flex: 1, fontSize: '0.9rem', background: '#ec4899', borderColor: '#ec4899' }}
                                                    onClick={() => navigate(`/criacao-livre/${encodeURIComponent(sb.nome)}/funcional`)}
                                                >
                                                    Funcional
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    style={{ padding: '0.5rem' }}
                                                    onClick={() => handleDelete(sb.orgaoId, 'funcional')}
                                                >
                                                    <Icons name="trash" size={16} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                style={{ width: '100%', fontSize: '0.9rem', borderStyle: 'dashed' }}
                                                onClick={() => navigate(`/criacao-livre/${encodeURIComponent(sb.nome)}/criar-funcional`)}
                                            >
                                                + Criar Funcional
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Modo CRIAÇÃO (Original)
    return (
        <div className="criar-organograma">
            <div className="container">
                <div className="header-section" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Criar Novo Organograma Livre
                    </h1>
                    <p className="subtitle" style={{ color: 'var(--text-secondary)' }}>
                        Selecione o órgão e crie organogramas de teste sem afetar dados institucionais
                    </p>
                </div>

                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Card>
                        <div style={{ padding: '2rem' }}>
                            <div className="icon-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ color: '#2563eb', marginBottom: '1rem' }}>
                                    <Icons name="folder" size={64} />
                                </div>
                                <h3 style={{ color: '#2563eb', marginBottom: '0.5rem' }}>Estrutura Organizacional</h3>
                                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                                    Crie a hierarquia de setores do órgão, definindo a estrutura organizacional completa com níveis hierárquicos ajustados.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    color: '#1e293b'
                                }}>
                                    Selecione o Órgão *
                                </label>
                                <Select
                                    value={selectedOrgao}
                                    onChange={(e) => setSelectedOrgao(e.target.value)}
                                    placeholder="Selecione um órgão"
                                    options={orgaos.map(o => ({
                                        value: o.id,
                                        label: o.nome
                                    }))}
                                    disabled={!!userOrgaoId} // Desabilita se detectou auto-seleção? Ou deixa livre?
                                // Usuário disse "n tem pq eu selecionar". Vamos deixar livre mas aviso.
                                // Se userOrgaoId setado, talvez travar?
                                // Vamos deixar habilitado para "Free Mode" (Sandbox real), mas pré-selecionado.
                                />
                                {userOrgaoId && (
                                    <small style={{ color: '#666' }}>
                                        * Pré-selecionado com base no seu setor.
                                    </small>
                                )}
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: '#fef3c7',
                                border: '1px solid #fbbf24',
                                borderRadius: '8px',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                                    <Icons name="palette" size={20} style={{ color: '#92400e', marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>
                                            Modo Teste
                                        </strong>
                                        <p style={{ color: '#92400e', fontSize: '0.9rem', margin: 0 }}>
                                            Organogramas criados aqui não afetam os dados institucionais. Use para testes e rascunhos.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (existingSandboxes.length > 0) {
                                            setViewMode('list');
                                        } else {
                                            navigate('/dashboard');
                                        }
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleCreateEstrutura}
                                    disabled={!selectedOrgao}
                                >
                                    Criar Organograma Estrutural
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default SandboxList;
