import { Request, Response } from 'express';
import { dbAsync } from '../database/db.js'; // Caminho correto
// dbAsync está exportado de database/db.ts
import { v4 as uuidv4 } from 'uuid';

// Interface para Request com User
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        matricula: string;
        tipo: string;
    };
}

export const listProjects = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        const projects = await dbAsync.all(
            'SELECT * FROM sandbox_projects WHERE user_id = ? ORDER BY updated_at DESC',
            [userId]
        );

        res.json(projects);
    } catch (error) {
        console.error('Erro ao listar projetos sandbox:', error);
        res.status(500).json({ message: 'Erro ao listar projetos.' });
    }
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        const { nome, tipo, descricao } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({ message: 'Nome e Tipo são obrigatórios.' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await dbAsync.run(
            `INSERT INTO sandbox_projects (id, user_id, nome, descricao, tipo, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, nome, descricao || '', tipo, now, now]
        );

        res.status(201).json({ id, nome, tipo, descricao, created_at: now, updated_at: now });
    } catch (error) {
        console.error('Erro ao criar projeto sandbox:', error);
        res.status(500).json({ message: 'Erro ao criar projeto.' });
    }
};

export const getProject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // Buscar projeto garantindo que pertence ao usuário
        const project = await dbAsync.get(
            'SELECT * FROM sandbox_projects WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado.' });
        }

        // Buscar itens
        const items = await dbAsync.all(
            'SELECT * FROM sandbox_items WHERE project_id = ?',
            [id]
        );

        // Parsear JSON dos itens
        const parsedItems = items.map((item: any) => ({
            ...item,
            data: JSON.parse(item.data_json)
        }));

        res.json({ ...project, items: parsedItems });
    } catch (error) {
        console.error('Erro ao buscar projeto sandbox:', error);
        res.status(500).json({ message: 'Erro ao buscar projeto.' });
    }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { nome, descricao } = req.body;

        const project = await dbAsync.get(
            'SELECT id FROM sandbox_projects WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado.' });
        }

        const now = new Date().toISOString();
        await dbAsync.run(
            'UPDATE sandbox_projects SET nome = ?, descricao = ?, updated_at = ? WHERE id = ?',
            [nome, descricao, now, id]
        );

        res.json({ message: 'Projeto atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar projeto sandbox:', error);
        res.status(500).json({ message: 'Erro ao atualizar projeto.' });
    }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const project = await dbAsync.get(
            'SELECT id FROM sandbox_projects WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado.' });
        }

        // Cascade delete fará o resto, mas por segurança deletamos itens primeiro
        // delete sandbox_items handled by FK cascade usually, but better explicit? No, SQLite FK enabled.
        await dbAsync.run('DELETE FROM sandbox_projects WHERE id = ?', [id]);

        res.json({ message: 'Projeto excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir projeto sandbox:', error);
        res.status(500).json({ message: 'Erro ao excluir projeto.' });
    }
};

export const syncItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { items } = req.body; // Array de itens (nodes + edges)

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Formato de itens inválido.' });
        }

        // Verificar propriedade
        const project = await dbAsync.get(
            'SELECT id FROM sandbox_projects WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado.' });
        }

        // Transação "burra": Deletar tudo e inserir novo.
        // Para um sandbox simples, é o mais robusto para evitar diff complexo.
        
        // SQLite não tem transaction exposto no dbAsync simples do service, mas podemos fazer sequencial
        // ou importar 'client' para transaction.
        // Vamos fazer sequencial (Delete All -> Insert All). Se falhar no meio, é ruim, mas aceitável para MVP.
        // Melhor: importar client do db.ts se precisar de transação. Mas dbAsync é o padrão do projeto.
        
        await dbAsync.run('DELETE FROM sandbox_items WHERE project_id = ?', [id]);

        const now = new Date().toISOString();
        
        // Inserir um por um ou em batch? Batch é melhor.
        // Mas dbAsync.run é singular.
        // Vamos fazer loop.
        for (const item of items) {
             // item deve ter id, type e o resto é data
             const itemId = item.id || uuidv4();
             const type = item.type === 'edge' || item.source ? 'edge' : 'node'; // Detecção simples
             // Opcional: source/target define edge.
             
             await dbAsync.run(
                'INSERT INTO sandbox_items (id, project_id, type, data_json) VALUES (?, ?, ?, ?)',
                [itemId, id, type, JSON.stringify(item)]
             );
        }

        await dbAsync.run('UPDATE sandbox_projects SET updated_at = ? WHERE id = ?', [now, id]);

        res.json({ message: 'Itens sincronizados com sucesso.', count: items.length });
    } catch (error) {
        console.error('Erro ao sincronizar itens sandbox:', error);
        res.status(500).json({ message: 'Erro ao sincronizar itens.' });
    }
};
