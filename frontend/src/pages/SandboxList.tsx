import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { logger } from '../utils/logger';
import './SandboxList.css';

interface Project {
    id: string;
    nome: string;
    descricao: string;
    tipo: 'orgao' | 'setor';
    updated_at: string;
}

const SandboxList: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({
        nome: '',
        descricao: '',
        tipo: 'orgao'
    });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await api.get('/sandbox');
            setProjects(response.data);
            logger.info('SandboxList', 'Projetos carregados', { count: response.data.length });
        } catch (error) {
            logger.error('SandboxList', 'Erro ao carregar projetos', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/sandbox', newProject);
            setProjects([response.data, ...projects]);
            setIsModalOpen(false);
            setNewProject({ nome: '', descricao: '', tipo: 'orgao' });
            logger.success('SandboxList', 'Projeto criado', response.data);
        } catch (error) {
            logger.error('SandboxList', 'Erro ao criar projeto', error);
            alert('Erro ao criar projeto.');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar navegar
        if (!window.confirm('Tem certeza que deseja excluir este projeto?')) return;
        
        try {
            await api.delete(`/sandbox/${id}`);
            setProjects(projects.filter(p => p.id !== id));
            logger.success('SandboxList', 'Projeto excluído', { id });
        } catch (error) {
            logger.error('SandboxList', 'Erro ao excluir projeto', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewProject((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewProject((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="sandbox-container">
           {/* Header and list same as before but wrapped correctly if needed */}
            <div className="sandbox-header">
                <div>
                    <h1>Criação Livre de Organograma</h1>
                    <p>Ambiente isolado para rascunhos e planejamentos.</p>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    + Novo Projeto
                </Button>
            </div>

            {loading ? (
                <div className="loading">Carregando...</div>
            ) : (
                <div className="projects-grid">
                    {projects.length === 0 ? (
                        <div className="empty-state">
                            <h3>Nenhum projeto encontrado</h3>
                            <p>Crie seu primeiro organograma livre clicando em "Novo Projeto".</p>
                        </div>
                    ) : (
                        projects.map(project => (
                            <div 
                                key={project.id} 
                                className="project-card-wrapper"
                                onClick={() => navigate(`/criacao-livre/editor/${project.id}`)}
                            >
                                <Card title={project.nome} className="project-card">
                                    <div className="project-info">
                                        <span className={`project-type ${project.tipo}`}>
                                            {project.tipo === 'orgao' ? '🏛️ Órgão' : '📂 Setor'}
                                        </span>
                                        <p className="project-desc">{project.descricao || 'Sem descrição'}</p>
                                        <p className="project-date">
                                            Atualizado em: {new Date(project.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="project-actions">
                                        <button 
                                            className="btn-delete"
                                            onClick={(e) => handleDelete(project.id, e)}
                                            title="Excluir"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Criação */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Novo Organograma Livre</h2>
                        <form onSubmit={handleCreate}>
                            <Input
                                id="nome"
                                name="nome"
                                label="Nome do Projeto"
                                value={newProject.nome}
                                onChange={handleInputChange}
                                required
                            />
                            
                            <Input
                                id="descricao"
                                name="descricao"
                                label="Descrição (Opcional)"
                                value={newProject.descricao}
                                onChange={handleInputChange}
                            />

                            <Select
                                id="tipo"
                                name="tipo"
                                label="Tipo de Organograma"
                                value={newProject.tipo}
                                onChange={handleSelectChange}
                                options={[
                                    { value: 'orgao', label: 'Organograma de Órgão' },
                                    { value: 'setor', label: 'Organograma de Setor' }
                                ]}
                            />

                            <div className="modal-actions">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="primary">
                                    Criar Projeto
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SandboxList;
