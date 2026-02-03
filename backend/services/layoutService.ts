/**
 * Serviço de Layout Hierárquico
 * Calcula posicionamento automático de nós em organogramas
 * REGRA: Assessorias/Staff ficam LATERALMENTE ao lado do setor pai
 */

// Constantes de espaçamento
const SPACING = {
    HORIZONTAL: 280,      // Espaçamento horizontal entre nós irmãos
    VERTICAL: 180,        // Espaçamento vertical entre níveis
    ASSESSORIA_OFFSET_X: 350,  // Offset horizontal para Assessoria (lateral direita)
    ASSESSORIA_OFFSET_Y: 0,    // Offset vertical para Assessoria (mesma altura do pai)
    MIN_SIBLING_GAP: 80,  // Gap mínimo entre nós irmãos (Aumentado de 50 para 80)
    LAYER_GAP: 200        // Espaçamento entre camadas horizontais
};

// Helper para dimensões (Sincronizado com Frontend)
// Helper para dimensões (Sincronizado com Frontend)
export function getNodeDimensions(item) {
    let h = 0;
    if (item.hierarquia !== undefined) h = parseFloat(item.hierarquia);
    else if (item.nivel !== undefined) h = parseFloat(item.nivel);

    const isPrefeito = item.tipoSetor === 'Prefeito' || item.id === 'prefeito' || (item.nomeCargo && item.nomeCargo.toLowerCase().includes('prefeito'));

    if (h === 1 || isPrefeito) return { w: 300, h: 110 };
    if (h === 2) return { w: 280, h: 100 };
    if (h === 3) return { w: 260, h: 90 };
    return { w: 240, h: 80 };
}

export function calculateHierarchicalLayout(items, isFuncional = false) {
    if (!items || items.length === 0) return [];

    // Identificar Organograma Geral
    const isOrganogramaGeral = items.some(s => s.id === 'prefeito' || s.id === 'prefeito-cargo');
    if (isOrganogramaGeral) {
        return calculateOrganogramaGeralLayout(items);
    }

    const spacing = isFuncional ?
        { ...SPACING, VERTICAL: 150, HORIZONTAL: 320, MIN_SIBLING_GAP: 60 } :
        SPACING;

    const itemMap = new Map();
    items.forEach(item => {
        // Normaliza ID e ParentID para string
        const idStr = String(item.id);
        const parentStr = item.parentId ? String(item.parentId) : null;

        itemMap.set(idStr, {
            ...item,
            id: idStr,
            originalParentId: parentStr, // Preserva original
            children: []
        });
    });

    itemMap.forEach(item => {
        if (item.originalParentId && itemMap.has(item.originalParentId)) {
            itemMap.get(item.originalParentId).children.push(item);
        }
    });

    const rootNodes = Array.from(itemMap.values()).filter(s =>
        !s.originalParentId || !itemMap.has(s.originalParentId)
    );

    if (rootNodes.length === 0) {
        return items.map(i => ({ ...i, position: { x: 0, y: 0 } }));
    }

    const allPosicionados = [];

    rootNodes.forEach((root, index) => {
        const offsetX = index * (spacing.HORIZONTAL * 3);
        const layoutResult = calculateSubtreeLayout(root, offsetX, 0, spacing, 'center');
        allPosicionados.push(...layoutResult.nodes);
    });

    return allPosicionados;
}

