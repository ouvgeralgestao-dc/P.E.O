import * as sqliteStorageService from '../services/sqliteStorageService.js';

export const listSetores = async (req, res) => {
    try {
        const setores = await sqliteStorageService.listUniqueSetores();
        
        // Aplicar filtro por setor para usuários comuns
        let filteredSetores = setores;
        if (req.user && req.user.tipo !== 'admin') {
            const userSector = req.user.setor.toUpperCase();
            filteredSetores = setores.filter(setor => {
                const setorUpper = setor.toUpperCase();
                return setorUpper === userSector || 
                       setorUpper.includes(userSector) ||
                       userSector.includes(setorUpper);
            });
        }
        
        res.json({ 
            success: true, 
            data: filteredSetores,
            filtered: req.user && req.user.tipo !== 'admin'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSetor = async (req, res) => {
    try {
        const { oldName, newName } = req.body;
        if (!oldName || !newName) {
            return res.status(400).json({ success: false, message: 'Nomes antigo e novo são obrigatórios' });
        }
        await sqliteStorageService.renameSectorGlobally(oldName, newName);
        res.json({ success: true, message: 'Setor renomeado globalmente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSetor = async (req, res) => {
    try {
        const { name } = req.params;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Nome do setor é obrigatório' });
        }
        await sqliteStorageService.deleteSectorGlobally(name);
        res.json({ success: true, message: 'Setor removido globalmente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// --- Gerenciamento de Configuração (Tipos de Setor) ---

export const listConfig = async (req, res) => {
    try {
        const tipos = await sqliteStorageService.listTiposSetor();
        res.json({ success: true, data: tipos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const upsertConfig = async (req, res) => {
    try {
        const { id, nome, hierarquias, oldNome } = req.body;
        if (!nome || !hierarquias) {
            return res.status(400).json({ success: false, message: 'Nome e hierarquias são obrigatórios' });
        }
        await sqliteStorageService.upsertTipoSetor({ id, nome, hierarquias, oldNome });
        res.json({ success: true, message: 'Configuração de setor salva com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteConfig = async (req, res) => {
    try {
        const { id } = req.params;
        await sqliteStorageService.deleteTipoSetor(id);
        res.json({ success: true, message: 'Tipo de setor removido com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
