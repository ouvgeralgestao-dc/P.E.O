import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { logger } from '../utils/logger';
import './GerenciarAcesso.css';

interface User {
    id: number;
    nome: string;
    matricula: string;
    email: string;
    setor: string;
    orgao_id: string;
    orgao_nome?: string;
    tipo: 'admin' | 'user';
    ativo: number; // 1 = Ativo, 0 = Inativo
}

interface Orgao {
    id: string; // slug
    nome: string;
}

const GerenciarAcesso = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orgaos, setOrgaos] = useState<Orgao[]>([]);
    
    const [configSetores, setConfigSetores] = useState<any[]>([]); // Tipos de setor (Config)
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        matricula: '',
        setor: '',
        orgao_id: '',
        tipo: 'user',
        senha: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            logger.info('GerenciarAcesso', 'Carregando dados...');
            
            const [usersRes, orgaosRes, setoresRes] = await Promise.all([
                api.get('/usuarios'),
                api.get('/orgaos'),
                api.get('/setores/config')
            ]);

            setUsers(usersRes.data.usuarios);
            
            // A API retorna { data: [...], success: true }, então precisamos acessar .data.data ou fallback
            const listaOrgaos = orgaosRes.data.data || orgaosRes.data;
            setOrgaos(Array.isArray(listaOrgaos) ? listaOrgaos : []);

            // Setores Config
            setConfigSetores(setoresRes.data.data || []);
            
            logger.success('GerenciarAcesso', 'Dados carregados');
        } catch (err: any) {
            logger.error('GerenciarAcesso', 'Erro ao carregar dados', err);
            setError(err.response?.data?.error || 'Erro ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            const novoStatus = user.ativo === 1 ? 0 : 1;
            const action = novoStatus === 1 ? 'ativar' : 'desativar';
            
            if (!window.confirm(`Tem certeza que deseja ${action} o acesso de ${user.nome}?`)) return;

            await api.put(`/usuarios/${user.id}`, {
                ativo: novoStatus
            });

            // Update local state
            setUsers(users.map(u => u.id === user.id ? { ...u, ativo: novoStatus } : u));
            logger.success('GerenciarAcesso', `Usuário ${user.nome} ${novoStatus ? 'ativado' : 'desativado'}`);
        } catch (err) {
            logger.error('GerenciarAcesso', 'Erro ao alterar status', err);
            alert('Erro ao alterar status do usuário.');
        }
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setFormData({
            nome: user.nome || '',
            email: user.email || '',
            matricula: user.matricula || '',
            setor: user.setor || '',
            orgao_id: user.orgao_id || '',
            tipo: user.tipo || 'user',
            senha: '' // Reset senha field
        });
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingUser(null);
        setFormData({
            nome: '',
            email: '',
            matricula: '',
            setor: '',
            orgao_id: '',
            tipo: 'user',
            senha: ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUser) {
                await api.put(`/usuarios/${editingUser.id}`, {
                    nome: formData.nome,
                    email: formData.email,
                    setor: formData.setor,
                    orgao_id: formData.orgao_id,
                    tipo: formData.tipo,
                    ...(formData.senha ? { senha: formData.senha } : {})
                });
                logger.success('GerenciarAcesso', 'Usuário atualizado');
            } else {
                await api.post('/usuarios', {
                    ...formData,
                    senha: formData.senha // Obrigatório no create
                });
                logger.success('GerenciarAcesso', 'Usuário criado com sucesso');
            }

            setIsModalOpen(false);
            loadData(); // Reload to get nice joined names etc
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Erro ao salvar.';
            logger.error('GerenciarAcesso', 'Erro ao salvar', err);
            alert(errorMsg);
        }
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        
        try {
            await api.delete(`/usuarios/${userToDelete.id}`);
            logger.success('GerenciarAcesso', `Usuário ${userToDelete.nome} excluído permanentemente`);
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (err: any) {
            logger.error('GerenciarAcesso', 'Erro ao excluir usuário', err);
            alert(err.response?.data?.error || 'Erro ao excluir usuário.');
        }
    };

    const orgaoOptions = Array.isArray(orgaos) ? orgaos.map(o => ({ value: o.id, label: o.nome })) : [];

    if (loading) return <div className="loading">Carregando usuários...</div>;

    return (
        <div className="gerenciar-acesso">
            <div className="page-header">
                <h1>Gerenciar Acesso</h1>
                <div style={{display: 'flex', gap: '10px'}}>
                    <Button onClick={handleCreateClick} variant="primary">
                        + Cadastrar Usuário
                    </Button>
                    <Button onClick={() => navigate('/configuracoes')} variant="secondary">
                         Voltar
                    </Button>
                </div>
            </div>

            {error && <div className="error-message" style={{color: 'red', marginBottom: 20}}>{error}</div>}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Nome / Matrícula</th>
                            <th>Email</th>
                            <th>Órgão</th>
                            <th>Setor</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{fontWeight: 'bold'}}>{user.nome || 'Sem Nome'}</div>
                                    <div style={{fontSize: '12px', color: '#718096'}}>Mat: {user.matricula}</div>
                                </td>
                                <td>{user.email}</td>
                                <td>{user.orgao_nome || user.orgao_id || '-'}</td>
                                <td>{user.setor}</td>
                                <td>
                                    <span className={`status-badge ${user.ativo ? 'status-active' : 'status-inactive'}`}>
                                        {user.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <Button 
                                            size="sm" 
                                            variant="secondary"
                                            onClick={() => handleEditClick(user)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={user.ativo ? "danger" : "primary"}
                                            onClick={() => handleToggleStatus(user)}
                                        >
                                            {user.ativo ? 'Desativar' : 'Ativar'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleDeleteClick(user)}
                                            style={{marginLeft: '8px', backgroundColor: '#e53e3e', borderColor: '#c53030'}}
                                            title="Excluir Permanentemente"
                                        >
                                            🗑️
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário Completo'}</h2>
                        </div>
                        <form onSubmit={handleSave} className="modal-form modal-form-grid">
                            <div className="form-col-span-2">
                                <Input
                                    id="input-nome"
                                    name="nome"
                                    label="Nome Completo"
                                    value={formData.nome}
                                    onChange={(e: any) => setFormData({...formData, nome: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="form-col-span-2">
                                <Input
                                    id="input-email"
                                    name="email"
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e: any) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <Input
                                    id="input-matricula"
                                    name="matricula"
                                    label="Matrícula"
                                    value={formData.matricula}
                                    onChange={(e: any) => setFormData({...formData, matricula: e.target.value})}
                                    required
                                    disabled={!!editingUser}
                                    placeholder={editingUser ? '' : 'Ex: 123456'}
                                />
                            </div>

                            <div className="form-group">
                                <Select
                                    id="select-tipo"
                                    name="tipo"
                                    label="Permissão"
                                    options={[
                                        { value: 'user', label: 'Usuário Comum' },
                                        { value: 'admin', label: 'Administrador' }
                                    ] as any}
                                    value={formData.tipo}
                                    onChange={(e: any) => setFormData({...formData, tipo: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-col-span-2 form-group">
                                <label style={{display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 600, fontSize: '0.875rem'}}>Órgão</label>
                                <Select
                                    id="select-orgao"
                                    name="orgao_id"
                                    label={null}
                                    options={[{value: '', label: 'Selecione...'}, ...orgaoOptions] as any}
                                    value={formData.orgao_id}
                                    onChange={(e: any) => setFormData({...formData, orgao_id: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-col-span-2 form-group">
                                <label style={{display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 600, fontSize: '0.875rem'}}>Setor</label>
                                <Select
                                    id="select-setor"
                                    name="setor"
                                    label={null}
                                    options={[{value: '', label: 'Selecione...'}, ...configSetores.map(s => ({ value: s.nome, label: s.nome }))] as any}
                                    value={formData.setor}
                                    onChange={(e: any) => setFormData({...formData, setor: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-col-span-2">
                                <Input
                                    id="input-senha"
                                    name="senha"
                                    label="Nova Senha (deixe em branco para manter)"
                                    type="password"
                                    value={formData.senha}
                                    onChange={(e: any) => setFormData({...formData, senha: e.target.value})}
                                    placeholder="******"
                                />
                            </div>

                            <div className="modal-actions">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="primary" onClick={() => {}}>
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && userToDelete && (
                <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{borderColor: '#e53e3e', borderTopWidth: '8px'}}>
                        <div className="modal-header">
                            <h2 style={{color: '#c53030'}}>⚠️ EXCLUIR USUÁRIO?</h2>
                        </div>
                        <div style={{marginBottom: '24px', fontSize: '16px', lineHeight: '1.6'}}>
                            <p>Tem certeza que deseja excluir <strong>PERMANENTEMENTE</strong> o usuário <strong>{userToDelete.nome}</strong>?</p>
                            <p style={{marginTop: '12px', color: '#718096', fontSize: '14px'}}>
                                Esta ação removerá o acesso e todos os dados do usuário do banco de dados. 
                                <br/><strong>Esta ação NÃO pode ser desfeita.</strong>
                            </p>
                        </div>
                        <div className="modal-actions">
                            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={confirmDelete}
                                style={{backgroundColor: '#c53030', fontWeight: 'bold'}}
                            >
                                SIM, EXCLUIR PERMANENTEMENTE
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GerenciarAcesso;
