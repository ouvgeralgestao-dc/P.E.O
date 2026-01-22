/**
 * LivePreviewCanvas - Preview em Tempo Real do Organograma
 * Com controles de zoom +/- e hierarquia fiel ao formulário
 */
import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, { Background, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { HIERARCHY_COLORS, HIERARCHY_BORDERS } from '../../constants/hierarchyLevels';
import './LivePreviewCanvas.css';
import { Handle, Position } from 'reactflow';

// Custom Node Simples para LivePreview com handles em todas as direções
const PreviewNode = ({ data, style }) => {
    const handleStyle = data.handleY ? { top: data.handleY } : {};

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Handle type="target" position="top" id="top" style={{ opacity: 0 }} />
            <Handle type="target" position="left" id="left" style={{ opacity: 0, ...handleStyle }} />
            <Handle type="target" position="right" id="right" style={{ opacity: 0, ...handleStyle }} />
            <Handle type="target" position="bottom" id="bottom" style={{ opacity: 0 }} />

            {/* Conteúdo Label (HTML) */}
            <div dangerouslySetInnerHTML={{ __html: data.labelHTML }} />

            <Handle type="source" position="top" id="top" style={{ opacity: 0 }} />
            <Handle type="source" position="left" id="left" style={{ opacity: 0, ...handleStyle }} />
            <Handle type="source" position="right" id="right" style={{ opacity: 0, ...handleStyle }} />
            <Handle type="source" position="bottom" id="bottom" style={{ opacity: 0 }} />
        </div>
    );
};

// Configuração de espaçamento base (Sincronizado com backend/services/layoutService.ts)
const BASE_SPACING = {
    ESTRUTURA: {
        HORIZONTAL: 280,
        VERTICAL: 300,        // Aumentado drasticamente para separar Nível 1 do Nível 2
        ASSESSORIA_OFFSET_X: 350,
        ASSESSORIA_OFFSET_Y: 0,
        MIN_SIBLING_GAP: 80       // Mais respiro horizontal
    },
    FUNCOES: {
        HORIZONTAL: 320,
        VERTICAL: 150, // Ajuste proporcional
        ASSESSORIA_OFFSET_X: 350,
        ASSESSORIA_OFFSET_Y: 0,
        MIN_SIBLING_GAP: 60
    }
};

// Obter dimensões dinâmicas (Réplica de SetorNode/layoutHelpers)
const getNodeDimensions = (item) => {
    // ... (Manter getNodeDimensions inalterado se já estiver correto, mas por segurança repetimos a lógica de dimensões)
    let h = 0;
    if (item.hierarquia !== undefined) h = parseInt(item.hierarquia);
    else if (item.nivel !== undefined) h = parseInt(item.nivel);

    const isPrefeito = item.tipoSetor === 'Prefeito' || item.id === 'prefeito' || (item.nomeCargo && item.nomeCargo.toLowerCase().includes('prefeito'));

    if (h === 1 || isPrefeito) return { w: 300, h: 110 };
    if (h === 2) return { w: 280, h: 100 };
    if (h === 3) return { w: 260, h: 90 };
    return { w: 240, h: 80 };
};

