/**
 * Página de Criação de Organogramas
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WizardForm from '../components/forms/WizardForm';
import EstruturaForm from '../components/forms/EstruturaForm';
import FuncoesForm from '../components/forms/FuncoesForm';
import LivePreviewCanvas from '../components/preview/LivePreviewCanvas';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SuccessOverlay from '../components/common/SuccessOverlay';
import { logger } from '../utils/logger';
import api from '../services/api';
import { validateNome } from '../utils/validators';
import { getOrgaoById } from '../constants/orgaos';
import './CriarOrganograma.css';

function CriarOrganograma() {
    const navigate = useNavigate();
    const location = useLocation();
    const [tipoOrganograma, setTipoOrganograma] = useState<string | null>(null);
    const [prefilledOrgao, setPrefilledOrgao] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [previewData, setPreviewData] = useState({ setores: [], cargos: [] });
    const [pendingNavigate, setPendingNavigate] = useState<string | null>(null);

    // Efeito para preencher via Query Params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tipo = params.get('tipo');
        const orgao = params.get('orgao');

        if (tipo === 'estrutural' || tipo === 'funcoes') {
            setTipoOrganograma(tipo);
        }

        if (orgao) {
            setPrefilledOrgao(orgao);
        }
    }, [location]);

    logger.info('CriarOrganograma', 'Página carregada', { tipoOrganograma, prefilledOrgao });

    // Selecionar tipo de organograma
    const handleSelectTipo = (tipo) => {
        setTipoOrganograma(tipo);
    };

    // Voltar para seleção de tipo
    const handleBack = () => {
        setTipoOrganograma(null);
    };

    // Criar organograma estrutural
    const handleCreateEstrutural = async (formData) => {
        try {
            setIsCreating(true);
            logger.info('CriarOrganograma', 'Criando organograma estrutural', formData);

            // Obter nome completo do órgão a partir do ID
            const orgaoInfo = getOrgaoById(formData.nomeOrgao);
            const nomeCompleto = orgaoInfo ? orgaoInfo.nome : formData.nomeOrgao;

            const response = await api.post('/organogramas/estrutural', {
                nomeOrgao: nomeCompleto,
                tamanhoFolha: formData.tamanhoFolha,
                setores: formData.setores,
                password: formData.password
            });

            // Iniciar animação de Check suave
            setIsFinished(true);
            setPendingNavigate(`/visualizar/${encodeURIComponent(nomeCompleto)}`);

            // Pequeno delay para visualizar o check verde na barra
            setTimeout(() => {
                setShowSuccess(true);
            }, 600);
        } catch (error) {
            logger.error('CriarOrganograma', 'Erro ao criar organograma', error);
            alert('Erro ao criar organograma: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsCreating(false);
        }
    };

    // Criar organograma de funções
    const handleCreateFuncoes = async (formData) => {
        try {
            setIsCreating(true);
            logger.info('CriarOrganograma', 'Criando organograma de funções', formData);

            // Obter nome completo
            const orgaoInfo = getOrgaoById(formData.nomeOrgao);
            const nomeCompleto = orgaoInfo ? orgaoInfo.nome : formData.nomeOrgao;

            const response = await api.post('/organogramas/funcoes', {
                nomeOrgao: nomeCompleto,
                tamanhoFolha: formData.tamanhoFolha,
                cargos: formData.cargos,
                password: formData.password
            });

            logger.success('CriarOrganograma', 'Organograma criado com sucesso', response.data);

            // Iniciar animação de Check suave
            setIsFinished(true);
            setPendingNavigate(`/visualizar/${encodeURIComponent(formData.nomeOrgao)}`);

            // Pequeno delay para visualizar o check verde na barra
            setTimeout(() => {
                setShowSuccess(true);
            }, 600);
        } catch (error) {
            logger.error('CriarOrganograma', 'Erro ao criar organograma', error);
            alert('Erro ao criar organograma: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsCreating(false);
        }
    };

    // Validação para organograma estrutural
    const validateEstrutural = (data) => {
        const errors = {};

        const nomeValidation = validateNome(data.nomeOrgao);
        if (!nomeValidation.valid) {
            errors.nomeOrgao = nomeValidation.message;
        }

        if (!data.setores || data.setores.length === 0) {
            errors.setores = 'Adicione pelo menos um setor';
        }

        if (data.passwordRequired && !data.password) {
            errors.password = 'Defina uma senha para este novo órgão';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    };

    // Validação para organograma de funções
    const validateFuncoes = (data) => {
        const errors = {};

        const nomeValidation = validateNome(data.nomeOrgao);
        if (!nomeValidation.valid) {
            errors.nomeOrgao = nomeValidation.message;
        }

        if (!data.cargos || data.cargos.length === 0) {
            errors.cargos = 'Adicione pelo menos um cargo';
        }

        if (data.passwordRequired && !data.password) {
            errors.password = 'Defina uma senha para este novo órgão';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    };

    // Steps para organograma estrutural
    const estruturalSteps = [
        {
            title: 'Estrutura Organizacional',
            description: 'Defina a hierarquia de setores do órgão',
            component: EstruturaForm,
            validate: validateEstrutural
        }
    ];

    // Steps para organograma de funções
    const funcoesSteps = [
        {
            title: 'Funções e Cargos',
            description: 'Defina os cargos e suas funções',
            component: FuncoesForm,
            validate: validateFuncoes
        }
    ];

    // Callback para atualizar preview (memorizado para evitar loop infinito)
    const handleDataChange = useCallback((data) => {
        setPreviewData({
            setores: data.setores || [],
            cargos: data.cargos || []
        });
    }, []);

    // Renderizar seleção de tipo
    if (!tipoOrganograma) {
        return (
            <div className="criar-organograma">
                <div className="container">
                    <h2 className="page-title-main">Criar Novo Organograma</h2>
                    <p className="page-description">
                        Selecione o tipo de organograma que deseja criar
                    </p>

                    <div className="tipo-selection single-option" style={{ display: 'flex', justifyContent: 'center' }}>
                        <Card
                            hoverable
                            onClick={() => handleSelectTipo('estrutural')}
                            className="tipo-card premium-selection-card"
                            style={{ maxWidth: '500px' }}
                        >
                            <div className="tipo-icon">🏢</div>
                            <h3>Estrutura Organizacional</h3>
                            <p>
                                Crie a hierarquia de setores do órgão, definindo a estrutura
                                organizacional completa com níveis hierárquicos ajustados.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizar wizard
    return (
        <div className="criar-organograma">
            {showSuccess && (
                <SuccessOverlay
                    onComplete={() => navigate(pendingNavigate || '/')}
                />
            )}
            <div className="container">
                <div className="wizard-header">
                    <Button variant="outline" onClick={handleBack}>
                        ← Voltar
                    </Button>
                    <h2 className="page-title">
                        {tipoOrganograma === 'estrutural' ? 'Estrutura Organizacional' : 'Funções e Cargos'}
                    </h2>
                </div>

                {isCreating ? (
                    <div className="creating-message">
                        <div className="spinner"></div>
                        <p>Criando organograma...</p>
                    </div>
                ) : (
                    <div className="split-layout">
                        <div className="form-panel">
                            <WizardForm
                                steps={tipoOrganograma === 'estrutural' ? estruturalSteps : funcoesSteps}
                                onComplete={tipoOrganograma === 'estrutural' ? handleCreateEstrutural : handleCreateFuncoes}
                                onCancel={handleBack}
                                onDataChange={handleDataChange}
                                initialData={{ nomeOrgao: prefilledOrgao }}
                            />
                        </div>
                        <div className="preview-panel">
                            <LivePreviewCanvas
                                setores={previewData.setores}
                                cargos={previewData.cargos}
                                isFuncional={tipoOrganograma === 'funcoes'}
                            />
                            {/* Mensagem de Construção Animada */}
                            <div className="construction-message-wrapper">
                                <div className={`construction-loading-bar ${isFinished ? 'finished' : ''}`}>
                                    <div className="loading-spinner-icon"></div>
                                    <span className="construction-text">
                                        {isFinished ? 'Estrutura finalizada!' : 'Enquanto você preenche as opções, estamos construindo sua estrutura...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CriarOrganograma;
