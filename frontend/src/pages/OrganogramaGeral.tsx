/**
 * Organograma Geral - Visualização Completa da Prefeitura
 * Estrutura Fixa: Prefeito + Gabinete + Subprefeituras
 * Agregação Automática: Todas as Secretarias
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganogramaCanvas from '../components/canvas/OrganogramaCanvas';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { logger } from '../utils/logger';
import api from '../services/api';
import { SUBPREFEITURAS, SUBPREFEITURAS_IDS } from '../constants/orgaos';
import './OrganogramaGeral.css';

function OrganogramaGeral() {
    const navigate = useNavigate();
    const [organogramaData, setOrganogramaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadOrganogramaGeral();
    }, []);

    const loadOrganogramaGeral = async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            logger.info('OrganogramaGeral', 'Carregando organograma geral', { forceRefresh });

            // Adiciona timestamp se for forceRefresh para evitar cache
            const url = forceRefresh
                ? `/organogramas/geral?t=${Date.now()}`
                : '/organogramas/geral';

            const response = await api.get(url);

            logger.success('OrganogramaGeral', 'Organograma geral carregado', response.data);
            setOrganogramaData(response.data.data);

            if (forceRefresh) {
                logger.success('OrganogramaGeral', 'Dados atualizados manualmente');
            }
        } catch (err: any) {
            logger.error('OrganogramaGeral', 'Erro ao carregar organograma geral', err);
            setError(err.response?.data?.message || 'Erro ao carregar organograma geral');
        } finally {
            setLoading(false);
        }
    };

    // Ref para guardar os dados atuais do React Flow (nós e arestas)
    // Necessário porque o Canvas é "controlado" internamente pelo ReactFlow
    const flowDataRef = React.useRef({ nodes: [], edges: [] });

    // Callback para manter a ref atualizada
    const handleFlowDataChange = React.useCallback((data: any) => {
        flowDataRef.current = data;
    }, []);

    const handlePrintPreview = React.useCallback(() => {
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
                title: 'Organograma Geral - Prefeitura Municipal de Duque de Caxias'
            });
            localStorage.setItem('printData', printData);

            // Abrir nova aba de impressão
            window.open('/imprimir', '_blank');
        } catch (error) {
            console.error('Erro ao abrir impressão:', error);
            alert('Erro ao preparar impressão.');
        }
    }, []);

    if (loading) {
        return (
            <div className="organograma-geral">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Carregando Organograma Geral...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="organograma-geral">
                <div className="container">
                    <Card title="Erro">
                        <p className="error-message">{error as any}</p>
                        <Button onClick={() => navigate('/')}>
                            ← Voltar para Dashboard
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="organograma-geral">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-left">
                        <Button variant="outline" onClick={() => navigate('/')}>
                            ← Voltar
                        </Button>
                        <div className="header-info">
                            <h2 className="page-title">Organograma Geral</h2>
                            <p className="page-subtitle">Prefeitura Municipal de Duque de Caxias</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <Button
                            className="btn-action btn-print"
                            onClick={handlePrintPreview}
                        >
                            <span className="btn-icon">🖨️</span> Imprimir / PDF
                        </Button>
                        <Button
                            className="btn-action btn-refresh"
                            variant="primary"
                            onClick={() => loadOrganogramaGeral(true)}
                        >
                            <span className="btn-icon">🔄</span> Atualizar
                        </Button>
                    </div>
                </div>

                {/* Legenda */}
                <div className="legend-card">
                    <h3>Estrutura do Organograma</h3>
                    <div className="legend-grid">
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', boxShadow: '0 0 5px rgba(255, 215, 0, 0.4)' }}></div>
                            <span>Prefeito</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: '#C0C0C0', border: '1px solid #A9A9A9' }}></div>
                            <span>Gabinete / Assessoria</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)', border: '1px solid #808080' }}></div>
                            <span>Subprefeituras</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: '#4ECDC4' }}></div>
                            <span>Secretarias (Nível 1)</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: '#45B7D1' }}></div>
                            <span>Subsecretarias (Nível 2)</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: '#96CEB4' }}></div>
                            <span>Diretorias (Nível 3+)</span>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <Card>
                    <OrganogramaCanvas
                        organogramaData={organogramaData}
                        editable={false}
                        onDataChange={handleFlowDataChange}
                    />
                </Card>

                {/* Estatísticas Expandidas */}
                <div className="stats-footer-expanded">
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-label">Total de Setores:</span>
                            <span className="stat-value">
                                {(() => {
                                    const setores = (organogramaData as any)?.organogramaEstrutural?.setores || [];
                                    // Excluir "Prefeito Municipal" da contagem
                                    const setoresSemPrefeito = setores.filter((s: any) =>
                                        !s.nomeSetor?.toLowerCase().includes('prefeito municipal')
                                    );
                                    return setoresSemPrefeito.length;
                                })()}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Secretarias/Procuradoria:</span>
                            <span className="stat-value">
                                {(() => {
                                    const setores = (organogramaData as any)?.organogramaEstrutural?.setores || [];
                                    const secretarias = setores.filter((s: any) =>
                                        s.tipoSetor?.toLowerCase().includes('secretaria') &&
                                        !s.tipoSetor?.toLowerCase().includes('subsecretaria')
                                    ).length;
                                    const procuradoria = setores.filter((s: any) =>
                                        s.tipoSetor?.toLowerCase().includes('procuradoria') &&
                                        !s.tipoSetor?.toLowerCase().includes('subprocuradoria')
                                    ).length;
                                    return secretarias + procuradoria;
                                })()}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Subprefeituras:</span>
                            <span className="stat-value">4</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Superintendências:</span>
                            <span className="stat-value">
                                {(() => {
                                    const setores = (organogramaData as any)?.organogramaEstrutural?.setores || [];
                                    return setores.filter((s: any) =>
                                        s.tipoSetor?.toLowerCase().includes('superintendência') ||
                                        s.tipoSetor?.toLowerCase().includes('superintendencia')
                                    ).length;
                                })()}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Subsecretarias/Subprocuradorias:</span>
                            <span className="stat-value">
                                {(() => {
                                    const setores = (organogramaData as any)?.organogramaEstrutural?.setores || [];
                                    const subsecretarias = setores.filter((s: any) =>
                                        s.tipoSetor?.toLowerCase().includes('subsecretaria')
                                    ).length;
                                    const subprocuradorias = setores.filter((s: any) =>
                                        s.tipoSetor?.toLowerCase().includes('subprocuradoria')
                                    ).length;
                                    return subsecretarias + subprocuradorias;
                                })()}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Última Atualização:</span>
                            <span className="stat-value">
                                {(organogramaData as any)?.updatedAt ?
                                    new Date((organogramaData as any).updatedAt).toLocaleDateString('pt-BR') :
                                    'N/A'}
                            </span>
                        </div>
                    </div>


                    {/* Tabelas de Setores e Símbolos - Layout em 2 Colunas */}
                    <div className="tables-grid">
                        {/* Tabela de Setores */}
                        <div className="table-container">
                            <h4 className="table-title">Quantidade por Tipo de Setor</h4>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Tipo de Setor</th>
                                            <th>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const setores = (organogramaData as any)?.organogramaEstrutural?.setores || [];
                                            // Filtrar Prefeito Municipal
                                            const setoresFiltrados = setores.filter((s: any) =>
                                                !s.nomeSetor?.toLowerCase().includes('prefeito municipal')
                                            );

                                            // Contar por tipo de setor
                                            const tiposCount: any = {};
                                            setoresFiltrados.forEach((setor: any) => {
                                                const tipo = setor.tipoSetor || 'Outros';
                                                tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
                                            });

                                            // Ordenar por quantidade (decrescente)
                                            const tiposOrdenados = Object.entries(tiposCount)
                                                .sort((a: any, b: any) => b[1] - a[1]);

                                            return tiposOrdenados.length > 0 ? (
                                                tiposOrdenados.map(([tipo, quantidade]) => (
                                                    <tr key={tipo}>
                                                        <td className="setor-name">{tipo}</td>
                                                        <td className="setor-count">{quantidade as React.ReactNode}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={2} className="no-data">Nenhum setor encontrado</td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabela de Símbolos */}
                        <div className="table-container">
                            <h4 className="table-title">Quantidade de Símbolos</h4>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Símbolo</th>
                                            <th>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const setores = (organogramaData as any)?.organogramaEstrutural?.setores || [];
                                            const simbolosCount: any = {};

                                            // Contar símbolos de todos os setores
                                            setores.forEach((setor: any) => {
                                                if (setor.cargos && Array.isArray(setor.cargos)) {
                                                    setor.cargos.forEach((cargo: any) => {
                                                        if (cargo.tipo && cargo.quantidade > 0) {
                                                            simbolosCount[cargo.tipo] = (simbolosCount[cargo.tipo] || 0) + cargo.quantidade;
                                                        }
                                                    });
                                                }
                                            });

                                            // Ordenar símbolos (DAS-S primeiro, depois numéricos)
                                            const simbolosOrdenados = Object.entries(simbolosCount).sort((a, b) => {
                                                const [simboloA] = a;
                                                const [simboloB] = b;

                                                // DAS-S sempre primeiro
                                                if (simboloA.includes('DAS-S')) return -1;
                                                if (simboloB.includes('DAS-S')) return 1;

                                                // Extrair números para ordenação
                                                const numA = parseInt(simboloA.match(/\d+/)?.[0] || '999');
                                                const numB = parseInt(simboloB.match(/\d+/)?.[0] || '999');

                                                return numB - numA; // Ordem decrescente
                                            });

                                            return simbolosOrdenados.length > 0 ? (
                                                simbolosOrdenados.map(([simbolo, quantidade]) => (
                                                    <tr key={simbolo}>
                                                        <td className="simbolo-name">{simbolo}</td>
                                                        <td className="simbolo-count">{quantidade as React.ReactNode}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={2} className="no-data">Nenhum símbolo encontrado</td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Cargos Consolidados (Meta 6.0) */}
                    <div className="table-container" style={{ marginTop: '24px' }}>
                        <h4 className="table-title">Consolidado de Cargos na Prefeitura</h4>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Cargo</th>
                                        <th>Quantidade Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(organogramaData as any)?.estatisticas?.cargos && (organogramaData as any).estatisticas.cargos.length > 0 ? (
                                        (organogramaData as any).estatisticas.cargos.map((cargo: any, index: any) => (
                                            <tr key={index}>
                                                <td className="setor-name">{cargo.nome}</td>
                                                <td className="setor-count">{cargo.quantidade}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="no-data">Nenhum cargo funcional encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default OrganogramaGeral;
