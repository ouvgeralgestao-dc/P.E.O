import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    ReactFlowProvider,
    addEdge,
    Connection,
    Edge,
    MarkerType,
    Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import SetorNode from '../components/canvas/SetorNode'; // Reusing
import { logger } from '../utils/logger';
import './SandboxEditor.css';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

// Tipos de Nós
const nodeTypes = {
    setorNode: SetorNode,
};

const SandboxEditorInner = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Editor State
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

    // Carregar Projeto
    useEffect(() => {
        if (id) loadProject(id);
    }, [id]);

    const loadProject = async (projectId: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/sandbox/${projectId}`);
            setProject(response.data);
            
            // Converter itens salvos para Nodes/Edges do ReactFlow
            const initialNodes: Node[] = [];
            const initialEdges: Edge[] = [];

            if (response.data.items) {
                response.data.items.forEach((item: any) => {
                    const itemData = item.data || {};
                    if (item.type === 'node' || itemData.type === 'setorNode') { // Compatibilidade
                         // Reconstruir o nó
                         initialNodes.push({
                            id: item.id,
                            type: 'setorNode',
                            position: itemData.position || { x: 0, y: 0 },
                            data: {
                                ...itemData.data,
                                // Re-attach handlers
                                onEditClick: handleEditClick,
                                onStyleChange: handleStyleChange,
                                // Garantir hierarquia numérica para cor
                                hierarquia: itemData.data.hierarquia || 0
                            }
                         });
                    } else if (item.type === 'edge' || item.source) { // Se tem source, é edge
                        initialEdges.push({
                            id: item.id,
                            source: item.source,
                            target: item.target,
                            sourceHandle: item.sourceHandle,
                            targetHandle: item.targetHandle,
                            type: item.type || 'smoothstep',
                            markerEnd: { type: MarkerType.ArrowClosed }
                        });
                    }
                });
            }

            setNodes(initialNodes);
            setEdges(initialEdges);
            logger.info('SandboxEditor', 'Projeto carregado', { id: projectId });
        } catch (error) {
            logger.error('SandboxEditor', 'Erro ao carregar projeto', error);
            alert('Erro ao carregar projeto. Verifique se ele existe.');
            navigate('/criacao-livre');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!project) return;
        try {
            // Converter nodes e edges para formato de persistência
            // Precisamos salvar TUDO que é necessário para reconstruir
            const itemsToSave = [
                ...nodes.map(n => ({
                    id: n.id,
                    type: 'node',
                    position: n.position,
                    data: {
                        ...n.data,
                        // Não salvar callbacks
                        onEditClick: undefined,
                        onStyleChange: undefined
                    }
                })),
                ...edges.map(e => ({
                    id: e.id,
                    type: 'edge',
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                    targetHandle: e.targetHandle,
                    markerEnd: e.markerEnd
                }))
            ];

            await api.post(`/sandbox/${project.id}/items`, { items: itemsToSave });
            logger.success('SandboxEditor', 'Projeto salvo com sucesso');
            alert('Projeto salvo com sucesso!');
        } catch (error) {
            logger.error('SandboxEditor', 'Erro ao salvar projeto', error);
            alert('Erro ao salvar projeto.');
        }
    };

    // Callback para conectar nós manualmente
    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge({ 
            ...params, 
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed } 
        }, eds));
    }, [setEdges]);

    // Callbacks do SetorNode
    const handleEditClick = (nodeId: string) => {
        setSelectedNodeId(nodeId);
        setIsPropertiesOpen(true);
    };

    const handleStyleChange = (nodeId: string, newStyle: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        style: { ...node.data.style, ...newStyle }
                    }
                };
            }
            return node;
        }));
    };

    const handleDataChange = (field: string, value: any) => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.map((node) => {
            if (node.id === selectedNodeId) {
                const newData = { ...node.data, [field]: value };
                // Se mudar nome, atualizar fallback label
                return {
                    ...node,
                    data: newData
                };
            }
            return node;
        }));
    };

    // Adicionar novo nó
    const handleAddNode = () => {
        const id = `node-${Date.now()}`;
        const newNode: Node = {
            id,
            type: 'setorNode',
            position: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 },
            data: {
                id,
                nomeSetor: 'Novo Elemento',
                nomeCargo: 'Novo Elemento',
                tipoSetor: 'Departamento',
                hierarquia: 3,
                isAssessoria: false,
                onEditClick: handleEditClick,
                onStyleChange: handleStyleChange,
                style: { backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }
            }
        };
        setNodes((nds) => nds.concat(newNode));
        setSelectedNodeId(id);
        setIsPropertiesOpen(true);
    };

    const handleDeleteSelected = () => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        setSelectedNodeId(null);
        setIsPropertiesOpen(false);
    };

    // Propriedades do nó selecionado
    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    if (loading) return <div className="loading">Carregando editor...</div>;

    return (
        <div className="sandbox-editor-container">
            <div className="sandbox-toolbar">
                <Button variant="outline" onClick={() => navigate('/criacao-livre')}>
                    Voltar
                </Button>
                <span className="project-title">{project?.nome}</span>
                <div className="toolbar-actions">
                    <Button variant="secondary" onClick={handleAddNode}>
                        + Adicionar Nó
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            <div className="canvas-wrapper">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    onNodeClick={(_, node) => handleEditClick(node.id)}
                    attributionPosition="bottom-right"
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>

                {/* Painel de Propriedades Flutuante */}
                {selectedNode && isPropertiesOpen && (
                    <div className="properties-panel">
                        <div className="panel-header">
                            <h3>Propriedades</h3>
                            <button className="close-btn" onClick={() => setIsPropertiesOpen(false)}>×</button>
                        </div>
                        <div className="panel-content">
                            {/* Campos dependendo do tipo do projeto (Setor ou Órgão) */}
                             <Input
                                key={`name-${selectedNodeId}`} // Force render
                                label="Nome"
                                name={project?.tipo === 'orgao' ? 'nomeSetor' : 'nomeCargo'}
                                value={project?.tipo === 'orgao' ? (selectedNode.data.nomeSetor || '') : (selectedNode.data.nomeCargo || '')}
                                onChange={(e) => handleDataChange(e.target.name, e.target.value)}
                             />

                             <Input
                                label="Ocupante / Detalhe"
                                name="ocupante"
                                value={selectedNode.data.ocupante || ''}
                                onChange={(e) => handleDataChange('ocupante', e.target.value)}
                             />

                             <Select
                                 label="Nível Hierárquico"
                                 name="hierarquia"
                                 value={String(selectedNode.data.hierarquia || 0)}
                                 onChange={(e) => handleDataChange('hierarquia', Number(e.target.value))}
                                 options={[
                                     { value: '1', label: 'Nível 1 (Liderança Máxima)' },
                                     { value: '2', label: 'Nível 2 (Diretoria/Sec.)' },
                                     { value: '3', label: 'Nível 3 (Gerência)' },
                                     { value: '4', label: 'Nível 4 (Coordenação)' },
                                     { value: '0', label: 'Assessoria / Staff' }
                                 ]}
                             />

                             <div className="checkbox-wrapper">
                                 <label>
                                     <input 
                                         type="checkbox"
                                         checked={selectedNode.data.isAssessoria || false}
                                         onChange={(e) => handleDataChange('isAssessoria', e.target.checked)}
                                     />
                                     É Assessoria?
                                 </label>
                             </div>

                             <div className="panel-actions">
                                 <Button variant="danger" fullWidth onClick={handleDeleteSelected}>
                                     Excluir Nó
                                 </Button>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Wrapper com Provider
const SandboxEditor = () => (
    <ReactFlowProvider>
        <SandboxEditorInner />
    </ReactFlowProvider>
);

export default SandboxEditor;
