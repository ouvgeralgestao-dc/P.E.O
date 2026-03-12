/**
 * Página de Edição de Organograma
 * Permite editar nome do órgão, tamanho da folha e setores/cargos
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import WizardForm from '../components/forms/WizardForm';
import EstruturaForm from '../components/forms/EstruturaForm';
import FuncoesForm from '../components/forms/FuncoesForm';
import LivePreviewCanvas from '../components/preview/LivePreviewCanvas';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SuccessOverlay from '../components/common/SuccessOverlay';
import { logger } from '../utils/logger';
import api from '../services/api';
import './EditarOrganograma.css';

function EditarOrganograma() {
    const { nomeOrgao } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [organogramaData, setOrganogramaData] = useState(null);
    const [tipoOrganograma, setTipoOrganograma] = useState('estrutura');
    const [previewData, setPreviewData] = useState({ setores: [], cargos: [] });
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [pendingNavigate, setPendingNavigate] = useState(null);

    useEffect(() => {
        loadOrganograma();
    }, [nomeOrgao, searchParams]);

    const loadOrganograma = async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('EditarOrganograma', 'Carregando organograma', { nomeOrgao });

            const response = await api.get(`/organogramas/${encodeURIComponent(nomeOrgao)}`);
            const data = response.data.data;

            logger.success('EditarOrganograma', 'Organograma carregado', data);
            setOrganogramaData(data);

            // Determinar tipo baseado na URL (prioridade) ou nos dados
            const tipoUrl = searchParams.get('tipo');

            if (tipoUrl === 'funcoes') {
                setTipoOrganograma('funcoes');
            } else if (tipoUrl === 'estrutura' || data.organogramaEstrutural) {
                setTipoOrganograma('estrutura');
            } else if (data.organogramasFuncoes) {
                setTipoOrganograma('funcoes');
            }

        } catch (err) {
            logger.error('EditarOrganograma', 'Erro ao carregar organograma', err);
            setError(err.response?.data?.message || 'Erro ao carregar organograma');
        } finally {
            setLoading(false);
        }
    };

    // [FIX CRÍTICO] Helper para preparar cargos para salvamento (CamelCase -> SnakeCase)
    // Isso garante que o backend receba as chaves exatas que espera, independente da "mágica" interna
    const prepareCargosForSave = (cargosFrontend) => {
        if (!cargosFrontend) return [];
        return cargosFrontend.map(c => ({
            ...c,
            // Mapeamento Explícito Frontend -> Backend
            setor_ref: c.setorRef || c.setor_ref || null,
            is_operacional: c.isOperacional ? 1 : 0,
            is_assessoria: c.isAssessoria ? 1 : 0,
            parent_id: c.parentId || c.parent_id || null,
            nome_cargo: c.nomeCargo || c.nome_cargo
        }));
    };

    const handleSave = async (formData) => {
        try {
            logger.info('EditarOrganograma', 'Salvando alterações', formData);

            // Preparar dados para envio baseado no tipo
            let endpoint, payload;

            if (tipoOrganograma === 'estrutura') {
                endpoint = `/organogramas/${encodeURIComponent(nomeOrgao)}/estrutura`;
                payload = {
                    tamanhoFolha: formData.tamanhoFolha,
                    setores: formData.setores
                };
                console.error('🚀 PAYLOAD ESTRUTURA:', JSON.stringify(payload, null, 2));
            } else {
                endpoint = `/organogramas/${encodeURIComponent(nomeOrgao)}/funcoes`;

                // [FIX] Validar e preparar dados antes de enviar (Blindagem)
                const cargosPrepared = prepareCargosForSave(formData.cargos);

                logger.info('EditarOrganograma', 'Salvando Cargos (Prepared):', cargosPrepared.length);

                payload = {
                    tamanhoFolha: formData.tamanhoFolha,
                    cargos: cargosPrepared
                };
            }

            await api.put(endpoint, payload);

            logger.success('EditarOrganograma', 'Organograma atualizado com sucesso');

            // Determinar rota de destino
            let targetPath = '/';
            const temConteudo = tipoOrganograma === 'estrutura'
                ? (formData.setores && formData.setores.length > 0)
                : (formData.cargos && formData.cargos.length > 0);

            if (temConteudo) {
                targetPath = `/visualizar/${encodeURIComponent(nomeOrgao)}?tipo=${tipoOrganograma}`;
            }

            // Iniciar animação de Check suave
            setIsFinished(true);
            setPendingNavigate(targetPath);

            // Pequeno delay para visualizar o check verde na barra
            setTimeout(() => {
                setShowSuccess(true);
            }, 600);
        } catch (err) {
            logger.error('EditarOrganograma', 'Erro ao salvar alterações', err);
            alert('Erro ao salvar alterações: ' + (err.response?.data?.message || err.message));
        }
    };

    // Função utilitária para achatar a árvore de setores em uma lista plana
    const flattenSetores = (nodes, parentId = null) => {
        let flatList = [];
        if (!nodes) return flatList;

        nodes.forEach(node => {
            const { children, ...setorSemFilhos } = node;
            // Garante que tenha parentId, usando o fornecido se não existir no objeto
            // Normaliza parent_id (SQLite) para parentId (Frontend)
            const setorTratado = {
                ...setorSemFilhos,
                parentId: setorSemFilhos.parentId || setorSemFilhos.parent_id || parentId
            };

            flatList.push(setorTratado);

            if (children && children.length > 0) {
                flatList = flatList.concat(flattenSetores(children, node.id));
            }
        });
        return flatList;
    };

    // Função para normalizar cargos vindos do backend (compatibilidade com FuncoesForm)
    const normalizeCargos = (cargosBackend) => {
        if (!cargosBackend) return [];
        return cargosBackend.map(c => {
            // [FIX CRÍTICO] SEMPRE mapear campos snake_case -> camelCase
            // O mapeamento precisa acontecer para TODOS os cargos, não apenas os sem simbolos
            const cargoNormalizado = {
                ...c,
                // Mapeamento OBRIGATÓRIO de campos para o frontend
                setorRef: c.setorRef || c.setor_ref || c.data?.setorRef || null,
                isOperacional: c.isOperacional || !!c.is_operacional || c.data?.isOperacional || false,
                isAssessoria: c.isAssessoria || !!c.is_assessoria || false,
                parentId: c.parentId || c.parent_id || null,
                nomeCargo: c.nomeCargo || c.nome_cargo || c.label || 'Cargo',
                hierarquia: c.hierarquia || c.nivel || '1'
            };

            // Normalização de simbolos
            if (c.simbolos && Array.isArray(c.simbolos)) {
                cargoNormalizado.simbolos = c.simbolos;
            } else if (c.simbolo) {
                cargoNormalizado.simbolos = [{ tipo: c.simbolo, quantidade: c.quantidade || 1 }];
            } else {
                cargoNormalizado.simbolos = [];
            }

            return cargoNormalizado;
        });
    };

    // Função utilitária para achatar a árvore de cargos em uma lista plana, preservando dados
    const flattenCargosRecursive = (nodes, parentId = null) => {
        let flatList = [];
        if (!nodes) return flatList;

        nodes.forEach(node => {
            const { children, ...cargoSemFilhos } = node;
            const cargoTratado = {
                ...cargoSemFilhos,
                parentId: parentId
            };

            flatList.push(cargoTratado);

            if (children && children.length > 0) {
                flatList = flatList.concat(flattenCargosRecursive(children, node.id));
            }
        });
        return flatList;
    };

    // Callback para atualizar preview (memorizado)
    const handleDataChange = useCallback((data) => {
        let cargosPreview = data.cargos || [];

        // Normalização crítica para Preview Funcional
        if (data.cargos && data.cargos.length > 0) {
            cargosPreview = data.cargos.map(c => ({
                ...c,
                // Garante parentId se existir parentId (camel) ou parent_id (snake)
                parentId: c.parentId || c.parent_id || null,
                // Garante hierarquia numérica ou string válida
                hierarquia: c.hierarquia ? String(c.hierarquia) : '1',
                // Label fallback
                nomeCargo: c.nomeCargo || c.nome_cargo || 'Cargo Sem Nome'
            }));
        }

        setPreviewData({
            setores: data.setores || [],
            cargos: cargosPreview
        });
    }, []);

    // Helper para extrair dados iniciais para o formulário
    const getFormInitialData = () => {
        if (!organogramaData) return { nomeOrgao, setores: [], cargos: [] };

        const baseData = {
            nomeOrgao: organogramaData.orgao,
            tamanhoFolha: organogramaData.organogramaEstrutural?.tamanhoFolha || 'A4',
            setores: [],
            cargos: []
        };

        if (organogramaData.organogramaEstrutural) {
            baseData.setores = flattenSetores(organogramaData.organogramaEstrutural.setores || []);
        }

        if (organogramaData.organogramasFuncoes?.[0]) {
            const cargosFlat = flattenCargosRecursive(organogramaData.organogramasFuncoes[0].cargos || []);
            baseData.cargos = normalizeCargos(cargosFlat);
            baseData.tamanhoFolha = organogramaData.organogramasFuncoes[0].tamanhoFolha || baseData.tamanhoFolha;
        }

        return baseData;
    };

    // O preview agora é inicializado via handleDataChange no momento que o WizardForm monta
    // E recebe o currentData via onDataChange do useEffect interno dele.

    if (loading) {
        return (
            <div className="editar-organograma">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Carregando organograma...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="editar-organograma">
                <div className="container">
                    <Card title="Erro">
                        <p className="error-message">{error}</p>
                        <Button onClick={() => navigate('/')}>
                            ← Voltar para Dashboard
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // Preparar dados iniciais para o formulário
    const initialData = tipoOrganograma === 'estrutura'
        ? {
            nomeOrgao: organogramaData.orgao,
            tamanhoFolha: organogramaData.organogramaEstrutural?.tamanhoFolha || 'A3',
            setores: flattenSetores(organogramaData.organogramaEstrutural?.setores || [])
        }
        : {
            nomeOrgao: organogramaData.orgao,
            tamanhoFolha: organogramaData.organogramasFuncoes?.[0]?.tamanhoFolha || 'A3',
            cargos: normalizeCargos(flattenCargosRecursive(organogramaData.organogramasFuncoes?.[0]?.cargos || [])),
            // CORREÇÃO: Incluir setores estruturais para popular o dropdown de referência
            setores: flattenSetores(organogramaData.organogramaEstrutural?.setores || [])
        };

    // Configurar steps do wizard
    const steps = tipoOrganograma === 'estrutura'
        ? [
            {
                title: 'Editar Estrutura Organizacional',
                description: 'Edite os setores e hierarquia do organograma',
                component: EstruturaForm,
                validate: (data) => {
                    const errors = {};
                    if (!data.tamanhoFolha) errors.tamanhoFolha = 'Selecione o tamanho da folha';
                    // Nota: Permitimos 0 setores agora para suportar a exclusão total via "Finalizar"
                    return {
                        valid: Object.keys(errors).length === 0,
                        errors
                    };
                }
            }
        ]
        : [
            {
                title: 'Editar Funções e Cargos',
                description: 'Edite os cargos e símbolos do cargo',
                component: FuncoesForm,
                validate: (data) => {
                    const errors = {};
                    // Nota: Permitimos 0 cargos agora para suportar a exclusão total via "Finalizar"
                    return {
                        valid: Object.keys(errors).length === 0,
                        errors
                    };
                }
            }
        ];

    return (
        <div className="editar-organograma">
            {showSuccess && (
                <SuccessOverlay
                    message="Sua estrutura foi atualizada!"
                    onComplete={() => navigate(pendingNavigate)}
                />
            )}
            <div className="container">
                <div className="page-header">
                    <Button variant="outline" onClick={() => navigate(`/visualizar/${encodeURIComponent(nomeOrgao)}?tipo=${tipoOrganograma}`)}>
                        ← Voltar
                    </Button>
                    <h2 className="page-title">Editar Organograma</h2>
                </div>

                <div className="split-layout">
                    <div className="form-panel">
                        <WizardForm
                            steps={steps}
                            initialData={getFormInitialData()}
                            onComplete={handleSave}
                            onCancel={() => navigate(`/visualizar/${encodeURIComponent(nomeOrgao)}?tipo=${tipoOrganograma}`)}
                            onDataChange={handleDataChange}
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
                                    {isFinished ? 'Estrutura atualizada!' : 'Enquanto você preenche as opções, estamos construindo sua estrutura...'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditarOrganograma;
