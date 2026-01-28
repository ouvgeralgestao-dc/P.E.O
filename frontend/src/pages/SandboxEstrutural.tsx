import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganogramaCanvas from '../components/canvas/OrganogramaCanvas';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { logger } from '../utils/logger';
import api from '../services/api';
import './VisualizarOrganograma.css';

function SandboxEstrutural() {
    const { nomeOrgao } = useParams();
    const navigate = useNavigate();
    const [orgaoId, setOrgaoId] = useState<number | null>(null);
    const [organogramaData, setOrganogramaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOrganograma();
    }, [nomeOrgao]);

    const loadOrganograma = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar órgão sandbox por nome
            const orgaosResponse = await api.get('/sandbox/orgaos');
            const orgao = orgaosResponse.data.find((o: any) => o.nome === decodeURIComponent(nomeOrgao || ''));
            
            if (!orgao) {
                setError('Órgão sandbox não encontrado.');
                return;
            }

            setOrgaoId(orgao.id);

            // Buscar organograma estrutural
            const response = await api.get(`/sandbox/estrutural/${orgao.id}`);
            
            setOrganogramaData({
                orgao: response.data.orgao,
                organogramaEstrutural: {
                    setores: response.data.setores || []
                }
            });

            logger.success('SandboxEstrutural', 'Organograma carregado', { orgao: orgao.nome });
        } catch (err: any) {
            if (err.response?.status === 404 || err.response?.data?.setores?.length === 0) {
                // Organograma não existe ainda
                setOrganogramaData(null);
            } else {
                logger.error('SandboxEstrutural', 'Erro ao carregar', err);
                setError(err.response?.data?.message || 'Erro ao carregar organograma');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSavePositions = async (positions: any) => {
        if (!orgaoId) return;

        try {
            await api.post(`/sandbox/positions/${orgaoId}`, {
                tipo: 'estrutural',
                positions
            });
            logger.success('SandboxEstrutural', 'Posições salvas');
        } catch (error) {
            logger.error('SandboxEstrutural', 'Erro ao salvar posições', error);
            alert('Erro ao salvar posições.');
        }
    };

    if (loading) {
        return <div className="loading-state"><div className="spinner"></div>Carregando organograma...</div>;
    }

    if (error) {
        return (
            <div className="container" style={{ marginTop: '2rem' }}>
                <Card title="Erro">
                    <p>{error}</p>
                    <Button onClick={() => navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}`)}>
                        Voltar
                    </Button>
                </Card>
            </div>
        );
    }

    // Se não tem organograma, mostrar mensagem
    if (!organogramaData || !organogramaData.organogramaEstrutural?.setores?.length) {
        return (
            <div className="visualizar-organograma">
                <div className="container">
                    <div className="header-section">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}`)}
                        >
                            ← Voltar
                        </Button>
                        <h1>🏢 Organograma Estrutural - {nomeOrgao} <span className="sandbox-badge">SANDBOX</span></h1>
                    </div>

                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                            <h2>Nenhum organograma estrutural criado</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                                Comece criando a estrutura de setores do órgão
                            </p>
                            <Button 
                                variant="primary" 
                                onClick={() => navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}/criar-estrutural`)}
                            >
                                Criar Organograma Estrutural
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="visualizar-organograma">
            <div className="container">
                <div className="header-section">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}`)}
                    >
                        ← Voltar
                    </Button>
                    <h1>🏢 Organograma Estrutural - {organogramaData.orgao} <span className="sandbox-badge">SANDBOX</span></h1>
                </div>

                <div className="canvas-container">
                    <OrganogramaCanvas
                        organogramaData={organogramaData}
                        onSavePositions={handleSavePositions}
                        editable={true}
                    />
                </div>
            </div>

            <style>{`
                .sandbox-badge { 
                    font-size: 0.6rem; 
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                    color: white; 
                    padding: 0.25rem 0.75rem; 
                    border-radius: 999px; 
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    margin-left: 1rem;
                }
            `}</style>
        </div>
    );
}

export default SandboxEstrutural;
