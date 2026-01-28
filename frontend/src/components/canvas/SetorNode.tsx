/**
 * Componente de Nó Customizado para ReactFlow
 * Representa um setor ou cargo no organograma
 * HANDLES: Top, Bottom, Left, Right para conexões flexíveis
 */
import React from 'react';
import { Handle, Position } from 'reactflow';
import { HIERARCHY_COLORS } from '../../constants/hierarchyLevels';
import StyleEditor from './StyleEditor';
import './SetorNode.css';

const SetorNode = ({ data, selected }) => {
    const {
        nomeSetor,
        nomeCargo,
        tipoSetor,
        hierarquia,
        isAssessoria,
        cargos,
        simbolos,
        ocupante,
        quantidade = 0,
        _isNested,
        customStyle,
        id
    } = data;

    // Derived values
    const nome = nomeSetor || nomeCargo; // Fallback
    const isPrefeito = tipoSetor === 'Prefeito' || data.id === 'prefeito' || data.id === 'prefeito-cargo';
    const isCargoAgrupado = quantidade > 0 && !isAssessoria;

    // Classe condicionais
    const hirarqNum = typeof hierarquia === 'string' ? parseFloat(hierarquia) : (hierarquia || 0);
    const isRoot = hirarqNum === 1 || hirarqNum === 0.5;
    const isAssessoriaNode = isAssessoria || (hirarqNum === 0);
    const isNested = _isNested;

    // Style Editor state controlled by parent (OrganogramaCanvas)
    const showEditor = data.isEditing;
    console.log(`[SetorNode] ${data.id?.substring(0, 8)} | isEditing=${data.isEditing} | showEditor=${showEditor}`);
    const nodeRef = React.useRef(null);

    // Cor especial para o Prefeito (Ouro) ou baseada na hierarquia
    const defaultBg = isPrefeito ? '#FFD700' : (HIERARCHY_COLORS[hirarqNum] || '#e2e8f0');

    // Se tiver cor customizada (style.backgroundColor), usa ela para borda/detalhe
    // Se não, usa a cor da hierarquia
    const nodeColor = customStyle?.backgroundColor || HIERARCHY_COLORS[hirarqNum] || '#e2e8f0';

    // Combinar estilos globais (customStyle) com individuais (style)
    // Individual tem prioridade sobre Global
    const effectiveStyle = {
        ...customStyle,
        ...data.style
    };

    // Posição vertical forçada para handles laterais (Pixel Perfect Alignment)
    const lateralHandleStyle = data.handleY ? { top: data.handleY } : {};

    // Suporte a Gradientes (background) e Cores Sólidas (backgroundColor)
    const backgroundStyle = effectiveStyle.background || effectiveStyle.backgroundColor || defaultBg;
    const textColor = effectiveStyle.color || (isPrefeito ? '#ffffff' : '#000000');
    const borderColor = effectiveStyle.borderColor || effectiveStyle.border?.split(' ')[2] || 'transparent';
    const borderWidth = effectiveStyle.borderWidth || (effectiveStyle.border ? effectiveStyle.border.split(' ')[0] : (effectiveStyle.borderColor ? '2px' : '0px'));
    const boxShadow = effectiveStyle.boxShadow || 'none';
    const fontWeight = effectiveStyle.fontWeight || 'normal';
    const textShadow = effectiveStyle.textShadow || 'none';

    // Regra de Tamanho Regressiva (Meta 11)
    // Nível 1: 300x110 | Nível 2: 280x100 | Nível 3: 260x90 | Nível 4+: 240x80 | Assessoria: 240x80
    const getDimension = () => {
        if (isNested) return { w: 200, h: 60 }; // Flattened
        const h = parseInt(hierarquia);
        if (h === 1 || isPrefeito) return { w: 300, h: 110 };
        if (h === 2) return { w: 280, h: 100 };
        if (h === 3) return { w: 260, h: 90 };
        // Assessoria (0) e níveis 4+ usam tamanho compacto
        return { w: 240, h: 80 };
    };
    const { w, h } = getDimension();

    // console.log('[SetorNode] Style:', { id: data.id, style: data.style, custom: data.customStyle, effective: effectiveStyle });

    const handleNodeClick = (e) => {
        e.stopPropagation(); // Evitar conflito com canvas
        console.log('🖱️ [SetorNode] Botão 🎨 clicado! ID:', data.id, '| onEditClick presente:', !!data.onEditClick);
        if (data.onEditClick) {
            data.onEditClick(data.id);
        } else {
            console.error('❌ [SetorNode] onEditClick NÃO está disponível no data!');
        }
    };

    // Handler de duplo-clique no corpo do nó (alternativa ao botão 🎨)
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        console.log('🖱️🖱️ [SetorNode] Duplo clique! ID:', data.id, '| onEditClick presente:', !!data.onEditClick);
        if (data.onEditClick) {
            data.onEditClick(data.id);
        } else {
            console.error('❌ [SetorNode] onEditClick NÃO está disponível no data!');
        }
    };

    const handleStyleChange = (newStyle) => {
        // Aplica imediatamente a mudança de cor
        if (data.onStyleChange) {
            data.onStyleChange(data.id, newStyle);
        }
    };

    const handleCloseEditor = () => {
        if (data.onEditClick) {
            data.onEditClick(data.id); // Toggle off
        }
    };

    return (
        <div
            ref={nodeRef}
            className={`setor-node ${isRoot ? 'root-node' : ''} ${selected ? 'selected' : ''} ${isAssessoriaNode ? 'assessoria-node' : ''} ${isNested ? 'nested-assessoria' : ''} ${isPrefeito ? 'prefeito' : ''}`}
            onDoubleClick={handleDoubleClick}
            style={{
                background: backgroundStyle,
                backgroundColor: backgroundStyle.includes('gradient') ? 'transparent' : backgroundStyle,
                color: textColor,
                borderWidth: borderWidth,
                borderStyle: 'solid',
                borderColor: borderColor,
                boxShadow: boxShadow,
                fontWeight: fontWeight,
                textShadow: textShadow,
                cursor: 'pointer',
                position: 'relative',
                width: `${w}px`,
                minHeight: `${h}px`
            }}
            data-hierarquia={hierarquia}
        >
            <button
                className="node-edit-button"
                onPointerDownCapture={(e) => {
                    // Captura o evento ANTES de qualquer outro handler
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🔴 [SetorNode] PointerDown capturado no botão 🎨');
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleNodeClick(e);
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
                onMouseUp={(e) => {
                    e.stopPropagation();
                }}
                title="Editar Estilo (clique único ou duplo-clique no nó)"
                style={{
                    opacity: selected ? 1 : 0,
                    pointerEvents: selected ? 'auto' : 'none'
                }}
            >
                🎨
            </button>
            {showEditor && (
                <StyleEditor
                    initialStyle={{ backgroundColor: backgroundStyle, borderColor, color: textColor }}
                    onStyleChange={handleStyleChange}
                    onClose={handleCloseEditor}
                />
            )}

            {/* Handles de entrada (target) */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                className="node-handle"
            />
            {/* Esquerda recebe (Target) - Padrão para nós à direita */}
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="node-handle"
                style={lateralHandleStyle}
            />
            {/* Direita recebe (Target) - Novo para nós à esquerda */}
            <Handle
                type="target"
                position={Position.Right}
                id="right-target"
                className="node-handle"
                style={lateralHandleStyle}
            />

            <div className="node-content">
                {/* Tipo de setor (apenas para estrutura) */}
                {tipoSetor && (
                    <div className="node-tipo">{tipoSetor}</div>
                )}

                {/* Nome do setor/cargo */}
                <div className="node-nome">{nome}</div>

                {/* Nome do Ocupante */}
                {ocupante && (
                    <div className="node-ocupante">{ocupante}</div>
                )}

                {/* Setor de Referência (Cross-Filtering) */}
                {data.nomeSetorRef && (
                    <div className="node-setor-ref">
                        {data.nomeSetorRef}
                    </div>
                )}

                {/* Hierarquia */}
                <div className="node-hierarquia">
                    {isAssessoria ? 'Assessoria' : `Nível ${!isNaN(parseFloat(hierarquia)) ? parseFloat(hierarquia).toFixed(1) : hierarquia}`}
                </div>

                {/* Cargos (para organograma estrutural) */}
                {cargos && cargos.length > 0 && (
                    <div className="node-cargos">
                        {cargos.map((cargo, idx) => (
                            <span key={idx} className="cargo-badge">
                                {cargo.tipo} ({cargo.quantidade})
                            </span>
                        ))}
                    </div>
                )}

                {/* Símbolos (para organograma de funções) */}
                {simbolos && simbolos.length > 0 && (
                    <div className="node-simbolos">
                        {simbolos.map((simbolo, idx) => (
                            <span key={idx} className="simbolo-badge">
                                {simbolo.tipo} ({simbolo.quantidade})
                            </span>
                        ))}
                    </div>
                )}

                {/* Quantidade (para cargos agrupados níveis 5-10) */}
                {isCargoAgrupado && (
                    <div className="node-quantidade">
                        Total: {quantidade}
                    </div>
                )}
            </div>

            {/* Handles de saída (source) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                className="node-handle"
            />
            {/* Direita envia (Source) - Padrão para nós à direita */}
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="node-handle"
                style={lateralHandleStyle}
            />
            {/* Esquerda envia (Source) - Novo para nós à esquerda */}
            <Handle
                type="source"
                position={Position.Left}
                id="left-source"
                className="node-handle"
                style={lateralHandleStyle}
            />
        </div>
    );
};

export default SetorNode;
