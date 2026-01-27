import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { client } from '../src/db/index.js';

interface AuthRequest extends Request {
    user?: {
        id: number;
        matricula: string;
        email: string;
        nome: string;
        setor: string;
        cargo: string;
        tipo: 'admin' | 'user';
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        // Buscar informações atualizadas do usuário no banco
        try {
            const user = client.prepare(`
                SELECT id, matricula, email, nome, setor, cargo, tipo 
                FROM usuarios 
                WHERE id = ?
            `).get(decoded.userId);

            if (!user) {
                return res.status(403).json({ error: 'Usuário não encontrado' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });
};

// Middleware para verificar se o usuário é admin
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (req.user.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
    }

    next();
};

// Middleware para verificar acesso por setor (usuários comuns só veem o próprio setor)
export const checkSectorAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Admins podem acessar qualquer setor
    if (req.user.tipo === 'admin') {
        return next();
    }

    // Para usuários comuns, verificar se estão tentando acessar dados do próprio setor
    const requestedSector = req.params.setor || req.query.setor || req.body.setor;
    
    if (requestedSector && requestedSector !== req.user.setor) {
        return res.status(403).json({ 
            error: 'Acesso negado. Você só pode visualizar dados do seu próprio setor.' 
        });
    }

    next();
};

export type { AuthRequest };