// Algoritmo Recursivo Avançado (Sincronizado com Frontend)
function calculateSubtreeLayout(node, x, y, spacing, alignMode = 'center') {
    const { w: nodeWidth, h: nodeHeight } = getNodeDimensions(node);

    // Centralizamos em X
    node.position = { x: x - (nodeWidth / 2), y };

    const nodes = [node];
    const children = node.children || [];

    // 1. Identificar a Hierarquia MÁXIMA entre os filhos (quem é o mais profundo?)
    // Ex: Se tem filhos Nível 2 e Nível 3, o Max é 3.
    let maxChildLevel = 0;
    children.forEach(c => {
        const h = parseFloat(c.hierarquia || 0);
        if (h > maxChildLevel) maxChildLevel = h;
    });

    const isAssessoriaNode = (n) => {
        // [FORCE FIX] Chefia NUNCA é assessoria, mesmo que o banco diga ao contrário (por bugs antigos)
        if (n.nomeSetor && (
            n.nomeSetor.toLowerCase().includes('superintend') ||
            n.nomeSetor.toLowerCase().includes('diretoria') ||
            n.nomeSetor.toLowerCase().includes('subsecretari')
        )) {
            return false;
        }

        // Regra 1: Explicitamente Assessoria
        if (n.isAssessoria) return true;
        // Regra 2: Nível 0 é sempre assessoria
        if (n.hierarquia !== undefined && parseFloat(n.hierarquia) === 0) return true;

        return false;
    };

    const isParentAssessoria = isAssessoriaNode(node);

    let assessorias = [];
    let setoresNormais = [];

    if (isParentAssessoria) {
        // Se o pai já é assessoria, filhos são sempre verticais
        setoresNormais = children;
    } else {
        assessorias = children.filter(c => isAssessoriaNode(c));
        setoresNormais = children.filter(c => !isAssessoriaNode(c));
    }

    const selfWidth = spacing.HORIZONTAL + (assessorias.length * spacing.HORIZONTAL);
    let maxY = y;

    // --- POSICIONAR ASSESSORIAS LATERALMENTE ---
    let maxAssessoriaY = y;

    assessorias.forEach((assessoria, idx) => {
        const isRight = (idx % 2 === 0);
        const direction = isRight ? 1 : -1;
        const pairIndex = Math.floor(idx / 2);

        const dynamicOffset = spacing.ASSESSORIA_OFFSET_X + (pairIndex * spacing.HORIZONTAL);

        const { h: assessoriaHeight } = getNodeDimensions(assessoria);
        // Centralização Vertical em relação ao Pai
        const assY = y; // Perfect-Pixel: Alinhado no topo do pai para linha reta no handle de 45px

        const mode = isRight ? 'right' : 'left';

        const assessoriaLayout = calculateSubtreeLayout(
            assessoria,
            x + (dynamicOffset * direction),
            assY,
            spacing,
            mode // Restaurado de 'center' para o modo direcional (left/right)
        );
        nodes.push(...assessoriaLayout.nodes);
        maxY = Math.max(maxY, assessoriaLayout.maxY);
        maxAssessoriaY = Math.max(maxAssessoriaY, assessoriaLayout.maxY);
    });

    // --- POSICIONAR FILHOS ---
    let childrenBlockWidth = 0;

    if (setoresNormais.length > 0) {
        // [MODIFICAÇÃO VISUAL]
        // Ordenar setores normais para que os níveis mais "Importantes" (menor hierarquia, ex: 2)
        // fiquem no CENTRO visual, e os níveis menos importantes (maior hierarquia, ex: 3) nas pontas.

        // 1. Agrupar por hierarquia
        const byHierarchy = {};
        setoresNormais.forEach(s => {
            const h = parseFloat(s.hierarquia || 999);
            if (!byHierarchy[h]) byHierarchy[h] = [];
            byHierarchy[h].push(s);
        });

        // 2. Ordenar chaves de hierarquia (2, 3, 4...)
        const levels = Object.keys(byHierarchy).map(Number).sort((a, b) => a - b);

        // 3. Construir lista final "Do Centro para Fora" (Highest Priority in Center)
        let sortedSetores = [];

        // Se tivermos níveis mistos, colocamos o nível mais baixo (mais importante) no meio
        // Ex: temos [L2, L3, L3]. Queremos [L3, L2, L3].

        if (levels.length > 1) {
            const topLevel = levels[0]; // Ex: 2
            const topLevelNodes = byHierarchy[topLevel]; // [NodeL2]
            const otherNodes = []; // [NodeL3, NodeL3]

            levels.slice(1).forEach(l => otherNodes.push(...byHierarchy[l]));

            // Estratégia: Metade dos outros à esquerda, Top no meio, Metade à direita
            const midPoint = Math.ceil(otherNodes.length / 2);
            const leftWing = otherNodes.slice(0, midPoint);
            const rightWing = otherNodes.slice(midPoint);

            sortedSetores = [...leftWing, ...topLevelNodes, ...rightWing];
        } else {
            // Apenas um nível, mantém ordem padrão (pode ser alfabética ou id)
            sortedSetores = setoresNormais.sort((a, b) => (a.nomeSetor || '').localeCompare(b.nomeSetor || ''));
        }

        const childrenLayouts = [];
        const advisorHeight = maxAssessoriaY - y;
        const verticalGap = Math.max(
            spacing.VERTICAL,
            (advisorHeight * 2) + (spacing.VERTICAL / 2)
        );
        const childY = y + verticalGap;

        sortedSetores.forEach(child => {
            // [FIX] Calcular Y baseado no nível hierárquico específico do filho
            // Garante que saltos de nível (ex: 1 -> 3) tenham gap visual correspondente
            const parentLevel = parseFloat(node.hierarquia || 0);
            const childLevel = parseFloat(child.hierarquia || 0);
            const levelDiff = childLevel > parentLevel ? (childLevel - parentLevel) : 1;

            // Gap base (já inclui clearance de assessorias) + Gap extra por níveis pulados
            const extraGap = (levelDiff - 1) * spacing.VERTICAL;
            const specificChildY = childY + extraGap;

            const childLayout = calculateSubtreeLayout(
                child, 0, specificChildY, spacing, alignMode
            );
            childrenLayouts.push(childLayout);
            childrenBlockWidth += childLayout.width;
        });

        childrenBlockWidth += (setoresNormais.length - 1) * spacing.MIN_SIBLING_GAP;

        // --- ALINHAMENTO DIRECIONAL ---
        let currentEdgeX;
        let directionStep = 1;

        if (alignMode === 'center') {
            currentEdgeX = x - (childrenBlockWidth / 2);
        } else if (alignMode === 'right') {
            const firstChildWidth = childrenLayouts[0].width;
            currentEdgeX = x - (firstChildWidth / 2);
        } else if (alignMode === 'left') {
            const firstChildWidth = childrenLayouts[0].width;
            currentEdgeX = x + (firstChildWidth / 2);
            directionStep = -1;
        }

        childrenLayouts.forEach((layoutInfo, idx) => {
            const subTreeWidth = layoutInfo.width;
            let childCenterX;

            if (alignMode === 'left') {
                childCenterX = currentEdgeX - (subTreeWidth / 2);
                currentEdgeX -= (subTreeWidth + spacing.MIN_SIBLING_GAP);
            } else {
                childCenterX = currentEdgeX + (subTreeWidth / 2);
                currentEdgeX += (subTreeWidth + spacing.MIN_SIBLING_GAP);
            }

            const finalChildLayout = calculateSubtreeLayout(
                setoresNormais[idx],
                childCenterX,
                childY,
                spacing,
                alignMode
            );

            nodes.push(...finalChildLayout.nodes);
            maxY = Math.max(maxY, finalChildLayout.maxY);
        });
    }

    const finalWidth = Math.max(selfWidth, childrenBlockWidth);
    return { nodes, maxY, width: finalWidth };
}

