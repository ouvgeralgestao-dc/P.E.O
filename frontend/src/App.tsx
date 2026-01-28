import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { logger } from "./utils/logger";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AprovarCadastro from "./pages/AprovarCadastro";
import CriarOrganograma from "./pages/CriarOrganograma";
import VisualizarOrganograma from "./pages/VisualizarOrganograma";
import EditarOrganograma from "./pages/EditarOrganograma";
import PastaOrgao from "./pages/PastaOrgao";
import OrganogramaGeral from "./pages/OrganogramaGeral";
import OrganogramaGeralFuncional from "./pages/OrganogramaGeralFuncional";
import ConfigurarOrgaos from "./pages/ConfigurarOrgaos";
import ConfigurarSetores from "./pages/ConfigurarSetores";
import ConfigurarPrefixos from "./pages/ConfigurarPrefixos";
import Configuracoes from "./pages/Configuracoes";
import GerenciarAcesso from "./pages/GerenciarAcesso";
import PrintPreview from "./pages/PrintPreview";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";
import SandboxList from "./pages/SandboxList";
import SandboxOrgao from "./pages/SandboxOrgao";
import SandboxEstrutural from "./pages/SandboxEstrutural";
import SandboxFuncional from "./pages/SandboxFuncional";
import CriarSandboxEstrutural from "./pages/CriarSandboxEstrutural";
import CriarSandboxFuncional from "./pages/CriarSandboxFuncional";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const isPrintPage = location.pathname === "/imprimir";
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="app">
      {!isPrintPage && !isLoginPage && <Sidebar />}
      <div
        className={
          isPrintPage 
            ? "print-layout" 
            : isLoginPage 
              ? "login-layout" 
              : "app-layout"
        }
      >
        <main
          className={
            isPrintPage 
              ? "print-content" 
              : isLoginPage 
                ? "login-content-wrapper" 
                : "main-content"
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/aprovar-cadastro/:token" element={<AprovarCadastro />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criar"
              element={
                <ProtectedRoute>
                  <CriarOrganograma />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criacao-livre"
              element={
                <ProtectedRoute>
                  <SandboxList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criacao-livre/:nomeOrgao"
              element={
                <ProtectedRoute>
                  <SandboxOrgao />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criacao-livre/:nomeOrgao/estrutural"
              element={
                <ProtectedRoute>
                  <SandboxEstrutural />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criacao-livre/:nomeOrgao/funcional"
              element={
                <ProtectedRoute>
                  <SandboxFuncional />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criacao-livre/:nomeOrgao/criar-estrutural"
              element={
                <ProtectedRoute>
                  <CriarSandboxEstrutural />
                </ProtectedRoute>
              }
            />
            <Route
              path="/criacao-livre/:nomeOrgao/criar-funcional"
              element={
                <ProtectedRoute>
                  <CriarSandboxFuncional />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orgao/:nomeOrgao"
              element={
                <ProtectedRoute>
                  <PastaOrgao />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visualizar/:nomeOrgao"
              element={
                <ProtectedRoute>
                  <VisualizarOrganograma />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editar/:nomeOrgao"
              element={
                <ProtectedRoute requireAdmin>
                  <EditarOrganograma />
                </ProtectedRoute>
              }
            />
            <Route
              path="/geral"
              element={
                <ProtectedRoute>
                  <OrganogramaGeral />
                </ProtectedRoute>
              }
            />
            <Route
              path="/geral-funcional"
              element={
                <ProtectedRoute>
                  <OrganogramaGeralFuncional />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configurar-orgaos"
              element={
                <ProtectedRoute requireAdmin>
                  <ConfigurarOrgaos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configurar-setores"
              element={
                <ProtectedRoute requireAdmin>
                  <ConfigurarSetores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configurar-prefixos"
              element={
                <ProtectedRoute requireAdmin>
                  <ConfigurarPrefixos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gerenciar-acesso"
              element={
                <ProtectedRoute requireAdmin>
                  <GerenciarAcesso />
                </ProtectedRoute>
              }
            />
            <Route
              path="/imprimir"
              element={
                <ProtectedRoute>
                  <PrintPreview />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        {!isPrintPage && !isLoginPage && <Footer />}
      </div>
    </div>
  );
}

function App() {
  logger.info("App", "Aplicação iniciada", {
    timestamp: new Date().toISOString(),
  });

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
