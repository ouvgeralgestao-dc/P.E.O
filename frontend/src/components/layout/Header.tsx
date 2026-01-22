import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { logger } from '../../utils/logger';
import Logo from '../common/Logo';
import './Header.css';

function Header() {
    const navigate = useNavigate();
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');
    const [modalType, setModalType] = useState(''); // 'config' ou 'passwords'

    logger.debug('Header', 'Componente renderizado');

    const handleConfigClick = (e) => {
        e.preventDefault();
        setModalType('config');
        setShowConfigModal(true);
        setPasswordInput('');
        setError('');
    };

    const handlePasswordsClick = (e) => {
        e.preventDefault();
        setModalType('passwords');
        setShowPasswordModal(true);
        setPasswordInput('');
        setError('');
    };

    const handlePasswordSubmit = () => {
        if (passwordInput === 'admouv1234') {
            if (modalType === 'config') {
                setShowConfigModal(false);
                navigate('/configurar-orgaos');
            } else if (modalType === 'passwords') {
                setShowPasswordModal(false);
                navigate('/gerenciar-senhas');
            }
        } else {
            setError('Senha incorreta');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handlePasswordSubmit();
        }
    };

    const closeModal = () => {
        setShowConfigModal(false);
        setShowPasswordModal(false);
        setPasswordInput('');
        setError('');
    };

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <Link to="/" className="header-brand">
                            <Logo size="large" variant="white" />
                            <div className="header-title-section">
                                <h1 className="header-title">Planejador de Estrutura Organizacional</h1>
                                <p className="header-subtitle">Prefeitura Municipal de Duque de Caxias</p>
                            </div>
                        </Link>
                        <nav className="header-nav">
                            <Link to="/" className="nav-link">🏠 Home</Link>
                            <Link to="/criar" className="nav-link">➕ Criar Organograma</Link>
                            <a href="#" onClick={handleConfigClick} className="nav-link">⚙️ Configurar Órgãos</a>
                            <a href="#" onClick={handlePasswordsClick} className="nav-link">🔐 Gerenciar Senhas</a>
                            <Link to="/geral" className="nav-link">🏛️ Organograma Geral Estrutural</Link>
                            <Link to="/geral-funcional" className="nav-link">📋 Organograma Geral Funcional</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Modal de Configurar Órgãos */}
            {showConfigModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🔒 Acesso Restrito</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <p className="modal-description">Digite a senha master para acessar Configurar Órgãos:</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Senha master"
                            className="modal-input"
                            autoFocus
                        />
                        {error && <p className="error-text">❌ {error}</p>}
                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn-cancel">
                                Cancelar
                            </button>
                            <button onClick={handlePasswordSubmit} className="btn-submit">
                                Acessar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Gerenciar Senhas */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🔐 Acesso Administrativo</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <p className="modal-description">Digite a senha master para gerenciar senhas dos órgãos:</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Senha master"
                            className="modal-input"
                            autoFocus
                        />
                        {error && <p className="error-text">❌ {error}</p>}
                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn-cancel">
                                Cancelar
                            </button>
                            <button onClick={handlePasswordSubmit} className="btn-submit">
                                Acessar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;

