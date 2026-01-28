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

    // ESTRATÉGIA "LINHA BAIXA" (Push Down Strategy)
    // Se houver distância vertical suficiente (>100px), forçamos a dobra (centerY)
    // para acontecer apenas 60px acima do destino.
    // Isso faz a linha passar "por trás/baixo" de quaisquer nós intermediários.
    let options = {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0 // Linhas quadradas ortogonais
    };

    // Apenas aplicar estratégia para conexões Top-Bottom (Verticais)
    // Para laterais, deixamos o padrão
    if (dy > 100 && sourcePosition === 'bottom' && targetPosition === 'top') {
        options['centerY'] = targetY - 60;
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
