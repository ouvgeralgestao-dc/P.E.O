import React, { useState, useEffect, useCallback } from 'react';
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
    const [currentData, setCurrentData] = useState<any>(null);

    useEffect(() => {
        loadOrganograma();
    }, [nomeOrgao]);

    const loadOrganograma = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar órgão sandbox por nome (usando lista geral de órgãos)
            const orgaosResponse = await api.get('/orgaos');
            const listaOrgaos = orgaosResponse.data.data || [];
            const orgao = listaOrgaos.find((o: any) => o.nome === decodeURIComponent(nomeOrgao || ''));

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

    const handleSavePositions = useCallback(async (positions: any) => {
        if (!orgaoId) return;

        try {
            await api.post(`/sandbox/positions/${orgaoId}`, {
                tipo: 'estrutural',
                positions
            });
            logger.success('SandboxEstrutural', 'Posições e estilos salvos');

            // Atualizar estado local para refletir as novas posições/estilos e evitar loop de validação do Canvas
            setOrganogramaData((prev: any) => {
                if (!prev || !prev.organogramaEstrutural) return prev;

                const updatedSetores = prev.organogramaEstrutural.setores.map((s: any) => {
                    const updateInfo = positions.find((p: any) => p.id === s.id);
                    if (updateInfo) {
                        return {
                            ...s,
                            position: updateInfo.position || s.position,
                            customStyle: updateInfo.customStyle || s.customStyle
                        };
                    }
                    return s;
                });

                return {
                    ...prev,
                    organogramaEstrutural: {
                        ...prev.organogramaEstrutural,
                        setores: updatedSetores
                    }
                };
            });

        } catch (error) {
            logger.error('SandboxEstrutural', 'Erro ao salvar posições', error);
            alert('Erro ao salvar posições.');
        }
    }, [orgaoId]);

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
    if (!organogramaData || !organogramaData.organogramaEstrutural?.setores?.length) {
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

    const handlePrint = () => {
        if (!currentData || !currentData.nodes || currentData.nodes.length === 0) {
            alert('Aguarde o carregamento do organograma para imprimir.');
            return;
        }

        const printData = {
            nodes: currentData.nodes,
            edges: currentData.edges,
            title: `Organograma Estrutural - ${organogramaData.orgao} (SANDBOX)`
        };

        localStorage.setItem('printData', JSON.stringify(printData));
        navigate('/imprimir'); // Navega para a rota de impressão que lê do localStorage
    };

    const handleDelete = async () => {
        if (!orgaoId || !window.confirm('Tem certeza que deseja excluir este organograma sandbox?')) return;

        try {
            await api.delete(`/sandbox/estrutural/${orgaoId}`);
            logger.success('SandboxEstrutural', 'Organograma excluído');
            navigate(`/criacao-livre`);
        } catch (error) {
            logger.error('SandboxEstrutural', 'Erro ao excluir', error);
            alert('Erro ao excluir organograma.');
        }
    };

    return (
        <div className="visualizar-organograma">
            <div className="container">
                <div className="header-section">
                    {/* Zona 1: Navegação (Esquerda) */}
                    <div className="header-zone-left">
                        <button
                            type="button"
                            className="btn-back"
                            onClick={() => navigate(`/criacao-livre`)}
                        >
                            <span className="btn-icon">←</span>
                            Voltar
                        </button>
                    </div>

                    {/* Zona 2: Título Centralizado */}
                    <div className="header-zone-center">
                        <h1>
                            <span>🏢</span>
                            Organograma Estrutural - {organogramaData.orgao}
                            <span className="sandbox-badge">SANDBOX</span>
                        </h1>
                    </div>

                    {/* Zona 3: Ações Agrupadas */}
                    <div className="header-zone-actions">
                        <div className="actions-container">
                            <button
                                type="button"
                                className="btn-action-primary"
                                onClick={handlePrint}
                            >
                                <span className="btn-icon">🖨️</span>
                                Imprimir
                            </button>
                            <button
                                type="button"
                                className="btn-action-secondary"
                                onClick={() => navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}/criar-estrutural`)}
                            >
                                <span className="btn-icon">✏️</span>
                                Editar
                            </button>
                            <button
                                type="button"
                                className="btn-action-danger"
                                onClick={handleDelete}
                            >
                                <span className="btn-icon">🗑️</span>
                                Excluir
                            </button>
                        </div>
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
        </div>
    );
}

export default SandboxEstrutural;
