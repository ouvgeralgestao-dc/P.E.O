import React, { useState } from 'react';
import './PasswordModal.css';

/**
 * Modal reutilizável para autenticação por senha
 * Usado para proteger ações de edição e exclusão
 */
const PasswordModal = ({
    isOpen,
    onClose,
    onSubmit,
    title = '🔒 Autenticação Necessária',
    description = 'Digite a senha para continuar:',
    submitText = 'Confirmar'
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!password) {
            setError('Por favor, digite a senha');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const success = await onSubmit(password);
            if (success) {
                handleClose();
            } else {
                setError('Senha incorreta');
                setPassword('');
            }
        } catch (err) {
            setError('Erro ao validar senha');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        setLoading(false);
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={handleClose} disabled={loading}>✕</button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">{description}</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite a senha"
                        className="modal-input"
                        autoFocus
                        disabled={loading}
                    />
                    {error && (
                        <div className="error-text">
                            ❌ {error}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button
                        onClick={handleClose}
                        className="btn-cancel"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn-submit"
                        disabled={loading}
                    >
                        {loading ? 'Verificando...' : submitText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;
