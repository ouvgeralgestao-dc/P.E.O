/**
 * Formulário de Estrutura Organizacional
 * Versão atualizada: Filtros condicionais aplicados
 */
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../../services/api';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { HIERARCHY_LEVELS, SETOR_TYPES, HIERARCHY_COLORS, HIERARCHY_LABELS } from '../../constants/hierarchyLevels';
import { CARGOS_DAS, DESCRICOES_DAS } from '../../constants/cargosDAS';
import { PAGE_SIZE_OPTIONS } from '../../constants/pageSizes';
import { ORGAOS_OPTIONS, SUBPREFEITURAS, SUBPREFEITURAS_IDS, getOrgaoById } from '../../constants/orgaos';
import { validateSetor, validateNome } from '../../utils/validators';
import './EstruturaForm.css';

const EstruturaForm = ({ data, updateData, errors, disableOrgaoSelection = false }) => {
    const [currentSetor, setCurrentSetor] = useState({
        tipoSetor: '',
        nomeSetor: '',
        hierarquia: '', // Será calculado automaticamente
        isAssessoria: false,
        isOperacional: false, // Novo campo: Ajuste fino de hierarquia
        parentId: null,
        cargos: [] as any[],
        isEditing: false,
        id: '',
        position: null as any
    });
    const [currentCargo, setCurrentCargo] = useState({ tipo: '', quantidade: 1 });
    const [tipoSetorOptions, setTipoSetorOptions] = useState<any[]>([]);
    const [cargoTypes, setCargoTypes] = useState<any[]>([]);
    const [orgaosOptions, setOrgaosOptions] = useState<any[]>([]);

    const setores = data.setores || [];
    const temRaiz = setores.some((s: any) => parseFloat(s.hierarquia) === 1 || parseFloat(s.hierarquia) === 0.5);
    const nomeOrgao = data.nomeOrgao || '';

    // Carregar configurações iniciais (Órgãos, Cargos e Tipos de Setor)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Buscar tipos de cargo
                const cargosResponse = await api.get('/configs/cargos');
                if (cargosResponse.data && cargosResponse.data.success) {
                    setCargoTypes(cargosResponse.data.data || []);
                }

                // 2. Buscar órgãos e formatar para Select
                const orgaosResponse = await api.get('/orgaos');
                const orgaosList = orgaosResponse.data.data || [];
                if (Array.isArray(orgaosList)) {
                    const formatted = orgaosList
                        .filter(o => o.id !== 'prefeito-municipal' && o.id !== 'vice-prefeito-municipal')
                        .map(o => ({
                            value: o.nome,
                            label: o.nome.length > 85 ? o.nome.substring(0, 85) + '...' : o.nome
                        }))
                        .sort((a, b) => a.label.localeCompare(b.label));
                    setOrgaosOptions(formatted);
                }

                // 3. Buscar dicionário de setores
                const sectorConfigResponse = await api.get('/setores/config');
                setTipoSetorOptions(sectorConfigResponse.data.data || []);

            } catch (error) {
                console.error('[EstruturaForm] Erro ao carregar dados iniciais:', error);
            }
        };

        fetchData();
    }, []);

    // Trava o órgão se houver qualquer setor Nível 1 ou Subprefeito (raízes)
    const orgaoTravado = setores.some((s: any) => {
        const h = parseFloat(s.hierarquia);
        return h === 1 || h === 0.5;
    });

    const tamanhoFolha = data.tamanhoFolha || 'A3';

    // ... handlers simples ...

    const handleNomeOrgaoChange = (e) => updateData({ nomeOrgao: e.target.value });
    const handleTamanhoFolhaChange = (e) => updateData({ tamanhoFolha: e.target.value });

    // Atualizar campo do setor atual
    const handleSetorFieldChange = (field, value) => {
        setCurrentSetor(prev => {
            const newState = { ...prev, [field]: value };

            // Resetar posição se mudar estrutura
            if (field === 'hierarquia' || field === 'parentId') {
                newState.position = null;
            }

            // Recálculo de Hierarquia Centralizado
            const recalculate = (state) => {
                if (state.isAssessoria) return '0';

                if (state.parentId) {
                    const pai = setores.find(s => s.id === state.parentId);
                    if (pai) {
                        const nivelPai = parseFloat(pai.hierarquia);
                        let base = (nivelPai < 1 ? 1 : nivelPai) + 1;

                        // Ajuste Operacional: Desce +1 nível
                        if (state.isOperacional) base += 1;

                        return String(Math.min(base, 10));
                    }
                } else if (!temRaiz) {
                    return state.isOperacional ? '2' : '1'; // Se for raiz operacional (raro), começa no 2? Ou 1? Vamos assumir 1 se for raiz, mas a lógica de raiz geralmente é 1 fixo.
                    // Na verdade, se não tem pai e não tem raiz, é o primeiro. O primeiro deve ser 1.
                    // Se o usuário marcar operacional no primeiro nó, talvez devesse ser 2? Mas sem pai não faz muito sentido ser operacional de ninguém.
                    // Vamos manter 1 para raiz.
                }
                return state.hierarquia; // Mantém atual se não cair nas regras
            };

            // Triggers para recálculo
            if (field === 'parentId' || field === 'isAssessoria' || field === 'isOperacional') {
                if (field === 'isAssessoria' && value === true) {
                    newState.hierarquia = '0';
                } else {
                    newState.hierarquia = recalculate(newState);
                }
            }

            return newState;
        });
    };

    // Adicionar cargo ao setor atual (Agrupando por tipo)
    const handleAddCargo = () => {
        if (currentCargo.tipo && currentCargo.quantidade > 0) {
            setCurrentSetor(prev => {
                const existingIndex = prev.cargos.findIndex(c => c.tipo === currentCargo.tipo);

                let newCargos;
                if (existingIndex >= 0) {
                    // Cargo já existe: Soma a quantidade
                    newCargos = [...prev.cargos];
                    newCargos[existingIndex] = {
                        ...newCargos[existingIndex],
                        quantidade: newCargos[existingIndex].quantidade + currentCargo.quantidade
                    };
                } else {
                    // Cargo novo: Adiciona à lista
                    newCargos = [...prev.cargos, { ...currentCargo }];
                }

                return {
                    ...prev,
                    cargos: newCargos
                };
            });
            setCurrentCargo({ tipo: '', quantidade: 1 });
        }
    };

    // Remover cargo do setor atual
    const handleRemoveCargo = (index) => {
        setCurrentSetor(prev => ({
            ...prev,
            cargos: prev.cargos.filter((_, i) => i !== index)
        }));
    };

    // Adicionar setor à lista
    const handleAddSetor = () => {
        const validation = validateSetor(currentSetor);

        if (!validation.valid) {
            // Mostrar mensagens de erro
            const errorMessages = Object.values(validation.errors).join('\n');
            alert(`Erro ao adicionar setor:\n\n${errorMessages}`);
            return;
        }

        const hierarquia = parseFloat(currentSetor.hierarquia);
        const isOrgaoSubprefeitura = SUBPREFEITURAS_IDS.includes(nomeOrgao);

        // Validação: Apenas 1 raiz por órgão
        const isRaiz = (isOrgaoSubprefeitura && hierarquia === 0.5) || (!isOrgaoSubprefeitura && hierarquia === 1);
        if (isRaiz) {
            const jaTemRaiz = setores.some(s => {
                const sHierarquia = parseFloat(s.hierarquia);
                return (isOrgaoSubprefeitura && sHierarquia === 0.5) || (!isOrgaoSubprefeitura && sHierarquia === 1);
            });

            if (jaTemRaiz) {
                const tipoRaiz = isOrgaoSubprefeitura ? 'Subprefeito(a)' : 'Nível 1';
                alert(`Erro: Já existe um setor ${tipoRaiz} neste órgão. Apenas um setor raiz é permitido.`);
                return;
            }
        }

        // Calcular parentId: usar o selecionado pelo usuário ou calcular automaticamente
        let parentId = currentSetor.parentId; // Usar o selecionado

        if (!isRaiz && !parentId) {
            // Se não foi selecionado, calcular automaticamente (fallback)
            const nivelPai = hierarquia - 1;
            const setoresPai = setores.filter(s => parseFloat(s.hierarquia) === nivelPai);

            if (setoresPai.length > 0) {
                parentId = setoresPai[setoresPai.length - 1].id;
            } else {
                // Fallback: Se não existe o nível superior imediato, subordina ao nível raiz (1 ou 0.5)
                const raiz = setores.find(s => {
                    const h = parseFloat(s.hierarquia);
                    return h === 1 || h === 0.5;
                });

                if (raiz) {
                    parentId = raiz.id;
                } else {
                    alert(`Erro: Você precisa adicionar o setor principal (Nível 1) antes de adicionar sub-setores.`);
                    return;
                }
            }
        }

        // Concatenar tipo de setor com nome opcional
        const nomeCompleto = hierarquia === 0.5
            ? `${currentSetor.tipoSetor}${currentSetor.nomeSetor ? ` - ${currentSetor.nomeSetor}` : ''}`
            : `${currentSetor.tipoSetor}${currentSetor.nomeSetor ? ` ${currentSetor.nomeSetor}` : ''}`;

        if (currentSetor.isEditing) {
            // Atualizar setor existente
            const { isEditing, ...setorLimpo } = {
                ...currentSetor,
                nomeSetor: nomeCompleto,
                parentId: parentId,
                isAssessoria: parseInt(currentSetor.hierarquia) === 0
            };

            updateData({
                setores: setores.map(s => s.id === setorLimpo.id ? setorLimpo : s)
            });
        } else {
            // Adicionar novo setor
            const novoSetor = {
                ...currentSetor,
                nomeSetor: nomeCompleto,
                id: uuidv4(),
                parentId: parentId,
                isAssessoria: parseInt(currentSetor.hierarquia) === 0
            };
            delete novoSetor.isEditing;

            updateData({
                setores: [...setores, novoSetor]
            });
        }

        // Resetar formulário
        setCurrentSetor({
            tipoSetor: '',
            nomeSetor: '',
            hierarquia: '',
            isAssessoria: false,
            isOperacional: false,
            parentId: null,
            cargos: [] as any[],
            isEditing: false,
            id: '',
            position: null
        });
    };

    // Efeito para definir hierarquia inicial se for o primeiro
    useEffect(() => {
        if (!currentSetor.isEditing && !currentSetor.hierarquia) {
            const existeRaiz = setores.some(s => parseFloat(s.hierarquia) === 1 || parseFloat(s.hierarquia) === 0.5);
            if (!existeRaiz) {
                setCurrentSetor(prev => ({ ...prev, hierarquia: '1' }));
            }
        }
    }, [setores, currentSetor.isEditing, currentSetor.hierarquia]);

    const handleEditSetor = (setor) => {
        const hierarquia = parseFloat(setor.hierarquia);
        let tipoEncontrado = setor.tipoSetor || '';
        let nomeLimpo = setor.nomeSetor;

        // Tentar extrair tipo e nome baseado na hierarquia DE FORMA SEGURA
        // Mas apenas tentar desmembrar se não tivermos um tipoEncontrado forte OU
        // tentar limpar o prefixo do nomeLimpo já sabendo o tipo.
        if (tipoEncontrado && nomeLimpo.startsWith(tipoEncontrado)) {
            let resto = nomeLimpo.substring(tipoEncontrado.length).trim();
            if (resto.startsWith('- ')) resto = resto.substring(2);
            if (resto.startsWith('de ')) resto = resto.substring(3);
            nomeLimpo = resto;
        } else {
            const tiposPossiveis = SETOR_TYPES[hierarquia] || [];
            let matchFound = false;

            for (const tipo of tiposPossiveis) {
                const separatorLegacy = hierarquia === 0.5 ? ' - ' : ' de ';
                const separatorNew = hierarquia === 0.5 ? ' - ' : ' ';

                if (setor.nomeSetor.startsWith(tipo + separatorLegacy)) {
                    tipoEncontrado = tipo;
                    nomeLimpo = setor.nomeSetor.substring((tipo + separatorLegacy).length);
                    matchFound = true;
                    break;
                } else if (setor.nomeSetor.startsWith(tipo + separatorNew)) {
                    tipoEncontrado = tipo;
                    nomeLimpo = setor.nomeSetor.substring((tipo + separatorNew).length);
                    matchFound = true;
                    break;
                } else if (setor.nomeSetor === tipo) {
                    tipoEncontrado = tipo;
                    nomeLimpo = '';
                    matchFound = true;
                    break;
                }
            }
            // Se não encontrou match, preserva o tipo original (if any)
            if (!matchFound && setor.tipoSetor) {
                tipoEncontrado = setor.tipoSetor;
            }
        }

        setCurrentSetor({
            ...setor,
            tipoSetor: tipoEncontrado,
            nomeSetor: nomeLimpo,
            isEditing: true
        });

        // Rolar para o formulário
        const formElement = document.querySelector('.estrutura-form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleCancelEdit = () => {
        setCurrentSetor({
            tipoSetor: '',
            nomeSetor: '',
            hierarquia: '',
            isAssessoria: false,
            isOperacional: false,
            parentId: null,
            cargos: [] as any[],
            isEditing: false,
            id: '',
            position: null
        });
    };

    // Remover setor da lista com proteção de integridade
    const handleRemoveSetor = (id) => {
        const setorParaRemover = setores.find(s => s.id === id);
        if (!setorParaRemover) return;

        const h = parseFloat(setorParaRemover.hierarquia);
        const isSetorRaiz = h === 1 || h === 0.5;

        // Se for o único setor raiz (Nível 1 ou Subprefeito)
        if (isSetorRaiz) {
            const outrasRaizes = setores.filter(s => {
                const sh = parseFloat(s.hierarquia);
                return (sh === 1 || sh === 0.5) && s.id !== id;
            });

            if (outrasRaizes.length === 0) {
                const confirmar = window.confirm("TEM CERTEZA QUE DESEJA DELETAR?");

                if (!confirmar) return;

                // Se confirmou, limpa tudo (pois sem raiz não há estrutura)
                updateData({ setores: [] });
                return;
            }
        }

        // Remoção padrão para outros casos
        updateData({
            setores: setores.filter(s => s.id !== id)
        });
    };

    // Opções de tipos de setor baseado na hierarquia
    const getTiposSetorOptions = () => {
        const hierarquia = parseFloat(currentSetor.hierarquia);
        if (isNaN(hierarquia)) return [];

        let options = [];

        // 1. Obter opções do Banco (Configurações)
        if (tipoSetorOptions.length > 0) {
            const hStr = hierarquia.toString();

            // Flexibilidade:
            // - Níveis 1-10: Todos os tipos
            // - Assessoria (Checkbox marcado): Todos os tipos (Ideia do usuário: qualquer setor pode ser assessoria)
            const shouldUseAll = (hierarquia >= 1 && hierarquia <= 10) || currentSetor.isAssessoria;

            options = tipoSetorOptions
                .filter(t => shouldUseAll || t.hierarquias.includes(hStr))
                .map(t => ({ value: t.nome, label: t.nome }));
        }

        // 2. Se for Nível 1-10, Assessoria, ou não houver opções do banco, adicionar tipos padrão (ALL_SETOR_TYPES)
        if (options.length === 0 || (hierarquia >= 1 && hierarquia <= 10) || currentSetor.isAssessoria) {

            // Se for Assessoria (explicitamente marcada), usamos a lista COMPLETA (igual nível 1)
            // Se for nível 0 nativo (sem checkbox explícito, ex: edição antiga), mantém restrição
            const tiposBase = currentSetor.isAssessoria
                ? (SETOR_TYPES['1'] || [])
                : (SETOR_TYPES[hierarquia] || SETOR_TYPES['1'] || []);

            const padraoOptions = tiposBase.map(t => ({ value: t, label: t }));

            // Merge unificando por valor para evitar duplicatas
            const currentValues = new Set(options.map(o => o.value));
            const novos = padraoOptions.filter(o => !currentValues.has(o.value));

            options = [...options, ...novos];
        }

        return options.sort((a, b) => a.label.localeCompare(b.label));
    };

    // Verificar se é nível Subprefeito
    const isSubprefeito = parseFloat(currentSetor.hierarquia) === 0.5;

    // Opções de nome para Subprefeituras (dropdown)
    const subprefeituraOptions = SUBPREFEITURAS.map(distrito => ({
        value: distrito,
        label: distrito
    }));

    // Verificar se o órgão selecionado é uma Subprefeitura
    const isOrgaoSubprefeitura = SUBPREFEITURAS_IDS.includes(nomeOrgao);

    // Opções de cargos DINÂMICAS: Agora usa cargoTypes da API
    const cargosOptions = cargoTypes.length > 0
        ? cargoTypes.map((c: any) => {
            // Tentar encontrar o código DAS (ex: DAS-8) pela descrição (ex: Diretor)
            const dasKey = Object.keys(DESCRICOES_DAS).find(key =>
                DESCRICOES_DAS[key as keyof typeof DESCRICOES_DAS] === c.nome
            );
            return {
                value: c.nome,
                label: dasKey || c.nome // Mostra "DAS-8" se for oficial, ou "Assessor" se for custom
            };
        }).sort((a, b) => {
            // Ordenar: Primeiro os que têm DAS (pela ordem do array) ou alfabético
            if (a.label.startsWith('DAS') && b.label.startsWith('DAS')) return b.label.localeCompare(a.label); // DAS-S antes de DAS-1
            return a.label.localeCompare(b.label);
        })
        : [];

    return (
        <div className="estrutura-form">
            {/* Configurações Gerais - Oculto no Sandbox */}
            {!disableOrgaoSelection && (
                <Card title="Configurações Gerais" className="mb-24">
                    <div className="form-row">
                        <Select
                            label="Nome do Órgão"
                            value={getOrgaoById(nomeOrgao)?.nome || nomeOrgao} // Resolve nome se for ID antigo
                            onChange={handleNomeOrgaoChange}
                            options={orgaosOptions}
                            placeholder="Selecione o órgão"
                            required
                            disabled={orgaoTravado}
                            error={errors.nomeOrgao}
                            helperText={orgaoTravado ? "Órgão travado após adicionar primeiro setor raiz" : ""}
                        />
                    </div>
                </Card>
            )}

            {/* Adicionar Setor */}
            <Card title="Adicionar Setor" className="mb-24">
                {currentSetor.isEditing && (
                    <div style={{
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        border: '1px solid #ffeeba',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        ⚠️ EDIÇÃO EM ANDAMENTO: Clique em "CONFIRMAR ALTERAÇÃO" abaixo para efetivar a mudança!
                    </div>
                )}

                {/* Opções de Perfil do Setor (Assessoria / Operacional) */}
                {temRaiz && (
                    <div className="checkbox-row-container">
                        <div className="checkbox-field">
                            <label>
                                <input
                                    type="checkbox"
                                    name="isAssessoria"
                                    checked={currentSetor.isAssessoria}
                                    onChange={(e) => handleSetorFieldChange('isAssessoria', e.target.checked)}
                                />
                                É Assessoria?
                            </label>
                            <span className="checkbox-help-text">(Lateral, Nível 0)</span>
                        </div>

                        {!currentSetor.isAssessoria && (
                            <div className="checkbox-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="isOperacional"
                                        checked={currentSetor.isOperacional}
                                        onChange={(e) => handleSetorFieldChange('isOperacional', e.target.checked)}
                                    />
                                    É Operacional?
                                </label>
                                <span className="checkbox-help-text">(Desce 1 Nível extra)</span>
                            </div>
                        )}
                    </div>
                )}



                {/* Seleção de Setor Pai - Obrigatório se já existe raiz */}
                {temRaiz && setores.length > 0 && (
                    <Select
                        label="Setor Pai (Subordinado a)"
                        value={currentSetor.parentId || ''}
                        onChange={(e) => handleSetorFieldChange('parentId', e.target.value || null)}
                        options={(() => {
                            const hierarquiaAtual = parseFloat(currentSetor.hierarquia);

                            // Se a hierarquia ainda não foi definida (NaN), mostramos TODOS os setores possíveis como pai
                            // O usuário escolhe o pai, e a hierarquia será calculada a partir dele.
                            if (isNaN(hierarquiaAtual)) {
                                return setores
                                    .filter(s => s.id !== currentSetor.id)
                                    .map(s => ({
                                        value: s.id,
                                        label: `${s.nomeSetor} (Nível ${s.hierarquia})`
                                    }));
                            }

                            // Se for Assessoria (0), pode ser ligado a qualquer nível >= 1 OU a outra Assessoria (0)
                            if (hierarquiaAtual === 0) {
                                return setores
                                    .filter(s => parseFloat(s.hierarquia) >= 0 && s.id !== currentSetor.id)
                                    .map(s => ({
                                        value: s.id,
                                        label: `${s.nomeSetor} (Nível ${s.hierarquia})`
                                    }));
                            }

                            // Lógica padrão para níveis hierárquicos normais
                            // Permite selecionar Assessoria (0) como pai também
                            const setoresPossiveis = setores.filter(s => {
                                const hierarquiaSetor = parseFloat(s.hierarquia);
                                const isAssessoria = hierarquiaSetor === 0;
                                // Pode ser subordinado a nível menor (hierarquia maior numérica) ou a Assessoria
                                return (hierarquiaSetor < hierarquiaAtual && hierarquiaSetor >= 1) || isAssessoria;
                            });

                            return setoresPossiveis.map(s => ({
                                value: s.id,
                                label: `${s.nomeSetor} (Nível ${s.hierarquia})`
                            }));
                        })()}
                        placeholder="Selecione o setor pai"
                        helperText="Escolha a qual setor este estará subordinado"
                        required
                    />
                )}
                {/* Visualização do Nível Automático (Read-Only) */}
                <div style={{ marginBottom: '15px', color: '#666', fontStyle: 'italic' }}>
                    Nível Hierárquico Automático: <strong>{currentSetor.hierarquia ? (HIERARCHY_LABELS[currentSetor.hierarquia] || currentSetor.hierarquia) : 'Aguardando seleção...'}</strong>
                </div>
                <div className="form-row">
                    <Select
                        label="Tipo de Setor"
                        value={currentSetor.tipoSetor}
                        onChange={(e) => handleSetorFieldChange('tipoSetor', e.target.value)}
                        options={getTiposSetorOptions()}
                        required
                        placeholder="Selecione o tipo"
                        disabled={!currentSetor.hierarquia} // Hierarquia é calculada automaticamente
                    />
                </div>

                {/* Nome do Setor - Input ou Select dependendo se é Subprefeito */}
                {isSubprefeito ? (
                    <Select
                        label="Nome do Setor (Opcional)"
                        value={currentSetor.nomeSetor}
                        onChange={(e) => handleSetorFieldChange('nomeSetor', e.target.value)}
                        options={subprefeituraOptions}
                        placeholder="Selecione o distrito (opcional)"
                        helperText="Subprefeituras: selecione o distrito"
                    />
                ) : (
                    <Input
                        label="Nome do Setor (Opcional)"
                        value={currentSetor.nomeSetor}
                        onChange={(e) => handleSetorFieldChange('nomeSetor', e.target.value)}
                        placeholder="Ex: Prefeito, Educação, Saúde..."
                        helperText="Opcional. Digite apenas o nome complementar. Ex: 'Prefeito' resultará em 'Gabinete Prefeito'"
                    />
                )}

                <div className="cargos-section">
                    <h4>Cargos DAS</h4>
                    <div className="form-row">
                        <Select
                            label="Tipo de Cargo"
                            value={currentCargo.tipo}
                            onChange={(e) => setCurrentCargo(prev => ({ ...prev, tipo: e.target.value }))}
                            options={cargosOptions}
                            placeholder="Selecione o cargo"
                        />
                        <Input
                            label="Quantidade"
                            type="number"
                            value={currentCargo.quantidade}
                            onChange={(e) => setCurrentCargo(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                            min="1"
                        />
                        <div className="add-cargo-btn">
                            <Button onClick={handleAddCargo} variant="secondary">
                                + Adicionar Cargo
                            </Button>
                        </div>
                    </div>

                    {currentSetor.cargos.length > 0 && (
                        <div className="cargos-list">
                            {currentSetor.cargos.map((cargo, index) => {
                                // Encontrar código DAS (ex: DAS-7) pela descrição
                                const dasKey = Object.keys(DESCRICOES_DAS).find(key =>
                                    DESCRICOES_DAS[key as keyof typeof DESCRICOES_DAS] === cargo.tipo
                                );
                                const label = dasKey || cargo.tipo;

                                return (
                                    <div key={index} className="cargo-item">
                                        <span>{label} - Quantidade: {cargo.quantidade}</span>
                                        <button onClick={() => handleRemoveCargo(index)} className="remove-btn">×</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Button onClick={handleAddSetor} fullWidth variant="primary">
                    {currentSetor.isEditing ? '✓ CONFIRMAR Alteração (Salvar na Lista)' : '✓ Adicionar Setor à Estrutura'}
                </Button>
                {currentSetor.isEditing && (
                    <Button onClick={handleCancelEdit} fullWidth variant="outline" style={{ marginTop: '10px' }}>
                        Cancelar Edição
                    </Button>
                )}
            </Card>

            {/* Lista de Setores Adicionados */}
            {setores.length > 0 && (
                <Card title={`Setores Adicionados (${setores.length})`}>
                    <div className="setores-list">
                        {setores.map((setor) => (
                            <div
                                key={setor.id}
                                className="setor-item"
                                style={{ borderLeftColor: HIERARCHY_COLORS[setor.hierarquia] }}
                            >
                                <div className="setor-info">
                                    <h4>{setor.nomeSetor}</h4>
                                    <p>
                                        {setor.tipoSetor} - Nível {setor.hierarquia}
                                        {setor.isAssessoria && ' (Assessoria)'}
                                    </p>
                                    <div className="setor-cargos">
                                        {setor.cargos.map((cargo, idx) => {
                                            // Encontrar símbolo correspondente na lista dinâmica
                                            // E mapear para código DAS se for o caso
                                            const dasKey = Object.keys(DESCRICOES_DAS).find(key =>
                                                DESCRICOES_DAS[key as keyof typeof DESCRICOES_DAS] === cargo.tipo
                                            );
                                            const label = dasKey || cargo.tipo;

                                            return (
                                                <span key={idx} className="cargo-badge">
                                                    {label} ({cargo.quantidade})
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="setor-item-actions">
                                    <button
                                        onClick={() => handleEditSetor(setor)}
                                        className="edit-setor-btn"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleRemoveSetor(setor.id)}
                                        className="remove-setor-btn"
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default EstruturaForm;
