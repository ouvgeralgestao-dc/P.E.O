/**
 * Página de Configuração de Órgãos
 * CRUD completo para gerenciar órgãos da PMDC
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Icons from '../components/common/Icons';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import { CATEGORIAS_ORGAOS } from '../constants/orgaos';
import './ConfigurarOrgaos.css';

const ConfigurarOrgaos = () => {
    const navigate = useNavigate();
    const [orgaos, setOrgaos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState<number | null>(null);
    const [novoOrgao, setNovoOrgao] = useState({
        nome: '',
        categoria: 'SECRETARIA'
    });

    // Carregar órgãos
    useEffect(() => {
        carregarOrgaos();
    }, []);

    const carregarOrgaos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orgaos');
            setOrgaos(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar órgãos:', error);
            alert('Erro ao carregar órgãos');
        } finally {
            setLoading(false);
        }
    };

    const handleCriarOrgao = async () => {
        if (!novoOrgao.nome.trim()) {
            alert('Nome do órgão é obrigatório');
            return;
        }

        try {
            await api.post('/orgaos', novoOrgao);
            setNovoOrgao({ nome: '', categoria: 'SECRETARIA' });
            carregarOrgaos();
            alert('Órgão criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar órgão:', error);
            alert(error.response?.data?.message || 'Erro ao criar órgão');
        }
    };

    const handleEditarOrgao = async (id: number) => {
        const orgao = orgaos.find(o => o.id === id);
        if (!orgao) return;

        try {
            await api.put(`/orgaos/${id}`, {
                nome: orgao.nome,
                categoria: orgao.categoria
            });
            setEditando(null);
            carregarOrgaos();
            alert('Órgão atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar órgão:', error);
            alert('Erro ao atualizar órgão');
        }
    };

    const handleDeletarOrgao = async (id: number) => {
        if (!confirm('TEM CERTEZA QUE DESEJA DELETAR?')) return;

        try {
            await api.delete(`/orgaos/${id}`);
            carregarOrgaos();
            alert('Órgão deletado com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar órgão:', error);
            alert('Erro ao deletar órgão');
        }
    };

    const handleChangeOrgao = (id: number, field: string, value: any) => {
        setOrgaos(prev => prev.map(o =>
            o.id === id ? { ...o, [field]: value } : o
        ));
    };

    const categoriasOptions = Object.entries(CATEGORIAS_ORGAOS).map(([key, label]) => ({
        value: key,
        label
    }));

    if (loading) {
        return (
            <div className="configurar-orgaos">
                <div className="loading">Carregando órgãos...</div>
            </div>
        );
    }

    return (
        <div className="configurar-orgaos">
            <div className="page-header">
                <h1>Configurar Órgãos</h1>
                <Button onClick={() => navigate('/configuracoes')} variant="secondary">
                    <Icons name="arrow-left" className="mr-2" /> Voltar
                </Button>
            </div>

            {/* Adicionar Novo Órgão */}
            <Card title="Adicionar Novo Órgão" className="mb-24">
                <div className="form-row">
                    <Input
                        label="Nome do Órgão"
                        value={novoOrgao.nome}
                        onChange={(e) => setNovoOrgao(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: Secretaria Municipal de Educação"
                    />
                    <Select
                        label="Categoria"
                        value={novoOrgao.categoria}
                        onChange={(e) => setNovoOrgao(prev => ({ ...prev, categoria: e.target.value }))}
                        options={categoriasOptions}
                    />
                    <div className="add-button">
                        <Button onClick={handleCriarOrgao} variant="primary">
                            <Icons name="plus" className="mr-2" /> Adicionar Órgão
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Lista de Órgãos */}
            <Card title={`Órgãos Cadastrados (${orgaos.length})`}>
                {orgaos.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhum órgão cadastrado</p>
                    </div>
                ) : (
                    <div className="orgaos-list">
                        {orgaos.map((orgao) => (
                            <div key={orgao.id} className="orgao-item">
                                {editando === orgao.id ? (
                                    <>
                                        <div className="orgao-edit">
                                            <Input
                                                value={orgao.nome}
                                                onChange={(e) => handleChangeOrgao(orgao.id, 'nome', e.target.value)}
                                            />
                                            <Select
                                                value={orgao.categoria}
                                                onChange={(e) => handleChangeOrgao(orgao.id, 'categoria', e.target.value)}
                                                options={categoriasOptions}
                                            />
                                        </div>
                                        <div className="orgao-actions">
                                            <Button onClick={() => handleEditarOrgao(orgao.id)} variant="primary" size="sm">
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
                                            <h4>{orgao.nome}</h4>
                                            <span className="orgao-categoria">{CATEGORIAS_ORGAOS[orgao.categoria]}</span>
                                        </div>
                                        <div className="orgao-actions">
                                            <Button onClick={() => setEditando(orgao.id)} variant="secondary" size="sm">
                                                Editar
                                            </Button>
                                            <Button onClick={() => handleDeletarOrgao(orgao.id)} variant="danger" size="sm">
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

export default ConfigurarOrgaos;
