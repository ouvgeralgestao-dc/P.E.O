/**
 * Componente de Edge (Conexão) Customizado para ReactFlow
 * Substitui o roteamento padrão (média) por uma estratégia de "Late Branching"
 * A dobra horizontal é empurrada para baixo (perto do destino) para evitar colisões
 */
import React from 'react';
import { getSmoothStepPath, getBezierPath } from 'reactflow';

const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data
}) => {
    // Distância vertical entre origem e destino
    const dy = targetY - sourceY;

    let options: any = {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0 // Linhas quadradas ortogonais
    };

    // ESTRATÉGIA "LINHA ALTA / BARRAMENTO" (Fixed Top Branching)
    if (sourcePosition === 'bottom' && targetPosition === 'top') {
        // [FIX CRÍTICO] Se o layout calculou um forkY específico (para limpar assessorias), use-o.
        // Caso contrário, use o padrão de 50px abaixo da origem.
        if (data && data.customForkY) {
            options['centerY'] = data.customForkY;
        } else {
             options['centerY'] = sourceY + 50;
        }
    }

    // Usar smoothstep (ortogonal) em vez de bezier para organograma
    const [edgePath] = getSmoothStepPath(options);

    return (
        <path
            id={id}
            style={{
                ...style,
                strokeWidth: 2,
                stroke: '#9e9e9e', // Cor padrão cinza
            }}
            className="react-flow__edge-path"
            d={edgePath}
            markerEnd={markerEnd}
        />
    );
};

export default CustomEdge;
