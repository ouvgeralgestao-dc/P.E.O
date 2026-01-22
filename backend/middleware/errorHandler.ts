// Middleware global de tratamento de erros
const errorHandler = (err, req, res, next) => {
    console.error('❌ Erro:', err);

    // Erro de validação (express-validator)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors: err.errors || err.message
        });
    }

    // Erro de arquivo não encontrado
    if (err.code === 'ENOENT') {
        return res.status(404).json({
            success: false,
            message: 'Arquivo não encontrado',
            error: err.message
        });
    }

    // Erro genérico
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorHandler;
