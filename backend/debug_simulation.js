
// Mock do layoutService.ts para isolar a lógica
// Copiei as funções relevantes e removi dependências externas

const SPACING = {
    HORIZONTAL: 280,
    VERTICAL: 180,
    ASSESSORIA_OFFSET_X: 350,
    ASSESSORIA_OFFSET_Y: 0,
    MIN_SIBLING_GAP: 50,
    LAYER_GAP: 200
};

function getNodeDimensions(item) {
    let h = 0;
    if (item.hierarquia !== undefined) h = parseInt(item.hierarquia);
    return { w: 240, h: 80 }; // Simplificado
}

// SIMULAÇÃO DO ALGORITMO
function calculateHierarchicalLayout(items) {
    const itemMap = new Map();
    items.forEach(item => {
        const idStr = String(item.id);
        const parentStr = item.parentId ? String(item.parentId) : null;
        itemMap.set(idStr, { ...item, id: idStr, originalParentId: parentStr, children: [] });
    });

    itemMap.forEach(item => {
        if (item.originalParentId && itemMap.has(item.originalParentId)) {
            itemMap.get(item.originalParentId).children.push(item);
        }
    });

    const rootNodes = Array.from(itemMap.values()).filter(s => !s.originalParentId);
    const allPosicionados = [];

    rootNodes.forEach((root, index) => {
        console.log(`\nProcessing Root: ${root.nomeSetor}`);
        const layoutResult = calculateSubtreeLayout(root, 0, 0, SPACING, 'center');
        allPosicionados.push(...layoutResult.nodes);
    });

    return allPosicionados;
}

function calculateSubtreeLayout(node, x, y, spacing, alignMode = 'center') {
    const { w: nodeWidth, h: nodeHeight } = getNodeDimensions(node);
    node.position = { x: x - (nodeWidth / 2), y };
    
    // LOG DE DEBUG PARA PERCEBER O QUE ESTÁ ACONTECENDO
    console.log(`[Layout] Node: ${node.nomeSetor} (L${node.hierarquia}) at (${node.position.x}, ${y})`);

    const nodes = [node];
    const children = node.children || [];

    // LÓGICA COPIADA DO ARQUIVO ORIGINAL
    let maxChildLevel = 0;
    children.forEach(c => {
        const h = parseInt(c.hierarquia || 0);
        if (h > maxChildLevel) maxChildLevel = h;
    });
    
    console.log(`   > Children count: ${children.length}. Max Level found: ${maxChildLevel}`);

    const isAssessoriaNode = (n) => {
        if (n.isAssessoria) return true;
        if (n.hierarquia !== undefined && parseInt(n.hierarquia) === 0) return true;
        
        const myLevel = parseInt(n.hierarquia || 0);
        const isConflict = (maxChildLevel > 0 && myLevel > 0 && myLevel < maxChildLevel);
        
        // DEBUG CHECK
        console.log(`   > Checking isAssessoria for ${n.nomeSetor} (L${myLevel}): Conflict? ${isConflict} (MyLevel ${myLevel} < Max ${maxChildLevel})`);
        
        if (isConflict) {
            return true;
        }

        return false;
    };

    const isParentAssessoria = isAssessoriaNode(node);

    let assessorias = [];
    let setoresNormais = [];

    if (isParentAssessoria) {
        setoresNormais = children;
    } else {
        assessorias = children.filter(c => isAssessoriaNode(c)); // Simplified filter for test
        setoresNormais = children.filter(c => !isAssessoriaNode(c));
    }

    console.log(`   > Classified Assessorias (Lateral): ${assessorias.map(a => a.nomeSetor).join(', ')}`);
    console.log(`   > Classified Normais (Vertical): ${setoresNormais.map(a => a.nomeSetor).join(', ')}`);

    // ... (Rest of layout logic simplified just to check placement)
    
    // Simulate Assessoria Placement
    assessorias.forEach((assessoria, idx) => {
        const dynamicOffset = spacing.ASSESSORIA_OFFSET_X; // Simplified
        console.log(`     -> Placing Lateral: ${assessoria.nomeSetor} at offset ${dynamicOffset}`);
        // Recursion
        const layoutResult = calculateSubtreeLayout(assessoria, x + dynamicOffset, y, spacing); // Simplified Y
        nodes.push(...layoutResult.nodes);
    });

    // Simulate Normal Placement
    let childY = y + spacing.VERTICAL;
    setoresNormais.forEach(child => {
        console.log(`     -> Placing Vertical: ${child.nomeSetor}`);
         const layoutResult = calculateSubtreeLayout(child, x, childY, spacing);
         nodes.push(...layoutResult.nodes);
    });

    return { nodes, maxY: 0, width: 0 };
}

// DADOS MOCKADOS REPLICANDO O CENÁRIO DO USUÁRIO
const mockItems = [
    { id: '1', nomeSetor: 'Secretaria (Pai)', hierarquia: '1', parentId: null },
    { id: '2', nomeSetor: 'Superintendência (Filho Raso)', hierarquia: '2', parentId: '1' }, // Deveria ser LATERAL
    { id: '3', nomeSetor: 'Subsecretaria (Filho Fundo)', hierarquia: '3', parentId: '1' }   // Deveria ser VERTICAL
];

console.log("--- START SIMULATION ---");
calculateHierarchicalLayout(mockItems);
console.log("--- END SIMULATION ---");
