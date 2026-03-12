/**
 * Componente Principal de Visualização de Organogramas
 * Usa ReactFlow para renderizar a hierarquia
 * FUNCIONALIDADE: Permite arrastar nós e salvar posições customizadas
 * REGRA: Assessorias conectam pela LATERAL, setores normais pelo TOPO
 */
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    Position,
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import SetorNode from './SetorNode';
import CustomEdge from './CustomEdge';
import { HIERARCHY_COLORS } from '../../constants/hierarchyLevels';
import { applyAutoLayout } from '../../utils/layoutHelpers';
import Icons from '../common/Icons';
import './OrganogramaCanvas.css';

const nodeTypes = {
    setorNode: SetorNode,
};

const edgeTypes = {
    customEdge: CustomEdge,
};

const CustomControls = () => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 5,
            alignItems: 'center'
        }}>
            <button
                onClick={() => zoomIn()}
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#555',
                    transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
                title="Aumentar Zoom (+)"
            >
                +
            </button>
            <button
                onClick={() => zoomOut()}
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#555',
                    transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
                title="Diminuir Zoom (-)"
            >
                -
            </button>
            <button
                onClick={() => fitView({ duration: 800 })}
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#555',
                    transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
                title="Ajustar à Tela ([ ])"
            >
                ↔
            </button>
        </div>
    );
};

