import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import Logo from '../common/Logo';
import './Sidebar.css';

/**
 * Sidebar Expansível - Menu Lateral Moderno
 * - Recolhe/Expande com animação suave
 * - Hover para expandir temporariamente
 * - Botão de Pin para fixar estado expandido
 * - LocalStorage para persistir preferência do usuário
 */
function Sidebar() {
    const navigate = useNavigate();

    // Estado de expansão (persistido)
    const [isExpanded, setIsExpanded] = useState(() => {
        const saved = localStorage.getItem('sidebarExpanded');
        return saved === 'true';
    });

    // Estado de pin (fixação)
    const [isPinned, setIsPinned] = useState(() => {
        const saved = localStorage.getItem('sidebarPinned');
        return saved === 'true';
    });

    // Estado de hover temporário
    const [isHovering, setIsHovering] = useState(false);

    // Modais de senha
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');
    const [modalType, setModalType] = useState('');

    // Persistir estado no localStorage
    useEffect(() => {
        localStorage.setItem('sidebarExpanded', isExpanded);
        localStorage.setItem('sidebarPinned', isPinned);

        // Atualizar variável CSS para ajuste de layout
        document.documentElement.style.setProperty(
            '--sidebar-width',
            (isExpanded || (isHovering && !isPinned)) ? '280px' : '80px'
        );
    }, [isExpanded, isPinned, isHovering]);

    // Determinar se sidebar deve estar visualmente expandida
    const shouldShowExpanded = isPinned ? isExpanded : (isHovering || isExpanded);

    const handleMouseEnter = () => {
        if (!isPinned) {
            setIsHovering(true);
        }
    };

    const handleMouseLeave = () => {
        if (!isPinned) {
            setIsHovering(false);
        }
    };

    const togglePin = () => {
        const newPinned = !isPinned;
        setIsPinned(newPinned);
        if (newPinned) {
            // Quando fixar, expande
            setIsExpanded(true);
        } else {
            // Quando desfixar, recolhe
            setIsExpanded(false);
        }
        logger.info('Sidebar', `Pin ${newPinned ? 'ativado' : 'desativado'}`);
    };

    const toggleExpanded = () => {
        if (isPinned) {
            setIsExpanded(!isExpanded);
        }
    };

    // Navegação protegida por senha
    const handleConfiguracoesClick = (e) => {
        e.preventDefault();
        setModalType('configuracoes');
        setShowPasswordModal(true);
        setPasswordInput('');
        setError('');
    };

    const handlePasswordSubmit = () => {
        if (passwordInput === 'admouv1234') {
            setShowPasswordModal(false);
            if (modalType === 'configuracoes') {
                navigate('/configuracoes');
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
            <aside
                className={`sidebar ${shouldShowExpanded ? 'expanded' : 'collapsed'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Header da Sidebar com Logo */}
                <div className="sidebar-header">
                    {/* Botão de Pin (Esquerda) */}
                    <button
                        className={`pin-button ${isPinned ? 'pinned' : ''}`}
                        onClick={togglePin}
                        title={isPinned ? 'Desafixar menu' : 'Fixar menu aberto'}
                    >
                        📌
                    </button>

                    <Link to="/" className="sidebar-brand">
                        <Logo
                            size={shouldShowExpanded ? "large" : "small"}
                            variant="white"
                            showText={false}
                        />
                        {shouldShowExpanded && (
                            <div className="app-badge">P.E.O</div>
                        )}
                    </Link>
                </div>

                {/* Navegação */}
                <nav className="sidebar-nav">
                    <Link to="/" className="sidebar-link">
                        <span className="sidebar-icon">🏠</span>
                        {shouldShowExpanded && <span className="sidebar-text">Home</span>}
                    </Link>

                    <Link to="/criar" className="sidebar-link">
                        <span className="sidebar-icon">➕</span>
                        {shouldShowExpanded && <span className="sidebar-text">Criar Organograma</span>}
                    </Link>

                    <Link to="/geral" className="sidebar-link">
                        <span className="sidebar-icon">🏛️</span>
                        {shouldShowExpanded && <span className="sidebar-text">Organograma Geral Estrutural</span>}
                    </Link>

                    <Link to="/geral-funcional" className="sidebar-link">
                        <span className="sidebar-icon">📋</span>
                        {shouldShowExpanded && <span className="sidebar-text">Organograma Geral Funcional</span>}
                    </Link>

                    {/* Spacer para empurrar configurações para baixo */}
                    <div style={{ flex: 1 }}></div>

                    {/* Botão Centralizado de Configurações */}
                    <a href="#" onClick={handleConfiguracoesClick} className="sidebar-link config-link">
                        <span className="sidebar-icon">⚙️</span>
                        {shouldShowExpanded && <span className="sidebar-text">Configurações</span>}
                    </a>
                </nav>

                {/* Logo da Prefeitura - Centro da Sidebar */}
                {shouldShowExpanded && (
                    <div className="sidebar-city-logo">
                        <img src="/dc-logo.png" alt="Prefeitura de Duque de Caxias" className="city-logo" />
                    </div>
                )}
                {/* Footer com informações */}
                {shouldShowExpanded && (
                    <div className="sidebar-footer">
                        <h2 className="footer-title">Planejador de Estrutura Organizacional</h2>
                        <p className="footer-subtitle">Prefeitura Municipal de Duque de Caxias</p>
                        <div className="footer-indicator">
                            <span className="indicator-icon">{isPinned ? '📌' : '🖱️'}</span>
                            <span className="indicator-text">{isPinned ? 'Fixado' : 'Desafixado'}</span>
                        </div>
                    </div>
                )}
            </aside>

            {/* Modal Único de Senha */}
            {(showConfigModal || showPasswordModal) && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>🔐 Acesso Restrito</h2>
                        <p>Digite a senha de administrador:</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Senha de administrador"
                            autoFocus
                        />
                        {error && <p className="error-message">{error}</p>}
                        <div className="modal-actions">
                            <button onClick={handlePasswordSubmit} className="btn-submit">Confirmar</button>
                            <button onClick={closeModal} className="btn-cancel">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;