/**
 * Calcula posicionamento para organograma de funções
 * TAMBÉM aplica regra de assessorias laterais
 */
export function calculateFuncoesLayout(cargos) {
    // Usar a mesma lógica de árvore robusta do estrutural
    return calculateHierarchicalLayout(cargos, true);
}

/**
 * Agrupa cargos por tipo para níveis 5-10 (modo funções)
 */
/**
 * Layout específico para Organograma Geral
 */
function calculateOrganogramaGeralLayout(setores) {
    const positionedNodes = [];
    const setorMap = new Map();

    setores.forEach(setor => {
        setorMap.set(setor.id, { ...setor, children: [] });
    });

    // Construir árvore de hierarquia
    setorMap.forEach(setor => {
        if (setor.parentId && setorMap.has(setor.parentId)) {
            setorMap.get(setor.parentId).children.push(setor);
        }
    });

    // CAMADA 0: Prefeito e Gabinete (LATERAL)
    const prefeito = setorMap.get('prefeito') || setorMap.get('prefeito-cargo');
    const gabinete = setorMap.get('gabinete') || setorMap.get('gabinete-cargo');

    if (prefeito) {
        prefeito.position = { x: 0, y: 0 };
        positionedNodes.push(prefeito);
    }

    if (gabinete) {
        gabinete.position = { x: SPACING.ASSESSORIA_OFFSET_X, y: SPACING.ASSESSORIA_OFFSET_Y };
        positionedNodes.push(gabinete);
    }

    // CAMADA 1: Subprefeituras
    const subprefeiturasIds = [
        ['subprefeitura-1', 'subprefeitura-1-cargo'],
        ['subprefeitura-2', 'subprefeitura-2-cargo'],
        ['subprefeitura-3', 'subprefeitura-3-cargo'],
        ['subprefeitura-4', 'subprefeitura-4-cargo']
    ];

    const subprefeituras = [];
    subprefeiturasIds.forEach(([id1, id2]) => {
        const node = setorMap.get(id1) || setorMap.get(id2);
        if (node) subprefeituras.push(node);
    });

    const subprefeituraY = SPACING.LAYER_GAP;
    // Usar a função recursiva com espaçamento padrão
    const subprefLayouts = subprefeituras.map(subpref => {
        return calculateSubtreeLayout(subpref, 0, subprefeituraY, SPACING);
    });

    let totalSubprefWidth = 0;
    subprefLayouts.forEach(layout => {
        totalSubprefWidth += (layout.width || SPACING.HORIZONTAL);
    });
    totalSubprefWidth += (Math.max(0, subprefLayouts.length - 1) * SPACING.HORIZONTAL);

    let currentSubprefX = -totalSubprefWidth / 2;

    subprefLayouts.forEach(layout => {
        const layoutWidth = layout.width || SPACING.HORIZONTAL;
        const offsetX = currentSubprefX + (layoutWidth / 2);

        layout.nodes.forEach(node => {
            node.position.x += offsetX;
        });

        positionedNodes.push(...layout.nodes);
        currentSubprefX += layoutWidth + SPACING.HORIZONTAL;
    });

    // CAMADA 2: Órgãos Nível 1
    const orgaosNivel1 = Array.from(setorMap.values()).filter(s =>
        (s.parentId === 'prefeito' || s.parentId === 'prefeito-cargo') &&
        Number(s.hierarquia) === 1 &&
        !s.id.startsWith('subprefeitura-') &&
        (s.id !== 'gabinete' && s.id !== 'gabinete-cargo')
    );

    const orgaosY = subprefeituraY + SPACING.LAYER_GAP;

    const orgaosLayouts = orgaosNivel1.map(orgao => {
        return calculateSubtreeLayout(orgao, 0, orgaosY, SPACING);
    });

    let totalOrgaosWidth = 0;
    orgaosLayouts.forEach(layout => {
        totalOrgaosWidth += (layout.width || SPACING.HORIZONTAL);
    });
    totalOrgaosWidth += (Math.max(0, orgaosLayouts.length - 1) * SPACING.MIN_SIBLING_GAP);

    let currentOrgaoX = -totalOrgaosWidth / 2;

    orgaosLayouts.forEach(layout => {
        const layoutWidth = layout.width || SPACING.HORIZONTAL;
        const centerX = currentOrgaoX + (layoutWidth / 2);

        layout.nodes.forEach(node => {
            node.position.x += centerX;
        });

        positionedNodes.push(...layout.nodes);
        currentOrgaoX += layoutWidth + SPACING.MIN_SIBLING_GAP;
    });

    return positionedNodes;
}