// Algoritmo de Layout Recursivo (Portado de layoutService.ts)
const calculateSubtreeLayout = (node, x, y, spacing, alignMode = 'center') => {
    const { w: nodeWidth, h: nodeHeight } = getNodeDimensions(node);

    // ReactFlow usa Top-Left. Centralizamos em X.
    node.position = { x: x - (nodeWidth / 2), y };

    // ... (Manter lógica de filhos e separação normal/assessoria)
    const nodes = [node];
    const children = node.children || [];

    // Ajudante para verificar se é assessoria (Por flag, nível 0 ou string)
    const isAssessoriaNode = (n) => {
        return n.isAssessoria ||
            (n.hierarquia !== undefined && parseInt(n.hierarquia) === 0) ||
            (n.nomeCargo && n.nomeCargo.toLowerCase().includes('assessor')) ||
            (n.nomeSetor && n.nomeSetor.toLowerCase().includes('assessor')) ||
            (n.tipoSetor && n.tipoSetor.toLowerCase().includes('assessoria')) ||
            (n.tipoSetor && n.tipoSetor.toLowerCase().includes('gabinete'));
    };

    // Verificação de Assessoria do PAI (Sincronizada)
    const isParentAssessoria = isAssessoriaNode(node);

    let assessorias = [];
    let setoresNormais = [];

    if (isParentAssessoria) {
        setoresNormais = children;
    } else {
        assessorias = children.filter(c => {
            // REGRA: Lateral apenas se for Nível 0 (Staff).
            // Se tiver nível explícito (1, 2, 3...), deve ser vertical, mesmo que se chame "Assessoria".
            const nivel = c.hierarquia !== undefined ? parseInt(c.hierarquia) : undefined;
            const isLikelyAss = isAssessoriaNode(c);

            // Prioridade: Se nível for 0 -> Lateral.
            // Se isAssessoriaNode for true E (sem nível definido OU nível 0) -> Lateral.
            return (nivel === 0) || (isLikelyAss && (nivel === undefined || nivel === 0));
        });
        setoresNormais = children.filter(c => {
            const nivel = c.hierarquia !== undefined ? parseInt(c.hierarquia) : undefined;
            const isLikelyAss = isAssessoriaNode(c);
            const isLateral = (nivel === 0) || (isLikelyAss && (nivel === undefined || nivel === 0));
            return !isLateral;
        });
    }

    // A largura base é o nó + assessorias laterais
    // No backend: const selfWidth = SPACING.HORIZONTAL + (assessorias.length * SPACING.HORIZONTAL);
    // Mas aqui as assessorias podem ir para ambos os lados, então vamos considerar a largura total do "cluster" do nó pai.
    // Vamos simplificar mantendo a lógica do backend de 'selfWidth' para garantir que irmãos não colidam.
    const selfWidth = spacing.HORIZONTAL + (assessorias.length * spacing.HORIZONTAL);

    let maxY = y;

    // --- POSICIONAR ASSESSORIAS LATERALMENTE (Alternando Esq/Dir) ---
    let maxAssessoriaY = y; // Rastrear o ponto mais baixo das assessorias

    assessorias.forEach((assessoria, idx) => {
        // Backend Logic:
        // const isRight = (index % 2 === 0);
        // const direction = isRight ? 1 : -1;
        // const pairIndex = Math.floor(index / 2);
        // const dynamicOffset = SPACING.ASSESSORIA_OFFSET_X + (pairIndex * SPACING.HORIZONTAL);

        const isRight = (idx % 2 === 0);
        const direction = isRight ? 1 : -1;
        const pairIndex = Math.floor(idx / 2);

        // Offset acumulativo se houver múltiplas assessorias do mesmo lado
        const dynamicOffset = spacing.ASSESSORIA_OFFSET_X + (pairIndex * spacing.HORIZONTAL);

        // Y deve ser calculado para CENTRALIZAR a assessoria verticalmente em relação ao pai
        // CenterY do Pai = y + (nodeHeight / 2)
        // CenterY da Ass = assY + (assessoriaHeight / 2)
        // Igualando: assY = y + (nodeHeight / 2) - (assessoriaHeight / 2)
        const { h: assessoriaHeight } = getNodeDimensions(assessoria);
        const assY = y + (nodeHeight / 2) - (assessoriaHeight / 2);

        // Passar alignMode correto: Direita -> 'right', Esquerda -> 'left'
        const mode = isRight ? 'right' : 'left';

        const assessoriaLayout = calculateSubtreeLayout(
            assessoria,
            x + (dynamicOffset * direction), // X relativo ao centro do pai
            assY,
            spacing,
            mode // Propagar modo de alinhamento
        );
        nodes.push(...assessoriaLayout.nodes);
        maxY = Math.max(maxY, assessoriaLayout.maxY);
        maxAssessoriaY = Math.max(maxAssessoriaY, assessoriaLayout.maxY);
    });

    // --- POSICIONAR FILHOS ---
    let childrenBlockWidth = 0;

    if (setoresNormais.length > 0) {
        // Ordenar por hierarquia (opcional, mas bom pra consistência)
        setoresNormais.sort((a, b) => (parseInt(a.hierarquia || 0) - parseInt(b.hierarquia || 0)));

        const childrenLayouts = [];

        // Lógica Dinâmica: Se houver assessorias profundas, empurrar filhos normais MUITO para baixo
        // Motivo: A linha de conexão (smoothstep) é desenhada no MEIO (50%) do espaço vertical.
        // Para a linha passar ABAIXO das assessorias, o espaço total deve ser > 2x a altura das assessorias.
        const advisorHeight = maxAssessoriaY - y;
        const verticalGap = Math.max(
            spacing.VERTICAL,
            (advisorHeight * 2) + (spacing.VERTICAL / 2) // * 2 para baixar o ponto médio + folga
        );
        const childY = y + verticalGap;

        // Passo 1: Recursão para calcular larguras
        // Recursão inicial (mantendo alignMode do pai para continuar o fluxo se necessário)
        // Mas para filhos normais, geralmente queremos resetar para 'center' SE for o Nível principal.
        // POREM, se estamos dentro de uma assessoria (alignMode != center), queremos manter o bias.
        setoresNormais.forEach(child => {
            const childLayout = calculateSubtreeLayout(
                child, 0, childY, spacing, alignMode // Mantém alignMode
            );
            childrenLayouts.push(childLayout);
            childrenBlockWidth += childLayout.width; // Usa a largura "width" que pode vir undefined no backend, mas aqui retornaremos sempre
        });

        // Adicionar Gaps
        childrenBlockWidth += (setoresNormais.length - 1) * spacing.MIN_SIBLING_GAP;

        // --- LÓGICA DE ALINHAMENTO DIRECIONAL ---
        let currentEdgeX;
        let directionStep = 1; // 1 para direita, -1 para esquerda

        if (alignMode === 'center') {
            // Padrão: Centralizado (Começa na esquerda total e vai pra direita)
            currentEdgeX = x - (childrenBlockWidth / 2);
        } else if (alignMode === 'right') {
            // Crescimento para Direita
            // O primeiro filho (idx 0) deve estar centralizado em X
            // currentEdgeX inicia na borda ESQUERDA do primeiro filho
            const firstChildWidth = childrenLayouts[0].width;
            currentEdgeX = x - (firstChildWidth / 2);
        } else if (alignMode === 'left') {
            // Crescimento para Esquerda
            // O primeiro filho (idx 0) deve estar centralizado em X
            // Os próximos vão para a esquerda.
            // currentEdgeX inicia na borda DIREITA do primeiro filho
            const firstChildWidth = childrenLayouts[0].width;
            currentEdgeX = x + (firstChildWidth / 2);
            directionStep = -1; // Inverter loop visualmente (ou matematicamente)
        }

        // Passo 2: Ajustar posições finais
        childrenLayouts.forEach((layoutInfo, idx) => {
            const childNode = setoresNormais[idx]; // Objeto original
            const subTreeWidth = layoutInfo.width;
            let childCenterX;

            if (alignMode === 'left') {
                // Modo Esquerda: Subtrair largura
                // edge está na direita do node. center = edge - w/2
                childCenterX = currentEdgeX - (subTreeWidth / 2);
                // Atualizar edge para o próximo (caminhando para esquerda)
                currentEdgeX -= (subTreeWidth + spacing.MIN_SIBLING_GAP);
            } else {
                // Modo Centro ou Direita: Somar largura
                // edge está na esquerda do node. center = edge + w/2
                childCenterX = currentEdgeX + (subTreeWidth / 2);
                // Atualizar edge para o próximo
                currentEdgeX += (subTreeWidth + spacing.MIN_SIBLING_GAP);
            }

            // Re-rodar layout com X final correto
            // Isso atualiza recursivamente todas as posições absolutas dos descendentes
            const finalChildLayout = calculateSubtreeLayout(
                childNode,
                childCenterX,
                childY, // Y calculado dinamicamente
                spacing,
                alignMode // Propaga para netos? Sim, growth trend mantém.
            );

            nodes.push(...finalChildLayout.nodes);
            maxY = Math.max(maxY, finalChildLayout.maxY);
        });
    }

    const finalWidth = Math.max(selfWidth, childrenBlockWidth);

    // Retorna width REAL usada (importante para não sobrepor irmãos no nível acima)
    return { nodes, maxY, width: finalWidth };
};

