/**
 * Organograma Geral de Funções - Visualização Completa dos Cargos da Prefeitura
 * Estrutura Fixa: Prefeito + Subprefeituras
 * Agregação Automática: Todos os Cargos Funcionais
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganogramaCanvas from '../components/canvas/OrganogramaCanvas';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { logger } from '../utils/logger';
import api from '../services/api';
import './OrganogramaGeralFuncional.css';

import PasswordModal from '../components/common/PasswordModal';
import Input from '../components/common/Input';
// import { toast } from 'react-hot-toast'; // Removido pois não está instalado. Usando alert.

function OrganogramaGeralFuncional() {
    const navigate = useNavigate();
    const [organogramaData, setOrganogramaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit Mode States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadOrganogramaGeralFuncional();
    }, []);

    const loadOrganogramaGeralFuncional = async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('OrganogramaGeralFuncional', 'Carregando organograma geral de funções');

            const response = await api.get('/organogramas/geral-funcional');

            // Adaptar estrutura para o formato esperado pelo OrganogramaCanvas
            const adaptedData = {
                ...response.data.data,
                organogramasFuncoes: [response.data.data.organogramaFuncional]
            };

            logger.success('OrganogramaGeralFuncional', 'Organograma geral de funções carregado', adaptedData);
            setOrganogramaData(adaptedData);
        } catch (err) {
            logger.error('OrganogramaGeralFuncional', 'Erro ao carregar organograma geral de funções', err);
            setError(err.response?.data?.message || 'Erro ao carregar organograma geral de funções');
        } finally {
            setLoading(false);
        }
    };

    // Ref para guardar os dados atuais do React Flow
    const flowDataRef = React.useRef({ nodes: [], edges: [] });

    // Callback para manter a ref atualizada
    const handleFlowDataChange = React.useCallback((data) => {
        flowDataRef.current = data;
    }, []);

    const handlePrintPreview = React.useCallback(() => {
        try {
            const { nodes, edges } = flowDataRef.current;

            if (!nodes || nodes.length === 0) {
                alert('Aguarde o carregamento do organograma...');
                return;
            }

            const printData = JSON.stringify({
                nodes: nodes,
                edges: edges,
                title: 'Organograma Geral de Funções - Prefeitura Municipal de Duque de Caxias'
            });
            localStorage.setItem('printData', printData);
            window.open('/imprimir', '_blank');
        } catch (error) {
            console.error('Erro ao abrir impressão:', error);
            alert('Erro ao preparar impressão.');
        }
    }, []);

    // Handlers de Edição
    const handleEditClick = () => {
        setShowPasswordModal(true);
    };

    const handleAuthSubmit = async (password) => {
        if (password === 'admouv1234') {
            // Carregar dados atuais nos campos
            const cargos = organogramaData?.organogramasFuncoes?.[0]?.cargos || [];
            const currentData = {};
            const fixedIds = [
                'prefeito-cargo',
                'gabinete-cargo',
                'subprefeitura-1-cargo',
                'subprefeitura-2-cargo',
                'subprefeitura-3-cargo',
                'subprefeitura-4-cargo'
            ];

            fixedIds.forEach(id => {
                const cargo = cargos.find(c => c.id === id);
                currentData[id] = cargo?.ocupante || '';
            });

            setEditData(currentData);
            setShowEditModal(true);
            return true;
        }
        return false;
    };

    const handleSaveOccupants = async () => {
        try {
            setSaving(true);
            await api.post('/organogramas/geral-funcional/ocupantes', { occupants: editData });

            // Recarregar dados
            await loadOrganogramaGeralFuncional();
            setShowEditModal(false);
            // alert('Ocupantes atualizados com sucesso!'); 
        } catch (error) {
            console.error('Erro ao salvar ocupantes:', error);
            alert('Erro ao salvar ocupantes.');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (id, value) => {
        setEditData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    if (loading) {
        return (
            <div className="organograma-geral-funcional">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Carregando Organograma Geral de Funções...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="organograma-geral-funcional">
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
        <div className="organograma-geral-funcional">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-left">
                        <Button variant="outline" onClick={() => navigate('/')}>
                            ← Voltar
                        </Button>
                        <div className="header-info">
                            <h2 className="page-title">Organograma Geral de Funções</h2>
                            <p className="page-subtitle">Prefeitura Municipal de Duque de Caxias</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <Button
                            className="btn-action"
                            variant="secondary"
                            onClick={handleEditClick}
                        >
                            <span className="btn-icon">✏️</span> Editar Ocupantes
                        </Button>
                        <Button
                            className="btn-action btn-print"
                            onClick={handlePrintPreview}
                        >
                            <span className="btn-icon">🖨️</span> Imprimir / PDF
                        </Button>
                        <Button
                            className="btn-action btn-refresh"
                            variant="primary"
                            onClick={loadOrganogramaGeralFuncional}
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
                            <span>Chefe de Gabinete</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: 'linear-gradient(135deg, #E0E0E0 0%, #A9A9A9 100%)', border: '1px solid #ccc' }}></div>
                            <span>Subprefeituras</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: '#4ECDC4' }}></div>
                            <span>Cargos - Níveis 1-2</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: '#45B7D1' }}></div>
                            <span>Cargos - Níveis 3-4</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box" style={{ background: '#96CEB4' }}></div>
                            <span>Cargos - Níveis 5+</span>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <Card>
                    <OrganogramaCanvas
                        organogramaData={organogramaData}
                        editable={false}
                        onDataChange={handleFlowDataChange}
                        isFuncional={true}
                    />
                </Card>

                {/* Estatísticas Expandidas */}
                <div className="stats-footer-expanded">
                    {/* ... conteúdo existente mantido ... */}
                    {/* Vou simplificar para não repetir tudo aqui, mas o replace deve manter o resto se eu usar chunk ou overwrite cuidado. */}
                    {/* Como estou substituindo o arquivo quase todo, vou recolocar o footer. */}
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-label">Total de Cargos:</span>
                            <span className="stat-value">
                                {(() => {
                                    const cargos = organogramaData?.estatisticas?.cargos || [];
                                    return cargos.reduce((acc, c) => acc + c.quantidade, 0);
                                })()}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tipos de Cargos:</span>
                            <span className="stat-value">
                                {organogramaData?.estatisticas?.cargos?.length || 0}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tipos de Símbolos:</span>
                            <span className="stat-value">
                                {organogramaData?.estatisticas?.simbolos?.length || 0}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Órgãos com Cargos:</span>
                            <span className="stat-value">
                                {organogramaData?.estatisticas?.setores?.length || 0}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Última Atualização:</span>
                            <span className="stat-value">
                                {organogramaData?.updatedAt ?
                                    new Date(organogramaData.updatedAt).toLocaleDateString('pt-BR') :
                                    'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Tabelas de Indicadores */}
                    <div className="tables-grid">
                        <div className="table-container">
                            <h4 className="table-title">Quantidade por Símbolo</h4>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Símbolo</th>
                                            <th>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {organogramaData?.estatisticas?.simbolos && organogramaData.estatisticas.simbolos.length > 0 ? (
                                            organogramaData.estatisticas.simbolos.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="simbolo-name">{item.simbolo}</td>
                                                    <td className="simbolo-count">{item.quantidade}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="2" className="no-data">Nenhum símbolo encontrado</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="table-container">
                            <h4 className="table-title">Nomenclatura de Cargos</h4>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Cargo</th>
                                            <th>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {organogramaData?.estatisticas?.cargos && organogramaData.estatisticas.cargos.length > 0 ? (
                                            organogramaData.estatisticas.cargos.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="setor-name">{item.nome}</td>
                                                    <td className="setor-count">{item.quantidade}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="2" className="no-data">Nenhum cargo encontrado</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <PasswordModal
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                    onSubmit={handleAuthSubmit}
                    title="Acesso Restrito"
                    description="Digite a senha para editar os ocupantes:"
                />

                {showEditModal && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3>Editar Ocupantes Fixos</h3>
                                <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <Input
                                        label="Prefeito Municipal"
                                        value={editData['prefeito-cargo'] || ''}
                                        onChange={e => handleInputChange('prefeito-cargo', e.target.value)}
                                        placeholder="Nome do Prefeito"
                                    />
                                    <Input
                                        label="Gabinete do Prefeito"
                                        value={editData['gabinete-cargo'] || ''}
                                        onChange={e => handleInputChange('gabinete-cargo', e.target.value)}
                                        placeholder="Nome do Chefe de Gabinete ou Responsável"
                                    />
                                    <div style={{ height: '1px', background: '#eee', margin: '5px 0' }}></div>
                                    <Input
                                        label="Subprefeito(a) - 1º Distrito"
                                        value={editData['subprefeitura-1-cargo'] || ''}
                                        onChange={e => handleInputChange('subprefeitura-1-cargo', e.target.value)}
                                        placeholder="Nome do Subprefeito(a)"
                                    />
                                    <Input
                                        label="Subprefeito(a) - 2º Distrito"
                                        value={editData['subprefeitura-2-cargo'] || ''}
                                        onChange={e => handleInputChange('subprefeitura-2-cargo', e.target.value)}
                                        placeholder="Nome do Subprefeito(a)"
                                    />
                                    <Input
                                        label="Subprefeito(a) - 3º Distrito"
                                        value={editData['subprefeitura-3-cargo'] || ''}
                                        onChange={e => handleInputChange('subprefeitura-3-cargo', e.target.value)}
                                        placeholder="Nome do Subprefeito(a)"
                                    />
                                    <Input
                                        label="Subprefeito(a) - 4º Distrito"
                                        value={editData['subprefeitura-4-cargo'] || ''}
                                        onChange={e => handleInputChange('subprefeitura-4-cargo', e.target.value)}
                                        placeholder="Nome do Subprefeito(a)"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="primary" onClick={handleSaveOccupants} disabled={saving}>
                                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrganogramaGeralFuncional;
