import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { logger } from './utils/logger';
import Dashboard from './pages/Dashboard';
import CriarOrganograma from './pages/CriarOrganograma';
import VisualizarOrganograma from './pages/VisualizarOrganograma';
import EditarOrganograma from './pages/EditarOrganograma';
import PastaOrgao from './pages/PastaOrgao';
import OrganogramaGeral from './pages/OrganogramaGeral';
import OrganogramaGeralFuncional from './pages/OrganogramaGeralFuncional';
import ConfigurarOrgaos from './pages/ConfigurarOrgaos';
import ConfigurarSetores from './pages/ConfigurarSetores';
import ConfigurarPrefixos from './pages/ConfigurarPrefixos';
import Configuracoes from './pages/Configuracoes';
import GerenciarSenhas from './pages/GerenciarSenhas';
import PrintPreview from './pages/PrintPreview';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import './App.css';

function AppContent() {
    const location = useLocation();
    const isPrintPage = location.pathname === '/imprimir';

    return (
        <div className="app">
            {!isPrintPage && <Sidebar />}
            <div className={!isPrintPage ? "app-layout" : "print-layout"}>
                <main className={!isPrintPage ? "main-content" : "print-content"}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/criar" element={<CriarOrganograma />} />
                        <Route path="/orgao/:nomeOrgao" element={<PastaOrgao />} />
                        <Route path="/visualizar/:nomeOrgao" element={<VisualizarOrganograma />} />
                        <Route path="/editar/:nomeOrgao" element={<EditarOrganograma />} />
                        <Route path="/geral" element={<OrganogramaGeral />} />
                        <Route path="/geral-funcional" element={<OrganogramaGeralFuncional />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/configurar-orgaos" element={<ConfigurarOrgaos />} />
                        <Route path="/configurar-setores" element={<ConfigurarSetores />} />
                        <Route path="/configurar-prefixos" element={<ConfigurarPrefixos />} />
                        <Route path="/gerenciar-senhas" element={<GerenciarSenhas />} />
                        <Route path="/imprimir" element={<PrintPreview />} />
                    </Routes>
                </main>
                {!isPrintPage && <Footer />}
            </div>
        </div>
    );
}

function App() {
    logger.info('App', 'Aplicação iniciada');

    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
