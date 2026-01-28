import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { logger } from '../utils/logger';
import api from '../services/api';
import './CriarOrganograma.css';

interface Orgao {
    id: number;
    nome: string;
    categoria: string;
}

function SandboxList() {
    const navigate = useNavigate();
    const [orgaos, setOrgaos] = useState<Orgao[]>([]);
    const [selectedOrgao, setSelectedOrgao] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrgaos();
    }, []);

    const loadOrgaos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orgaos');
            setOrgaos(response.data.data || []);
            logger.info('SandboxList', 'Órgãos carregados', { count: response.data.data?.length });
        } catch (error) {
            logger.error('SandboxList', 'Erro ao carregar órgãos', error);
            alert('Erro ao carregar lista de órgãos.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEstrutura = () => {
        if (!selectedOrgao) {
            alert('Selecione um órgão para criar o organograma.');
            return;
        }

        const orgao = orgaos.find(o => o.id === parseInt(selectedOrgao));
        if (!orgao) return;

        navigate(`/criacao-livre/${encodeURIComponent(orgao.nome)}/criar-estrutural`);
    };

    if (loading) {
        return <div className="loading-state"><div className="spinner"></div>Carregando...</div>;
    }

    return (
        <div className="criar-organograma">
            <div className="container">
                <div className="header-section" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#ffffff' }}>
                        Criar Novo Organograma Livre
                    </h1>
                    <p className="subtitle" style={{ color: '#e0e7ff' }}>
                        Selecione o órgão e crie organogramas de teste sem afetar dados institucionais
                    </p>
                </div>

                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Card>
                        <div style={{ padding: '2rem' }}>
                            <div className="icon-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏢</div>
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
                                        value: o.id.toString(),
                                        label: o.nome
                                    }))}
                                />
                            </div>

                            <div style={{ 
                                padding: '1rem', 
                                background: '#fef3c7', 
                                border: '1px solid #fbbf24',
                                borderRadius: '8px',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                                    <span style={{ fontSize: '1.25rem' }}>🎨</span>
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
                                    onClick={() => navigate('/dashboard')}
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
