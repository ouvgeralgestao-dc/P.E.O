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
// TORNANDO GENÉRICO: Baseado apenas em Nível numérico (1, 2, 3...)
const getDynamicDimensions = (hierarquia, isAssessoria = false, tipoSetor = '') => {
    // Normalizar hierarquia (parseFloat para suportar 0.5)
    let h = parseFloat(hierarquia);
    if (isNaN(h)) h = 0; // Default para 0

    // Nível 0.5: Subprefeituras (Especial)
    if (h === 0.5) return { w: 280, h: 100 };

    // Nível 1 (Máximo): Prefeito, Secretário, Presidente, etc.
    if (h === 1 || tipoSetor === 'Prefeito') return { w: 300, h: 110 };

    // Nível 2: Subsecretário, Superintendente
    if (h === 2) return { w: 280, h: 100 };

    // Nível 3: Diretor, Coordenador
    if (h === 3) return { w: 260, h: 90 };

    // Nível 4+ e Assessorias (h=0) -> Tamanho padrão compacto
    return { w: 240, h: 80 };
};

const SPACING_CONFIG = {
    // Usar valores fixos padrão (maior largura/altura possível)
    horizontalSpacing: 300 + LAYOUT_CONSTANTS.HORIZONTAL_GAP, // 340px passo
    verticalSpacing: 110 + LAYOUT_CONSTANTS.VERTICAL_GAP,    // 210px passo
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

        // [FORCE FIX] Chefias nunca são assessorias laterais
        const nomeLower = (c.nomeSetor || c.nomeCargo || '').toLowerCase();
        const isChefiaForcada = nomeLower.includes('superintend') ||
            nomeLower.includes('diret') ||
            nomeLower.includes('subsecretari') ||
            nomeLower.includes('secretari') ||
            nomeLower.includes('gerencia') ||
            nomeLower.includes('coordena');

        if (isChefiaForcada) return false;
        if (hirarqNum === 0) return true;

        return false;
    };

    /**
     * Calcula largura da subárvore (espaço horizontal necessário)
     * Largura = (N_filhos * 260) + ((N_filhos - 1) * 40)
     */
    const calcularLarguraSubarvore = (setor) => {
        const { w } = getDynamicDimensions(setor.hierarquia, setor.isAssessoria, setor.tipoSetor);

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
        const { w, h } = getDynamicDimensions(setor.hierarquia, setor.isAssessoria, setor.tipoSetor);
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

        // CORREÇÃO MATEMÁTICA RÍGIDA (FEVEREIRO/2026): Alinhamento Horizontal Perfeito
        // Baseado no MANUAL_TECNICO_LAYOUT.md e SetorNode.tsx:
        // PAI (Nível 1): Altura H=110px. Handle lateral fixo em 45px do topo (SetorNode: top: 45px).
        // FILHA (Assessoria): Altura H=80px. Handle lateral fixo em 45px do topo (SetorNode: top: 45px).
        // PARA LINHA 100% RETA: O ponto Y global deve ser igual.
        // Y_global_pai + 45px === Y_global_filha + 45px
        // Logo: Y_global_filha === Y_global_pai. O offset deve ser ZERO!
        const yOffsetForAlignment = 0;

        console.log(`[LAYOUT FIX] Alinhamento 1:1 rigoroso aplicado`, {
            yOffsetForAlignment
        });

        // CORREÇÃO: Inicializar maxAssessoriaY com o Y do pai + sua altura (onde começam os filhos)
        let maxAssessoriaY = y + h;

        assessorias.forEach((ass, i) => {
            // Regra: 1ª (i=0) Direita, 2ª (i=1) Esquerda, 3ª (i=2) Direita...
            const isRight = (i % 2 === 0);
            const side = isRight ? 'right' : 'left';

            const xOffset = SPACING_CONFIG.assessoriaOffset;
            const assX = isRight
                ? x_center_available + xOffset
                : x_center_available - xOffset;

            // Ajuste vertical para não sobrepor se houver muitas assessorias do mesmo lado
            const levelIndex = Math.floor(i / 2);

            // Y final = Y do pai + offset matemático + espaçamento entre grupos
            // Usamos Math.round para evitar qualquer erro de float que gere diagonais de 1px
            const assY = Math.round(y + yOffsetForAlignment + (levelIndex * 150));

            // Atualizar maxAssessoriaY para saber onde começar os filhos verticais
            // CORREÇÃO: Deep Scan para considerar altura de filhos aninhados (Nested Advisors)
            const getDeepMaxY = (node, currentY) => {
                const { h: nodeH } = getDynamicDimensions(node.hierarquia, true, '');
                let maxY = currentY + nodeH;

                if (node.children && node.children.length > 0) {
                    // Calcular Y dos filhos aninhados (Lógica simétrica à de nestedAdvisors abaixo)
                    const FIXED_VERTICAL_GAP = 100;
                    const startChildY = currentY + nodeH + FIXED_VERTICAL_GAP;

                    node.children.forEach(child => {
                        maxY = Math.max(maxY, getDeepMaxY(child, startChildY));
                    });
                }
                return maxY;
            };

            maxAssessoriaY = Math.max(maxAssessoriaY, getDeepMaxY(ass, assY));

            ass._side = side;
            ass.targetPosition = isRight ? 'left' : 'right';
            ass.sourcePosition = 'bottom';

            console.log(`[LAYOUT FIX] Assessoria: ${ass.nomeSetor || ass.nomeCargo}`, {
                parentY: y,
                finalY: Math.round(assY),
                // Linha 100% Reta: Y_pai + 45 === Y_filha + 45
                isPerfectlyStraight: (y + 45) === (Math.round(assY) + 45)
            });

            posicionarNos(ass, assX, Math.round(assY));
        });

        // =================================================================================
        // LÓGICA 2: NESTED ADVISORS (Filhos de Assessoria - Cadeia Horizontal)
        // =================================================================================
        if (nestedAdvisors.length > 0) {
            // Direção depende do lado do Pai (expande "para fora")
            const direction = setor._side === 'left' ? -1 : 1;

            // Dimensões do Pai para calcular descida
            const { h: parentH_forNested } = getDynamicDimensions(setor.hierarquia, true, '');

            const FIXED_VERTICAL_GAP = 100;
            const startY = y + parentH_forNested + FIXED_VERTICAL_GAP;

            // Preparar larguras das subárvores
            const nestedLayouts = nestedAdvisors.map(child => ({
                node: child,
                width: calcularLarguraSubarvore(child)
            }));

            const NESTED_GAP = 80; // GAP aumentado para evitar caixas "grudadas"

            // Lógica de Expansão Externa:
            // O primeiro filho (idx=0) fica centralizado exatamente abaixo do pai (x_center_available).
            // Os seguintes se deslocam para fora (direction) baseado na largura acumulada.
            let currentOffset = 0;

            nestedLayouts.forEach((layoutItem, idx) => {
                const { node, width } = layoutItem;

                if (idx > 0) {
                    const prevWidth = nestedLayouts[idx - 1].width;
                    // Deslocamento = (metade do anterior + GAP + metade do atual)
                    currentOffset += (prevWidth / 2) + NESTED_GAP + (width / 2);
                }

                const childCenterX = x_center_available + (currentOffset * direction);

                // Herdar lado do pai e configurar handles
                node._side = setor._side || 'right';
                node._isNested = true;
                node.sourcePosition = 'bottom';
                node.targetPosition = 'top';

                posicionarNos(node, childCenterX, Math.round(startY));
            });
        }

        if (subordinados.length === 0) return;

        // 3. Posicionar Subordinados Verticais (Pirâmide em Camadas)

        // 3. Posicionar Subordinados Verticais (Pirâmide em Camadas)
        // [MOUNTAIN SORT] Ordenação Centrada (Nível 2 no meio, Nível 3 nos lados)

        // 1. Agrupar por hierarquia
        const byHierarchy = {};
        subordinados.forEach(s => {
            const h = parseFloat(s.hierarquia || 0);
            if (!byHierarchy[h]) byHierarchy[h] = [];
            byHierarchy[h].push(s);
        });

        // 2. Ordenar Hierarquias (2, 3, 4...)
        const sortedHierarchyKeys = Object.keys(byHierarchy).map(Number).sort((a, b) => a - b);

        // 3. Construir lista final "Do Centro para Fora"
        let sortedSetores = [];

        if (sortedHierarchyKeys.length > 1) {
            // Ex: Temos Nível 2 e Nível 3 misturados
            // Pegamos o Nível SUPERIOR (2) para ser o CENTRO
            const topLevel = sortedHierarchyKeys[0];
            const topLevelNodes = byHierarchy[topLevel];

            // Os demais (Nível 3+) vão para as pontas
            const otherNodes = [];
            sortedHierarchyKeys.slice(1).forEach(l => otherNodes.push(...byHierarchy[l]));

            const midPoint = Math.ceil(otherNodes.length / 2);
            const leftWing = otherNodes.slice(0, midPoint);
            const rightWing = otherNodes.slice(midPoint);

            sortedSetores = [...leftWing, ...topLevelNodes, ...rightWing];
        } else {
            // Apenas um nível (ex: todos Nível 3), mantém ordem alfabética ou original
            sortedSetores = subordinados.sort((a, b) => (a.nomeSetor || '').localeCompare(b.nomeSetor || ''));
        }

        const advisorHeight = maxAssessoriaY - y;

        // Gap vertical base: Se houver assessoria, precisamos pular
        // [FIX] Aumentado de + 50 para + 80 para afastar mais a linha
        const verticalGapBase = Math.max(
            SPACING_CONFIG.verticalSpacing,
            (advisorHeight > 0 ? advisorHeight + 100 : SPACING_CONFIG.verticalSpacing)
        );

        const childYStart = y + verticalGapBase;

        // CORREÇÃO VISUAL: Definir altura exata onde a linha horizontal (fork) deve acontecer
        // Deve ser abaixo das assessorias (maxAssessoriaY) e acima dos filhos (childYStart)
        // Usamos childYStart - 25 como margem de segurança
        if (assessorias.length > 0 || nestedAdvisors.length > 0) {
            // [FIX] Aumentei o espaçamento para "descer mais" como pedido
            setor._customForkY = childYStart - 60; // Mais respiro acima dos filhos
        } else {
            setor._customForkY = undefined;
        }

        // Calcular largura total do bloco de filhos
        // Precisamos pré-calcular para centralizar o bloco inteiro
        const childrenLayouts = sortedSetores.map(child => ({
            node: child,
            width: calcularLarguraSubarvore(child)
        }));

        const totalChildrenWidth = childrenLayouts.reduce((sum, item) => sum + item.width, 0)
            + (Math.max(0, childrenLayouts.length - 1) * LAYOUT_CONSTANTS.HORIZONTAL_GAP);

        let currentChildX = x_center_available - (totalChildrenWidth / 2);

        childrenLayouts.forEach(layoutItem => {
            const { node, width } = layoutItem;

            // Centralizar o nó no seu espaço alocado
            const childCenterX = currentChildX + (width / 2);

            // Calcular Y específico (respeitando saltos de hierarquia)
            const parentLevelVal = parseFloat(setor.hierarquia || 0);
            const childLevelVal = parseFloat(node.hierarquia || 0);
            const levelDiff = childLevelVal > parentLevelVal ? (childLevelVal - parentLevelVal) : 1;

            // Se pulou nível (ex: 1 -> 3), desce mais. Se é (1 -> 2), desce padrão.
            // Gap extra apenas para a DIFERENÇA além de 1
            const extraGap = (levelDiff - 1) * LAYOUT_CONSTANTS.VERTICAL_GAP;


            const finalChildY = Math.round(childYStart + extraGap);

            posicionarNos(node, childCenterX, finalChildY);

            currentChildX += width + LAYOUT_CONSTANTS.HORIZONTAL_GAP;
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

    // Calcular altura máxima das raízes para alinhamento vertical
    const rootsDimensions = raizes.map(r => getDynamicDimensions(r.hierarquia, r.isAssessoria, r.tipoSetor));
    const maxRootHeight = Math.max(...rootsDimensions.map(d => d.h));
    const rootCenterY = maxRootHeight / 2;

    raizes.forEach((raiz, index) => {
        const width = rootWidths[index];
        const { h: rootH } = rootsDimensions[index];
        const centerX = currentRootX + (width / 2);

        // Alinhar verticalmente pelo centro
        // Se a raiz for menor que a maior raiz, desce para alinhar o meio
        const y = rootCenterY - (rootH / 2);

        posicionarNos(raiz, centerX, Math.round(y));

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
