import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WizardForm from '../components/forms/WizardForm';
import FuncoesForm from '../components/forms/FuncoesForm';
import LivePreviewCanvas from '../components/preview/LivePreviewCanvas';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SuccessOverlay from '../components/common/SuccessOverlay';
import { logger } from '../utils/logger';
import api from '../services/api';
import './CriarOrganograma.css';

function CriarSandboxFuncional() {
    const { nomeOrgao } = useParams<{ nomeOrgao: string }>();
    const navigate = useNavigate();
    const [orgaoId, setOrgaoId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [previewData, setPreviewData] = useState({ cargos: [] });
    const [pendingNavigate, setPendingNavigate] = useState<string | null>(null);

    useEffect(() => {
        loadOrgao();
    }, [nomeOrgao]);

    const loadOrgao = async () => {
        try {
            const orgaosResponse = await api.get('/orgaos');
            const orgao = orgaosResponse.data.data?.find((o: any) => o.nome === decodeURIComponent(nomeOrgao || ''));
            
            if (!orgao) {
                alert('Órgão não encontrado.');
                navigate('/criacao-livre');
                return;
            }

            setOrgaoId(orgao.id);
        } catch (error) {
            logger.error('CriarSandboxFuncional', 'Erro ao carregar órgão', error);
            alert('Erro ao carregar órgão.');
            navigate('/criacao-livre');
        }
    };

    const handleCreateFuncional = async (formData: any) => {
        if (!orgaoId) return;

        try {
            setIsCreating(true);
            logger.info('CriarSandboxFuncional', 'Criando organograma funcional sandbox', formData);

            await api.post(`/sandbox/funcional/${orgaoId}`, {
                cargos: formData.cargos,
            });

            setIsFinished(true);
            setPendingNavigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}/funcional`);

            setTimeout(() => {
                setShowSuccess(true);
            }, 600);
        } catch (error: any) {
            logger.error('CriarSandboxFuncional', 'Erro ao criar organograma', error);
            alert('Erro ao criar organograma: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancel = () => {
        navigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}`);
    };

    const handleDataChange = useCallback((data: any) => {
        setPreviewData({ cargos: data.cargos || [] });
    }, []);

    const handleSuccessComplete = () => {
        if (pendingNavigate) {
            navigate(pendingNavigate);
        }
    };

    const steps = [
        {
            id: 'funcoes',
            title: 'Funções e Cargos',
            component: FuncoesForm,
            validate: (data: any) => {
                const errors: any = {};
                if (!data.cargos || data.cargos.length === 0) {
                    errors.cargos = 'Adicione pelo menos um cargo';
                }
                return {
                    valid: Object.keys(errors).length === 0,
                    errors
                };
            }
        }
    ];

    if (!orgaoId) {
        return <div className="loading-state"><div className="spinner"></div>Carregando...</div>;
    }

    return (
        <div className="criar-organograma">
            <div className="container">
                <div className="header-section">
                    <Button variant="outline" onClick={handleCancel}>← Voltar</Button>
                    <h1>👥 Criar Organograma Funcional - {nomeOrgao} <span className="sandbox-badge">SANDBOX</span></h1>
                    <p className="subtitle">Defina os cargos e funções do órgão</p>
                </div>

                <div className="wizard-container">
                    <div className="wizard-form-section">
                        <Card>
                            <WizardForm
                                steps={steps}
                                onComplete={handleCreateFuncional}
                                onCancel={handleCancel}
                                onDataChange={handleDataChange}
                                initialData={{}}
                            />
                        </Card>
                    </div>

                    <div className="preview-section">
                        <Card title="Preview em Tempo Real">
                            <LivePreviewCanvas
                                tipo="funcional"
                                data={previewData}
                                orgao={nomeOrgao || 'Órgão Sandbox'}
                            />
                        </Card>
                    </div>
                </div>
            </div>

            {showSuccess && (
                <SuccessOverlay
                    message="Organograma funcional criado com sucesso!"
                    onComplete={handleSuccessComplete}
                />
            )}

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

export default CriarSandboxFuncional;
