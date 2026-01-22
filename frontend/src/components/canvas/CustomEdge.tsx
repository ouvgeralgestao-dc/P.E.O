/**
 * Componente de Edge (Conexão) Customizado para ReactFlow
 * Representa conexões hierárquicas entre setores/cargos
 */
import React from 'react';
import { getBezierPath } from 'reactflow';

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
}) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <path
                id={id}
                style={{
                    ...style,
                    strokeWidth: 2,
                    stroke: '#667eea',
                }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
        </>
    );
};

export default CustomEdge;