const calculateHierarchicalLayout = (items, isFuncional) => {
    if (!items || items.length === 0) return [];

    const spacing = isFuncional ? BASE_SPACING.FUNCOES : BASE_SPACING.ESTRUTURA;

    const setorMap = new Map();
    items.forEach(item => {
        const idStr = String(item.id);
        const itemCopy = {
            ...item,
            id: idStr, // Normaliza ID para string
            children: [],
            originalParentId: item.parentId ? String(item.parentId) : null
        };
        setorMap.set(idStr, itemCopy);
    });

    setorMap.forEach(setor => {
        const pIdStr = setor.originalParentId;
        if (pIdStr && setorMap.has(pIdStr)) {
            const parent = setorMap.get(pIdStr);
            parent.children.push(setor);
        }
    });

    const rootNodes = Array.from(setorMap.values()).filter(s =>
        !s.originalParentId || !setorMap.has(s.originalParentId)
    );

    if (rootNodes.length === 0) {
        return items.map(i => ({ ...i, position: { x: 0, y: 0 } }));
    }

    const allPosicionados = [];

    rootNodes.forEach((root, index) => {
        const offsetX = index * (spacing.HORIZONTAL * 3);
        const layoutResult = calculateSubtreeLayout(root, offsetX, 0, spacing);
        allPosicionados.push(...layoutResult.nodes);
    });

    return allPosicionados;
};

