/**
 * Formulário de Estrutura Organizacional
 * Versão atualizada: Filtros condicionais aplicados
 */
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';
import api from '../../services/api';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { HIERARCHY_LEVELS, SETOR_TYPES, HIERARCHY_COLORS, HIERARCHY_LABELS } from '../../constants/hierarchyLevels';
import { CARGOS_DAS } from '../../constants/cargosDAS';
import { PAGE_SIZE_OPTIONS } from '../../constants/pageSizes';
import { ORGAOS_OPTIONS, SUBPREFEITURAS, SUBPREFEITURAS_IDS, getOrgaoById } from '../../constants/orgaos';
import { validateSetor, validateNome } from '../../utils/validators';
import './EstruturaForm.css';

const EstruturaForm = ({ data, updateData, errors, disableOrgaoSelection = false }) => {
    const [currentSetor, setCurrentSetor] = useState({
        tipoSetor: '',
        nomeSetor: '',
        hierarquia: '',
        isAssessoria: false,
        parentId: null,
        cargos: [],
        isEditing: false
    });
    const [currentCargo, setCurrentCargo] = useState({ tipo: '', quantidade: 1 });
    const [tipoSetorOptions, setTipoSetorOptions] = useState([]); // Dicionário dinâmico do banco
    const [orgaosOptions, setOrgaosOptions] = useState([]); // Lista dinâmica de órgãos

    const setores = data.setores || [];
    const nomeOrgao = data.nomeOrgao || '';

    // Buscar lista de órgãos da API
    useEffect(() => {
        const fetchOrgaos = async () => {
            try {
                const response = await api.get('/orgaos');
                // IMPORTANTE: A API retorna { success: true, data: [...] }
                const orgaos = response.data.data || [];

                if (!Array.isArray(orgaos)) {
                    console.error('Órgãos não é um array:', orgaos);
                    return;
                }

                // Filtrar e formatar para o Select
                const formattedOptions = orgaos
                    .filter(orgao => orgao.id !== 'prefeito-municipal' && orgao.id !== 'vice-prefeito-municipal')
                    .map(orgao => ({
                        value: orgao.nome, // Valor agora é o nome real para evitar slugs na UI
                        label: orgao.nome.length > 85 ? orgao.nome.substring(0, 85) + '...' : orgao.nome
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label));

                setOrgaosOptions(formattedOptions);
            } catch (error) {
                console.error("Erro ao buscar órgãos:", error);
            }
        };

        fetchOrgaos();
    }, []);

    // Trava o órgão se houver qualquer setor Nível 1 ou Subprefeito (raízes)
    const orgaoTravado = setores.some(s => {
        const h = parseFloat(s.hierarquia);
        return h === 1 || h === 0.5;
    });

    const tamanhoFolha = data.tamanhoFolha || 'A3';

    // Carregar dicionário de tipos de setor do banco
    useEffect(() => {
        const fetchSectorConfig = async () => {
            try {
                const response = await api.get('/setores/config');
                setTipoSetorOptions(response.data.data || []);
            } catch (error) {
                console.error('Erro ao buscar dicionário de setores:', error);
            }
        };
        fetchSectorConfig();
    }, []);

    // Atualizar nome do órgão
    const handleNomeOrgaoChange = (e) => {
        updateData({ nomeOrgao: e.target.value });
    };

    // Atualizar tamanho da folha
    const handleTamanhoFolhaChange = (e) => {
        updateData({ tamanhoFolha: e.target.value });
    };

    // Atualizar campo do setor atual
    const handleSetorFieldChange = (field, value) => {
        setCurrentSetor(prev => {
            const newState = { ...prev, [field]: value };

            // Se mudou a hierarquia ou o pai, reseta a posição visual antiga
            // Isso força o motor de layout a recalcular a posição correta na nova estrutura
            if (field === 'hierarquia') {
                newState.tipoSetor = '';
                newState.parentId = null; // Resetar pai ao mudar de nível
                newState.position = null; // <--- CORREÇÃO: Limpa posição antiga (ex: lá embaixo)
            }

            if (field === 'parentId') {
                newState.position = null; // <--- CORREÇÃO: Limpa posição se mudar de pai
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

        // Para Subprefeituras, usar nome direto. Para outros, concatenar
        const nomeCompleto = hierarquia === 0.5
            ? `${currentSetor.tipoSetor} - ${currentSetor.nomeSetor}` // Subprefeitura - 1º Distrito
            : `${currentSetor.tipoSetor} de ${currentSetor.nomeSetor}`; // Secretaria de Governo

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
            parentId: null,
            cargos: [],
            isEditing: false
        });
    };

    const handleEditSetor = (setor) => {
        const hierarquia = parseFloat(setor.hierarquia);
        let tipoEncontrado = '';
        let nomeLimpo = setor.nomeSetor;

        // Tentar extrair tipo e nome baseado na hierarquia
        const tiposPossiveis = SETOR_TYPES[hierarquia] || [];

        for (const tipo of tiposPossiveis) {
            const separator = hierarquia === 0.5 ? ' - ' : ' de ';
            if (setor.nomeSetor.startsWith(tipo + separator)) {
                tipoEncontrado = tipo;
                nomeLimpo = setor.nomeSetor.replace(tipo + separator, '');
                break;
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
            parentId: null,
            cargos: [],
            isEditing: false
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

        // Priorizar opções vindas do banco de dados (Configurações)
        if (tipoSetorOptions.length > 0) {
            const hStr = hierarquia.toString();
            return tipoSetorOptions
                .filter(t => t.hierarquias.includes(hStr))
                .map(t => ({ value: t.nome, label: t.nome }));
        }

        // Fallback para a constante estática caso o banco falhe ou esteja vazio
        const tipos = SETOR_TYPES[hierarquia] || [];
        return tipos.map(tipo => ({ value: tipo, label: tipo }));
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

    // Opções de hierarquia (filtra Subprefeito se não for órgão Subprefeitura)
    const hierarquiaOptions = Object.entries(HIERARCHY_LEVELS)
        .filter(([key, value]) => {
            // Se não for órgão Subprefeitura, remove a opção Subprefeito
            if (!isOrgaoSubprefeitura && value === 0.5) {
                return false;
            }
            return true;
        })
        .map(([key, value]) => ({
            value: value,
            label: HIERARCHY_LABELS[value] || `Nível ${value}`
        }))
        .sort((a, b) => a.value - b.value);

    // Opções de cargos DAS
    const cargosOptions = CARGOS_DAS.map(cargo => ({
        value: cargo,
        label: cargo
    }));

    return (
        <div className="estrutura-form">
            {/* Configurações Gerais */}
            <Card title="Configurações Gerais" className="mb-24">
                <div className="form-row">
                    <Select
                        label="Nome do Órgão"
                        value={getOrgaoById(nomeOrgao)?.nome || nomeOrgao} // Resolve nome se for ID antigo
                        onChange={handleNomeOrgaoChange}
                        options={orgaosOptions}
                        placeholder="Selecione o órgão"
                        required
                        disabled={orgaoTravado || disableOrgaoSelection}
                        error={errors.nomeOrgao}
                        helperText={disableOrgaoSelection ? "Órgão fixado pelo modo Sandbox" : (orgaoTravado ? "Órgão travado após adicionar primeiro setor raiz" : "")}
                    />
                </div>


            </Card>

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
                <div className="form-row">
                    <Select
                        label="Hierarquia"
                        value={currentSetor.hierarquia}
                        onChange={(e) => handleSetorFieldChange('hierarquia', e.target.value)}
                        options={hierarquiaOptions}
                        required
                        placeholder="Selecione o nível hierárquico"
                    />
                    <Select
                        label="Tipo de Setor"
                        value={currentSetor.tipoSetor}
                        onChange={(e) => handleSetorFieldChange('tipoSetor', e.target.value)}
                        options={getTiposSetorOptions()}
                        required
                        placeholder="Selecione o tipo"
                        disabled={!currentSetor.hierarquia}
                    />
                </div>

                {/* Seleção de Setor Pai - Para níveis 2+ ou Assessoria */}
                {currentSetor.hierarquia && (parseFloat(currentSetor.hierarquia) > 1 || parseFloat(currentSetor.hierarquia) === 0) && setores.length > 0 && (
                    <Select
                        label="Setor Pai (Subordinado a)"
                        value={currentSetor.parentId || ''}
                        onChange={(e) => handleSetorFieldChange('parentId', e.target.value || null)}
                        options={(() => {
                            // Filtrar setores que podem ser pais
                            const hierarquiaAtual = parseFloat(currentSetor.hierarquia);

                            // Se for Assessoria (0), pode ser ligado a qualquer nível >= 1 OU a outra Assessoria (0)
                            if (hierarquiaAtual === 0) {
                                return setores
                                    .filter(s => parseFloat(s.hierarquia) >= 0 && s.id !== currentSetor.id) // Permite nível 0 (outra assessoria)
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

                {/* Nome do Setor - Input ou Select dependendo se é Subprefeito */}
                {isSubprefeito ? (
                    <Select
                        label="Nome do Setor"
                        value={currentSetor.nomeSetor}
                        onChange={(e) => handleSetorFieldChange('nomeSetor', e.target.value)}
                        options={subprefeituraOptions}
                        placeholder="Selecione o distrito"
                        required
                        helperText="Subprefeituras: selecione o distrito"
                    />
                ) : (
                    <Input
                        label="Nome do Setor"
                        value={currentSetor.nomeSetor}
                        onChange={(e) => handleSetorFieldChange('nomeSetor', e.target.value)}
                        placeholder="Ex: Governo, Educação, Saúde..."
                        required
                        helperText="Digite apenas o nome complementar. Ex: 'Governo' resultará em 'Secretaria de Governo'"
                    />
                )}

                {/* Setor Pai removido - calculado automaticamente baseado na hierarquia */}
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
                            {currentSetor.cargos.map((cargo, index) => (
                                <div key={index} className="cargo-item">
                                    <span>{cargo.tipo} - Quantidade: {cargo.quantidade}</span>
                                    <button onClick={() => handleRemoveCargo(index)} className="remove-btn">×</button>
                                </div>
                            ))}
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
                                        {setor.cargos.map((cargo, idx) => (
                                            <span key={idx} className="cargo-badge">
                                                {cargo.tipo} ({cargo.quantidade})
                                            </span>
                                        ))}
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
