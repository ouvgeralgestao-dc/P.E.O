/**
 * Página de Visualização de Organograma Individual
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import OrganogramaCanvas from '../components/canvas/OrganogramaCanvas';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import BackButton from '../components/common/BackButton';
import { logger } from '../utils/logger';
import { exportToPNG, exportToJPG, exportToPDF } from '../utils/exportHelpers';
import api from '../services/api';
import { formatOrgaoName } from '../utils/formatters';
import TabelaQuantidades from '../components/common/TabelaQuantidades';
import './VisualizarOrganograma.css';

function VisualizarOrganograma() {
    const { nomeOrgao } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [fullData, setFullData] = useState<any>(null); // Dados brutos da API
    const [displayData, setDisplayData] = useState<any>(null); // Dados filtrados para o Canvas
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    // Estados para proteção por senha REMOVIDOS

    // Ref para guardar os dados atuais do React Flow (nós e arestas)
    const flowDataRef = React.useRef({ nodes: [], edges: [] });

    // Ref para guardar fullData atualizado (evita stale closure)
    const fullDataRef = React.useRef(null);

    // Callback para atualizar a ref quando o Canvas mudar
    const handleFlowDataChange = useCallback((data: any) => {
        flowDataRef.current = data;
    }, []);

    const tipoVisualizacao = searchParams.get('tipo') || 'estrutura';
    const idVisualizacao = searchParams.get('id');

    useEffect(() => {
        loadOrganograma();
    }, [nomeOrgao]);

    // Atualizar displayData quando fullData ou query params mudarem
    useEffect(() => {
        if (!fullData) return;

        if (tipoVisualizacao === 'estrutura' && fullData.organogramaEstrutural) {
            setDisplayData({
                orgao: fullData.orgao,
                organogramaEstrutural: fullData.organogramaEstrutural,
                // Não passamos organogramasFuncoes para evitar renderização duplicada
            });
        } else if (tipoVisualizacao === 'funcoes' && fullData.organogramasFuncoes) {
            // Filtrar pelo ID se fornecido, ou pegar SOMENTE O PRIMEIRO (Latest)
            // O backend retorna ordenado por createdAt DESC, então [0] é o atual.
            // Exibir múltiplas versões ao mesmo tempo causa sobreposição e estatísticas incorretas.
            const funcoes = idVisualizacao
                ? fullData.organogramasFuncoes.filter((f: any) => f.id === idVisualizacao)
                : (fullData.organogramasFuncoes.length > 0 ? [fullData.organogramasFuncoes[0]] : []);

            setDisplayData({
                orgao: fullData.orgao,
                organogramasFuncoes: funcoes,
                // Não passamos organogramaEstrutural
            });
        } else {
            // Fallback: mostrar tudo (comportamento antigo) ou nada
            setDisplayData(fullData);
        }
    }, [fullData, tipoVisualizacao, idVisualizacao]);

    const loadOrganograma = async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('VisualizarOrganograma', 'Carregando organograma', { nomeOrgao });

            const response = await api.get(`/organogramas/${encodeURIComponent(nomeOrgao as string)}`);

            logger.success('VisualizarOrganograma', 'Organograma carregado', response.data);
            setFullData(response.data.data);
            fullDataRef.current = response.data.data; // Atualizar ref também
        } catch (err: any) {
            logger.error('VisualizarOrganograma', 'Erro ao carregar organograma', err);
            setError(err.response?.data?.message || 'Erro ao carregar organograma');
        } finally {
            setLoading(false);
        }
    };

    // Ir direto para edição (permissão controlada por ProtectedRoute e Backend)
    const handleEditClick = () => {
        navigate(`/editar/${encodeURIComponent(nomeOrgao as string)}?tipo=${tipoVisualizacao}`);
    };

    // Confirmar e deletar com mensagens diferenciadas por tipo
    const handleDeleteClick = async () => {
        let confirmMessage = '';

        if (tipoVisualizacao === 'estrutura') {
            confirmMessage = '⚠️ ATENÇÃO: Ao deletar o organograma ESTRUTURAL, o FUNCIONAL também será deletado!\n\nO órgão permanecerá na lista de configuração para criação futura.\n\nTEM CERTEZA QUE DESEJA CONTINUAR?';
        } else {
            confirmMessage = 'Deseja deletar o organograma funcional?\n\nO organograma estrutural e o órgão permanecem intactos.\n\nConfirmar?';
        }

        if (window.confirm(confirmMessage)) {
            await executeDelete();
        }
    };

    const [styleSettings, setStyleSettings] = useState(null); // { backgroundColor, textColor, ... }
    const [pendingSaveData, setPendingSaveData] = useState(null); // Dados aguardando senha para salvar
    const isSavingRef = React.useRef(false); // Trava para evitar double-submit

    // Callback recebido do Canvas quando usuário clica em Salvar Posições
    // Usa fullDataRef para evitar stale closure
    const handleSaveLayoutRequest = useCallback((updatedNodesData: any) => {
        // Salvamento direto sem senha (Meta 0)
        executeSaveLayout(updatedNodesData);
    }, []);

    // Executar salvamento após senha (ou diretamente)
    // Usa fullDataRef.current em vez de fullData para ter sempre o valor atualizado
    const executeSaveLayout = async (dataToSave = pendingSaveData) => {
        if (!dataToSave) return;
        if (isSavingRef.current) {
            logger.warn('VisualizarOrganograma', 'Salvamento já em andamento, ignorando...');
            return;
        }

        // Usar a ref para obter os dados mais atualizados
        const currentFullData = fullDataRef.current;
        if (!currentFullData) {
            logger.warn('VisualizarOrganograma', 'Dados ainda não carregados, aguarde...');
            alert('Aguarde o carregamento completo dos dados antes de salvar.');
            return;
        }

        try {
            isSavingRef.current = true;
            logger.info('VisualizarOrganograma', 'Salvando layout customizado');

            const orgaoId = (currentFullData as any).orgaoId || encodeURIComponent(nomeOrgao as string);

            // Função utilitária para "achatar" árvores antes de enviar para o backend
            const flattenRecursively = (items: any[]) => {
                let result: any[] = [];
                items.forEach(item => {
                    const { children, ...rest } = item as any;
                    result.push(rest);
                    if (children && children.length > 0) {
                        result = [...result, ...flattenRecursively(children)];
                    }
                });
                return result;
            };

            // Verificar se estamos no modo Estrutura ou Funções
            if (tipoVisualizacao === 'estrutura') {
                // IMPORTANTE: Não sobrescrever a estrutura completa!
                // Apenas atualizar posições e estilos dos setores existentes
                console.log('[DEBUG Save] dataToSave do canvas:', dataToSave);

                // Pegar estrutura original completa
                const originalSetores = (currentFullData as any).organogramaEstrutural?.setores || [];

                // Função recursiva para atualizar posições/estilos preservando hierarquia
                const updateSetoresRecursively = (setores: any[]) => {
                    return setores.map(setor => {
                        const match = (dataToSave as any[]).find((n: any) => n.id === setor.id);
                        const updatedSetor = {
                            ...setor,
                            position: match?.position || setor.position,
                            // CORREÇÃO: Verificar customStyle que vem do Canvas
                            style: match?.customStyle || match?.style || setor.style
                        };

                        // Processar children recursivamente
                        if (setor.children && setor.children.length > 0) {
                            updatedSetor.children = updateSetoresRecursively(setor.children);
                        }

                        return updatedSetor;
                    });
                };

                const updatedSetores = updateSetoresRecursively(originalSetores);

                // IMPORTANTE: O backend espera uma lista plana (flat) se for classificado como "Full Edit"
                // (que acontece quando enviamos objetos completos com nomeSetor, etc).
                // Se enviarmos aninhado, o buildHierarchy do backend vai ignorar os filhos e perder dados.

                const flattenedSetores = flattenRecursively(updatedSetores);

                const payload = {
                    tamanhoFolha: currentFullData.organogramaEstrutural?.tamanhoFolha || 'A3',
                    setores: flattenedSetores
                };

                await api.put(`/organogramas/${orgaoId}/estrutura`, payload);

            } else if (tipoVisualizacao === 'funcoes') {
                // Preparar dados para updateFuncoes
                const currentOrgFuncoes = (currentFullData as any).organogramasFuncoes?.[0];
                if (!currentOrgFuncoes) return;

                // Função recursiva para atualizar cargos em toda a árvore
                const updateCargosRecursively = (cargos: any[]) => {
                    return cargos.map(cargo => {
                        const match = (dataToSave as any[]).find((n: any) => n.id === cargo.id);

                        // DEBUG: Verificar se encontrou o match para atualização de posição
                        if (!match) {
                            console.warn(`[VisualizarOrganograma] Match não encontrado para cargo ${cargo.id} (${cargo.nomeCargo}). Posição não será atualizada.`);
                        } else {
                            console.log(`[VisualizarOrganograma] Atualizando cargo ${cargo.id}. Match found? ${!!match} | Style no match:`, match?.customStyle || match?.style);
                        }

                        const updatedCargo = {
                            id: cargo.id,
                            nomeCargo: cargo.nomeCargo || cargo.nome_cargo || cargo.label || 'Cargo',
                            ocupante: cargo.ocupante || '',
                            hierarquia: (() => {
                                const h = parseInt(cargo.hierarquia ?? cargo.nivel ?? 0);
                                return isNaN(h) ? 0 : h;
                            })(),
                            parentId: cargo.parentId || cargo.parent_id || null,
                            simbolos: cargo.simbolos || [],
                            position: match?.position || cargo.position || { x: 0, y: 0 },
                            // CORREÇÃO: Verificar customStyle que vem do Canvas
                            style: match?.customStyle || match?.style || cargo.style || cargo.customStyle || {}
                        };

                        if (cargo.children && cargo.children.length > 0) {
                            updatedCargo.children = updateCargosRecursively(cargo.children);
                        }

                        return updatedCargo;
                    });
                };

                const updatedCargos = updateCargosRecursively(currentOrgFuncoes.cargos || []);

                if (updatedCargos.length === 0) {
                    logger.warn('VisualizarOrganograma', 'Nenhum cargo para salvar no modo funções');
                    return;
                }

                const flattenedCargos = flattenRecursively(updatedCargos);

                const payload = {
                    tamanhoFolha: currentOrgFuncoes?.tamanhoFolha || currentFullData.organogramaEstrutural?.tamanhoFolha || 'A3',
                    cargos: flattenedCargos
                };

                await api.put(`/organogramas/${orgaoId}/funcoes`, payload);
            }

            logger.success('VisualizarOrganograma', 'Layout salvo com sucesso (AutoSave)');
            // Removido alert e loadOrganograma para evitar interrupção e reset visual
            setPendingSaveData(null);
        } catch (err) {
            logger.error('VisualizarOrganograma', 'Erro ao salvar layout', err);
            // Apenas logar erro no console/logger, sem alert para não interromper fluxo
        } finally {
            isSavingRef.current = false;
        }
    };

    // Validar senha REMOVIDO (Lógica obsoleta)

    // Executar exclusão com rota específica para cada tipo
    const executeDelete = async () => {
        try {
            const encodedName = encodeURIComponent(nomeOrgao as string);
            let endpoint = '';

            if (tipoVisualizacao === 'estrutura') {
                endpoint = `/organogramas/${encodedName}/estrutura`;
                logger.info('VisualizarOrganograma', 'Deletando organograma ESTRUTURAL (e funcional)', { nomeOrgao });
            } else {
                endpoint = `/organogramas/${encodedName}/funcoes`;
                logger.info('VisualizarOrganograma', 'Deletando apenas organograma FUNCIONAL', { nomeOrgao });
            }

            await api.delete(endpoint);

            logger.success('VisualizarOrganograma', 'Organograma deletado');
            alert('Organograma deletado com sucesso!');
            navigate('/');
        } catch (err: any) {
            logger.error('VisualizarOrganograma', 'Erro ao deletar organograma', err);
            alert('Erro ao deletar organograma: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleExportPNG = async () => {
        try {
            setExporting(true);
            const { saveAs } = await import('file-saver');

            const canvasElement = document.querySelector('.react-flow');
            if (!canvasElement) {
                alert('Erro: Canvas não encontrado');
                setExporting(false);
                return;
            }

            const tamanhoFolha = displayData?.organogramaEstrutural?.tamanhoFolha ||
                displayData?.organogramasFuncoes?.[0]?.tamanhoFolha || 'A3';

            const blob = await exportToPNG(canvasElement, tamanhoFolha);
            const filename = `organograma_${nomeOrgao}_${Date.now()}.png`;
            saveAs(blob, filename);
            setExporting(false);
        } catch (error) {
            console.error('Erro ao exportar PNG:', error);
            alert('Erro ao exportar PNG: ' + error.message);
            setExporting(false);
        }
    };

    const handleExportJPG = async () => {
        try {
            setExporting(true);
            const { saveAs } = await import('file-saver');

            const canvasElement = document.querySelector('.react-flow');
            if (!canvasElement) {
                alert('Erro: Canvas não encontrado');
                setExporting(false);
                return;
            }

            const tamanhoFolha = displayData?.organogramaEstrutural?.tamanhoFolha ||
                displayData?.organogramasFuncoes?.[0]?.tamanhoFolha || 'A3';

            const blob = await exportToJPG(canvasElement, tamanhoFolha);
            const filename = `organograma_${nomeOrgao}_${Date.now()}.jpg`;
            saveAs(blob, filename);
            setExporting(false);
        } catch (error) {
            console.error('Erro ao exportar JPG:', error);
            alert('Erro ao exportar JPG: ' + error.message);
            setExporting(false);
        }
    };

    const handlePrintPreview = useCallback(() => {
        try {
            const { nodes, edges } = flowDataRef.current;

            if (!nodes || nodes.length === 0) {
                alert('Aguarde o carregamento do organograma...');
                return;
            }

            // Salvar estado atual para ser carregado na janela de impressão
            const printData = JSON.stringify({
                nodes: nodes,
                edges: edges,
                title: nomeOrgao || 'Organograma'
            });
            localStorage.setItem('printData', printData);

            // Abrir nova aba de impressão
            window.open('/imprimir', '_blank');
        } catch (error) {
            console.error('Erro ao abrir impressão:', error);
            alert('Erro ao preparar impressão.');
        }
    }, [nomeOrgao]);

    const handleExportPDF = async () => {
        try {
            setExporting(true);

            const canvasElement = document.querySelector('.react-flow');
            if (!canvasElement) {
                alert('Erro: Canvas não encontrado');
                setExporting(false);
                return;
            }

            const tamanhoFolha = displayData?.organogramaEstrutural?.tamanhoFolha ||
                displayData?.organogramasFuncoes?.[0]?.tamanhoFolha || 'A3';

            const pdf = await exportToPDF(canvasElement, tamanhoFolha);
            pdf.save(`organograma_${nomeOrgao}_${Date.now()}.pdf`);
            setExporting(false);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao exportar PDF: ' + error.message);
            setExporting(false);
        }
    };

    // Calcular estatísticas de cargos para o modo Funcional
    const estatisticasCargos = React.useMemo(() => {
        if (tipoVisualizacao !== 'funcoes' || !displayData?.organogramasFuncoes) return null;

        const stats = {};

        const processarCargos = (lista: any[]) => {
            if (!lista) return;
            lista.forEach(cargo => {
                const nome = cargo.nomeCargo;
                if (nome) {
                    // Agrupar pela primeira palavra (Prefixo)
                    const prefixo = nome.split(' ')[0].trim();
                    const qtdCargo = cargo.quantidade ? parseInt(cargo.quantidade) : 1;

                    if (!(stats as any)[prefixo]) {
                        (stats as any)[prefixo] = { total: 0, simbolosMap: {} };
                    }

                    (stats as any)[prefixo].total += qtdCargo;

                    // Agregar símbolos deste cargo
                    if (cargo.simbolos && Array.isArray(cargo.simbolos)) {
                        cargo.simbolos.forEach((sim: any) => {
                            const qtdSim = sim.quantidade ? parseInt(sim.quantidade) : 0;
                            const tipoSim = sim.tipo;
                            if (tipoSim && qtdSim > 0) {
                                (stats as any)[prefixo].simbolosMap[tipoSim] = ((stats as any)[prefixo].simbolosMap[tipoSim] || 0) + qtdSim;
                            }
                        });
                    }
                }

                if (cargo.children && cargo.children.length > 0) {
                    processarCargos(cargo.children);
                }
            });
        };

        if (displayData.organogramasFuncoes && displayData.organogramasFuncoes.length > 0) {
            processarCargos(displayData.organogramasFuncoes[0].cargos);
        }

        // Formatar para exibição na tabela (compatível com nova estrutura de objeto)
        const formattedStats = {};
        Object.keys(stats).forEach(prefixo => {
            const item = (stats as any)[prefixo];
            const detalhesArr = Object.entries(item.simbolosMap as any)
                .map(([tipo, qtd]) => `${tipo} (${qtd})`);

            const detalhes = detalhesArr.length > 0 ? detalhesArr.join(', ') : '-';

            (formattedStats as any)[prefixo] = {
                total: item.total,
                detalhes: detalhes
            };
        });

        return formattedStats as any;
    }, [displayData, tipoVisualizacao]);

    if (loading) {
        return (
            <div className="visualizar-organograma">
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
            <div className="visualizar-organograma">
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

    return (
        <div className="visualizar-organograma">
            <div className="visualizar-header">
                <div className="header-content container">
                    <div className="header-left">
                        <BackButton to="/" />
                    </div>

                    {/* Título Centralizado */}
                    <div className="header-right">
                        <div className="header-titles">
                            <h1 className="org-title">{formatOrgaoName(displayData?.orgao)}</h1>
                            <span className="org-subtitle">
                                {tipoVisualizacao === 'funcoes' ? 'Funções e Cargos' : 'Estrutura Organizacional'}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Toolbar de estilos global REMOVIDA - Meta 0.2 */}
                {/* Agora a estilização é feita clicando diretamente na caixinha */}
            </div>

            {/* Botões Flutuantes - Fixos no Lado Direito */}
            <div className="header-actions">
                <Button
                    className="btn-action btn-print"
                    onClick={handlePrintPreview}
                >
                    <span className="btn-icon">🖨️</span> Imprimir / PDF
                </Button>
                <Button
                    className="btn-action btn-edit"
                    variant="secondary"
                    onClick={handleEditClick}
                >
                    <span className="btn-icon">✏️</span> Editar
                </Button>
                <Button
                    className="btn-action btn-delete"
                    variant="danger"
                    onClick={handleDeleteClick}
                >
                    <span className="btn-icon">🗑️</span> Deletar
                </Button>
            </div>

            <div className="container main-content-area">
                {/* Canvas - Ocupa toda a largura inicialmente */}
                <Card className="canvas-card">
                    <OrganogramaCanvas
                        organogramaData={displayData}
                        onDataChange={handleFlowDataChange}
                        onSavePositions={handleSaveLayoutRequest}
                    />
                </Card>
            </div>

            {/* Nova Seção Footer - Informações e Estatísticas lado a lado */}
            <div className="container visualizar-footer">
                <div className="footer-grid">
                    {/* Coluna 1: Informações Gerais */}
                    <Card title="Informações" className="info-card">
                        <div className="info-item">
                            <span className="info-label">Órgão:</span>
                            <span className="info-value">{formatOrgaoName(displayData?.orgao)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Tipo:</span>
                            <span className="info-value">
                                {tipoVisualizacao === 'funcoes' ? 'Funções e Cargos' : 'Estrutura Organizacional'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Criado em:</span>
                            <span className="info-value">
                                {fullData?.createdAt ? new Date(fullData.createdAt).toLocaleDateString('pt-BR') : '-'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-value">
                                {fullData?.updatedAt ? new Date(fullData.updatedAt).toLocaleDateString('pt-BR') : '-'}
                            </span>
                        </div>
                        {tipoVisualizacao === 'funcoes' && estatisticasCargos && (
                            <div className="info-item">
                                <span className="info-label">Total de Cargos:</span>
                                <span className="info-value">
                                    {Object.values(estatisticasCargos).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0)}
                                </span>
                            </div>
                        )}
                        {(!tipoVisualizacao || tipoVisualizacao === 'estrutura') && (
                            <>
                                <div className="info-item">
                                    <span className="info-label">Total de Setores:</span>
                                    <span className="info-value">
                                        {(() => {
                                            const countSetores = (nodes) => {
                                                if (!nodes) return 0;
                                                return nodes.reduce((acc, node) => acc + 1 + countSetores(node.children), 0);
                                            };
                                            return displayData?.organogramaEstrutural?.setores
                                                ? countSetores(displayData.organogramaEstrutural.setores)
                                                : '-';
                                        })()}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Total de Símbolos:</span>
                                    <span className="info-value">
                                        {(() => {
                                            let totalSimbolos = 0;
                                            const contarSimbolos = (nodes) => {
                                                if (!nodes) return;
                                                nodes.forEach(n => {
                                                    if (n.cargos) n.cargos.forEach(c => totalSimbolos += (parseInt(c.quantidade) || 0));
                                                    if (n.children) contarSimbolos(n.children);
                                                });
                                            };
                                            if (displayData?.organogramaEstrutural?.setores) {
                                                contarSimbolos(displayData.organogramaEstrutural.setores);
                                            }
                                            return totalSimbolos > 0 ? totalSimbolos : '-';
                                        })()}
                                    </span>
                                </div>
                            </>
                        )}
                    </Card>

                    {/* Coluna 2: Tabela de Estatísticas (Ocupa mais espaço) */}
                    {displayData?.organogramaEstrutural && (
                        <Card title="Quantidade de Símbolos por Setores" className="stats-card">
                            <div className="tabela-quantidades-container">
                                <table className="tabela-simples">
                                    <thead>
                                        <tr>
                                            <th className="text-left" style={{ width: '30%' }}>Setor</th>
                                            <th className="text-right" style={{ width: '10%' }}>Qtd.</th>
                                            <th className="text-left" style={{ paddingLeft: '20px' }}>Detalhamento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const getSectorStatistics = (nodes) => {
                                                let stats = [];
                                                const process = (node) => {
                                                    let total = 0;
                                                    let details = [];

                                                    if (node.cargos && node.cargos.length > 0) {
                                                        const cargoMap = new Map();
                                                        node.cargos.forEach(c => {
                                                            if (c.quantidade > 0) {
                                                                const qtd = parseInt(c.quantidade);
                                                                const tipo = c.tipo;
                                                                cargoMap.set(tipo, (cargoMap.get(tipo) || 0) + qtd);
                                                            }
                                                        });

                                                        cargoMap.forEach((qtd, tipo) => {
                                                            total += qtd;
                                                            details.push(`${tipo} (${qtd})`);
                                                        });
                                                    }

                                                    stats.push({
                                                        id: node.id,
                                                        name: node.nomeSetor,
                                                        total: total,
                                                        details: details.length > 0 ? details.join(', ') : '-'
                                                    });

                                                    if (node.children && node.children.length > 0) {
                                                        node.children.forEach(child => process(child));
                                                    }
                                                };
                                                nodes.forEach(node => process(node));
                                                return stats;
                                            };

                                            const sectorStats = getSectorStatistics(displayData.organogramaEstrutural.setores || []);

                                            return sectorStats.map((stat, index) => (
                                                <tr key={stat.id || index}>
                                                    <td className="text-left">
                                                        <div className="cargo-nome-cell">
                                                            <span className="dot-indicator" style={{ backgroundColor: stat.total > 0 ? '#3b82f6' : '#cbd5e1' }}></span>
                                                            {stat.name}
                                                        </div>
                                                    </td>
                                                    <td className="text-right font-bold">{stat.total > 0 ? stat.total : '-'}</td>
                                                    <td className="text-sm text-gray-600" style={{ paddingLeft: '20px' }}>
                                                        {stat.details}
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                                            <td style={{ paddingTop: '12px' }}>Total de Símbolos neste Órgão</td>
                                            <td className="text-right" style={{ paddingTop: '12px' }}>
                                                {(() => {
                                                    let totalGeral = 0;
                                                    const contar = (nodes) => {
                                                        nodes.forEach(n => {
                                                            if (n.cargos) n.cargos.forEach(c => totalGeral += (c.quantidade || 0));
                                                            if (n.children) contar(n.children);
                                                        });
                                                    };
                                                    if (displayData.organogramaEstrutural?.setores) {
                                                        contar(displayData.organogramaEstrutural.setores);
                                                    }
                                                    return totalGeral;
                                                })()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>
                    )}

                    {tipoVisualizacao === 'funcoes' && estatisticasCargos && (
                        <div style={{ flex: 1 }}>
                            <TabelaQuantidades dados={estatisticasCargos} />
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

export default VisualizarOrganograma;
