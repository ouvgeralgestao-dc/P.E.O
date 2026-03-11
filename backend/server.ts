import "dotenv/config"; // Carregar env antes de tudo
import express from "express";
import cors from "cors";
import organogramasRoutes from "./routes/organogramas.js";
import orgaosRoutes from "./routes/orgaos.js";
import setoresRoutes from "./routes/setores.js";
import prefixosRoutes from "./routes/prefixos.js";
import authRoutes from "./routes/auth.js";
import usuariosRoutes from "./routes/usuarios.js";
import solicitacoesRoutes from "./routes/solicitacoes.js";
import sandboxRoutes from "./routes/sandbox.js";
import permissoesRoutes from "./routes/permissoes.js";
import configsRoutes from "./routes/configs.js";
import errorHandler from "./middleware/errorHandler.js";

// Carregar variáveis de ambiente
// Carregar variáveis de ambiente (já feito via import 'dotenv/config')

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 6001; // Porta configurável
const HOST = process.env.HOST || 'localhost'; // Permitir configurar host

// Middlewares
// CORS configurado para aceitar requisições do Nginx
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Em produção, definir domínio específico
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/api/organogramas", organogramasRoutes);
app.use("/api/orgaos", orgaosRoutes);
app.use("/api/setores", setoresRoutes);
app.use("/api/prefixos", prefixosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/solicitacoes", solicitacoesRoutes);
app.use("/api/sandbox", sandboxRoutes);
app.use("/api/permissoes", permissoesRoutes);
app.use("/api/configs", configsRoutes);

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor Organogramas PMDC rodando (TypeScript)",
    timestamp: new Date().toISOString(),
  });
});

// Em produção, serve os arquivos estáticos do frontend
// O Electron define FRONTEND_PATH quando roda o backend empacotado
import path from "path";
const frontendPath = process.env.FRONTEND_PATH;
if (frontendPath) {
  console.log("📂 Servindo frontend de:", frontendPath);
  app.use(express.static(frontendPath));

  // Fallback para SPA - qualquer rota não-API retorna o index.html
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Iniciar servidor blindado para o Nginx (127.0.0.1)
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servidor rodando selado na porta ${PORT} (127.0.0.1)`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`💾 Armazenamento: SQLite (Migrado + TypeScript 2.0)`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Acessível via Nginx proxy em: http://ogm.duquedecaxias.rj.gov.br/peo/api`);
  }
});
