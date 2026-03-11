/**
 * LivePreviewCanvas - Preview em Tempo Real do Organograma
 * Com controles de zoom +/- e hierarquia fiel ao formulário
 */
import React, { useMemo, useEffect, useRef } from 'react';
import ReactFlow, { 
    Background, 
    ReactFlowProvider, 
    useReactFlow, 
    Handle, 
    Position 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HIERARCHY_COLORS, HIERARCHY_BORDERS } from '../../constants/hierarchyLevels';
import './LivePreviewCanvas.css';

// 1. Custom Node - Componente Nominal
function PreviewNode({ data }: { data: any }) {
    return (
        <div style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center'
        }}>
            {/* Target Handles (Entradas) */}
            <Handle type="target" position={Position.Top} id="target-top" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="target-left" style={{ opacity: 0 }} />
            
            <div dangerouslySetInnerHTML={{ __html: data.labelHTML || '...' }} />

            {/* Source Handles (Saídas) */}
            <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="source-right" style={{ opacity: 0 }} />
        </div>
    );
}

// 2. Registro estático de tipos de nó
const nodeTypes = {
    previewNode: PreviewNode
};

// 3. Spacing Constants
const BASE_SPACING = {
    ESTRUTURA: { HORIZONTAL: 280, VERTICAL: 300, ASSESSORIA_OFFSET_X: 350, MIN_SIBLING_GAP: 80 },
    FUNCOES: { HORIZONTAL: 320, VERTICAL: 150, ASSESSORIA_OFFSET_X: 350, MIN_SIBLING_GAP: 60 }
};

// 4. Helpers de Estilo e Dimensão
const getNodeDimensions = (item: any) => {
    const h = item.hierarquia !== undefined ? parseInt(item.hierarquia) : (item.nivel !== undefined ? parseInt(item.nivel) : 0);
    const isSpecial = item.tipoSetor === 'Prefeito' || (item.nomeCargo && item.nomeCargo.toLowerCase().includes('prefeito'));
    
    if (h === 1 || isSpecial) return { w: 300, h: 110 };
    if (h === 2) return { w: 280, h: 100 };
    if (h === 3) return { w: 260, h: 90 };
    return { w: 240, h: 80 };
};

const getNodeStyles = (item: any) => {
    const h = parseFloat(item.hierarquia) || 0;
    const isPrefeito = item.tipoSetor === 'Prefeito' || item.nomeCargo === 'Prefeito Municipal';
    const isGabinete = item.tipoSetor === 'Gabinete';
    
    // @ts-ignore
    let bg = isPrefeito ? '#FFD700' : (isGabinete ? '#FFA500' : (HIERARCHY_COLORS[h] || '#F5F5F5'));
    // @ts-ignore
    let border = isPrefeito ? '#B8860B' : (isGabinete ? '#CC8400' : (HIERARCHY_BORDERS[h] || '#BDBDBD'));
    
    return { bg, border };
};

