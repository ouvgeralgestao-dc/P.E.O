/**
 * Utilitários para cálculo de layout hierárquico
 * Algoritmo: Reingold-Tilford modificado (Árvore centralizada)
 * Spec: Google Gemini Paired Plan
 */

// Constantes de Layout Exatas
const LAYOUT_CONSTANTS = {
    VERTICAL_GAP: 100, // Distância vertical entre pai e filho
    HORIZONTAL_GAP: 40, // Distância horizontal entre irmãos
};

// Obter dimensões baseadas na hierarquia (Meta 11)
const getDynamicDimensions = (hierarquia, isAssessoria = false, isPrefeito = false) => {
    // Normalizar hierarquia
    let h = parseInt(hierarquia);
    if (isNaN(h)) h = 0; // Default para 0 se não for número

    if (h === 1 || isPrefeito) return { w: 300, h: 110 };
    if (h === 2) return { w: 280, h: 100 };
    if (h === 3) return { w: 260, h: 90 };
    return { w: 240, h: 80 }; // Nível 4+ e Assessorias
};

const SPACING_CONFIG = {
    horizontalSpacing: LAYOUT_CONSTANTS.NODE_WIDTH + LAYOUT_CONSTANTS.HORIZONTAL_GAP, // 300px passo
    verticalSpacing: LAYOUT_CONSTANTS.NODE_HEIGHT + LAYOUT_CONSTANTS.VERTICAL_GAP,    // 190px passo
    assessoriaOffset: 650, // Aumentado para 650 (Mais espaço lateral)
};

/**
 * Calcula layout hierárquico perfeito estilo ÁRVORE
 */
