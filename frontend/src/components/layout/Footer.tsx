import './Footer.css';

/**
 * Footer Institucional
 * Exibe informação de colaboração entre secretarias
 */
function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <img src="/peo/dc-logo.png" alt="Prefeitura de Duque de Caxias" className="footer-logo" />
                <p className="footer-text">
                    <span className="footer-label">Elaboração conjunta:</span>
                    Secretaria de Governo | Secretaria de Comunicação Social e Relações Públicas | Ouvidoria Geral do Município
                </p>
                <p className="footer-year">2026</p>
            </div>
        </footer>
    );
}

export default Footer;
