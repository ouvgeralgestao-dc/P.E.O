/**
 * Página de Configuração Global de Setores
 * Permite gerenciar o dicionário de nomes de setor e seus níveis hierárquicos permitidos
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import { HIERARCHY_LABELS } from '../constants/hierarchyLevels';
import './ConfigurarSetores.css';

const ConfigurarSetores = () => {
    const navigate = useNavigate();
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(null); // Armazena o objeto completo sendo editado
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para novo setor / edição
    const [formData, setFormData] = useState({
        nome: '',
        hierarquias: []
    });

    const isAddingNew = !editando && (formData.nome || formData.hierarquias.length > 0);

    useEffect(() => {
        carregarSetores();
    }, []);

    const carregarSetores = async () => {
        try {
            setLoading(true);
            const response = await api.get('/setores/config');
            setSetores(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar setores:', error);
            alert('Erro ao carregar configurações de setores');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSetor = async () => {
        if (!formData.nome.trim()) {
            alert('Nome é obrigatório');
            return;
        }

        if (formData.hierarquias.length === 0) {
            alert('Selecione pelo menos um nível hierárquico');
            return;
        }

        try {
            const payload = {
                id: editando?.id,
                nome: formData.nome,
                hierarquias: formData.hierarquias,
                oldNome: editando?.nome // Para renomeação global se necessário
            };

            await api.post('/setores/config', payload);

            setEditando(null);
            setFormData({ nome: '', hierarquias: [] });
            carregarSetores();
            alert('Configuração salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar setor:', error);
            alert(error.response?.data?.message || 'Erro ao salvar configuração');
        }
    };

    const handleDeletarSetor = async (setor) => {
        if (!confirm('TEM CERTEZA QUE DESEJA DELETAR?')) return;

        try {
            await api.delete(`/setores/config/${setor.id}`);
            carregarSetores();
            alert('Configuração removida com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar setor:', error);
            alert(error.response?.data?.message || 'Erro ao deletar configuração');
        }
    };

    const startEditing = (setor) => {
        setEditando(setor);
        setFormData({
            nome: setor.nome,
            hierarquias: [...setor.hierarquias]
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditando(null);
        setFormData({ nome: '', hierarquias: [] });
    };

    const toggleHierarquia = (nivel) => {
        setFormData(prev => {
            const nivelStr = nivel.toString();
            const exists = prev.hierarquias.includes(nivelStr);
            if (exists) {
                return { ...prev, hierarquias: prev.hierarquias.filter(h => h !== nivelStr) };
            } else {
                return { ...prev, hierarquias: [...prev.hierarquias, nivelStr] };
            }
        });
    };

    const sortedLabels = Object.entries(HIERARCHY_LABELS).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

    const filteredSetores = setores.filter(s =>
        s.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="configurar-setores">
                <div className="loading">Carregando configurações...</div>
            </div>
        );
    }

    return (
        <div className="configurar-setores">
            <div className="page-header">
                <div>
                    <h1>Configurar Dicionário de Setores</h1>
                    <p className="subtitle">Gerencie os nomes e níveis hierárquicos disponíveis nos formulários</p>
                </div>
                <Button onClick={() => navigate('/configuracoes')} variant="secondary">
                    ← Voltar
                </Button>
            </div>

            {/* Formulário de Adição/Edição */}
            <Card title={editando ? `Editando: ${editando.nome}` : "Adicionar Novo Tipo de Setor"} className="mb-24 highlight-card">
                <div className="config-form">
                    <div className="form-row">
                        <Input
                            label="Nome do Setor / Tipo"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Ex: Diretoria, Secretaria, Núcleo..."
                        />
                    </div>

                    <div className="hierarquias-selection">
                        <label className="field-label">Níveis Hierárquicos Permitidos:</label>
                        <div className="checkbox-grid">
                            {sortedLabels.map(([nivel, label]) => (
                                <div
                                    key={nivel}
                                    className={`checkbox-item ${formData.hierarquias.includes(nivel.toString()) ? 'active' : ''}`}
                                    onClick={() => toggleHierarquia(nivel)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.hierarquias.includes(nivel.toString())}
                                        readOnly
                                    />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button onClick={handleSaveSetor} variant="primary">
                            {editando ? 'Salvar Alterações' : 'Adicionar ao Dicionário'}
                        </Button>
                        {(editando || isAddingNew) && (
                            <Button onClick={cancelEditing} variant="secondary">
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="mb-24">
                <div className="search-bar">
                    <Input
                        label="Buscar no Dicionário"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Digite o nome do setor para filtrar..."
                    />
                </div>
            </Card>

            <Card title={`Dicionário Ativo (${filteredSetores.length} itens)`}>
                {filteredSetores.length === 0 ? (
                    <div className="empty-state">
                        <p>{searchTerm ? 'Nenhum item encontrado para a busca.' : 'O dicionário está vazio.'}</p>
                    </div>
                ) : (
                    <div className="setores-list">
                        <div className="list-header">
                            <span className="col-nome">Nome do Setor</span>
                            <span className="col-niveis">Níveis Permitidos</span>
                            <span className="col-acoes">Ações</span>
                        </div>
                        {filteredSetores.map((setor) => (
                            <div key={setor.id} className="setor-item">
                                <div className="setor-info col-nome">
                                    <h4>{setor.nome}</h4>
                                </div>
                                <div className="setor-niveis col-niveis">
                                    {setor.hierarquias.map(h => (
                                        <span key={h} className="nivel-badge">
                                            {HIERARCHY_LABELS[h] || h}
                                        </span>
                                    ))}
                                </div>
                                <div className="setor-actions col-acoes">
                                    <Button onClick={() => startEditing(setor)} variant="secondary" size="small">
                                        Editar
                                    </Button>
                                    <Button onClick={() => handleDeletarSetor(setor)} variant="danger" size="small" outline>
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <div className="warning-box">
                <p><strong>💡 Importante:</strong> As alterações feitas aqui afetam as opções exibidas nos formulários de criação e edição. Se você renomear um item, o sistema tentará atualizar os nomes em todos os organogramas existentes para manter a consistência.</p>
            </div>
        </div>
    );
};

export default ConfigurarSetores;
