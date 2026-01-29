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
import errorHandler from "./middleware/errorHandler.js";

// Carregar variáveis de ambiente
// Carregar variáveis de ambiente (já feito via import 'dotenv/config')

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 6001; // Porta configurável

// Middlewares
app.use(cors());
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`💾 Armazenamento: SQLite (Migrado + TypeScript 2.0)`);
});
