
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { logger } from '../utils/logger';
import api from '../services/api';

function PastaOrgao() {
    const { nomeOrgao } = useParams();
    const navigate = useNavigate();
    const [orgaoData, setOrgaoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOrgao();
    }, [nomeOrgao]);

    const loadOrgao = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/organogramas/${encodeURIComponent(nomeOrgao)}`);
            setOrgaoData(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao carregar pasta do órgão');
            logger.error('PastaOrgao', 'Erro', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEstrutura = () => {
        navigate(`/visualizar/${encodeURIComponent(nomeOrgao)}?tipo=estrutura`);
    };

    const handleOpenFuncoes = (id) => {
        navigate(`/visualizar/${encodeURIComponent(nomeOrgao)}?tipo=funcoes&id=${id}`);
    };

    if (loading) return <div className="loading-state"><div className="spinner"></div>Carregando pasta...</div>;

    if (error) return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <Card title="Erro"><p>{error}</p><Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button></Card>
        </div>
    );

    return (
        <div className="pasta-orgao">
            <div className="container">
                <div className="header-section">
                    <Button variant="outline" onClick={() => navigate('/')}>← Voltar</Button>
                    <h1>📂 {orgaoData?.orgao}</h1>
                    <p className="subtitle">Gerencie os organogramas deste órgão</p>
                </div>

                <div className="items-grid">
                    {/* Organograma Estrutural */}
                    {orgaoData?.organogramaEstrutural && (
                        <Card
                            hoverable
                            className="item-card"
                            onClick={handleOpenEstrutura}
                        >
                            <div className="icon">🏢</div>
                            <h3>Estrutura Organizacional</h3>
                            <p>Organograma hierárquico principal</p>
                            <div className="meta">
                                <span>Setores: {orgaoData.organogramaEstrutural.setores?.length || 0}</span>
                                <span>Folha: {orgaoData.organogramaEstrutural.tamanhoFolha || 'A4'}</span>
                            </div>
                        </Card>
                    )}

                    {/* Organogramas de Funções */}
                    {orgaoData?.organogramasFuncoes?.map((func, idx) => (
                        <Card
                            key={func.id || idx}
                            hoverable
                            className="item-card"
                            onClick={() => handleOpenFuncoes(func.id)}
                        >
                            <div className="icon">👥</div>
                            <h3>Funções e Cargos</h3>
                            <p>Detalhamento de cargos e funções</p>
                            <div className="meta">
                                <span>Cargos: {func.cargos?.length || 0}</span>
                                <span>Criado em: {new Date(func.createdAt).toLocaleDateString()}</span>
                            </div>
                        </Card>
                    ))}

                    {/* Botão para criar novo se não houver (opcional) */}
                    <Card
                        hoverable
                        className="item-card add-card"
                        onClick={() => navigate('/criar')}
                    >
                        <div className="icon">+</div>
                        <h3>Criar Novo</h3>
                    </Card>
                </div>
            </div>
            <style>{`
                .pasta-orgao { padding: 2rem 0; min-height: 100vh; background: #f8fafc; }
                .header-section { margin-bottom: 2rem; }
                .header-section h1 { margin: 1rem 0 0.5rem; color: #1e293b; }
                .subtitle { color: #64748b; }
                .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .item-card { cursor: pointer; transition: transform 0.2s; border-left: 4px solid transparent; }
                .item-card:hover { transform: translateY(-4px); border-left-color: #2563eb; }
                .icon { font-size: 2rem; margin-bottom: 1rem; }
                .meta { display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
                .add-card { border-style: dashed; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; }
                .add-card .icon { color: #cbd5e1; }
                .add-card:hover { border-color: #2563eb; color: #2563eb; }
                .add-card:hover .icon { color: #2563eb; }
            `}</style>
        </div>
    );
}

export default PastaOrgao;
