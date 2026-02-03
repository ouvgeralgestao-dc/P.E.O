/**
 * Formulário de Organograma de Funções
 */
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { HIERARCHY_LEVELS, HIERARCHY_COLORS } from '../../constants/hierarchyLevels';
import { CARGOS_DAS, DESCRICOES_DAS, SIMBOLOS_DAS } from '../../constants/cargosDAS'; // Importando constantes legadas
import { validateCargo } from '../../utils/validators';
import api from '../../services/api';
import './FuncoesForm.css';

const FuncoesForm = ({ data, updateData, errors, disableOrgaoSelection = false, isSandbox = false, orgaoId = null }: any) => {
    const [currentCargo, setCurrentCargo] = useState<any>({
        prefixo: '',
        complementoNome: '',
        ocupante: '',
        hierarquia: '1', // Default 1
        isAssessoria: false,
        isOperacional: false, // Novo campo
        parentId: null,
        setorRef: null,
        simbolos: []
    });
    const [currentSimbolo, setCurrentSimbolo] = useState({ tipo: '', quantidade: 1 });

    const [prefixosOptions, setPrefixosOptions] = useState<any[]>([]);
    const [setoresOptions, setSetoresOptions] = useState<any[]>([]);
    const [cargoTypes, setCargoTypes] = useState<any[]>([]);

    const cargos = data.cargos || [];
    const nomeOrgao = data.nomeOrgao || '';

    // --- LÓGICA LEGADA DE CARGOS DAS (Restaurada a pedido do usuário) ---
    // Em vez de buscar da API, usamos a lista estática onde ficam "DAS-S, DAS-9, etc"
    // para garantir que a lista seja EXATAMENTE o que o usuário espera.

    // Mapeamento de Nível Hierárquico baseado no DAS (Inferência)
    // DAS-9/S = 1, DAS-8 = 2, DAS-7 = 3...
    const getHierarchyFromDasKey = (key: string) => {
        const map: any = {
            'DAS-S': 1, 'DAS-9': 2, 'DAS-8': 3, 'DAS-7': 4,
            'DAS-6': 5, 'DAS-5': 6, 'DAS-4': 7, 'DAS-3': 8,
            'DAS-2': 9, 'DAS-1': 10, 'FC-1': 11
        };
        return map[key] || 11;
    };

    // --- 1. PREFIXOS DO CARGO (Configuração do Usuário) ---
    // Fonte: Endpoint /prefixos (Tabela editável pelo usuário)
    // Objetivo: Refletir exatamente o que o usuário cadastrou em "Configurar Prefixos"
    React.useEffect(() => {
        const fetchPrefixos = async () => {
            try {
                const response = await api.get('/prefixos');
                const userPrefixos = response.data?.data || [];

                const options = userPrefixos.map((p: any) => ({
                    value: p.nome,
                    label: p.nome
                }));
                // Ordenar alfabeticamente
                options.sort((a: any, b: any) => a.label.localeCompare(b.label));

                setPrefixosOptions(options);
            } catch (error) {
                console.error('Erro ao buscar prefixos:', error);
            }
        };
        fetchPrefixos();
    }, []);

    // --- 2. TIPOS DE SÍMBOLO (Oficiais do Sistema) ---
    // Fonte: Endpoint /configs/cargos (Tabela tipos_cargo do DB)
    // Objetivo: Listar os símbolos oficiais (DAS-S, DAS-9, etc.)
    useEffect(() => {
        const fetchSimbolos = async () => {
            try {
                const response = await api.get('/configs/cargos');
                if (response.data?.success) {
                    const allTypes = response.data.data || []; // Lista completa do banco

                    // O usuário pediu a lista que tem DAS-S, DAS-9, etc.
                    // Esses itens geralmente têm ordem definida (1, 2, 3...). 
                    // Itens migrados/customizados pelo usuário costumam ter ordem null ou alta (99).
                    // Para garantir que apareçam os DAS, ordenamos pela ordem.
                    const sortedTypes = allTypes.sort((a: any, b: any) => (a.ordem || 999) - (b.ordem || 999));

                    setCargoTypes(sortedTypes);
                }
            } catch (e) {
                console.error('Erro ao buscar símbolos:', e);
            }
        };
        fetchSimbolos();
    }, []);

    const [orgaosOptions, setOrgaosOptions] = useState<any[]>([]);

    // Options
    // Usar dados do BANCO filtrados (cargoTypes) para garantir consistência
    // E mapear o NOME (que no banco é Descrição ex: "Diretor") para o CÓDIGO (ex: "DAS-8")
    // pois o usuário quer ver o código na lista SEM OS SÍMBOLOS FÍSICOS (quadrados/bolinhas).
    const simbolosOptions = cargoTypes.map((cargo: any) => {
        // Tentar encontrar a chave (DAS-X) correspondente à descrição
        const dasKey = Object.keys(DESCRICOES_DAS).find(key =>
            DESCRICOES_DAS[key as keyof typeof DESCRICOES_DAS] === cargo.nome
        );

        // Se achou (ex: achou "DAS-8" para "Diretor"), usa "DAS-8" no label
        // Se não achou (cargo customizado), usa o nome original
        const labelText = dasKey || cargo.nome;

        return {
            value: cargo.nome, // Mantemos o valor (nome) para compatibilidade com o backend
            label: labelText // AGORA SEM SÍMBOLO: apenas "DAS-8"
        };
    });

    // Helper para display do nome do símbolo (Reverso do DESCRICOES_DAS)
    const getSimboloDisplay = (nome: string) => {
        const dasKey = Object.keys(DESCRICOES_DAS).find(key =>
            DESCRICOES_DAS[key as keyof typeof DESCRICOES_DAS] === nome
        );
        return dasKey || nome;
    };

    // Buscar Órgãos
    useEffect(() => {
        const fetchOrgaos = async () => {
            try {
                const response = await api.get('/orgaos');
                const orgaos = response.data.data || [];

                if (!Array.isArray(orgaos)) return;

                const formattedOptions = orgaos
                    .filter((orgao: any) => orgao.id !== 'prefeito-municipal' && orgao.id !== 'vice-prefeito-municipal')
                    .map((orgao: any) => ({
                        value: orgao.nome,
                        label: orgao.nome.length > 85 ? orgao.nome.substring(0, 85) + '...' : orgao.nome
                    }))
                    .sort((a: any, b: any) => a.label.localeCompare(b.label));

                setOrgaosOptions(formattedOptions);
            } catch (error) {
                console.error("Erro ao buscar órgãos:", error);
            }
        };

        fetchOrgaos();
    }, []);

    // Trava o órgão
    const orgaoTravado = cargos.some((c: any) => {
        const h = parseFloat(c.hierarquia);
        return h === 1 || h === 0.5;
    });

    const flattenSetoresForOptions = (nodes: any) => {
        let options: any[] = [];
        if (!nodes || !Array.isArray(nodes)) return [];

        nodes.forEach((node: any) => {
            options.push({
                value: node.id,
                label: node.nomeSetor || node.nome
            });
            if (node.children && node.children.length > 0) {
                options = options.concat(flattenSetoresForOptions(node.children));
            }
        });
        return options;
    };

    // Verificar órgão e carregar setores
    useEffect(() => {
        const checkOrgao = async () => {
            if (!nomeOrgao && !(isSandbox && orgaoId)) {
                setSetoresOptions([]);
                return;
            }

            try {
                let setores = [];
                // CORREÇÃO: Priorizar setores passados via props (Edição)
                if (data.setores && data.setores.length > 0) {
                    setores = data.setores;
                    console.log('[FuncoesForm] Usando setores recebidos via props:', setores.length);
                }
                else if (isSandbox && orgaoId) {
                    const sandboxResponse = await api.get(`/sandbox/estrutural/${orgaoId}`);
                    setores = sandboxResponse.data?.setores || [];
                } else {
                    const response = await api.get(`/organogramas/${encodeURIComponent(nomeOrgao)}`);
                    setores = response.data?.data?.organogramaEstrutural?.setores || [];
                }

                if (setores && setores.length > 0) {
                    const flatSetores = flattenSetoresForOptions(setores);
                    flatSetores.sort((a, b) => a.label.localeCompare(b.label));
                    setSetoresOptions(flatSetores);
                } else {
                    setSetoresOptions([]);
                }
            } catch (error: any) {
                console.error('[FuncoesForm] Erro ao carregar setores:', error);
                if (error.response && error.response.status === 404) {
                    setSetoresOptions([]);
                }
            }
        };

        checkOrgao();
        const timeoutId = setTimeout(() => {
            if (nomeOrgao) checkOrgao();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [nomeOrgao, isSandbox, orgaoId]);

    // --- LÓGICA DE HIERARQUIA AUTOMÁTICA ---
    useEffect(() => {
        let novoNivel = '1';

        // 1. Assessoria é sempre 0
        if (currentCargo.isAssessoria) {
            novoNivel = '0';
        }
        // 2. Se tiver Pai...
        else if (currentCargo.parentId) {
            const pai = cargos.find((c: any) => c.id === currentCargo.parentId);
            if (pai) {
                const nivelPai = parseFloat(pai.hierarquia);
                let base = (nivelPai < 1 ? 1 : nivelPai) + 1;

                // Ajuste Operacional: Desce +1 nível
                if (currentCargo.isOperacional) base += 1;

                novoNivel = String(Math.min(base, 10)); // Max 10
            }
        }
        // 3. Sem pai (Raiz)
        else {
            // Se for operacional sem pai, talvez devesse ser 2? Mas manteremos 1 por padrão se for raiz.
            // Se o usuário quiser, ele muda manualmente? Ah, é travado agora?
            // Se for raiz e operacional, faz sentido ser 2? Vamos assumir que sim para consistência.
            novoNivel = currentCargo.isOperacional ? '2' : '1';
        }

        if (currentCargo.hierarquia !== novoNivel) {
            setCurrentCargo((prev: any) => ({ ...prev, hierarquia: novoNivel }));
        }
    }, [currentCargo.isAssessoria, currentCargo.isOperacional, currentCargo.parentId, cargos, currentCargo.hierarquia]);

    const handleNomeOrgaoChange = (e: any) => {
        updateData({ nomeOrgao: e.target.value });
    };

    const handleCargoFieldChange = (field: string, value: any) => {
        if (field === 'parentId') {
            setCurrentCargo((prev: any) => ({
                ...prev,
                [field]: value,
                position: null // Reset position on move
            }));
        } else {
            setCurrentCargo((prev: any) => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleAddSimbolo = () => {
        if (currentSimbolo.tipo && currentSimbolo.quantidade > 0) {
            setCurrentCargo((prev: any) => {
                const existingIndex = prev.simbolos.findIndex((s: any) => s.tipo === currentSimbolo.tipo);
                let newSimbolos;
                if (existingIndex >= 0) {
                    newSimbolos = [...prev.simbolos];
                    newSimbolos[existingIndex] = {
                        ...newSimbolos[existingIndex],
                        quantidade: newSimbolos[existingIndex].quantidade + currentSimbolo.quantidade
                    };
                } else {
                    newSimbolos = [...prev.simbolos, { ...currentSimbolo }];
                }
                return { ...prev, simbolos: newSimbolos };
            });
            setCurrentSimbolo({ tipo: '', quantidade: 1 });
        }
    };

    const handleRemoveSimbolo = (index: number) => {
        setCurrentCargo((prev: any) => ({
            ...prev,
            simbolos: prev.simbolos.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleAddCargo = () => {
        // Validação de Setor de Referência (Obrigatório para exibir nome no organograma)
        if (!currentCargo.setorRef) {
            alert('⚠️ É obrigatório selecionar um Setor de Referência para vincular o cargo.');
            return;
        }

        const nomeCompleto = currentCargo.prefixo && currentCargo.complementoNome
            ? `${currentCargo.prefixo} de ${currentCargo.complementoNome}`
            : currentCargo.prefixo || currentCargo.complementoNome || '';

        // Validação final de hierarquia
        let finalHierarquia = currentCargo.hierarquia; // Já calculado pelo useEffect

        const cargoParaValidar = {
            ...currentCargo,
            nomeCargo: nomeCompleto,
            hierarquia: finalHierarquia
        };

        const validation = validateCargo(cargoParaValidar);

        if (validation.valid) {
            if (currentCargo.isEditing) {
                const { isEditing, ...cargoLimpo } = cargoParaValidar;
                updateData({
                    cargos: cargos.map((c: any) => c.id === cargoLimpo.id ? cargoLimpo : c)
                });
            } else {
                const novoCargo = {
                    ...cargoParaValidar,
                    id: uuidv4(),
                    isAssessoria: parseInt(finalHierarquia) === 0,
                    parentId: parseInt(finalHierarquia) === 1 ? null : currentCargo.parentId
                };
                updateData({ cargos: [...cargos, novoCargo] });
            }

            // Reset
            setCurrentCargo({
                prefixo: '',
                complementoNome: '',
                ocupante: '',
                hierarquia: '1',
                isAssessoria: false,
                isOperacional: false,
                parentId: null,
                setorRef: null,
                simbolos: []
            });
        } else {
            // Fix: usar Object.values para garantir array de erros se for objeto
            const errorList = Array.isArray(validation.errors) ? validation.errors : Object.values(validation.errors || {});
            alert('⚠️ ' + errorList.join('\n'));
        }
    };

    const handleRemoveCargo = (id: string) => {
        if (window.confirm("Deseja remover este cargo?")) {
            updateData({
                cargos: cargos.filter((c: any) => c.id !== id)
            });
        }
    };

    const handleEditCargo = (cargo: any) => {
        // Tentar separar o nome em prefixo + complemento
        let prefixoEncontrado = '';
        let complementoEncontrado = cargo.nomeCargo;
        const prefixosList = prefixosOptions.map(p => p.value);
        for (const p of prefixosList) {
            if (cargo.nomeCargo.startsWith(p + ' de ')) {
                prefixoEncontrado = p;
                complementoEncontrado = cargo.nomeCargo.replace(p + ' de ', '');
                break;
            } else if (cargo.nomeCargo === p) {
                prefixoEncontrado = p;
                complementoEncontrado = '';
                break;
            }
        }

        setCurrentCargo({
            ...cargo,
            prefixo: prefixoEncontrado,
            complementoNome: complementoEncontrado,
            // CORREÇÃO: Assegurar que setorRef e parentId sejam carregados corretamente
            setorRef: cargo.setorRef || cargo.setor_ref || null,
            parentId: cargo.parentId === 'null' ? null : (cargo.parentId || null),
            isEditing: true
        });

        const formElement = document.querySelector('.funcoes-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setCurrentCargo({
            prefixo: '',
            complementoNome: '',
            ocupante: '',
            hierarquia: '1',
            isAssessoria: false,
            parentId: null,
            setorRef: null,
            simbolos: []
        });
    };



    const cargosPaiOptions = cargos.map((cargo: any) => ({
        value: cargo.id,
        label: `${cargo.nomeCargo} (Nível ${cargo.hierarquia})`
    }));

    const parseHierarchy = (val: string) => parseFloat(val);
    const formatHierarchyLabel = (level: number) => {
        if (level === 0) return 'Assessoria (0)';
        return `Nível ${level}`;
    };

    return (
        <div className="funcoes-form">
            <Card title="Configurações Gerais" className="mb-24">
                <div className="form-row">
                    <Select
                        label="Nome do Órgão"
                        value={nomeOrgao}
                        onChange={handleNomeOrgaoChange}
                        options={orgaosOptions}
                        placeholder="Selecione o órgão"
                        required
                        disabled={orgaoTravado || disableOrgaoSelection}
                        error={errors.nomeOrgao}
                    />
                </div>
            </Card>

            <Card title="Adicionar Cargo/Função" className="mb-24">
                {currentCargo.isEditing && (
                    <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ffeeba', fontWeight: 'bold', textAlign: 'center' }}>
                        ⚠️ EDIÇÃO EM ANDAMENTO
                    </div>
                )}

                <div className="cargo-inputs-grid">
                    <div className="grid-item-prefixo">
                        <Select
                            label="Prefixo do Cargo"
                            value={currentCargo.prefixo}
                            onChange={(e: any) => setCurrentCargo((prev: any) => ({ ...prev, prefixo: e.target.value }))}
                            options={prefixosOptions}
                            placeholder="Selecione..."
                            required
                        />
                    </div>
                    <div className="grid-item-complemento">
                        <Input
                            label="Complemento do Nome"
                            value={currentCargo.complementoNome}
                            onChange={(e: any) => handleCargoFieldChange('complementoNome', e.target.value)}
                            placeholder="Ex: de Governo"
                            required
                        />
                    </div>
                    <div className="grid-item-ocupante">
                        <Input
                            label="Nome do Ocupante"
                            value={currentCargo.ocupante}
                            onChange={(e: any) => handleCargoFieldChange('ocupante', e.target.value)}
                            placeholder="Ex: João da Silva"
                        />
                    </div>
                </div>

                <div className="form-row">
                    {/* Checkbox de Chefia vs Operacional - BLOQUEADO PARA NÍVEL 1 */}
                    {/* Se estiver editando um cargo nível 1, ou criando o primeiro cargo (que será nível 1), não mostrar opções */}
                    {(cargos.length > 0 && parseFloat(currentCargo.hierarquia) !== 1) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px', marginBottom: '10px' }}>
                            <div className="checkbox-container" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                                    <input
                                        type="checkbox"
                                        checked={currentCargo.isAssessoria}
                                        onChange={(e) => setCurrentCargo((prev: any) => ({ ...prev, isAssessoria: e.target.checked }))}
                                    />
                                    É uma Assessoria? (Nível 0 - Lateral)
                                </label>
                            </div>

                            {!currentCargo.isAssessoria && (
                                <div className="checkbox-container" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                                        <input
                                            type="checkbox"
                                            checked={currentCargo.isOperacional}
                                            onChange={(e) => setCurrentCargo((prev: any) => ({ ...prev, isOperacional: e.target.checked }))}
                                        />
                                        É Operacional? (Desce 1 Nível)
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AVISO PARA NÍVEL 1 */}
                    {parseFloat(currentCargo.hierarquia) === 1 && (
                        <div style={{ marginTop: '15px', marginBottom: '15px', color: '#666', fontStyle: 'italic', fontSize: '0.9em' }}>
                            * Cargos de Nível 1 são Raiz e não podem ser Assessoria ou Operacional.
                        </div>
                    )}

                    {/* Pai Obrigatório para filhos, mas OPCIONAL/OCULTO para Nível 1 */}
                    {cargos.length > 0 && parseFloat(currentCargo.hierarquia) !== 1 && (
                        <Select
                            label="Cargo Pai (Subordinado a)"
                            value={currentCargo.parentId || ''}
                            onChange={(e: any) => handleCargoFieldChange('parentId', e.target.value || null)}
                            options={cargosPaiOptions}
                            placeholder="Selecione o cargo pai"
                            helperText="O nível hierárquico será calculado automaticamente."
                            required={!currentCargo.isAssessoria}
                        />
                    )}
                </div>

                {/* Display Nível */}
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef', fontSize: '0.9rem' }}>
                    <strong>Nível Hierárquico Calculado: </strong>
                    <span style={{ color: parseHierarchy(currentCargo.hierarquia) === 0 ? '#6c757d' : '#007bff', fontWeight: 'bold' }}>
                        {formatHierarchyLabel(parseHierarchy(currentCargo.hierarquia))}
                    </span>
                </div>

                {/* Setor Ref */}
                <div className="form-row">
                    <Select
                        label="Setor de Referência (Estrutural)"
                        value={currentCargo.setorRef || ''}
                        onChange={(e: any) => handleCargoFieldChange('setorRef', e.target.value || null)}
                        options={setoresOptions}
                        placeholder="Selecione o setor estrutural"
                        required
                        helperText="Vincule este cargo ao setor onde ele está lotado para exibir o nome no organograma."
                    />
                </div>
                {setoresOptions.length === 0 && nomeOrgao && (
                    <div style={{ padding: '10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', marginTop: '-15px', marginBottom: '15px', fontSize: '0.9rem' }}>
                        ⚠️ Nenhum setor estrutural encontrado. Crie o Organograma Estrutural primeiro para vincular cargos.
                    </div>
                )}

                {/* Simbolos */}
                <div className="simbolos-section">
                    <h4>Símbolos</h4>
                    <div className="form-row">
                        <Select
                            label="Tipo de Símbolo"
                            value={currentSimbolo.tipo}
                            onChange={(e: any) => setCurrentSimbolo(prev => ({ ...prev, tipo: e.target.value }))}
                            options={simbolosOptions}
                            placeholder="Selecione"
                        />
                        <Input
                            label="Qtd"
                            type="number"
                            value={currentSimbolo.quantidade}
                            onChange={(e: any) => setCurrentSimbolo(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                            min="1"
                        />
                        <div className="add-simbolo-btn">
                            <Button onClick={handleAddSimbolo} variant="secondary">Adicionar</Button>
                        </div>
                    </div>
                    {currentCargo.simbolos.length > 0 && (
                        <div className="simbolos-list">
                            {currentCargo.simbolos.map((simbolo: any, index: number) => (
                                <div key={index} className="simbolo-item">
                                    <span>{getSimboloDisplay(simbolo.tipo)} ({simbolo.quantidade})</span>
                                    <button onClick={() => handleRemoveSimbolo(index)} className="remove-btn">×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button onClick={handleAddCargo} fullWidth variant="primary">
                    {currentCargo.isEditing ? '✓ SALVAR ALTERAÇÃO' : '✓ Adicionar Cargo'}
                </Button>
                {currentCargo.isEditing && (
                    <Button onClick={handleCancelEdit} fullWidth variant="outline" style={{ marginTop: '10px' }}>Cancelar</Button>
                )}
            </Card>

            {cargos.length > 0 && (
                <Card title={`Cargos (${cargos.length})`}>
                    <div className="cargos-list">
                        {cargos.map((cargo: any) => (
                            <div key={cargo.id} className="cargo-item-card" style={{ borderLeftColor: HIERARCHY_COLORS[cargo.hierarquia] }}>
                                <div className="cargo-info">
                                    <h4>{cargo.nomeCargo}</h4>
                                    <p>Nível {cargo.hierarquia} {cargo.isAssessoria && '(Assessoria)'}</p>
                                    <div className="cargo-simbolos">
                                        {cargo.simbolos.map((s: any, i: number) => (
                                            <span key={i} className="simbolo-badge">{getSimboloDisplay(s.tipo)} ({s.quantidade})</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="cargo-item-actions">
                                    <button onClick={() => handleEditCargo(cargo)} className="edit-cargo-btn">Editar</button>
                                    <button onClick={() => handleRemoveCargo(cargo.id)} className="remove-cargo-btn">Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default FuncoesForm;
