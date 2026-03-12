import 'dotenv/config';
import express from 'express';
import { body, validationResult } from 'express-validator';

// Regras de quantidade máxima por tipo de cargo DAS
const CARGO_MAX_QUANTITY = {
    'DAS-S': 1, 'DAS-9': 1, 'DAS-8': 1, 'DAS-7': 10000,
    'DAS-6': 10000, 'DAS-5': 10000, 'DAS-4': 10000, 'DAS-3': 10000,
    'DAS-2': 10000, 'DAS-1': 10000, 'FC-1': 10000
};

const SIMBOLOS_POR_NIVEL = {
    0: Infinity, 0.5: Infinity, 1: Infinity, 2: Infinity,
    3: Infinity, 4: Infinity, 5: Infinity, 6: Infinity,
    7: Infinity, 8: Infinity, 9: Infinity, 10: Infinity
};

const validateCargosDAS = (cargos) => {
    const errors = [];
    for (const cargo of cargos) {
        const maxQty = CARGO_MAX_QUANTITY[cargo.tipo];
        if (!maxQty) continue;
        if (cargo.quantidade > maxQty) errors.push(`${cargo.tipo} permite no máximo ${maxQty} cargo(s)`);
        if (cargo.quantidade < 1) errors.push(`Quantidade deve ser no mínimo 1 para ${cargo.tipo}`);
    }
    return { valid: errors.length === 0, errors };
};

const validateSimbolosPorNivel = (hierarquia, cargos) => {
    const errors = [];
    const maxSimbolos = SIMBOLOS_POR_NIVEL[hierarquia];
    if (maxSimbolos === undefined) {
        errors.push(`Hierarquia inválida: ${hierarquia}. Deve ser entre 0 (Assessoria) e 10.`);
        return { valid: false, errors };
    }
    const totalSimbolos = cargos.reduce((sum, cargo) => sum + (cargo.quantidade || 0), 0);
    if (maxSimbolos !== Infinity && totalSimbolos > maxSimbolos) {
        errors.push(`Nível permite apenas ${maxSimbolos} símbolo(s)`);
    }
    return { valid: errors.length === 0, errors };
};

const validateUpdateOrganogramaEstrutural = [
    body('tamanhoFolha').notEmpty().isIn(['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']),
    body('setores').isArray(),
    body('setores.*.tipoSetor').notEmpty(),
    body('setores.*.nomeSetor').notEmpty(),
    body('setores.*.hierarquia').isFloat({ min: 0, max: 10 }),
    body('setores.*.cargos').isArray(),
    body('setores.*.style').optional().isObject(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.json({ success: false, errors: errors.array() });
        const validationErrors = [];
        for (const setor of req.body.setores) {
            const dasValidation = validateCargosDAS(setor.cargos || []);
            if (!dasValidation.valid) validationErrors.push(...dasValidation.errors.map(err => ({ setor: setor.nomeSetor, erro: err })));
            const simbolosValidation = validateSimbolosPorNivel(setor.hierarquia, setor.cargos || []);
            if (!simbolosValidation.valid) validationErrors.push(...simbolosValidation.errors.map(err => ({ setor: setor.nomeSetor, erro: err })));
        }
        if (validationErrors.length > 0) return res.json({ success: false, errors: validationErrors });
        res.json({ success: true });
    }
];

const app = express();
app.use(express.json());
app.post('/test', validateUpdateOrganogramaEstrutural);
app.listen(9999, async () => {
    const payload = {
        tamanhoFolha: "A3",
        setores: [{
            tipoSetor: "Assessoria",
            nomeSetor: "Assessoria Assessoria",
            hierarquia: "0",
            isAssessoria: true,
            isOperacional: false,
            parentId: "uuid1",
            cargos: [],
            id: "uuid2"
        },
        {
            tipoSetor: "Seção",
            nomeSetor: "Seção Operacional",
            hierarquia: "11",
            isAssessoria: false,
            isOperacional: true,
            parentId: "uuid1",
            cargos: [],
            id: "uuid2"
        }]
    };
    
    // Test 1: Operacional that exceeds 10? No, max is 10. Math.min(base, 10).
    // Test 2: Assessoria with hierarquia: "0".
    
    const r = await fetch('http://localhost:9999/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    console.log(await r.json());
    process.exit(0);
});
