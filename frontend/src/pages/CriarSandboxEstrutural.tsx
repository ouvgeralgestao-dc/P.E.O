import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WizardForm from '../components/forms/WizardForm';
import EstruturaForm from '../components/forms/EstruturaForm';
import LivePreviewCanvas from '../components/preview/LivePreviewCanvas';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SuccessOverlay from '../components/common/SuccessOverlay';
import { logger } from '../utils/logger';
import api from '../services/api';
import './CriarOrganograma.css';

function CriarSandboxEstrutural() {
    const { nomeOrgao } = useParams<{ nomeOrgao: string }>();
    const navigate = useNavigate();
    const [orgaoId, setOrgaoId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [previewData, setPreviewData] = useState({ setores: [] });
    const [pendingNavigate, setPendingNavigate] = useState<string | null>(null);

    const [initialData, setInitialData] = useState<any>({});

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

            // Tentar carregar dados existentes para edição
            try {
                const existingDataResponse = await api.get(`/sandbox/estrutural/${orgao.id}`);
                if (existingDataResponse.data && existingDataResponse.data.setores && existingDataResponse.data.setores.length > 0) {
                    setInitialData({ setores: existingDataResponse.data.setores });
                    setPreviewData({ setores: existingDataResponse.data.setores }); // Preview inicial
                    logger.info('CriarSandboxEstrutural', 'Dados existentes carregados para edição');
                }
            } catch (ignore) {
                // Se der 404 ou erro, assume criação nova (vazio)
            }

        } catch (error) {
            logger.error('CriarSandboxEstrutural', 'Erro ao carregar órgão', error);
            alert('Erro ao carregar órgão.');
            navigate('/criacao-livre');
        }
    };

    const handleCreateEstrutural = useCallback(async (formData: any) => {
        if (!orgaoId) return;

        try {
            setIsCreating(true);
            logger.info('CriarSandboxEstrutural', 'Criando organograma estrutural sandbox', formData);

            await api.post(`/sandbox/estrutural/${orgaoId}`, {
                setores: formData.setores,
            });

            setIsFinished(true);
            setPendingNavigate(`/criacao-livre/${encodeURIComponent(nomeOrgao || '')}/estrutural`);

            setTimeout(() => {
                setShowSuccess(true);
            }, 600);
        } catch (error: any) {
            logger.error('CriarSandboxEstrutural', 'Erro ao criar organograma', error);
            alert('Erro ao criar organograma: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsCreating(false);
        }
    }, [orgaoId, nomeOrgao]);

    const handleCancel = () => {
        navigate(`/criacao-livre`);
    };

    const handleDataChange = useCallback((data: any) => {
        setPreviewData({ setores: data.setores || [] });
    }, []);

    const handleSuccessComplete = () => {
        if (pendingNavigate) {
            navigate(pendingNavigate);
        }
    };

    const steps = useMemo(() => [
        {
            id: 'estrutura',
            title: 'Estrutura Organizacional',
            component: EstruturaForm,
            props: { disableOrgaoSelection: true },
            validate: (data: any) => {
                const errors: any = {};
                if (!data.setores || data.setores.length === 0) {
                    errors.setores = 'Adicione pelo menos um setor';
                }
                return {
                    valid: Object.keys(errors).length === 0,
                    errors
                };
            }
        }
    ], []);

    // Memoizar initialData para evitar disparos desnecessários do formulário
    const memoizedInitialData = useMemo(() => ({
        ...initialData,
        setores: initialData.setores || []
    }), [initialData]);

    // Renderizar o WizardForm de forma estável para evitar loops (Memoizado no topo p/ evitar violação de Hooks)
    const wizardForm = useMemo(() => (
        <WizardForm
            steps={steps}
            onComplete={handleCreateEstrutural}
            onCancel={handleCancel}
            onDataChange={handleDataChange}
            initialData={memoizedInitialData}
        />
    ), [steps, handleCreateEstrutural, handleCancel, handleDataChange, memoizedInitialData]);

    if (!orgaoId) {
        return <div className="loading-state"><div className="spinner"></div>Carregando...</div>;
    }

    return (
        <div className="criar-organograma">
            <div className="container">
                <div className="header-section">
                    <Button variant="outline" onClick={handleCancel}>← Voltar</Button>
                    <h1 className="page-title">🏢 Criar Organograma Estrutural - {nomeOrgao} <span className="sandbox-badge">SANDBOX</span></h1>
                    <p className="subtitle" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Defina a hierarquia de setores do órgão</p>
                </div>

                <div className="split-layout">
                    <div className="form-panel">
                        <Card>
                            {wizardForm}
                        </Card>
                    </div>

                    <div className="preview-panel">
                        <Card title="Preview em Tempo Real">
                            <LivePreviewCanvas
                                setores={previewData.setores || []}
                                cargos={[]}
                                isFuncional={false}
                            />
                        </Card>
                    </div>
                </div>
            </div>

            {showSuccess && (
                <SuccessOverlay
                    message="Organograma estrutural criado com sucesso!"
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

export default CriarSandboxEstrutural;
