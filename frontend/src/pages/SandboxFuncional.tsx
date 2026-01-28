import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganogramaCanvas from '../components/canvas/OrganogramaCanvas';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { logger } from '../utils/logger';
import api from '../services/api';
import './VisualizarOrganograma.css';

function SandboxFuncional() {
    const { nomeOrgao } = useParams();
    const navigate = useNavigate();
    const [orgaoId, setOrgaoId] = useState<number | null>(null);
    const [organogramaData, setOrganogramaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentData, setCurrentData] = useState<any>(null);

    useEffect(() => {
        loadOrganograma();
    }, [nomeOrgao]);

    const loadOrganograma = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar órgão sandbox por nome
            const orgaosResponse = await api.get('/orgaos');
            const listaOrgaos = orgaosResponse.data.data || [];
            const orgao = listaOrgaos.find((o: any) => o.nome === decodeURIComponent(nomeOrgao || ''));
            
            if (!orgao) {
                setError('Órgão sandbox não encontrado.');
                return;
            }

            setOrgaoId(orgao.id);

            // Buscar organograma funcional
            const response = await api.get(`/sandbox/funcional/${orgao.id}`);
            
            setOrganogramaData({
                orgao: response.data.orgao,
                organogramasFuncoes: [{
                    id: 'sandbox-funcional',
                    cargos: response.data.cargos || []
                }]
            });

            logger.success('SandboxFuncional', 'Organograma carregado', { orgao: orgao.nome });
        } catch (err: any) {
            if (err.response?.status === 404 || err.response?.data?.cargos?.length === 0) {
                // Organograma não existe ainda
                setOrganogramaData(null);
            } else {
                logger.error('SandboxFuncional', 'Erro ao carregar', err);
                setError(err.response?.data?.message || 'Erro ao carregar organograma');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSavePositions = useCallback(async (positions: any) => {
        if (!orgaoId) return;

        try {
            await api.post(`/sandbox/positions/${orgaoId}`, {
                tipo: 'funcional',
                positions
            });
            logger.success('SandboxFuncional', 'Dados salvos com sucesso');

            // Atualizar estado local para evitar loops (Proativo)
            setOrganogramaData((prev: any) => {
                if (!prev || !prev.organogramasFuncoes?.[0]) return prev;
                
                const updatedCargos = prev.organogramasFuncoes[0].cargos.map((c: any) => {
                    const updateInfo = positions.find((p: any) => p.id === c.id);
                    if (updateInfo) {
                        return { 
                            ...c, 
                            position: updateInfo.position || c.position,
                            customStyle: updateInfo.customStyle || c.customStyle
                        };
                    }
                    return c;
                });

                return {
                    ...prev,
                    organogramasFuncoes: [{
                        ...prev.organogramasFuncoes[0],
                        cargos: updatedCargos
                    }]
                };
            });
        } catch (error) {
            logger.error('SandboxFuncional', 'Erro ao salvar posições', error);
            alert('Erro ao salvar posições.');
        }
    }, [orgaoId]);

    const handlePrint = () => {
        if (!currentData || !currentData.nodes || currentData.nodes.length === 0) {
            alert('Aguarde o carregamento do organograma para imprimir.');
            return;
        }

        const printData = {
            nodes: currentData.nodes,
            edges: currentData.edges,
            title: `Organograma Funcional - ${organogramaData.orgao} (SANDBOX)`
        };

        localStorage.setItem('printData', JSON.stringify(printData));
        navigate('/imprimir');
    };

    const handleDelete = async () => {
        if (!orgaoId || !window.confirm('Tem certeza que deseja excluir este organograma sandbox?')) return;

        try {
            await api.delete(`/sandbox/funcional/${orgaoId}`);
            logger.success('SandboxFuncional', 'Organograma excluído');
            navigate(`/criacao-livre`);
        } catch (error) {
            logger.error('SandboxFuncional', 'Erro ao excluir', error);
            alert('Erro ao excluir organograma.');
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
                    <Button onClick={() => navigate(`/criacao-livre`)}>
                        Voltar
                    </Button>
                </Card>
            </div>
        );
    }

    // Se não tem organograma, mostrar mensagem
    const hasCargos = organogramaData?.organogramasFuncoes?.[0]?.cargos?.length > 0;
    
    if (!organogramaData || !hasCargos) {
        return (
            <div className="visualizar-organograma">
                <div className="container">
                    <div className="header-section">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate(`/criacao-livre`)}
                        >
                            ← Voltar
                        </Button>
                        <h1>👥 Organograma Funcional - {nomeOrgao} <span className="sandbox-badge">SANDBOX</span></h1>
                    </div>

                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                            <h2>Nenhum organograma funcional criado</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                                Comece criando os cargos e funções do órgão
                            </p>
                            <Button 
                                variant="primary" 
                                onClick={() => navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}/criar-funcional`)}
                            >
                                Criar Organograma Funcional
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <Button 
                            variant="outline" 
                            onClick={() => navigate(`/criacao-livre`)}
                        >
                            ← Voltar
                        </Button>
                        <h1 style={{ margin: 0 }}>👥 Organograma Funcional - {organogramaData.orgao} <span className="sandbox-badge">SANDBOX</span></h1>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button 
                            variant="outline" 
                            onClick={handlePrint}
                        >
                            🖨️ Imprimir
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}/criar-funcional`)}
                        >
                            ✏️ Editar
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={handleDelete}
                        >
                            🗑️ Excluir
                        </Button>
                    </div>
                </div>

                <div className="canvas-container">
                    <OrganogramaCanvas
                        organogramaData={organogramaData}
                        onSavePositions={handleSavePositions}
                        editable={true}
                        onDataChange={setCurrentData}
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

export default SandboxFuncional;
