import 'dotenv/config'; // Carregar env antes de tudo
import express from 'express';
import cors from 'cors';
import organogramasRoutes from './routes/organogramas.js';
import orgaosRoutes from './routes/orgaos.js';
import setoresRoutes from './routes/setores.js';
import prefixosRoutes from './routes/prefixos.js';
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import solicitacoesRoutes from './routes/solicitacoes.js';
import errorHandler from './middleware/errorHandler.js';

// Carregar variáveis de ambiente
// Carregar variáveis de ambiente (já feito via import 'dotenv/config')

const app = express();
const PORT = 6001; // Porta fixa - Backend conforme regra rules.mdc

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/organogramas', organogramasRoutes);
app.use('/api/orgaos', orgaosRoutes);
app.use('/api/setores', setoresRoutes);
app.use('/api/prefixos', prefixosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor Organogramas PMDC rodando (TypeScript)',
        timestamp: new Date().toISOString()
    });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Armazenamento: SQLite (Migrado + TypeScript 2.0)`);
});
