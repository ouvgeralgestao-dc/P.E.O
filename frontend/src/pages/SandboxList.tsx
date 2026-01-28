import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { logger } from '../utils/logger';
import './SandboxList.css';

interface SandboxOrgao {
    id: number;
    nome: string;
    categoria: string;
    created_at: string;
    updated_at: string;
}

const SandboxList: React.FC = () => {
    const navigate = useNavigate();
    const [orgaos, setOrgaos] = useState<SandboxOrgao[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [newOrgaoNome, setNewOrgaoNome] = useState('');
    const [newOrgaoCategoria, setNewOrgaoCategoria] = useState('OUTROS');

    useEffect(() => {
        loadOrgaos();
    }, []);

    const loadOrgaos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/sandbox/orgaos');
            setOrgaos(response.data);
            logger.info('SandboxList', 'Órgãos carregados', { count: response.data.length });
        } catch (error) {
            logger.error('SandboxList', 'Erro ao carregar órgãos', error);
            alert('Erro ao carregar órgãos sandbox.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrgao = async () => {
        if (!newOrgaoNome.trim()) {
            alert('Por favor, preencha o nome do órgão.');
            return;
        }

        try {
            const response = await api.post('/sandbox/orgaos', {
                nome: newOrgaoNome,
                categoria: newOrgaoCategoria,
            });
            
            setOrgaos([response.data, ...orgaos]);
            closeModal();
            logger.success('SandboxList', 'Órgão criado com sucesso', response.data);
            
            // Navegar para o órgão criado
            navigate(`/criacao-livre/${encodeURIComponent(response.data.nome)}`);
        } catch (error: any) {
            logger.error('SandboxList', 'Erro ao criar órgão', error);
            const errorMsg = error.response?.data?.message || 'Erro ao criar órgão.';
            alert(errorMsg);
        }
    };

    const handleDeleteOrgao = async (orgaoId: number, orgaoNome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${orgaoNome}"? Todos os organogramas serão perdidos.`)) {
            return;
        }

        try {
            await api.delete(`/sandbox/orgaos/${orgaoId}`);
            setOrgaos(orgaos.filter((o) => o.id !== orgaoId));
            logger.success('SandboxList', 'Órgão excluído com sucesso', { orgaoId });
        } catch (error) {
            logger.error('SandboxList', 'Erro ao excluir órgão', { orgaoId, error });
            alert('Erro ao excluir órgão.');
        }
    };

    const openModal = () => {
        setNewOrgaoNome('');
        setNewOrgaoCategoria('OUTROS');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (loading) {
        return <div className="loading">Carregando órgãos sandbox...</div>;
    }

    return (
        <div className="sandbox-list-container">
            <div className="sandbox-header">
                <div>
                    <h1>🎨 Criação Livre de Organogramas</h1>
                    <p className="subtitle">
                        Crie e edite organogramas de teste sem afetar os dados institucionais
                    </p>
                </div>
                <Button variant="primary" onClick={openModal}>
                    + Novo Órgão Sandbox
                </Button>
            </div>

            {orgaos.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>Nenhum órgão sandbox criado</h3>
                    <p>Comece criando seu primeiro órgão de teste</p>
                    <Button onClick={openModal}>Criar Primeiro Órgão</Button>
                </div>
            ) : (
                <div className="orgaos-grid">
                    {orgaos.map((orgao) => (
                        <Card key={orgao.id} className="orgao-card">
                            <div className="card-header">
                                <h3>{orgao.nome}</h3>
                                <span className="categoria-badge">{orgao.categoria}</span>
                            </div>
                            <div className="card-meta">
                                <span>Criado em: {formatDate(orgao.created_at)}</span>
                                <span>Atualizado: {formatDate(orgao.updated_at)}</span>
                            </div>
                            <div className="card-actions">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={() => navigate(`/criacao-livre/${encodeURIComponent(orgao.nome)}`)}
                                >
                                    Abrir Organogramas
                                </Button>
                                <Button
                                    variant="danger"
                                    fullWidth
                                    onClick={() => handleDeleteOrgao(orgao.id, orgao.nome)}
                                >
                                    Excluir
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Criação */}
            {isModalOpen && (
                <Modal onClose={closeModal} title="Criar Novo Órgão Sandbox">
                    <div className="modal-form">
                        <Input
                            label="Nome do Órgão"
                            name="nome"
                            value={newOrgaoNome}
                            onChange={(e) => setNewOrgaoNome(e.target.value)}
                            required
                            helperText="Ex: Secretaria de Teste, Departamento Exemplo"
                        />

                        <Select
                            label="Categoria"
                            name="categoria"
                            value={newOrgaoCategoria}
                            onChange={(e) => setNewOrgaoCategoria(e.target.value)}
                            options={[
                                { value: 'OUTROS', label: 'Outros' },
                                { value: 'ADMINISTRACAO', label: 'Administração' },
                                { value: 'FAZENDA', label: 'Fazenda' },
                                { value: 'SAUDE', label: 'Saúde' },
                                { value: 'EDUCACAO', label: 'Educação' },
                            ]}
                        />

                        <div className="modal-actions">
                            <Button variant="outline" onClick={closeModal}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleCreateOrgao}>
                                Criar Órgão
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SandboxList;