const getNodeColor = (item) => {
    // Manter lógica existente
    const hierarquia = parseFloat(item.hierarquia) || 0;

    if (item.tipoSetor === 'Prefeito' || item.nomeCargo === 'Prefeito Municipal') {
        return '#FFD700';
    }

    if (item.tipoSetor === 'Gabinete') {
        return '#FFA500';
    }

    return HIERARCHY_COLORS[hierarquia] || '#F5F5F5';
};

const getNodeBorder = (item) => {
    // Manter lógica existente
    const hierarquia = parseFloat(item.hierarquia) || 0;

    if (item.tipoSetor === 'Prefeito' || item.nomeCargo === 'Prefeito Municipal') {
        return '#B8860B';
    }

    if (item.tipoSetor === 'Gabinete') {
        return '#CC8400';
    }

    return HIERARCHY_BORDERS[hierarquia] || '#BDBDBD';
};

// Helper para formatar label de cargo
const getCargoLabel = (item) => {
    let label = item.nomeCargo || '';

    if (item.ocupante) {
        label += `\n(${item.ocupante})`;
    }

    if (item.simbolos && Array.isArray(item.simbolos) && item.simbolos.length > 0) {
        const simbolosStr = item.simbolos.map(s => `${s.tipo} (${s.quantidade})`).join(', ');
        label += `\n${simbolosStr}`;
    } else if (item.simbolo) {
        label += `\n${item.simbolo}`;
        if (item.quantidade) label += ` (${item.quantidade})`;
    }

    return label;
};

