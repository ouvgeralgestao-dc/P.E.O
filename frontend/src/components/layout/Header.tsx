import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { logger } from '../../utils/logger';
import { authService } from '../../services/authService';
import Logo from '../common/Logo';
import './Header.css';

function Header() {
    const navigate = useNavigate();
    const [user] = useState<any>(authService.getUser());

    logger.debug('Header', 'Componente renderizado');

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
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
                        {user?.tipo === 'admin' && (
                            <>
                                <Link to="/criar" className="nav-link">➕ Criar Organograma</Link>
                                <Link to="/configurar-orgaos" className="nav-link">⚙️ Configurar Órgãos</Link>
                            </>
                        )}
                        <Link to="/geral" className="nav-link">🏛️ Organograma Geral Estrutural</Link>
                        <Link to="/geral-funcional" className="nav-link">📋 Organograma Geral Funcional</Link>
                        <button onClick={handleLogout} className="nav-logout-btn">
                            🚪 Sair
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;

