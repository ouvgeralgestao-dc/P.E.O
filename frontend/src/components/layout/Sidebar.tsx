import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { authService } from '../../services/authService';
import Logo from '../common/Logo';
import './Sidebar.css';

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

    // Informações do usuário
    const [user, setUser] = useState<any>(null);

    // Carregar informações do usuário
    useEffect(() => {
        const currentUser = authService.getUser();
        setUser(currentUser);
    }, []);

    // Persistir estado no localStorage
    useEffect(() => {
        localStorage.setItem('sidebarExpanded', String(isExpanded));
        localStorage.setItem('sidebarPinned', String(isPinned));

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
        logger.info('Sidebar', `Pin ${newPinned ? 'ativado' : 'desativado'}`, { isPinned: newPinned });
    };

    const toggleExpanded = () => {
        if (isPinned) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleLogout = () => {
        authService.logout();
    };

    const handleConfiguracoesClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/configuracoes');
    };

    return (
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

            {/* Informações do Usuário */}
            {shouldShowExpanded && user && (
                <div className="user-info">
                    <div className="user-avatar">
                        {user.nome ? user.nome.charAt(0).toUpperCase() : (user.matricula ? user.matricula.charAt(0) : 'U')}
                    </div>
                    <div className="user-details">
                        <div className="user-name-row">
                            <span className="user-name">{user.nome ? user.nome.split(' ')[0] : 'Usuário'}</span>
                            <span className="user-matricula">{user.matricula}</span>
                        </div>
                        <div className="user-sector">{user.setor || 'Setor não definido'}</div>
                        <div className={`user-type ${user.tipo}`}>
                            {user.tipo === 'admin' ? '👑 Administrador' : '👤 Usuário'}
                        </div>
                    </div>
                </div>
            )}

            {/* Navegação */}
            <nav className="sidebar-nav">
                <Link to="/" className="sidebar-link">
                    <span className="sidebar-icon">🏠</span>
                    {shouldShowExpanded && <span className="sidebar-text">Home</span>}
                </Link>

                {/* Criar Organograma - Todos podem criar (mas só para seu setor) */}
                <Link to="/criar" className="sidebar-link">
                    <span className="sidebar-icon">➕</span>
                    {shouldShowExpanded && <span className="sidebar-text">Criar Organograma Institucional</span>}
                </Link>

                {/* Criação Livre (Sandbox) */}
                <Link to="/criacao-livre" className="sidebar-link">
                    <span className="sidebar-icon">🎨</span>
                    {shouldShowExpanded && <span className="sidebar-text">Criação Livre de Organograma</span>}
                </Link>

                {/* Organograma Geral Estrutural - Apenas admin */}
                {user?.tipo === 'admin' ? (
                    <Link to="/geral" className="sidebar-link">
                        <span className="sidebar-icon">🏛️</span>
                        {shouldShowExpanded && <span className="sidebar-text">Organograma Geral Estrutural</span>}
                    </Link>
                ) : (
                    <div className="sidebar-link disabled-link" title="Acesso restrito a administradores">
                        <span className="sidebar-icon">🔒</span>
                        {shouldShowExpanded && <span className="sidebar-text">Organograma Geral Estrutural</span>}
                    </div>
                )}

                {/* Organograma Geral Funcional - Apenas admin */}
                {user?.tipo === 'admin' ? (
                    <Link to="/geral-funcional" className="sidebar-link">
                        <span className="sidebar-icon">📋</span>
                        {shouldShowExpanded && <span className="sidebar-text">Organograma Geral Funcional</span>}
                    </Link>
                ) : (
                    <div className="sidebar-link disabled-link" title="Acesso restrito a administradores">
                        <span className="sidebar-icon">🔒</span>
                        {shouldShowExpanded && <span className="sidebar-text">Organograma Geral Funcional</span>}
                    </div>
                )}

                {/* Spacer para empurrar configurações para baixo */}
                <div style={{ flex: 1 }}></div>

                {/* Botão de Configurações */}
                {user?.tipo === 'admin' && (
                    <a href="#" onClick={handleConfiguracoesClick} className="sidebar-link config-link">
                        <span className="sidebar-icon">⚙️</span>
                        {shouldShowExpanded && <span className="sidebar-text">Configurações</span>}
                    </a>
                )}

                {/* Botão de Logout */}
                <button onClick={handleLogout} className="sidebar-link logout-link">
                    <span className="sidebar-icon">🚪</span>
                    {shouldShowExpanded && <span className="sidebar-text">Sair</span>}
                </button>
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
    );
}

export default Sidebar;