const OrganogramaCanvasInner = ({
    organogramaData,
    onSavePositions,
    editable = true,
    onDataChange
}) => {
    const [hasChanges, setHasChanges] = useState(false);
    const { fitView } = useReactFlow();

    // -- ESTADOS DE UI E EDIÇÃO --
    const [activeEditorId, setActiveEditorId] = useState(null);

    // -- ESTADOS DO REACT FLOW --
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Callback para abrir/fechar editor de um nó
    const onEditClick = useCallback((nodeId, forceOpen) => {
        console.log('🎨 [onEditClick] Chamado com nodeId:', nodeId, '| editable:', editable, '| forceOpen:', forceOpen);
        if (!editable) {
            console.log('🚫 [OrganogramaCanvas] Edição desativada (Modo Visualização)');
            return;
        }
        setActiveEditorId(prev => {
            if (forceOpen === true) return nodeId;
            if (forceOpen === false) return null;
            // Toggle se undefined
            const newValue = prev === nodeId ? null : nodeId;
            console.log('🎨 [onEditClick] setActiveEditorId: prev=', prev, ' -> next=', newValue);
            return newValue;
        });
    }, [editable]);

    // Callback para mudar estilo (estável)
    const onStyleChange = useCallback((nodeId, newStyle) => {
        setNodes((nds) => {
            const targetNode = nds.find(n => n.id === nodeId);
            // Se o nó alvo estiver selecionado, atualizamos todos os selecionados
            const isBatchUpdate = targetNode?.selected;

            return nds.map((node) => {
                const shouldUpdate = (node.id === nodeId) || (isBatchUpdate && node.selected);

                if (shouldUpdate) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            style: {
                                ...(node.data.style || {}),
                                ...newStyle
                            }
                        }
                    };
                }
                return node;
            });
        });

        // Salvar automaticamente após alteração de cor
        if (onSavePositions) {
            window.__needsAutoSave = true;
        }
    }, [onSavePositions, setNodes]);

    // -- PROCESSAMENTO DE DADOS (useMemo) --
    // Injeta os callbacks estáveis nos nós durante o carregamento inicial


    // Converter dados do organograma para formato ReactFlow
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        if (!organogramaData) {
            return { nodes: [], edges: [] };
        }

        const nodes: any[] = [];
        const edges: any[] = [];
        const setorMap = new Map(); // Para identificar assessorias

        // Função para achatar estrutura hierárquica (setores com children)
        // Usa Set para evitar duplicatas
        const flattenSetores = (setoresHierarquicos) => {
            const result = [];
            const processedIds = new Set();

            const processSetor = (setor) => {
                // Evitar duplicatas
                if (processedIds.has(setor.id)) return;
                processedIds.add(setor.id);

                const { children, ...setorSemChildren } = setor;
                result.push(setorSemChildren);

                // Processar children recursivamente
                if (children && children.length > 0) {
                    children.forEach(child => processSetor(child));
                }
            };

            setoresHierarquicos.forEach(setor => processSetor(setor));
            return result;
        };

        // Processar organograma estrutural
        if (organogramaData.organogramaEstrutural) {
            let setoresOriginal = organogramaData.organogramaEstrutural.setores || [];

            // Achatar estrutura hierárquica para lista plana
            let setores = flattenSetores(setoresOriginal);

            // Se NÃO tiver posições salvas (ou seja, primeira carga), aplica layout
            // Caso contrário, respeita o que veio do banco (se vier via props já processado)
            // OBS: A função applyAutoLayout atual calcula posições do zero.
            // MELHORADO: Verificar se as posições formam um layout hierárquico válido
            // (não apenas se são != 0, mas se há variação em Y indicando níveis diferentes)
            // CORREÇÃO: Check explícito para isNaN, pois typeof NaN é 'number'
            // CORREÇÃO CRÍTICA (18/01/2026): Validação Rígida de Layout
            // Se QUALQUER nó tiver coordenada NaN, o layout inteiro é considerado inválido.
            // Isso previne que o ReactFlow trave ao tentar renderizar coordenadas inválidas.
            const hasInvalidNodes = setores.some(s =>
                !s.position ||
                typeof s.position.x !== 'number' || isNaN(s.position.x) ||
                typeof s.position.y !== 'number' || isNaN(s.position.y)
            );

            // Verificação secundária: Mesmo que todos sejam números, eles formam uma árvore visual?
            const positionsWithY = setores.filter(s => !isNaN(s.position?.y));
            const uniqueYValues = new Set(positionsWithY.map(s => Math.round((s.position?.y || 0) / 50)));
            const hasHierarchy = positionsWithY.length > 2 && uniqueYValues.size > 1;

            // [FIX] Verificação Terciária: Consistência Geométrica Hierárquica
            // Detectar "esmagamento": Filho Nível 3 colado em Pai Nível 1 (devia ter gap duplo)
            let hasGeometricInconsistency = false;
            // Só executa se não houve falha prévia
            if (!hasInvalidNodes && (positionsWithY.length <= 2 || hasHierarchy)) {
                const tempPosMap = new Map(setores.map(s => [s.id, s]));

                for (const setor of setores) {
                    if (!setor.parentId || !tempPosMap.has(setor.parentId)) continue;

                    const parent = tempPosMap.get(setor.parentId);
                    // Validar apenas se ambos tem posição numérica válida
                    if (typeof setor.position?.y !== 'number' || typeof parent.position?.y !== 'number') continue;

                    const hChild = parseFloat(setor.hierarquia || 0);
                    const hParent = parseFloat(parent.hierarquia || 0);

                    // Checar apenas espinha dorsal (h>0) e ignorar assessorias
                    if (hChild > 0 && hParent > 0 && !(setor.isAssessoria || parent.isAssessoria)) {
                        const levelDiff = hChild - hParent;
                        if (levelDiff > 0) {
                            // Gap base esperado: 90px * diff (Conservador)
                            const minExpectedDelta = levelDiff * 90;
                            const actualDelta = setor.position.y - parent.position.y;

                            if (actualDelta < minExpectedDelta) {
                                console.warn(`[Layout Fix] Inconsistência Geométrica: ${setor.nomeSetor} (L${hChild}) muito perto de ${parent.nomeSetor} (L${hParent}). Delta: ${actualDelta}, Min: ${minExpectedDelta}`);
                                hasGeometricInconsistency = true;
                                break;
                            }
                        }
                    }
                }
            }

            console.log(`[OrganogramaCanvas] Validação de Layout: InvalidNodes=${hasInvalidNodes}, UniqueY=${uniqueYValues.size}, HasHierarchy=${hasHierarchy}, GeomInconsistent=${hasGeometricInconsistency}`);

            if (hasInvalidNodes || (positionsWithY.length > 2 && !hasHierarchy) || hasGeometricInconsistency) {
                console.warn('[OrganogramaCanvas] 🚨 LAYOUT CORROMPIDO OU INCOMPLETO DETECTADO! 🚨');
                console.warn('Motivo:', hasInvalidNodes ? 'Nós com coordenadas NaN/Inválidas' : 'Layout plano/sem hierarquia');

                // Forçar recálculo total do layout
                console.log('[OrganogramaCanvas] Aplicando Auto-Layout de Emergência...');
                setores = applyAutoLayout(setores);

                // Marcar para salvar imediatamente e corrigir o banco de dados
                setores.forEach(s => s._wasAutoLayouted = true);
            } else {
                console.log('[OrganogramaCanvas] Layout validado com sucesso. Mantendo posições originais.');
            }

            // [ROBUST FIX] Pré-cálculo de ForkY baseado na posição REAL dos filhos (Anti-Snapback)
            // Isso garante que a linha horizontal fique na altura correta mesmo após recarregar do DB
            const parentMinChildY = new Map();
            setores.forEach(item => {
                const pId = item.parentId || item.originalParentId;
                if (!pId) return;

                // Detecção de "Filho Regular" (que demanda a linha vertical principal)
                const nomeLower = (item.nomeSetor || '').toLowerCase();
                const isChefia = nomeLower.includes('superintend') ||
                    nomeLower.includes('diretoria') ||
                    nomeLower.includes('subsecretari');

                const isAss = !isChefia && (
                    item.isAssessoria ||
                    (item.hierarquia === '0' || item.hierarquia === 0) ||
                    nomeLower.includes('assessoria') ||
                    (item.tipoSetor || '').toLowerCase().includes('assessoria')
                );

                // Se NÃO é assessoria e nem filho de assessoria, contribui para o cálculo do fork
                if (!isAss && !item._isNested) {
                    const currentMin = parentMinChildY.get(pId) || Infinity;
                    const itemY = item.position?.y || Infinity;
                    // Ignorar 0 ou números inválidos
                    if (itemY > 0 && itemY < currentMin) {
                        parentMinChildY.set(pId, itemY);
                    }
                }
            });

            // Mapa de Posições para Auto-Cura Y (Garantir horizontalidade independente da ordem dos nós)
            const positionMap = new Map();
            setores.forEach(s => {
                if (s.position) positionMap.set(s.id, s.position);
            });

            // Primeiro, mapear todos os setores
            setores.forEach((setor) => {
                setorMap.set(setor.id, setor);
            });

            setores.forEach((setor) => {
                // Preservar estilo customizado se existir no objeto setor
                // Prioridade: style (novo) > customStyle (legado)
                const savedStyle = setor.style || setor.customStyle || {};

                // Detecção robusta para Assessoria/Gabinete (Mapeamento Visual)
                // Normalizar hierarquia para número
                const hirarqNum = typeof setor.hierarquia === 'string' ? parseFloat(setor.hierarquia) : (setor.hierarquia || 0);

                // [FORCE FIX VISUAL] Superintendência/Diretoria/Subsecretaria NUNCA é assessoria lateral
                // Isso previne linhas laterais quando o layout é vertical
                const nomeLower = (setor.nomeSetor || setor.nomeCargo || '').toLowerCase();
                const isChefiaForcada = nomeLower.includes('superintend') ||
                    nomeLower.includes('diret') ||
                    nomeLower.includes('subsecretari') ||
                    nomeLower.includes('secretari') ||
                    nomeLower.includes('gerencia') ||
                    nomeLower.includes('coordena');

                const isAssessoriaNode = !isChefiaForcada && (
                    setor.isAssessoria || hirarqNum === 0
                );

                if ((setor.nomeSetor || '').toLowerCase().includes('gabinete') ||
                    (setor.nomeSetor || '').toLowerCase().includes('consultoria')) {
                    console.log(`[DEBUG STRUC] Setor: ${setor.nomeSetor}`, {
                        id: setor.id,
                        isAssessoriaProp: setor.isAssessoria,
                        hirarqNum,
                        x: setor.position?.x,
                        parentId: setor.parentId,
                        RESULT_isAssessoriaNode: isAssessoriaNode
                    });
                }

                // Helper para detectar lado (Left/Right)
                const parentPos = setorMap.get(setor.parentId)?.position || { x: 0 };
                const isLeftAssessoria = setor._side === 'left' ||
                    (setor.position && setor.position.x < parentPos.x && isAssessoriaNode);

                // Lógica de Conexão Vertical para Assessorias de Nível Profundo (>=3)
                const parent = setorMap.get(setor.parentId);
                const parentLevel = parent ? parseInt(parent.hierarquia || 0) : 0;

                // CORREÇÃO (18/01/2026): Detectar se o PAI é uma assessoria.
                // Se o pai for assessoria, este nó (mesmo sendo assessoria) deve se comportar como filho vertical.
                const isParentAssessoria = parent && (
                    parent.isAssessoria ||
                    parent.data?.isAssessoria || // Se parent vier do nó ReactFlow
                    parseFloat(parent.hierarquia) === 0 ||
                    parseFloat(parent.hierarquia) === 0.5 // CORREÇÃO: Subprefeituras (0.5) também devem ter filhos verticais
                );

                // Se for assessoria, mas o pai é nível 3+ OU o pai já é uma assessoria -> Vertical
                // CORREÇÃO (18/01/2026): Prioridade total para isParentAssessoria.
                // Se o pai é Subprefeitura (isParentAssessoria=true), forçamos vertical, independente se o filho é considerado assessoria ou não.
                const isVerticalAssessoria = isParentAssessoria || (isAssessoriaNode && parentLevel >= 3);

                // Definir Posição dos Handles
                let sourcePos, targetPos;
                if (isVerticalAssessoria) {
                    // Vertical: Recebe por cima, sai por baixo
                    sourcePos = Position.Bottom;
                    targetPos = Position.Top;
                } else if (isLeftAssessoria) {
                    sourcePos = Position.Left;
                    targetPos = Position.Right;
                } else if (isAssessoriaNode) {
                    sourcePos = Position.Right;
                    targetPos = Position.Left;
                } else {
                    sourcePos = Position.Bottom;
                    targetPos = Position.Top;
                }

                nodes.push({
                    id: setor.id,
                    type: 'setorNode',
                    style: savedStyle, // Adicionar no nível raiz para persistência no React Flow
                    // Sanitização: Fallback para 0,0 se vier NaN para não quebrar ReactFlow
                    position: {
                        x: (setor.position && !isNaN(setor.position.x)) ? setor.position.x : 0,
                        y: (() => {
                            const rawY = (setor.position && !isNaN(setor.position.y)) ? setor.position.y : 0;
                            const pId = setor.parentId || setor.originalParentId;
                            const parentPos = positionMap.get(pId);

                            if (isAssessoriaNode && !isVerticalAssessoria && !setor._isNested && parentPos) {
                                if (Math.abs(rawY - parentPos.y) > 0.1) {
                                    console.warn(`[AUTO-CURA] Alinhando Y de ${setor.nomeSetor} (${rawY} -> ${parentPos.y})`);
                                }
                                return parentPos.y;
                            }
                            return rawY;
                        })()
                    },
                    data: {
                        id: setor.id, // ID para identificar o nó ao aplicar estilos
                        nomeSetor: setor.nomeSetor,
                        tipoSetor: setor.tipoSetor,
                        hierarquia: isAssessoriaNode ? 0 : (setor.hierarquia || 0), // Forçar hierarquia 0 para assessorias visuais
                        isAssessoria: isAssessoriaNode,
                        isOperacional: setor.isOperacional || !!setor.is_operacional,
                        cargos: setor.cargos,
                        style: savedStyle, // Usar 'style' for compatibilidade backend
                        customStyle: savedStyle, // Manter fallback
                        onStyleChange: onStyleChange, // Passar callback estável
                        onEditClick: onEditClick, // Passar callback estável
                        handleY: 45, // [PADRÃO UNIFICADO] 45px do topo em todos os nós
                        _wasAutoLayouted: setor._wasAutoLayouted, // Flag para disparar auto-save
                        parentId: setor.parentId || setor.originalParentId, // Busca ID do pai
                        editable: editable // Passar estad
                        // o de edição para o nó
                    },
                    // Definir handles (pontos de conexão) baseado no tipo e lado
                    sourcePosition: sourcePos,
                    targetPosition: targetPos,
                    isAssessoria: isAssessoriaNode,
                    _isLeft: isLeftAssessoria,
                    _isNested: setor._isNested // Passar flag de nested
                });

                // Criar edge se tiver pai
                const pId = setor.parentId || setor.originalParentId;
                if (pId) {
                    // Detecção robusta para definir estilo da edge
                    const isAssessoriaEdge = isAssessoriaNode; // Simplificado pois já calculamos isAssessoriaNode antes
                    const isNestedEdge = setor._isNested; // Nova flag

                    // Lógica de Handles baseada no lado
                    let sourceHandle, targetHandle;
                    let edgeType = 'customEdge'; // Default

                    if (isVerticalAssessoria) {
                        sourceHandle = 'bottom';
                        targetHandle = 'top';
                        edgeType = 'customEdge';
                        /* console.log(`[EDGE DECISION] ${setor.nomeSetor} -> VERTICAL ASSESSORIA`); */
                    } else if (isNestedEdge) {
                        // FILHOS DE ASSESSORIA: Sempre vertical (L shape)
                        sourceHandle = 'bottom';
                        targetHandle = 'top';
                        edgeType = 'customEdge';
                        /* console.log(`[EDGE DECISION] ${setor.nomeSetor} -> NESTED`); */
                    } else if (isLeftAssessoria) {
                        // ASSESSORIA DA ESQUERDA CONECTANDO AO PAI CENTRAL: Lateral
                        sourceHandle = 'left-source';
                        targetHandle = 'right-target';
                        edgeType = 'straight';
                        /* console.log(`[EDGE DECISION] ${setor.nomeSetor} -> LEFT ASSESSORIA`); */
                    } else if (isAssessoriaEdge) {
                        // ASSESSORIA DA DIREITA CONECTANDO AO PAI CENTRAL: Lateral
                        sourceHandle = 'right';
                        targetHandle = 'left';
                        edgeType = 'straight';
                        /* console.log(`[EDGE DECISION] ${setor.nomeSetor} -> RIGHT ASSESSORIA`); */
                    } else {
                        sourceHandle = 'bottom';
                        targetHandle = 'top';
                        edgeType = 'customEdge';
                        if (isAssessoriaNode) {
                            console.warn(`[EDGE DECISION WARNING] ${setor.nomeSetor} é Assessoria mas caiu no Default Vertical!`, {
                                isVerticalAssessoria,
                                isNestedEdge,
                                isLeftAssessoria,
                                isAssessoriaEdge
                            });
                        }
                    }

                    edges.push({
                        id: `e-${setor.parentId}-${setor.id}`,
                        source: setor.parentId,
                        target: setor.id,
                        type: edgeType,
                        sourceHandle: sourceHandle,
                        targetHandle: targetHandle,
                        pathOptions: { borderRadius: 0 }, // Linhas ortogonais quadradas
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#9e9e9e',
                        },
                        style: { stroke: '#9e9e9e', strokeWidth: 2 },
                        data: {
                            // [ROBUST FIX] Usar o cálculo baseado na posição real dos filhos
                            // Subtraímos 60px (Margin) para a linha ficar acima dos filhos
                            customForkY: parentMinChildY.has(setor.parentId || setor.originalParentId)
                                ? (parentMinChildY.get(setor.parentId || setor.originalParentId) - 60)
                                : undefined
                        }
                    });
                }
            });
        }

        const flattenCargos = (cargosHierarquicos) => {
            const result = [];
            const processedIds = new Set();

            const flattenCargo = (cargo) => {
                if (!cargo || !cargo.id || processedIds.has(cargo.id)) return;
                processedIds.add(cargo.id);

                const { children, ...cargoSemChildren } = cargo;
                result.push(cargoSemChildren);

                if (children && children.length > 0) {
                    children.forEach(child => flattenCargo(child));
                }
            };

            cargosHierarquicos.forEach(cargo => flattenCargo(cargo));
            return result;
        };

        // [LOOKUP DINÂMICO] Mapa de Setores Estruturais para resolver nomes (id -> nome)
        const setorLookupMap = new Map();
        const setoresParaLookup = organogramaData.setores || organogramaData.organogramaEstrutural?.setores || [];

        if (setoresParaLookup.length > 0) {
            // Reutilizar a função flattenSetores que acabamos de definir acima
            const flatSetores = flattenSetores(setoresParaLookup);
            flatSetores.forEach(s => {
                setorLookupMap.set(s.id, s.nomeSetor || s.nome);
            });
            console.log(`[OrganogramaCanvas] Lookup Map Size: ${setorLookupMap.size}`, Object.fromEntries(setorLookupMap));
        } else {
            console.warn('[OrganogramaCanvas] AVISO: Lista de setores para lookup vazia! Verifique se "organogramaData.setores" ou "organogramaData.organogramaEstrutural.setores" estão populados.', organogramaData);
        }

        // Processar organogramas de funções
        if (organogramaData.organogramasFuncoes && organogramaData.organogramasFuncoes.length > 0) {
            organogramaData.organogramasFuncoes.forEach((orgFunc) => {
                let cargos = flattenCargos(orgFunc.cargos || []);

                // MELHORADO: Verificar se as posições formam um layout hierárquico válido
                // (não apenas se são != 0, mas se há variação em Y indicando níveis diferentes)
                const positionsWithY = cargos.filter(c => c.position && typeof c.position.y === 'number');
                const uniqueYValues = new Set(positionsWithY.map(c => Math.round(c.position.y / 50))); // Agrupar por faixas de 50px
                const hasValidHierarchicalLayout = positionsWithY.length > 1 && uniqueYValues.size > 1;

                console.log(`[OrganogramaCanvas] Funcional: ${positionsWithY.length} nós com posição, ${uniqueYValues.size} níveis Y únicos, válido=${hasValidHierarchicalLayout}`);

                if (!hasValidHierarchicalLayout) {
                    console.log('[OrganogramaCanvas] Funcional: Layout inválido detectado. Aplicando auto-layout.');
                    cargos = applyAutoLayout(cargos);
                    // Flag para persistir se houver auto-layout
                    cargos.forEach(c => c._wasAutoLayouted = true);
                }

                // Mapa de Cargos para busca de Pai
                const cargoMap = new Map();
                const positionMapFunc = new Map();
                cargos.forEach((c, idx) => {
                    if (idx === 0) console.log('[DEBUG CANVAS] Primeiro Cargo Raw:', c);
                    cargoMap.set(c.id, c);
                    if (c.position) positionMapFunc.set(c.id, c.position);
                });

                // [ROBUST FIX] Pré-cálculo de ForkY baseado na posição REAL dos filhos (Anti-Snapback)
                const parentMinChildYFunc = new Map();
                cargos.forEach(item => {
                    const pId = item.parentId;
                    if (!pId) return;

                    const hirarq = typeof item.hierarquia === 'string' ? parseFloat(item.hierarquia) : (item.hierarquia || 0);
                    const isAss = hirarq === 0 || item.isAssessoria;

                    if (!isAss && !item._isNested) {
                        const currentMin = parentMinChildYFunc.get(pId) || Infinity;
                        const itemY = item.position?.y || Infinity;
                        // Ignorar 0 ou números inválidos
                        if (itemY > 0 && itemY < currentMin) {
                            parentMinChildYFunc.set(pId, itemY);
                        }
                    }
                });

                cargos.forEach(cargo => {
                    // Preservar estilo customizado se existir
                    const savedStyle = cargo.style || cargo.customStyle || {};

                    // Normalizar hierarquia para número (suporta "0", 0, "0.0")
                    const hirarqNum = typeof cargo.hierarquia === 'string' ? parseFloat(cargo.hierarquia) : (cargo.hierarquia || 0);
                    // Detectar assessoria: flag isAssessoria, hierarquia 0, ou palavras-chave
                    const nameLower = (cargo.nomeCargo || '').toLowerCase();
                    const typeLower = (cargo.tipoSetor || '').toLowerCase();

                    const isAssessoriaNode = cargo.isAssessoria || hirarqNum === 0;

                    if (nameLower.includes('gabinete') || nameLower.includes('consultoria')) {
                        console.log(`[DEBUG EDGE] Cargo: ${cargo.nomeCargo}`, {
                            isAssessoria: cargo.isAssessoria,
                            hirarqNum,
                            nameLower,
                            typeLower,
                            RESULT_isAssessoriaNode: isAssessoriaNode
                        });
                    }

                    // Lógica Vertical para Cargos Assessorias Profundos
                    const parent = cargoMap.get(cargo.parentId);
                    const parentLevel = parent ? parseFloat(parent.hierarquia || parent.nivel || 0) : 0;
                    // Se for assessoria, mas o pai é nível 3+ (ex: Subsecretaria), comporta-se como vertical
                    const isVerticalAssessoria = isAssessoriaNode && parentLevel >= 3;

                    // Determinar lado baseado na posição X relativa ao pai (persistida no banco) OU _side do auto-layout
                    const parentX = parent?.position?.x || 0;
                    const cargoX = cargo.position?.x || 0;
                    // CORREÇÃO: Priorizar _side se existir, pois é a decisão fresca do layout
                    const isLeftAssessoria = cargo._side === 'left' || (isAssessoriaNode && cargoX < parentX);
                    const isRightAssessoria = isAssessoriaNode && !isLeftAssessoria; // Se é assessoria e não é left, é right

                    let sourcePos, targetPos;
                    if (isVerticalAssessoria) {
                        sourcePos = Position.Bottom;
                        targetPos = Position.Top;
                    } else if (isLeftAssessoria) {
                        sourcePos = Position.Left;
                        targetPos = Position.Right;
                    } else if (isAssessoriaNode) {
                        sourcePos = Position.Right;
                        targetPos = Position.Left;
                    } else {
                        sourcePos = Position.Bottom;
                        targetPos = Position.Top;
                    }

                    nodes.push({
                        id: cargo.id,
                        type: 'setorNode',
                        style: savedStyle, // Adicionar no nível raiz para persistência no React Flow
                        // Sanitização: Se NaN escapar, fallback para 0,0 para não quebrar renderer
                        position: {
                            x: (cargo.position && !isNaN(cargo.position.x)) ? cargo.position.x : 0,
                            y: (() => {
                                const rawY = (cargo.position && !isNaN(cargo.position.y)) ? cargo.position.y : 0;
                                // [AUTO-CURA FEVEREIRO/2026] Corrigir dados legados do banco
                                // Se for uma assessoria lateral (não vertical e não nested), 
                                // ela DEVE ter o mesmo Y do pai para a linha ser 100% reta.
                                const parentPos = positionMapFunc.get(cargo.parentId);
                                if (isAssessoriaNode && !isVerticalAssessoria && !cargo._isNested && parentPos) {
                                    return parentPos.y;
                                }
                                return rawY;
                            })()
                        },
                        data: {
                            id: cargo.id, // ID para identificar o nó ao aplicar estilos
                            nomeCargo: cargo.nomeCargo,
                            ocupante: cargo.ocupante,
                            hierarquia: isAssessoriaNode ? 0 : (cargo.hierarquia || cargo.nivel || 0),
                            nivel: isAssessoriaNode ? 0 : (cargo.nivel || cargo.hierarquia || 0),
                            tipoSetor: cargo.tipoSetor, // Preservar se vier do backend
                            isAssessoria: isAssessoriaNode,
                            isOperacional: cargo.isOperacional || !!cargo.is_operacional, // [SYNC] Persistir propriedade Operacional
                            nomeSetorRef: (() => {
                                // 1. Tentar obter direto do objeto cargo (Prevalência Backend JOIN)
                                const direct = cargo.nome_setor_ref || cargo.nomeSetorRef;

                                // DEBUG: Verificar dados crus
                                // console.log(`[DEBUG CANVAS] Cargo: ${cargo.nomeCargo} | RefID: ${cargo.setor_ref || cargo.setorRef} | DirectName: ${direct}`);

                                if (direct) return direct;

                                // 2. Se falhar, tentar Lookup pelo ID
                                const refId = cargo.setor_ref || cargo.setorRef;
                                if (!refId) return null;

                                let lookedUp = setorLookupMap.get(refId);

                                // 3. Se falhar no Map, tentar busca direta no array (Fallback de segurança)
                                if (!lookedUp && setoresParaLookup.length > 0) {
                                    const found = setoresParaLookup.find(s => s.id === refId);
                                    if (found) {
                                        lookedUp = found.nomeSetor || found.nome;
                                        console.log(`[CANVAS RECOVERY] Setor encontrado via busca linear: ${lookedUp}`);
                                    }
                                }

                                // 4. Fallback Automático por Nome (Heurística)
                                // Ex: Cargo "Diretor de Ouvidoria Geral" -> Setor "Ouvidoria Geral"
                                if (!lookedUp && setorLookupMap.size > 0) {
                                    const cargoNameNormalized = (cargo.nomeCargo || '').toLowerCase();

                                    // Converter mapa array e ordenar por comprimento do nome (decrescente)
                                    const candidates = Array.from(setorLookupMap.entries())
                                        .map(([id, nome]) => ({ id, nome: String(nome) }))
                                        .filter(c => c.nome.length > 3)
                                        .sort((a, b) => b.nome.length - a.nome.length);

                                    for (const candidate of candidates) {
                                        const sNomeNorm = candidate.nome.toLowerCase();
                                        if (cargoNameNormalized.includes(sNomeNorm)) {
                                            lookedUp = candidate.nome;
                                            console.log(`[AUTO-LINK] Match por nome: ${cargo.nomeCargo} -> ${candidate.nome}`);
                                            break;
                                        }
                                    }
                                }

                                if (refId && !lookedUp) {
                                    console.warn(`[DEBUG FAIL] Lookup FALHOU para ${cargo.nomeCargo}. ID: ${refId}. Setores Disp: ${setorLookupMap.size}`);
                                }

                                return lookedUp;
                            })(),
                            setorRef: cargo.setor_ref || cargo.setorRef, // Mapear ambos os casos
                            simbolos: cargo.simbolos,
                            simbolo: cargo.simbolo, // Preservar para cargos agrupados
                            quantidade: cargo.quantidade,
                            style: savedStyle,
                            customStyle: savedStyle,
                            onStyleChange: onStyleChange, // Passar callback estável
                            onEditClick: onEditClick, // Passar callback estável
                            _wasAutoLayouted: cargo._wasAutoLayouted,
                            handleY: 45, // [PADRÃO UNIFICADO] 45px do topo em todos os nós
                            parentId: cargo.parentId,
                            editable: editable // Passar estado de edição para o nó
                        },
                        // Sincronizar Positions com Handles do SetorNode
                        sourcePosition: sourcePos,
                        targetPosition: targetPos,
                        // Adicionar flag isAssessoria na raiz do nó para fácil acesso no Canvas
                        isAssessoria: isAssessoriaNode,
                        _isLeft: isLeftAssessoria,
                        _isNested: cargo._isNested // Passar flag de nested
                    });

                    // Criar edge se tiver pai
                    if (cargo.parentId) {
                        // Lógica de Handles baseada no lado
                        let sourceHandle, targetHandle;
                        let edgeType;

                        if (isVerticalAssessoria) {
                            sourceHandle = 'bottom';
                            targetHandle = 'top';
                            edgeType = 'customEdge';
                        } else if (cargo._isNested) {
                            // FILHOS DE ASSESSORIA: Sempre vertical (L shape)
                            sourceHandle = 'bottom';
                            targetHandle = 'top';
                            edgeType = 'customEdge';
                        } else if (isLeftAssessoria) {
                            sourceHandle = 'left-source';
                            targetHandle = 'right-target';
                            edgeType = 'straight';
                        } else if (isAssessoriaNode) {
                            sourceHandle = 'right';
                            targetHandle = 'left';
                            edgeType = 'straight';
                        } else {
                            sourceHandle = 'bottom';
                            targetHandle = 'top';
                            edgeType = 'customEdge';
                        }

                        edges.push({
                            id: `e-${cargo.parentId}-${cargo.id}`,
                            source: cargo.parentId,
                            target: cargo.id,
                            type: edgeType,
                            sourceHandle: sourceHandle,
                            targetHandle: targetHandle,
                            pathOptions: { borderRadius: 0 }, // Garantir linhas quadradas
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#9e9e9e', // Cor neutra para combinar com preview
                            },
                            style: { stroke: '#9e9e9e', strokeWidth: 2 },
                            data: {
                                customForkY: parentMinChildYFunc.has(cargo.parentId)
                                    ? (parentMinChildYFunc.get(cargo.parentId) - 60)
                                    : undefined
                            }
                        });
                    }
                });
            });
        }

        // Remover edges duplicadas pelo ID
        const uniqueEdges = edges.filter((edge, index, self) =>
            index === self.findIndex(e => e.id === edge.id)
        );

        return { nodes, edges: uniqueEdges };
    }, [organogramaData, onStyleChange, onEditClick]);

    // Efeito para sincronizar nós iniciais prevenindo perda de estado de UI (Transiência)
    useEffect(() => {
        if (initialNodes.length > 0) {
            setNodes((currentNodes) => {
                // Se for a primeira carga ou reset completo
                if (currentNodes.length === 0) return initialNodes;

                // Caso contrário, mesclar preservando estados de UI (selected, position se mudou manual, isEditing)
                return initialNodes.map(newNode => {
                    const currentNode = currentNodes.find(n => n.id === newNode.id);
                    if (!currentNode) return newNode;

                    // Lógica Crítica: Se o usuário estiver editando o estilo agora, não sobrescrever com o estilo vindo do "initialNodes"
                    // (que pode ser um dado antigo recém-confirmado pelo backend após auto-save anterior)
                    const isBeingEdited = currentNode.data.isEditing;
                    const hasLocalStyle = (currentNode.style && Object.keys(currentNode.style).length > 0) || (currentNode.data.customStyle && Object.keys(currentNode.data.customStyle).length > 0);
                    const hasIncomingStyle = (newNode.style && Object.keys(newNode.style).length > 0) || (newNode.data.customStyle && Object.keys(newNode.data.customStyle).length > 0);

                    // Priorizar o estilo local se:
                    // 1. Está sendo editado agora
                    // 2. Temos estilo local mas o que veio das props está vazio (evita piscar azul ao confirmar no banco)
                    const shouldKeepLocalStyle = isBeingEdited || (hasLocalStyle && !hasIncomingStyle);

                    return {
                        ...newNode,
                        // Se estiver sendo editado ou selecionado, preferir o estilo que já está na tela
                        style: shouldKeepLocalStyle ? (currentNode.style || currentNode.data.customStyle || newNode.style) : newNode.style,
                        // Preservar estado de seleção e arrasto do React Flow
                        selected: currentNode.selected,
                        dragging: currentNode.dragging,
                        // Preservar data.isEditing e callbacks (evita fechar cor ao salvar)
                        data: {
                            ...newNode.data,
                            // Mesclar customStyle se houver, preferindo o local se necessário
                            customStyle: shouldKeepLocalStyle ? (currentNode.data.customStyle || currentNode.style || newNode.data.style || newNode.data.customStyle) : (newNode.data.customStyle || currentNode.data.customStyle),
                            isEditing: isBeingEdited,
                            // USAR CALLBACKS FRESCOS: Sempre usar os callbacks do newNode (que vem do useMemo atualizado)
                            // Evita Stale Closures onde o callback antigo referenciava variaveis antigas via closure
                            onEditClick: newNode.data.onEditClick,
                            onStyleChange: newNode.data.onStyleChange
                        }
                    };
                });
            });
            setEdges(initialEdges);
        }
    }, [initialNodes, initialEdges]);

    // Efeito para injetar callbacks e estado de edição nos nós reativamente
    // IMPORTANTE: Incluímos nodes.length para garantir que rode após os nós serem carregados
    useEffect(() => {
        console.log('🔄 [useEffect] Injetando callbacks. activeEditorId =', activeEditorId, '| nodes.length =', nodes.length);
        if (nodes.length === 0) {
            console.log('   -> Pulando injeção: nenhum nó carregado ainda');
            return;
        }
        setNodes(nds => nds.map(n => {
            const isEditing = n.id === activeEditorId;
            // Só atualiza se houver mudança real (performance)
            if (n.data.isEditing !== isEditing || n.data.onEditClick !== onEditClick || n.data.onStyleChange !== onStyleChange) {
                console.log(`   -> Atualizando nó ${n.id}: isEditing=${isEditing}`);
                return {
                    ...n,
                    data: {
                        ...n.data,
                        isEditing,
                        onEditClick,
                        onStyleChange
                    }
                };
            }
            return n;
        }));
    }, [activeEditorId, onEditClick, onStyleChange, nodes.length]);

    // Função para salvar automaticamente (Definida antes dos hooks para evitar ReferenceError)
    const autoSave = useCallback(() => {
        if (!onSavePositions) return;

        const updatedData = nodes.map(node => {
            const baseData = {
                id: node.id,
                position: node.position,
                customStyle: node.data.style || node.data.customStyle,
                hierarquia: node.data.hierarquia,
                isAssessoria: node.data.isAssessoria,
                parentId: node.data.parentId
            };

            // Se for nó de setor (estrutural)
            if (node.data.nomeSetor) {
                return {
                    ...baseData,
                    nomeSetor: node.data.nomeSetor,
                    tipoSetor: node.data.tipoSetor,
                    cargos: node.data.cargos || []
                };
            }

            // Se for nó de cargo (funcional)
            return {
                ...baseData,
                nomeCargo: node.data.nomeCargo,
                ocupante: node.data.ocupante,
                simbolos: node.data.simbolos,
                simbolo: node.data.simbolo, // Enviar de volta para o backend
                isOperacional: node.data.isOperacional, // [SYNC] Enviar flag de Operacional
                quantidade: node.data.quantidade,
                // [FIX] Buscar setorRef de TODAS as fontes possíveis para evitar perda de dados
                setorRef: node.data.setorRef || node.data.setor_ref || (node as any).setorRef || (node as any).setor_ref,
                nomeSetorRef: node.data.nomeSetorRef || node.data.nome_setor_ref
            };
        });

        console.log('[AutoSave] Salvando automaticamente:', updatedData.length, 'nós');
        onSavePositions(updatedData);
    }, [nodes, onSavePositions]);


    // NOVO: Forçar auto-save após layout inicial ser aplicado para garantir persistência
    // Este efeito garante que posições calculadas pelo auto-layout sejam salvas no primeiro carregamento
    const hasTriggeredInitialSaveRef = React.useRef(false);
    React.useEffect(() => {
        // Verificar se algum nó foi auto-layouted e ainda não persistimos
        const hasAutoLayoutedNodes = initialNodes.some(n => n.data?._wasAutoLayouted);

        if (hasAutoLayoutedNodes && !hasTriggeredInitialSaveRef.current && onSavePositions) {
            hasTriggeredInitialSaveRef.current = true;
            console.log('[OrganogramaCanvas] Layout inicial detectado. Forçando auto-save em 500ms...');

            // Delay para garantir que o estado React Flow esteja completamente sincronizado
            setTimeout(() => {
                console.log('[OrganogramaCanvas] Executando auto-save do layout inicial');
                window.__needsAutoSave = true;
            }, 500);
        }
    }, [initialNodes, onSavePositions]);

    // Notificar pai sobre mudanças nos dados (para impressão/exportação)
    React.useEffect(() => {
        if (onDataChange) {
            onDataChange({ nodes, edges });
        }
    }, [nodes, edges, onDataChange]);

    // Monitorar flag de auto-save para salvar cores automaticamente
    React.useEffect(() => {
        // Se houver algum nó que foi auto-layouted e ainda não foi persistido
        const hasUnsavedLayout = nodes.some(n => n.data._wasAutoLayouted);

        if ((window.__needsAutoSave || hasUnsavedLayout) && onSavePositions) {
            console.log('[OrganogramaCanvas] Iniciando auto-save (Layout ou Cores)');
            window.__needsAutoSave = false;
            autoSave();

            // Limpar a flag _wasAutoLayouted dos nós para evitar loop
            if (hasUnsavedLayout) {
                setNodes(nds => nds.map(n => ({
                    ...n,
                    data: { ...n.data, _wasAutoLayouted: false }
                })));
            }
        }
    }, [nodes, onSavePositions, autoSave, setNodes]);


    // Detectar mudanças de posição ao arrastar nós - SALVAR AUTOMATICAMENTE
    const handleNodeDragStop = useCallback((event, node, nodes) => {
        // Se houver multi-seleção e arrasto em grupo, 'nodes' conterá todos os arrastados?
        // O ReactFlow 11 suporta multi-drag nativamente.
        // O 'node' é o nó que parou de ser arrastado.
        // Podemos simplesmente chamar o autoSave que varre TODOS os nodes do state 'nodes'.
        setTimeout(() => autoSave(), 100);
    }, [autoSave]);

    // Resetar para layout automático (recalculado)
    const handleResetLayout = useCallback(() => {
        let itemsToLayout = [];

        // 1. Identificar dados e resetar posições/estilos
        // 1. Identificar dados e resetar posições/estilos
        // [FIX CRÍTICO 03/02/2026] Usar o estado ATUAL dos nós ('nodes') como fonte da verdade.
        // Isso preserva edições recentes (nomes, referências de setor, etc.) que ainda não foram salvas/recarregadas no 'organogramaData'.
        // O 'organogramaData' é obsoleto assim que o usuário faz uma edição.
        if (nodes && nodes.length > 0) {
            console.log('[Reset] Usando estado atual dos nós para preservar edições:', nodes.length);

            itemsToLayout = nodes.map(node => ({
                ...node.data, // [ROBUST FIX] Preservar TODO o objeto data (nomes, cargos, refs, etc.)
                id: node.id,
                // Resetar apenas o que deve ser recalculado
                position: { x: 0, y: 0 },
                style: {},
                customStyle: {}
            }));

        } else if (organogramaData?.organogramaEstrutural) {
            // Fallback para dados iniciais se não houver nós
            const flattenHelper = (items, result = []) => {
                items.forEach(item => {
                    const { children, ...rest } = item;
                    result.push({
                        ...rest,
                        position: { x: 0, y: 0 },
                        style: {},
                        customStyle: {},
                        editable: editable
                    });
                    if (children && children.length) flattenHelper(children, result);
                });
                return result;
            };
            itemsToLayout = flattenHelper(organogramaData.organogramaEstrutural.setores || []);
        } else if (organogramaData?.organogramasFuncoes && organogramaData.organogramasFuncoes.length > 0) {
            const flattenHelper = (items, result = []) => {
                items.forEach(item => {
                    const { children, ...rest } = item;
                    result.push({
                        ...rest,
                        position: { x: 0, y: 0 },
                        style: {},
                        customStyle: {},
                        editable: editable
                    });
                    if (children && children.length) flattenHelper(children, result);
                });
                return result;
            };

            itemsToLayout = organogramaData.organogramasFuncoes.flatMap(org =>
                flattenHelper(org.cargos || [])
            );
        }

        if (itemsToLayout.length === 0) return;

        // 2. Remover duplicatas E Ajustar Hierarquia Operacional (Frontend Simulation)
        const uniqueItems = [];
        const seen = new Set();
        const itemMapForHierarchy = new Map();

        // Primeira passada: Dedup e Indexar
        itemsToLayout.forEach(item => {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                // Clonar para não mutar estado original inadvertidamente
                const clone = { ...item };
                uniqueItems.push(clone);
                itemMapForHierarchy.set(clone.id, clone);
            }
        });

        // Segunda passada: Ajustar Hierarquia Operacional
        // Regra: Se é operacional, deve ter nível > pai (para ficar abaixo visualmente)
        uniqueItems.forEach(item => {
            if (item.isOperacional && item.parentId) {
                const parent = itemMapForHierarchy.get(item.parentId);
                if (parent) {
                    const parentH = parseFloat(parent.hierarquia || 0);
                    const myH = parseFloat(item.hierarquia || 0);

                    // Se hierarquia for igual ou menor que o pai, força descer um nível
                    // Isso simula a lógica do backend 'recalculateHierarchy'
                    if (myH <= parentH) {
                        item.hierarquia = String(Math.floor(parentH) + 1);
                        console.log(`[Reset] Ajustando hierarquia Operacional: ${item.nomeCargo} (${myH} -> ${item.hierarquia})`);
                    }
                }
            }
        });

        // 3. Aplicar Auto Layout
        const itemsLayouted = applyAutoLayout(uniqueItems);

        // Mapa para Reset Layout
        const itemMap = new Map();
        itemsLayouted.forEach(item => itemMap.set(item.id, item));

        // 4. Converter para Nodes do React Flow (idêntico ao mapeamento inicial)
        const newNodes = itemsLayouted.map((item: any) => {
            // Detecção robusta para Assessoria/Gabinete (Mapeamento Visual) - Reset Layout
            // [FORCE FIX VISUAL REPLICADO] Superintendência/Diretoria/Subsecretaria NUNCA é assessoria lateral
            const nomeLower = (item.nomeSetor || item.nomeCargo || '').toLowerCase();
            const isChefiaForcada = nomeLower.includes('superintend') ||
                nomeLower.includes('diret') ||
                nomeLower.includes('subsecretari') ||
                nomeLower.includes('secretari') ||
                nomeLower.includes('gerencia') ||
                nomeLower.includes('coordena');

            const isAssessoriaNode = !isChefiaForcada && (
                item.isAssessoria ||
                (typeof item.hierarquia === 'string' ? parseFloat(item.hierarquia) : item.hierarquia) === 0 ||
                nomeLower.includes('assessoria') ||
                (item.tipoSetor || '').toLowerCase().includes('assessoria') ||
                nomeLower.includes('assessor')
            );

            // Helper para detectar lado (Left/Right) - Baseado no _side que vem do layoutHelpers
            const isLeftAssessoria = item._side === 'left' ||
                (!isChefiaForcada && (
                    (item.nomeSetor || '').toLowerCase().includes('consultoria') ||
                    (item.nomeCargo || '').toLowerCase().includes('consultoria') ||
                    (item.tipoSetor || '').toLowerCase().includes('consultoria')
                ));

            // Lógica de Conexão Vertical para Assessorias de Nível Profundo (Reset Layout)
            const parent = itemMap.get(item.parentId);
            const parentLevel = parent ? parseInt(parent.hierarquia || parent.nivel || 0) : 0;
            const isVerticalAssessoria = isAssessoriaNode && parentLevel >= 3;

            let sourcePos, targetPos;
            if (isVerticalAssessoria) {
                sourcePos = Position.Bottom;
                targetPos = Position.Top;
            } else if (isLeftAssessoria) {
                sourcePos = Position.Left;
                targetPos = Position.Right;
            } else if (isAssessoriaNode) {
                sourcePos = Position.Right;
                targetPos = Position.Left;
            } else {
                sourcePos = Position.Bottom;
                targetPos = Position.Top;
            }

            return {
                id: item.id,
                type: 'setorNode',
                position: item.position || { x: 0, y: 0 },
                data: {
                    ...item, // [ROBUST FIX] Preservar todos os campos originais (nomeSetor, nomeCargo, ocupante, cargos, etc.)
                    id: item.id,
                    hierarquia: isAssessoriaNode ? 0 : (item.hierarquia || 0),
                    isAssessoria: isAssessoriaNode,
                    style: {},
                    customStyle: {},
                    onStyleChange: onStyleChange,
                    onEditClick: onEditClick,
                    handleY: 45,
                    editable: item.editable ?? editable,
                    _isNested: item._isNested
                },
                sourcePosition: sourcePos,
                targetPosition: targetPos,
                isAssessoria: isAssessoriaNode,
                _isLeft: isLeftAssessoria,
                _isNested: item._isNested // Passar flag de nested
            }
        });

        // 5. Atualizar Estado
        setNodes(newNodes);
        // IMPORTANTE: Precisamos Recriar as Edges no Reset, pois os Handles mudaram!
        // Antes estávamos mantendo initialEdges. Isso estava errado para mudanças de tipo.
        // Vamos recriar edges baseado nos itemsLayouted
        const newEdges = [];
        itemsLayouted.forEach((item: any) => {
            if (item.parentId) {
                // Copiar lógica de Edge - Detecção robusta de assessoria
                const hirarqNum = typeof item.hierarquia === 'string' ? parseFloat(item.hierarquia) : (item.hierarquia || 0);

                // [FORCE FIX VISUAL REPLICADO] 
                const nomeLower = (item.nomeSetor || item.nomeCargo || '').toLowerCase();
                const isChefiaForcada = nomeLower.includes('superintend') ||
                    nomeLower.includes('diret') ||
                    nomeLower.includes('subsecretari') ||
                    nomeLower.includes('secretari') ||
                    nomeLower.includes('gerencia') ||
                    nomeLower.includes('coordena');

                const isAssessoriaNode = !isChefiaForcada && (
                    item.isAssessoria || hirarqNum === 0 ||
                    nomeLower.includes('assessoria') ||
                    (item.tipoSetor || '').toLowerCase().includes('assessoria') ||
                    nomeLower.includes('assessor')
                );

                // Determinar lado baseado na posição X (persistida) ou _side (do layout)
                const parent = itemMap.get(item.parentId);
                const parentX = parent?.position?.x || 0;
                const itemX = item.position?.x || 0;
                const isLeftAssessoria = (isAssessoriaNode && itemX < parentX) || item._side === 'left';
                const isRightAssessoria = isAssessoriaNode && itemX > parentX;

                const parentLevel = parent ? parseFloat(parent.hierarquia || parent.nivel || 0) : 0;
                const isVerticalAssessoria = isAssessoriaNode && parentLevel >= 3;

                let sourceHandle, targetHandle, edgeType;

                if (isVerticalAssessoria) {
                    sourceHandle = 'bottom';
                    targetHandle = 'top';
                    edgeType = 'customEdge'; // CRÍTICO: Usar CustomEdge para fork correto
                } else if (item._isNested) {
                    // FILHOS DE ASSESSORIA: Sempre vertical (L shape)
                    sourceHandle = 'bottom';
                    targetHandle = 'top';
                    edgeType = 'customEdge'; // CRÍTICO: Usar CustomEdge para fork correto
                } else if (isLeftAssessoria) {
                    sourceHandle = 'left-source';
                    targetHandle = 'right-target';
                    edgeType = 'straight';
                } else if (isRightAssessoria || isAssessoriaNode) {
                    // Assessoria à direita (ou assessoria genérica)
                    sourceHandle = 'right';
                    targetHandle = 'left';
                    edgeType = 'straight';
                } else {
                    sourceHandle = 'bottom';
                    targetHandle = 'top';
                    edgeType = 'customEdge';
                }

                newEdges.push({
                    id: `e-${item.parentId}-${item.id}`,
                    source: item.parentId,
                    target: item.id,
                    type: edgeType,
                    sourceHandle: sourceHandle,
                    targetHandle: targetHandle,
                    pathOptions: { borderRadius: 0 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#9e9e9e' },
                    style: { stroke: '#9e9e9e', strokeWidth: 2 },
                    data: {
                        customForkY: parent?._customForkY
                    }
                });
            }
        });

        setEdges(newEdges);
        // 5.1 Centralizar viewport nos novos nós
        setTimeout(() => {
            fitView({ padding: 0.15, duration: 400, minZoom: 0.01 });
        }, 50);

        // 6. Salvar layout limpo
        setTimeout(() => {
            if (onSavePositions) {
                const resetDataItems = newNodes.map(node => ({
                    ...node.data, // [ROBUST FIX] Preservar TUDO para o banco de dados
                    id: node.id,
                    position: node.position,
                    customStyle: {}, // Resetar estilo para padrão
                    style: {}        // Resetar estilo para padrão
                }));
                console.log('[Reset] Salvando layout padrão recalculado');
                onSavePositions(resetDataItems);
            }
        }, 150);

    }, [organogramaData, nodes, onSavePositions, onStyleChange, initialEdges, setNodes, setEdges]);

    // Função para cores do MiniMap baseado na hierarquia
    const nodeColor = useCallback((node) => {
        const hierarquia = node.data.hierarquia;
        return HIERARCHY_COLORS[hierarquia] || '#e2e8f0';
    }, []);

    // Click no pane (não faz mais nada especial)
    // Click no pane (fundo): Fecha qualquer editor aberto
    const handlePaneClick = useCallback(() => {
        setActiveEditorId(null);
    }, []);

    const selectionKeyCode = 'Shift';

    return (
        <div className="organograma-canvas">
            {/* Botões fixos permanentes - sempre visíveis quando editável */}
            {editable && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px'
                }}>
                    <button
                        onClick={handleResetLayout}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Icons name="refresh" className="mr-2" /> Resetar Layout
                    </button>
                    {/* Caixa de Instrução Discreta */}
                    <div className="reset-instruction-box">
                        <Icons name="info" className="info-icon" />
                        <p>Segure "Shift + Clique e Arraste" para mover vários nós.</p>
                    </div>
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={handleNodeDragStop}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodesDraggable={editable}
                nodesConnectable={false}
                elementsSelectable={editable}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.01}
                maxZoom={4}
                selectionOnDrag={true}
                selectionKeyCode={selectionKeyCode}
                multiSelectionKeyCode={selectionKeyCode}
                panOnDrag={true} // Permitir arrastar com botão esquerdo (Shift alterna para seleção)
                panOnScroll={true}
            >
                <Background color="#aaa" gap={16} />
                <CustomControls />
                <MiniMap
                    nodeColor={nodeColor}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                />
            </ReactFlow>
        </div>
    );
};

// Wrapper com Provider para permitir uso de useReactFlow
const OrganogramaCanvas = (props) => (
    <ReactFlowProvider>
        <OrganogramaCanvasInner {...props} />
    </ReactFlowProvider>
);

export default OrganogramaCanvas;