// Componente interno que tem acesso ao contexto do ReactFlow
function LivePreviewContent({ setores, cargos, isFuncional }) {
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    // Registrar tipos de nó (memoizado)
    const nodeTypes = useMemo(() => ({
        previewNode: PreviewNode
    }), []);
    // Estado local apenas para exibição da porcentagem de zoom (opcional)
    const [zoomLevel, setZoomLevel] = useState(1);

    const { nodes, edges } = useMemo(() => {
        const items = isFuncional ? cargos : setores;
        // ... (resto do useMemo se mantém igual, apenas verificando se nodes/edges mudaram)
        if (!items || items.length === 0) {
            return { nodes: [], edges: [] };
        }

        console.log('LivePreview Debug - Items:', items.length);
        const itemsComPosicao = calculateHierarchicalLayout(items, isFuncional);

        // ... (mapeamento de nodes)
        const nodes = itemsComPosicao.map(item => {
            const bgColor = getNodeColor(item);
            const borderColor = getNodeBorder(item);
            return {
                id: item.id,
                type: 'previewNode', // Usar nosso custom node
                data: {
                    labelHTML: (isFuncional ? getCargoLabel(item) : item.nomeSetor).replace(/\n/g, '<br/>'),
                    handleY: undefined
                },
                position: item.position || { x: 0, y: 0 },
                style: {
                    background: bgColor,
                    color: '#1a202c',
                    border: `2px solid ${borderColor}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    // Usar GetNodeDimensions para garantir sincronia com layout
                    width: `${getNodeDimensions(item).w}px`,
                    height: `${getNodeDimensions(item).h}px`, // Altura fixa para garantir alinhamento
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                }
            };
        });

        const edges = itemsComPosicao
            .filter(item => item.originalParentId)
            .map(item => {
                // Encontrar o pai para verificar se ele também é assessoria
                // O layout já posicionou verticalmente se o pai for assessoria, então a edge deve acompanhar.
                const parent = itemsComPosicao.find(p => String(p.id) === String(item.originalParentId));

                const isParentAssessoria = parent && (
                    parent.isAssessoria ||
                    (parent.hierarquia !== undefined && parseInt(parent.hierarquia) === 0) ||
                    (parent.nomeCargo && parent.nomeCargo.toLowerCase().includes('assessor')) ||
                    (parent.nomeSetor && parent.nomeSetor.toLowerCase().includes('assessor')) ||
                    (parent.tipoSetor && parent.tipoSetor.toLowerCase().includes('assessoria')) ||
                    (parent.tipoSetor && parent.tipoSetor.toLowerCase().includes('gabinete'))
                );

                // Detectar se é assessoria (hierarquia 0 ou flag explícita) - LOGICA ESTRITA
                const nivel = item.hierarquia !== undefined ? parseInt(item.hierarquia) : undefined;
                const isLateral = (nivel === 0) || (
                    (item.isAssessoria ||
                        (item.nomeCargo && item.nomeCargo.toLowerCase().includes('assessor')) ||
                        (item.nomeSetor && item.nomeSetor.toLowerCase().includes('assessor')) ||
                        (item.tipoSetor && item.tipoSetor.toLowerCase().includes('assessoria')) ||
                        (item.tipoSetor && item.tipoSetor.toLowerCase().includes('gabinete'))
                    ) && (nivel === undefined || nivel === 0)
                );

                // Se for lateral E o pai NÃO for lateral (ou seja, conectado ao tronco principal)
                if (isLateral && !isParentAssessoria) {
                    return {
                        id: `${item.originalParentId}-${item.id}`,
                        source: item.originalParentId,
                        target: item.id,
                        type: 'straight', // Linha reta para conexão lateral
                        sourceHandle: 'right',
                        targetHandle: 'left',
                        animated: false,
                        style: { stroke: '#9e9e9e', strokeWidth: 2 }
                    };
                }

                // Padrão para outros nós (Top-Bottom) ou Assessorias Aninhadas
                return {
                    id: `${item.originalParentId}-${item.id}`,
                    source: item.originalParentId,
                    target: item.id,
                    type: 'smoothstep', // Usar smoothstep para linhas ortogonais mais controladas
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                    animated: false,
                    style: { stroke: '#9e9e9e', strokeWidth: 2 },
                    pathOptions: { borderRadius: 0 } // Raio 0 para ficar "quadrado" (dentro de pathOptions)
                };
            });

        return { nodes, edges };
    }, [setores, cargos, isFuncional]);

    // Garantir que o fitView ocorra quando os dados mudarem ou o componente carregar
    // Mas sem loop infinito
    const lastNodesCount = React.useRef(0);

    React.useEffect(() => {
        if (nodes.length > 0) {
            // Só dispara automático se a contagem mudar ou for a primeira vez
            const runFitView = () => {
                window.requestAnimationFrame(() => {
                    // Permitir zoom bem pequeno (0.05) para caber estruturas gigantes
                    // Limitar zoom máximo inicial (1.5) para não estourar em hierarquias pequenas
                    fitView({ padding: 0.2, duration: 600, minZoom: 0.05, maxZoom: 1.5 });
                });
            };

            if (nodes.length !== lastNodesCount.current) {
                runFitView();
                lastNodesCount.current = nodes.length;
            } else {
                // Se o conteúdo mudou mas a quantidade não, tenta uma vez
                const timer = setTimeout(runFitView, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [nodes, fitView]); // Nodes do useMemo é seguro agora se usarmos o ref para controle

    // ... (rest of render)
    return (
        <div className="live-preview-canvas">
            <div className="preview-header">
                <span className="preview-icon">🔴</span>
                <span className="preview-title">PREVIEW AO VIVO</span>
                <span className="preview-badge">
                    {isFuncional ? cargos.length : setores.length} {isFuncional ? 'cargo(s)' : 'setor(es)'}
                </span>
                <div className="zoom-controls">
                    <button onClick={() => zoomOut()} className="zoom-btn" title="Diminuir zoom">−</button>
                    <button onClick={() => zoomIn()} className="zoom-btn" title="Aumentar zoom">+</button>
                    <button onClick={() => fitView({ padding: 0.2, duration: 400 })} className="zoom-btn zoom-reset" title="Centralizar e Ajustar">⟲</button>
                </div>
            </div>

            <div className="preview-canvas-wrapper">
                {nodes.length === 0 ? (
                    <div className="preview-empty-state">
                        <div className="empty-icon">📋</div>
                        <p className="empty-title">Nenhum {isFuncional ? 'cargo' : 'setor'} adicionado</p>
                        <p className="empty-subtitle">
                            O preview aparecerá aqui conforme você adiciona {isFuncional ? 'cargos' : 'setores'}
                        </p>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '100%' }}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            zoomOnScroll={true}
                            panOnScroll={true}
                            panOnDrag={true}
                            minZoom={0.1}
                            maxZoom={4}
                        >
                            <Background color="#cbd5e1" gap={20} size={1} />
                        </ReactFlow>
                    </div>
                )}
            </div>
        </div>
    );
}

// Componente Wrapper Principal
function LivePreviewCanvas(props) {
    return (
        <ReactFlowProvider>
            <LivePreviewContent {...props} />
        </ReactFlowProvider>
    );
}

export default React.memo(LivePreviewCanvas);