// 5. Layout Calculation
const calculateSubtreeLayout = (node: any, x: number, y: number, spacing: any, alignMode: string = 'center') => {
    const { w, h } = getNodeDimensions(node);
    node.position = { x: x - (w / 2), y };
    
    const nodes = [node];
    const children = node.children || [];
    
    const isStaff = (n: any) => {
        return n.isStaff || n.isAssessoria || (n.hierarquia !== undefined && parseInt(n.hierarquia) === 0);
    };
    
    let assessorias: any[] = [];
    let normais: any[] = [];
    
    if (isStaff(node)) {
        normais = children;
    } else {
        assessorias = children.filter((c: any) => isStaff(c) && (c.hierarquia === undefined || parseInt(c.hierarquia) === 0));
        normais = children.filter((c: any) => !assessorias.includes(c));
    }
    
    let maxY = y + h;
    let maxAssY = y;

    assessorias.forEach((ass, idx) => {
        const isRight = idx % 2 === 0;
        const dir = isRight ? 1 : -1;
        const pairIdx = Math.floor(idx / 2);
        const offX = spacing.ASSESSORIA_OFFSET_X + (pairIdx * spacing.HORIZONTAL);
        const { h: assH } = getNodeDimensions(ass);
        const assY = y + (h / 2) - (assH / 2);
        const assLayout = calculateSubtreeLayout(ass, x + (offX * dir), assY, spacing, isRight ? 'right' : 'left');
        nodes.push(...assLayout.nodes);
        maxY = Math.max(maxY, assLayout.maxY);
        maxAssY = Math.max(maxAssY, assLayout.maxY);
    });

    if (normais.length > 0) {
        const gapV = Math.max(spacing.VERTICAL, (maxAssY - y) * 2 + 50);
        const childY = y + gapV;
        const layouts = normais.map(child => calculateSubtreeLayout(child, 0, childY, spacing, alignMode));
        const blockW = layouts.reduce((acc, l) => acc + (l.width || spacing.HORIZONTAL), 0) + (normais.length - 1) * spacing.MIN_SIBLING_GAP;
        
        let currX: number;
        if (alignMode === 'center') currX = x - (blockW / 2);
        else if (alignMode === 'right') currX = x - ((layouts[0].width || spacing.HORIZONTAL) / 2);
        else currX = x + ((layouts[0].width || spacing.HORIZONTAL) / 2);

        normais.forEach((child, idx) => {
            const l = layouts[idx];
            const subW = l.width || spacing.HORIZONTAL;
            let centerX: number;
            if (alignMode === 'left') {
                centerX = currX - (subW / 2);
                currX -= (subW + spacing.MIN_SIBLING_GAP);
            } else {
                centerX = currX + (subW / 2);
                currX += (subW + spacing.MIN_SIBLING_GAP);
            }
            const finalL = calculateSubtreeLayout(child, centerX, childY, spacing, alignMode);
            nodes.push(...finalL.nodes);
            maxY = Math.max(maxY, finalL.maxY);
        });
    }

    return { 
        nodes, 
        maxY, 
        width: Math.max(
            spacing.HORIZONTAL + (assessorias.length * spacing.HORIZONTAL), 
            normais.length > 0 ? (nodes.length > 1 ? spacing.HORIZONTAL * 2 : spacing.HORIZONTAL) : spacing.HORIZONTAL
        ) 
    };
};

const calculateHierarchicalLayout = (items: any[], isFuncional: boolean) => {
    if (!items || items.length === 0) return [];
    const spacing = isFuncional ? BASE_SPACING.FUNCOES : BASE_SPACING.ESTRUTURA;
    const map = new Map();
    
    // 1. Mapear itens forçando String nos IDs
    items.forEach(it => {
        const id = String(it.id);
        const parentId = it.parentId ? String(it.parentId) : (it.parent_id ? String(it.parent_id) : null);
        map.set(id, { ...it, id, children: [], originalParentId: parentId });
    });
    
    // 2. Construir árvore
    map.forEach(it => {
        if (it.originalParentId && map.has(it.originalParentId)) {
            map.get(it.originalParentId).children.push(it);
        }
    });
    
    // 3. Identificar raízes (quem não tem pai OU o pai não existe no mapa)
    const roots = Array.from(map.values()).filter(it => !it.originalParentId || !map.has(it.originalParentId));
    
    if (roots.length === 0 && items.length > 0) {
        console.warn('LivePreview: Nenhuma raiz encontrada, usando todos como raízes para evitar tela vazia');
        return items.map((it, i) => ({ ...it, id: String(it.id), position: { x: i * spacing.HORIZONTAL, y: 0 } }));
    }
    
    const result: any[] = [];
    roots.forEach((root, i) => {
        const layout = calculateSubtreeLayout(root, i * spacing.HORIZONTAL * 3, 0, spacing);
        result.push(...layout.nodes);
    });
    return result;
};

