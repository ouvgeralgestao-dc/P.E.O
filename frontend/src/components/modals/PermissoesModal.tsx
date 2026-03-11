import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import { logger } from '../../utils/logger';
import './PermissoesModal.css';

interface Permissao {
    modulo: string;
    permitido: boolean;
}

interface PermissoesModalProps {
    userId: number;
    userName: string;
    onClose: () => void;
    onSave: () => void;
}

const MODULOS = [
    { id: 'criar_institucional', nome: 'Criar Organograma Institucional', icone: '➕' },
    { id: 'criacao_livre', nome: 'Criação Livre de Organograma', icone: '🎨' },
    { id: 'geral_estrutural', nome: 'Organograma Geral Estrutural', icone: '🏛️' },
    { id: 'geral_funcional', nome: 'Organograma Geral Funcional', icone: '📋' },
    { id: 'configuracoes', nome: 'Configurações', icone: '⚙️' }
];

const PermissoesModal: React.FC<PermissoesModalProps> = ({ userId, userName, onClose, onSave }) => {
    const [permissoes, setPermissoes] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadPermissoes();
    }, [userId]);

    const loadPermissoes = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/permissoes/${userId}`);
            const permsMap: Record<string, boolean> = {};
            response.data.permissoes.forEach((p: any) => {
                permsMap[p.modulo] = p.permitido === 1;
            });
            setPermissoes(permsMap);
        } catch (error) {
            logger.error('PermissoesModal', 'Erro ao carregar permissões', error);
            alert('Erro ao carregar permissões do usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (modulo: string) => {
        setPermissoes(prev => ({
            ...prev,
            [modulo]: !prev[modulo]
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const permissoesArray = MODULOS.map(m => ({
                modulo: m.id,
                permitido: permissoes[m.id] || false
            }));

            await api.put(`/permissoes/${userId}`, { permissoes: permissoesArray });
            logger.success('PermissoesModal', 'Permissões salvas com sucesso');

            // Disparar evento customizado para atualizar Sidebar
            window.dispatchEvent(new CustomEvent('permissoesUpdated', {
                detail: { userId }
            }));

            // Mostrar toast de sucesso
            setShowSuccess(true);

            // Aguardar animação e fechar
            setTimeout(() => {
                onSave();
                onClose();
            }, 1500);
        } catch (error) {
            logger.error('PermissoesModal', 'Erro ao salvar permissões', error);
            alert('Erro ao salvar permissões');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content permissoes-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🔐 Permissões de Acesso</h2>
                    <p className="modal-subtitle">Usuário: <strong>{userName}</strong></p>
                </div>

                {loading ? (
                    <div className="loading-state">Carregando permissões...</div>
                ) : (
                    <div className="permissoes-list">
                        {MODULOS.map(modulo => (
                            <div key={modulo.id} className="permissao-item">
                                <label className="permissao-label">
                                    <input
                                        type="checkbox"
                                        checked={permissoes[modulo.id] || false}
                                        onChange={() => handleToggle(modulo.id)}
                                        className="permissao-checkbox"
                                    />
                                    <span className="permissao-icone">{modulo.icone}</span>
                                    <span className="permissao-nome">{modulo.nome}</span>
                                </label>
                                <span className={`permissao-status ${permissoes[modulo.id] ? 'permitido' : 'bloqueado'}`}>
                                    {permissoes[modulo.id] ? '✓ Permitido' : '🔒 Bloqueado'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="modal-actions">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? 'Salvando...' : 'Salvar Permissões'}
                    </Button>
                </div>

                {/* Toast de Sucesso */}
                {showSuccess && (
                    <div className="success-toast">
                        <div className="success-icon">✓</div>
                        <div className="success-message">
                            <strong>Permissões salvas!</strong>
                            <p>As alterações foram aplicadas com sucesso.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissoesModal;