/**
 * Agrupa cargos por tipo para níveis 5-10 (modo funções)
 */
export function groupCargosByType(cargos) {
    if (!cargos || cargos.length === 0) {
        return [];
    }

    const grouped = {};
    const others = [];

    cargos.forEach(cargo => {
        // Garantir que hierarquia seja tratada como número
        const hierarquia = parseFloat(cargo.hierarquia);

        if (hierarquia >= 5 && hierarquia <= 10) {
            // Verificar se o cargo já está no formato agrupado (simbolo + quantidade)
            if (cargo.simbolo && cargo.quantidade !== undefined) {
                // Cargo já está agrupado, apenas passar adiante
                const key = `${cargo.nomeCargo}_${cargo.simbolo}_${hierarquia}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        id: cargo.id,
                        nomeCargo: cargo.nomeCargo,
                        hierarquia: cargo.hierarquia,
                        isAssessoria: cargo.isAssessoria,
                        parentId: cargo.parentId,
                        simbolo: cargo.simbolo,
                        quantidade: 0,
                        position: cargo.position,
                        style: cargo.style
                    };
                }
                grouped[key].quantidade += cargo.quantidade;
            } else if (Array.isArray(cargo.simbolos)) {
                // Formato original com array de simbolos
                cargo.simbolos.forEach(simbolo => {
                    const key = `${cargo.nomeCargo}_${simbolo.tipo}_${hierarquia}`;

                    if (!grouped[key]) {
                        grouped[key] = {
                            id: cargo.id,
                            nomeCargo: cargo.nomeCargo,
                            hierarquia: cargo.hierarquia,
                            isAssessoria: cargo.isAssessoria,
                            parentId: cargo.parentId,
                            simbolo: simbolo.tipo,
                            quantidade: 0,
                            position: cargo.position,
                            style: cargo.style
                        };
                    }
                    grouped[key].quantidade += simbolo.quantidade;
                });
            } else {
                // Cargo sem simbolos definidos, passar como está
                others.push(cargo);
            }
        } else {
            others.push(cargo);
        }
    });

    return [...others, ...Object.values(grouped)];
}

/**
 * Centraliza toda a árvore para que o nó raiz fique em (0, 0)
 */
export function centerLayout(nodes) {
    if (!nodes || nodes.length === 0) {
        return [];
    }

    const rootNode = nodes.find(n => !n.parentId && !n.isAssessoria) ||
        nodes.find(n => Number(n.hierarquia) === 1 && !n.isAssessoria) ||
        nodes[0];

    const offsetX = -rootNode.position.x;
    const offsetY = -rootNode.position.y;

    return nodes.map(node => ({
        ...node,
        position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY
        }
    }));
}