export const calculateHierarchicalLayout = (setores) => {
    if (!setores || setores.length === 0) return [];

    // Criar mapa de setores por ID
    const setoresMap = new Map(setores.map(s => ({ ...s, children: [] })).map(s => [s.id, s]));

    // Construir árvore de hierarquia
    const raizes = [];
    setoresMap.forEach(setor => {
        if (setor.parentId && setoresMap.has(setor.parentId)) {
            const pai = setoresMap.get(setor.parentId);
            pai.children.push(setor);
        } else {
            raizes.push(setor);
        }
    });

    // Ordenar raízes e filhos por hierarquia
    raizes.sort((a, b) => parseFloat(a.hierarquia || 0) - parseFloat(b.hierarquia || 0));

    /**
     * Calcula largura da subárvore (espaço horizontal necessário)
     * Largura = (N_filhos * 260) + ((N_filhos - 1) * 40)
     */
    /**
     * Helper para verificar se é assessoria
     */
    const checkIsAssessoria = (c) => {
        if (!c) return false;
        if (c.isAssessoria) return true;

        // Normalizar hierarquia para número
        const hirarqNum = typeof c.hierarquia === 'string' ? parseFloat(c.hierarquia) : (c.hierarquia || 0);
        if (hirarqNum === 0) return true;

        const name = (c.nomeCargo || c.nomeSetor || '').toLowerCase().trim();
        const type = (c.tipoSetor || '').toLowerCase().trim();

        return name.includes('assessor') ||
            name.includes('gabinete') ||
            name.includes('consultoria') ||
            (type && type.includes('assessoria')) ||
            (type && type.includes('gabinete')) ||
            (type && type.includes('consultoria'));
    };

    /**
     * Calcula largura da subárvore (espaço horizontal necessário)
     * Largura = (N_filhos * 260) + ((N_filhos - 1) * 40)
     */
    const calcularLarguraSubarvore = (setor) => {
        const { w } = getDynamicDimensions(setor.hierarquia, setor.isAssessoria, setor.id?.includes('prefeito'));

        // Condicional: Assessorias só são laterais (fora da largura) se Pai for Nível < 3 (0, 1, 2)
        // Se Pai for >= 3 (Subsecretaria), Assessoria conta como filho vertical normal.
        const parentLevel = parseInt(setor.hierarquia || 0);
        const isHighLevel = parentLevel < 3;

        const subordinados = (setor.children || []).filter(c => {
            const isAss = checkIsAssessoria(c);
            if (!isAss) return true; // Não é assessoria, mantém normal

            // É assessoria:
            if (isHighLevel) return false; // Pai Alto Nível -> Lateral -> Não conta largura
            return true; // Pai Baixo Nível -> Vertical -> Conta largura
        });

        if (subordinados.length === 0) {
            return w;
        }

        const larguraSubordinados = subordinados.reduce((sum, child) => sum + calcularLarguraSubarvore(child), 0);
        const gaps = (subordinados.length - 1) * LAYOUT_CONSTANTS.HORIZONTAL_GAP;

        return Math.max(w, larguraSubordinados + gaps);
    };

    /**
     * Posiciona nós recursivamente
     * @param {Object} setor - Nó atual
     * @param {Number} x - Coordenada X central disponível para esta subárvore
     * @param {Number} y - Coordenada Y
     */
    const posicionarNos = (setor, x_center_available, y) => {
        // Obter dimensões para converter Coodernada e alinhar Centros
        const { w } = getDynamicDimensions(setor.hierarquia, setor.isAssessoria, setor.id?.includes('prefeito'));
        // ReactFlow usa Top-Left como âncora. Para alinhar centros (X), subtraimos metade da largura.
        // Math.round para evitar sub-pixel rendering (linhas borradas)
        setor.position = { x: Math.round(x_center_available - (w / 2)), y: Math.round(y) };

        if (!setor.children || setor.children.length === 0) {
            return;
        }

        // SEPARAR: Assessorias vs Subordinados

        // Helper interno para checar se é para ESQUERDA
        // CORREÇÃO: User pediu Consultoria na DIREITA.
        // Vamos manter apenas lógica específica ou remover se não houver left
        const isLeftAssessoria = (node) => {
            const name = (node.nomeSetor || node.nomeCargo || '').toLowerCase();
            const type = (node.tipoSetor || '').toLowerCase();
            // Apenas definidos explicitamente vão para esquerda
            return node._side === 'left';
        };

        // SEPARAR FILHOS:
        // 1. Assessorias (Hierarquia 0 ou flag isAssessoria) -> Lógica lateral tradicional
        // 2. Subordinados Normais -> Lógica vertical
        // 3. Nested Assessorias (Filhos de uma Assessoria) -> Lógica lateral em cadeia (Horizontal Chain)

        // Verificar se O PAI é uma assessoria (para ativar modo Chain)
        const isParentAssessoria = checkIsAssessoria(setor) || parseInt(setor.hierarquia) === 0;

        // Verificar nível do pai para decisão de layout
        const parentLevel = parseInt(setor.hierarquia || 0);
        const isHighLevel = parentLevel < 3; // Nível 0, 1, 2 = Lateral. Nível 3+ = Vertical.

        let assessorias = [];
        let subordinados = [];
        let nestedAdvisors = []; // Filhos de assessoria

        setor.children.forEach(child => {
            // Debug para entender decisão de layout
            const isAss = checkIsAssessoria(child);
            const parentIsAss = isParentAssessoria;

            if (isParentAssessoria) {
                // Se o pai é assessoria, TODOS os filhos são tratados como child lateral (Chain o vertical dependendo da lógica 2)
                nestedAdvisors.push(child);
            } else if (isAss && isHighLevel) {
                // É assessoria E pai é alto nível -> Lateral
                assessorias.push(child);
            } else {
                // Não é assessoria OU pai é baixo nível -> Vertical
                subordinados.push(child);
            }
        });

        // =================================================================================
        // LÓGICA 1: ASSESSORIAS DO PAI (Primeiro Nível Lateral)
        // =================================================================================

        // =================================================================================
        // LÓGICA 1: ASSESSORIAS DO PAI (Lateral Alternado)
        // =================================================================================

        // IMPORTANTE: NÃO ordenar assessorias por ID (UUID não preserva ordem de criação)
        // A ordem original do array já vem ordenada pelo backend (ordem de inserção)
        // Ordenar por ID causava intermitência no posicionamento esquerda/direita

        const { h: parentH } = getDynamicDimensions(setor.hierarquia, setor.isAssessoria, setor.id?.includes('prefeito'));
        const parentCenterY = parentH / 2;

        const getAdvisorYOffset = (ass) => {
            const { h: assH } = getDynamicDimensions(ass.hierarquia, true, false);
            const assCenterY = assH / 2;
            return parentCenterY - assCenterY;
        };

        assessorias.forEach((ass, i) => {
            // Regra: 1ª (i=0) Direita, 2ª (i=1) Esquerda, 3ª (i=2) Direita...
            const isRight = (i % 2 === 0);
            const side = isRight ? 'right' : 'left';

            const xOffset = SPACING_CONFIG.assessoriaOffset;
            const assX = isRight
                ? x_center_available + xOffset
                : x_center_available - xOffset;

            // Ajuste vertical para não sobrepor se houver muitas assessorias do mesmo lado
            // Math.floor(i/2) agrupa pares (0,1 no nível 0; 2,3 no nível 1...)
            const levelIndex = Math.floor(i / 2);
            const yOffset = getAdvisorYOffset(ass);
            const assY = y + yOffset + (levelIndex * 150); // 150px de gap vertical entre grupos

            ass._side = side;

            // Configurar Handles para garantir fluxo correto
            // Se está na direita, recebe linha na esquerda. Se está na esquerda, recebe na direita.
            ass.targetPosition = isRight ? 'left' : 'right';
            ass.sourcePosition = 'bottom'; // Sempre sai por baixo para os filhos

            posicionarNos(ass, assX, Math.round(assY));
        });

        // =================================================================================
        // LÓGICA 2: NESTED ADVISORS (Filhos de Assessoria - Cadeia Horizontal)
        // =================================================================================
        if (nestedAdvisors.length > 0) {
            // Direção depende do lado do Pai
            const direction = setor._side === 'left' ? -1 : 1;

            // Dimensões do Pai para calcular descida
            const { h: parentH_forNested } = getDynamicDimensions(setor.hierarquia, true, false);

            // Start Y: Abaixo do pai + GAP PADRONIZADO
            const FIXED_VERTICAL_GAP = 100; // Valor fixo para padronizar distância
            const startY = y + parentH_forNested + FIXED_VERTICAL_GAP;

            // Espaçamento Horizontal entre os filhos
            const NESTED_SPACING = 280;

            nestedAdvisors.forEach((child, idx) => {
                // Layout em L:
                // idx=0: Fica exatamente verticalmente abaixo do pai (offset 0)
                // idx=1: Fica ao lado (1 * spacing)
                // idx=2: Fica ao lado (2 * spacing)

                // Se o pai é Left -> expande para Left (x - offset)
                // Se o pai é Right -> expande para Right (x + offset)

                // Nota: Se quisermos o "L" perfeito, o primeiro filho não desloca X.
                const childOffset = idx * NESTED_SPACING;

                const childX = x_center_available + (childOffset * direction);
                const childY = startY;

                // Herdar lado do pai
                child._side = setor._side || 'right';
                // Marcar como nested
                child._isNested = true;
                child.sourcePosition = 'bottom';
                child.targetPosition = 'top'; // FORÇADO: Sempre recebe linha por cima, vinda do Bottom do Pai

                // Garantir Y exato (sem flutuação de float)
                const exactY = Math.round(childY);
                posicionarNos(child, childX, exactY);
            });
        }

        if (subordinados.length === 0) return;

        // 3. Posicionar Subordinados Verticais (Pirâmide)
        subordinados.sort((a, b) => parseFloat(a.hierarquia || 0) - parseFloat(b.hierarquia || 0));

        const largurasSubordinados = subordinados.map(child => calcularLarguraSubarvore(child));
        const totalLarguraSubordinados = largurasSubordinados.reduce((a, b) => a + b, 0) +
            (subordinados.length - 1) * LAYOUT_CONSTANTS.HORIZONTAL_GAP;

        let currentX = x_center_available - (totalLarguraSubordinados / 2);

        subordinados.forEach((filho, index) => {
            const larguraFilho = largurasSubordinados[index];
            const centroFilho = currentX + (larguraFilho / 2);

            const { h: parentH } = getDynamicDimensions(setor.hierarquia, setor.isAssessoria, setor.id?.includes('prefeito'));

            // Se for nível alto (onde tem assessorias laterais), empurrar filhos centrais MUITO para baixo.
            // Aumentado para 320 para limpar completamente a área dos filhos de assessoria.
            // CRÍTICO: Aplicar APENAS se o pai for Nível 1 (Secretaria -> Superintendência).
            // Se for Nível 2 (Superintendência -> Diretoria), NÃO aplicar gap extra.

            const parentLevelInternal = parseInt(setor.hierarquia);
            const isLevel1 = parentLevelInternal === 1;

            const extraGap = (isHighLevel && isLevel1) ? 320 : 0;
            const verticalStep = 200 + extraGap; // Gap visual FIXO de 200px + extra se Level1

            // Arredondar Y para evitar linhas tortas/grossas
            const finalY = Math.round(y + verticalStep);
            posicionarNos(filho, centroFilho, finalY);
            currentX += larguraFilho + LAYOUT_CONSTANTS.HORIZONTAL_GAP;
        });
    };

    // Posicionar cada árvore raiz
    // Assumir que raízes são irmãs no topo
    let totalWidthRoots = 0;
    const rootWidths = raizes.map(r => calcularLarguraSubarvore(r));
    const totalRootWidth = rootWidths.reduce((a, b) => a + b, 0) + (raizes.length - 1) * 80; // Gap maior entre raízes

    let currentRootX;
    if (raizes.length === 1) {
        // Se houver apenas uma raiz, ela fica centralizada em 0
        currentRootX = -(rootWidths[0] / 2);
    } else {
        // Se houver várias, distribui simetricamente em relação ao centro 0
        currentRootX = -(totalRootWidth / 2);
    }

    raizes.forEach((raiz, index) => {
        const width = rootWidths[index];
        const centerX = currentRootX + (width / 2);

        posicionarNos(raiz, centerX, 0);

        currentRootX += width + 80; // Gap entre subárvores principais
    });

    return Array.from(setoresMap.values());
};

export const centerLayout = (setores) => {
    if (!setores || setores.length === 0) return [];
    // Positions are already centered around 0,0 by algorithm logic above
    return setores;
};

export const adjustAssessoriaPositions = (setores) => {
    // Manter lógica simples para assessoria por enquanto, ou ignorar se não houver no spec
    // Spec não mencionou assessoria explicitamente, vamos manter comportamento padrão se necessário
    return setores;
};

export const applyAutoLayout = (setores) => {
    let setoresComLayout = calculateHierarchicalLayout(setores);
    // setoresComLayout = adjustAssessoriaPositions(setoresComLayout); // Opcional
    // Centralização já embutida
    return setoresComLayout;
};
