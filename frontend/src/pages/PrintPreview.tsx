import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, useNodesState, useEdgesState, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import SetorNode from '../components/canvas/SetorNode';
import CustomEdge from '../components/canvas/CustomEdge';
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Tipos de nó customizados
const nodeTypes = {
    setorNode: SetorNode
};

const edgeTypes = {
    customEdge: CustomEdge
};

// Dimensões ISO A em mm (horizontal)
const PAPER_SIZES = {
    A4: { width: 297, height: 210, name: 'A4 (297mm x 210mm)' },
    A3: { width: 420, height: 297, name: 'A3 (420mm x 297mm)' },
    A2: { width: 594, height: 420, name: 'A2 (594mm x 420mm)' },
    A1: { width: 841, height: 594, name: 'A1 (841mm x 594mm)' },
    A0: { width: 1189, height: 841, name: 'A0 (1189mm x 841mm)' }
};

function PrintPreviewContent() {
    const navigate = useNavigate();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [title, setTitle] = useState('');
    const [selectedSize, setSelectedSize] = useState('A3'); // Padrão A3
    const [orientation, setOrientation] = useState('landscape'); // 'landscape' | 'portrait'
    const [scale, setScale] = useState(1);
    const { fitView, getNodes } = useReactFlow();

    useEffect(() => {
        // Carregar dados
        try {
            const printData = localStorage.getItem('printData');
            if (printData) {
                const { nodes: savedNodes, edges: savedEdges, title: savedTitle } = JSON.parse(printData);

                // Limpar interação
                const cleanNodes = savedNodes.map(n => ({
                    ...n,
                    selected: false,
                    draggable: false,
                    data: { ...n.data, isPrintMode: true }
                }));

                const cleanEdges = savedEdges.map(e => ({
                    ...e,
                    selected: false,
                    animated: false,
                }));

                setNodes(cleanNodes);
                setEdges(cleanEdges);
                setTitle(savedTitle || 'Organograma');

                // Auto-detectar orientação
                // Pequeno delay para garantir que nodes foram setados no store interno se necessário
                // Mas aqui podemos estimar pelas posições dos savedNodes
                if (savedNodes.length > 0) {
                    const minX = Math.min(...savedNodes.map(n => n.position.x));
                    const maxX = Math.max(...savedNodes.map(n => n.position.x + (n.width || 180)));
                    const minY = Math.min(...savedNodes.map(n => n.position.y));
                    const maxY = Math.max(...savedNodes.map(n => n.position.y + (n.height || 100)));

                    const width = maxX - minX;
                    const height = maxY - minY;

                    if (height > width) {
                        setOrientation('portrait');
                        logger.info('PrintPreview', 'Auto-detected Portrait orientation');
                    } else {
                        setOrientation('landscape');
                        logger.info('PrintPreview', 'Auto-detected Landscape orientation');
                    }
                }
            }
        } catch (error) {
            logger.error('PrintPreview', 'Erro ao carregar dados', error);
        }
    }, [setNodes, setEdges]);

    // Calcular dimensões baseadas na orientação
    const baseSize = PAPER_SIZES[selectedSize];
    const isLandscape = orientation === 'landscape';
    const paperWidth = isLandscape ? baseSize.width : baseSize.height;
    const paperHeight = isLandscape ? baseSize.height : baseSize.width;

    // Calcular escala visual para caber na tela
    useEffect(() => {
        const calculateScale = () => {
            const padding = 40; // Espaço para UI
            const availableWidth = window.innerWidth - padding;
            const availableHeight = window.innerHeight - 100; // - header toolbar

            // Converter mm para px (96dpi: 1mm ~ 3.78px)
            const mmToPx = 3.78;
            const targetW = paperWidth * mmToPx;
            const targetH = paperHeight * mmToPx;

            const scaleW = availableWidth / targetW;
            const scaleH = availableHeight / targetH;

            // Usar o menor scale para caber inteiro (Fit Page)
            const newScale = Math.min(scaleW, scaleH, 1);
            setScale(newScale * 0.95); // 95% para margem de respiro
        };

        calculateScale();
        window.addEventListener('resize', calculateScale); // Recalcular se redimensionar janela
        return () => window.removeEventListener('resize', calculateScale);
    }, [selectedSize, orientation]); // Recalcular se mudar tamanho ou orientação

    // Reajustar zoom NO REACT FLOW quando o tamanho do papel mudar
    useEffect(() => {
        if (nodes.length > 0) {
            // Esperar a transição CSS (300ms) terminar
            const timer = setTimeout(() => {
                fitView({
                    padding: 0.08, // 8% de margem para respirar
                    duration: 200,
                    includeHiddenNodes: true
                });
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [selectedSize, orientation, nodes, fitView]);

    // Garantir resize robusto
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            fitView({ padding: 0.08, duration: 0 });
        });

        const container = document.querySelector('.flow-wrapper');
        if (container) resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [fitView]);

    const handlePrint = () => {
        // Aplicar padding maior para margem antes de imprimir
        fitView({ padding: 0.1, duration: 0 });
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleSavePDF = async () => {
        // [INSIGHT] Bibliotecas de captura (html2canvas) falham em renderizar SVGs e arestas do React Flow com 100% de precisão.
        // A função nativa do navegador (Salvar como PDF) é infinitamente superior em fidelidade e performance.
        handlePrint(); 
    };

    return (
        <div className="print-preview-page">
            <div className="print-toolbar no-print">
                <div className="toolbar-group">
                    <label>Tamanho do Papel:</label>
                    <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="size-select"
                    >
                        {Object.entries(PAPER_SIZES).map(([key, size]) => (
                            <option key={key} value={key}>{size.name}</option>
                        ))}
                    </select>

                    <label style={{ marginLeft: 20 }}>Orientação:</label>
                    <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value)}
                        className="size-select"
                    >
                        <option value="landscape">Paisagem (Horizontal)</option>
                        <option value="portrait">Retrato (Vertical)</option>
                    </select>
                </div>

                <div className="toolbar-info">
                    ℹ️ Dica: Selecione o mesmo papel ao imprimir.
                </div>

                <div className="toolbar-actions">
                    <button className="btn-secondary" onClick={handleBack}>
                        Voltar
                    </button>
                    <button className="btn-pdf" onClick={handleSavePDF}>
                        📄 PDF
                    </button>
                    <button className="btn-print" onClick={handlePrint}>
                        🖨️ Imprimir
                    </button>
                </div>
            </div>

            <div className="paper-container">
                <div
                    className="paper-sheet"
                    style={{
                        width: `${paperWidth}mm`,
                        height: `${paperHeight}mm`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center'
                    }}
                >
                    <div className="print-header">
                        <h1>{title}</h1>
                    </div>

                    <div className="flow-wrapper">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            minZoom={0.001}
                            maxZoom={10}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            panOnDrag={false}
                            panOnScroll={false}
                            zoomOnScroll={false}
                            zoomOnPinch={false}
                            zoomOnDoubleClick={false}
                            attributionPosition="bottom-right"
                        >
                            <Background color="#eee" gap={20} size={1} />
                        </ReactFlow>
                    </div>
                </div>
            </div>

            <style>{`
                /* Estilos da Interface de Ajuste */
                .print-preview-page {
                    background-color: #525659;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center; /* Centralizar na tela */
                    padding-top: 60px; /* Toolbar height */
                    overflow: hidden; /* Evitar scrollbars na tela de preview */
                }

                .print-toolbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: #333;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    z-index: 1000;
                }

                .toolbar-info {
                    font-size: 0.9em;
                    color: #aaa;
                    font-style: italic;
                    display: none; /* Mobile hide */
                }
                @media (min-width: 800px) {
                    .toolbar-info { display: block; }
                }

                .size-select {
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 14px;
                    margin-left: 10px;
                    background: #fff;
                    border: none;
                }

                .toolbar-actions {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                }

                .btn-print, .btn-pdf, .btn-secondary {
                    padding: 8px 18px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    margin-left: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 14px;
                }
                
                .btn-print { 
                    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); 
                    color: white;
                    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
                }

                .btn-pdf { 
                    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
                    color: white;
                    box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
                }

                .btn-secondary { 
                    background: #4a4a4a; 
                    color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .btn-print:hover, .btn-pdf:hover, .btn-secondary:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                }

                .btn-print:active, .btn-pdf:active, .btn-secondary:active {
                    transform: translateY(0);
                }

                .paper-container {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                }

                .paper-sheet {
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: width 0.3s ease, height 0.3s ease, transform 0.3s ease;
                }

                .print-header {
                    text-align: center;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .print-header h1 {
                    margin: 0;
                    font-size: 18pt;
                    font-family: Arial, sans-serif;
                }

                .flow-wrapper {
                    flex: 1;
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                /* ESTILOS DE IMPRESSÃO */
                @media print {
                    .no-print { display: none !important; }
                    
                    @page {
                        size: ${orientation}; /* Dinâmico: landscape ou portrait */
                        margin: 0.5cm; /* Margem mínima para não colar nas bordas */
                    }

                    body, html {
                        margin: 0;
                        padding: 0;
                        background: none;
                        width: 100%;
                        height: 100%;
                        overflow: visible;
                    }

                    .print-preview-page {
                        background: white;
                        padding: 0.5cm; /* Margem interna */
                        margin: 0;
                        display: block;
                        overflow: visible;
                        box-sizing: border-box;
                    }

                    .paper-container {
                        padding: 0;
                        margin: 0;
                        display: block;
                        width: 100%;
                        height: 100%;
                    }

                    .paper-sheet {
                        box-shadow: none;
                        margin: 0;
                        page-break-after: avoid;
                        /* FORÇAR TAMANHO REAL NA IMPRESSÃO */
                        transform: none !important;
                        width: 100% !important;
                        height: 100% !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default function PrintPreview() {
    return (
        <ReactFlowProvider>
            <PrintPreviewContent />
        </ReactFlowProvider>
    );
}
