import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { logger } from '../utils/logger';
import api from '../services/api';

function SandboxOrgao() {
    const { nomeOrgao } = useParams<{ nomeOrgao: string }>();
    const navigate = useNavigate();
    const [orgaoData, setOrgaoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOrgao();
    }, [nomeOrgao]);

    const loadOrgao = async () => {
        try {
            setLoading(true);
            // Buscar órgão sandbox por nome
            const orgaosResponse = await api.get('/sandbox/orgaos');
            const orgao = orgaosResponse.data.find((o: any) => o.nome === decodeURIComponent(nomeOrgao || ''));
            
            if (!orgao) {
                setError('Órgão sandbox não encontrado.');
                return;
            }

            // Buscar organogramas estrutural e funcional
            const [estruturalRes, funcionalRes] = await Promise.all([
                api.get(`/sandbox/estrutural/${orgao.id}`).catch(() => null),
                api.get(`/sandbox/funcional/${orgao.id}`).catch(() => null),
            ]);

            setOrgaoData({
                id: orgao.id,
                orgao: orgao.nome,
                categoria: orgao.categoria,
                organogramaEstrutural: estruturalRes?.data || null,
                organogramaFuncional: funcionalRes?.data || null,
            });

            logger.info('SandboxOrgao', 'Órgão carregado', { orgao: orgao.nome });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao carregar órgão sandbox');
            logger.error('SandboxOrgao', 'Erro', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEstrutura = () => {
        if (!nomeOrgao || !orgaoData?.id) return;
        navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao)}/estrutural`);
    };

    const handleOpenFuncional = () => {
        if (!nomeOrgao || !orgaoData?.id) return;
        navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao)}/funcional`);
    };

    const handleCreateEstrutura = () => {
        if (!nomeOrgao || !orgaoData?.id) return;
        navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao)}/estrutural`);
    };

    const handleCreateFuncional = () => {
        if (!nomeOrgao || !orgaoData?.id) return;
        navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao)}/funcional`);
    };

    if (loading) return <div className="loading-state"><div className="spinner"></div>Carregando órgão sandbox...</div>;

    if (error) return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <Card title="Erro"><p>{error}</p><Button onClick={() => navigate('/criacao-livre')}>Voltar à Lista</Button></Card>
        </div>
    );

    const hasEstrutural = orgaoData?.organogramaEstrutural?.setores?.length > 0;
    const hasFuncional = orgaoData?.organogramaFuncional?.cargos?.length > 0;

    return (
        <div className="pasta-orgao">
            <div className="container">
                <div className="header-section">
                    <Button variant="outline" onClick={() => navigate('/criacao-livre')}>← Voltar</Button>
                    <h1>🎨 {orgaoData?.orgao} <span className="sandbox-badge">SANDBOX</span></h1>
                    <p className="subtitle">Área de testes - Organogramas não afetam dados institucionais</p>
                </div>

                <div className="items-grid">
                    {/* Organograma Estrutural */}
                    {hasEstrutural ? (
                        <Card
                            hoverable={true}
                            className="item-card"
                            onClick={handleOpenEstrutura}
                        >
                            <div className="icon">🏢</div>
                            <h3>Estrutura Organizacional</h3>
                            <p>Organograma hierárquico de setores</p>
                            <div className="meta">
                                <span>Setores: {orgaoData.organogramaEstrutural.setores?.length || 0}</span>
                                <span className="status-badge success">Criado</span>
                            </div>
                        </Card>
                    ) : (
                        <Card
                            hoverable={true}
                            className="item-card add-card"
                            onClick={handleCreateEstrutura}
                        >
                            <div className="icon">🏢</div>
                            <h3>CRIAR ORGANOGRAMA ESTRUTURAL</h3>
                            <p>Defina a hierarquia de setores</p>
                        </Card>
                    )}

                    {/* Organograma Funcional */}
                    {hasFuncional ? (
                        <Card
                            hoverable
                            className="item-card"
                            onClick={handleOpenFuncional}
                        >
                            <div className="icon">👥</div>
                            <h3>Funções e Cargos</h3>
                            <p>Detalhamento de cargos e funções</p>
                            <div className="meta">
                                <span>Cargos: {orgaoData.organogramaFuncional.cargos?.length || 0}</span>
                                <span className="status-badge success">Criado</span>
                            </div>
                        </Card>
                    ) : (
                        <Card
                            hoverable
                            className="item-card add-card functional-add-card"
                            onClick={handleCreateFuncional}
                        >
                            <div className="icon">👥</div>
                            <h3>CRIAR ORGANOGRAMA FUNCIONAL</h3>
                            <p>Detalhe cargos e funções</p>
                        </Card>
                    )}
                </div>
            </div>
            <style>{`
                .pasta-orgao { padding: 2rem 0; min-height: 100vh; background: #f8fafc; }
                .header-section { margin-bottom: 2rem; }
                .header-section h1 { margin: 1rem 0 0.5rem; color: #1e293b; display: flex; align-items: center; gap: 1rem; }
                .sandbox-badge { 
                    font-size: 0.7rem; 
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                    color: white; 
                    padding: 0.25rem 0.75rem; 
                    border-radius: 999px; 
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .subtitle { color: #64748b; }
                .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .item-card { cursor: pointer; transition: transform 0.2s; border-left: 4px solid transparent; }
                .item-card:hover { transform: translateY(-4px); border-left-color: #2563eb; }
                .icon { font-size: 2rem; margin-bottom: 1rem; }
                .meta { display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
                .status-badge { 
                    padding: 0.25rem 0.5rem; 
                    border-radius: 4px; 
                    font-size: 0.75rem; 
                    font-weight: 600;
                }
                .status-badge.success { background: #dcfce7; color: #166534; }
                .add-card { 
                    border-style: dashed; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    text-align: center; 
                    color: #64748b; 
                    min-height: 200px;
                }
                .add-card .icon { color: #cbd5e1; }
                .add-card:hover { border-color: #2563eb; color: #2563eb; }
                .add-card:hover .icon { color: #2563eb; }
                .functional-add-card { 
                    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
                    border: 2px dashed #10b981;
                }
                .functional-add-card:hover {
                    border-style: solid;
                    border-color: #10b981;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    transform: translateY(-8px) !important;
                    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
                }
                .functional-add-card h3 { color: #059669; font-weight: 800; font-size: 1.1rem; }
            `}</style>
        </div>
    );
}

export default SandboxOrgao;
