/**
 * Página de Configuração de Prefixos de Cargos
 * CRUD completo para gerenciar prefixos (Ex: Secretário, Diretor)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Icons from '../components/common/Icons';
import Card from '../components/common/Card';
import './ConfigurarOrgaos.css'; // Reutilizando estilos

const ConfigurarPrefixos = () => {
    const navigate = useNavigate();
    const [prefixos, setPrefixos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState<number | null>(null);
    const [novoPrefixo, setNovoPrefixo] = useState({
        nome: ''
    });

    // Carregar prefixos
    useEffect(() => {
        carregarPrefixos();
    }, []);

    const carregarPrefixos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/prefixos');
            setPrefixos(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar prefixos:', error);
            alert('Erro ao carregar prefixos de cargos');
        } finally {
            setLoading(false);
        }
    };

    const handleCriarPrefixo = async () => {
        if (!novoPrefixo.nome.trim()) {
            alert('Nome do prefixo é obrigatório');
            return;
        }

        try {
            await api.post('/prefixos', novoPrefixo);
            setNovoPrefixo({ nome: '' });
            carregarPrefixos();
            alert('Prefixo criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar prefixo:', error);
            const errorMsg = error.response?.data?.message || 'Erro ao criar prefixo';
            // Mensagem amigável para erro de duplicidade
            if (errorMsg.includes('UNIQUE constraint')) {
                alert('Este prefixo já existe! Escolha outro nome.');
            } else {
                alert(errorMsg);
            }
        }
    };

    const handleEditarPrefixo = async (id: number) => {
        const prefixo = prefixos.find(p => p.id === id);
        if (!prefixo) return;

        try {
            await api.put(`/prefixos/${id}`, {
                nome: prefixo.nome
            });
            setEditando(null);
            carregarPrefixos();
            alert('Prefixo atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar prefixo:', error);
            alert('Erro ao atualizar prefixo');
        }
    };

    const handleDeletarPrefixo = async (id: number) => {
        if (!confirm('TEM CERTEZA QUE DESEJA DELETAR?')) return;

        try {
            await api.delete(`/prefixos/${id}`);
            carregarPrefixos();
            alert('Prefixo deletado com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar prefixo:', error);
            alert('Erro ao deletar prefixo');
        }
    };

    const handleChangePrefixo = (id: number, value: string) => {
        setPrefixos(prev => prev.map(p =>
            p.id === id ? { ...p, nome: value } : p
        ));
    };

    if (loading) {
        return (
            <div className="configurar-orgaos">
                <div className="loading">Carregando prefixos...</div>
            </div>
        );
    }

    return (
        <div className="configurar-orgaos">
            <div className="page-header">
                <h1>Configurar Prefixos de Cargos</h1>
                <Button onClick={() => navigate('/configuracoes')} variant="secondary">
                    <Icons name="arrow-left" className="mr-2" /> Voltar
                </Button>
            </div>

            {/* Adicionar Novo Prefixo */}
            <Card title="Adicionar Novo Prefixo" className="mb-24">
                <div className="form-row">
                    <Input
                        label="Nome do Prefixo"
                        value={novoPrefixo.nome}
                        onChange={(e) => setNovoPrefixo({ nome: e.target.value })}
                        placeholder="Ex: Secretário(a), Diretor(a)..."
                    />
                    <div className="add-button">
                        <Button onClick={handleCriarPrefixo} variant="primary">
                            <Icons name="plus" className="mr-2" /> Adicionar Prefixo
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Lista de Prefixos */}
            <Card title={`Prefixos Cadastrados (${prefixos.length})`}>
                {prefixos.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhum prefixo cadastrado</p>
                    </div>
                ) : (
                    <div className="orgaos-list">
                        {prefixos.map((prefixo) => (
                            <div key={prefixo.id} className="orgao-item">
                                {editando === prefixo.id ? (
                                    <>
                                        <div className="orgao-edit">
                                            <Input
                                                value={prefixo.nome}
                                                onChange={(e) => handleChangePrefixo(prefixo.id, e.target.value)}
                                            />
                                        </div>
                                        <div className="orgao-actions">
                                            <Button onClick={() => handleEditarPrefixo(prefixo.id)} variant="primary" size="sm">
                                                Salvar
                                            </Button>
                                            <Button onClick={() => setEditando(null)} variant="secondary" size="sm">
                                                Cancelar
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="orgao-info">
                                            <h4>{prefixo.nome}</h4>
                                        </div>
                                        <div className="orgao-actions">
                                            <Button onClick={() => setEditando(prefixo.id)} variant="secondary" size="sm">
                                                Editar
                                            </Button>
                                            <Button onClick={() => handleDeletarPrefixo(prefixo.id)} variant="danger" size="sm">
                                                Deletar
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ConfigurarPrefixos;