// 6. Componente Interno
function LivePreviewContent({ setores = [], cargos = [], isFuncional }: { setores?: any[], cargos?: any[], isFuncional: boolean }) {
    const { fitView, zoomIn, zoomOut } = useReactFlow();
    const lastFitCount = useRef(0);

    const { flowNodes, flowEdges } = useMemo(() => {
        const items = isFuncional ? cargos : setores;
        if (!items || items.length === 0) return { flowNodes: [], flowEdges: [] };

        const itemsComPos = calculateHierarchicalLayout(items, isFuncional);
        const nodes = itemsComPos.map((it: any) => {
            const { w, h } = getNodeDimensions(it);
            const { bg, border } = getNodeStyles(it);
            
            // Mapeamento robusto de label - aceita múltiplas nomenclaturas
            const label = it.nomeCargo || it.nome_cargo || it.nomeSetor || it.nome_setor || it.nome || 'Sem Nome';
            
            return {
                id: String(it.id),
                type: 'previewNode',
                data: { labelHTML: label.replace(/\n/g, '<br/>') },
                position: it.position || { x: 0, y: 0 },
                style: {
                    background: bg,
                    border: `2px solid ${border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    width: w,
                    height: h,
                    fontSize: '11px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a202c',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Relevo para visibilidade
                }
            };
        });

        const edges = itemsComPos
            .filter((it: any) => it.originalParentId && itemsComPos.some((x: any) => String(x.id) === String(it.originalParentId)))
            .map((it: any) => ({
                id: `e-${it.originalParentId}-${it.id}`,
                source: String(it.originalParentId),
                target: String(it.id),
                sourceHandle: 'source-bottom',
                targetHandle: 'target-top',
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#94a3b8', strokeWidth: 2 }
            }));

        console.log(`LivePreview: Gerados ${nodes.length} nós e ${edges.length} conexões.`);
        return { flowNodes: nodes, flowEdges: edges };
    }, [setores, cargos, isFuncional]);

    useEffect(() => {
        if (flowNodes.length > 0) {
            console.log('LivePreview: Solicitando fitView. Nós:', flowNodes.length);
            
            // FitView inicial: Padding menor e maior velocidade para aparecer logo
            const timer = setTimeout(() => {
                fitView({ padding: 0.1, duration: 450, minZoom: 0.01, maxZoom: 1 });
                lastFitCount.current = flowNodes.length;
            }, 300); 

            // Segunda chamada de segurança para garantir o enquadramento após renderização completa
            const timer2 = setTimeout(() => {
                fitView({ padding: 0.15, duration: 300, minZoom: 0.01, maxZoom: 1 });
            }, 800);

            return () => {
                clearTimeout(timer);
                clearTimeout(timer2);
            };
        }
    }, [flowNodes.length, fitView]); 

    return (
        <div className="live-preview-canvas">
            <div className="preview-header">
                <span className="preview-icon">🔴</span>
                <span className="preview-title">PREVIEW AO VIVO</span>
                <span className="preview-badge">{flowNodes.length} nodes</span>
                <div className="zoom-controls">
                    <button onClick={() => zoomOut()} className="zoom-btn">−</button>
                    <button onClick={() => zoomIn()} className="zoom-btn">+</button>
                    <button onClick={() => fitView({ padding: 0.15, duration: 400, minZoom: 0.01 })} className="zoom-btn">⟲</button>
                </div>
            </div>
            <div className="preview-canvas-wrapper">
                {flowNodes.length === 0 ? (
                    <div className="preview-empty-state">
                        <div className="empty-icon">📋</div>
                        <p>Adicione {isFuncional ? 'cargos' : 'setores'} para ver o preview</p>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={flowNodes}
                        edges={flowEdges}
                        nodeTypes={nodeTypes}
                        nodesDraggable={true}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        minZoom={0.01}
                        maxZoom={4}
                        onInit={(instance) => {
                            setTimeout(() => instance.fitView({ padding: 0.15, minZoom: 0.01 }), 50);
                            setTimeout(() => instance.fitView({ padding: 0.15, minZoom: 0.01 }), 300);
                        }}
                    >
                        <Background color="#e2e8f0" gap={20} />
                    </ReactFlow>
                )}
            </div>
        </div>
    );
}

// 7. Componente Principal (Export Default)
export default function LivePreviewCanvas(props: any) {
    return (
        <ReactFlowProvider>
            <LivePreviewContent {...props} />
        </ReactFlowProvider>
    );
}
