/**
 * Formulário de Organograma de Funções
 */
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { HIERARCHY_LEVELS, HIERARCHY_COLORS } from '../../constants/hierarchyLevels';
import { CARGOS_DAS } from '../../constants/cargosDAS';
import { getOrgaoById } from '../../constants/orgaos';
import { validateCargo } from '../../utils/validators';
import api from '../../services/api';
import './FuncoesForm.css';

const FuncoesForm = ({ data, updateData, errors }) => {
    const [currentCargo, setCurrentCargo] = useState({
        prefixo: '',
        complementoNome: '',
        ocupante: '',
        hierarquia: '',
        isAssessoria: false,
        parentId: null,
        setorRef: null,
        simbolos: []
    });
    const [currentSimbolo, setCurrentSimbolo] = useState({ tipo: '', quantidade: 1 });

    const [prefixosOptions, setPrefixosOptions] = useState([]);
    const [setoresOptions, setSetoresOptions] = useState([]);

    // Buscar prefixos do backend
    React.useEffect(() => {
        const fetchPrefixos = async () => {
            try {
                const response = await api.get('/prefixos');
                if (response.data && response.data.success) {
                    const options = response.data.data.map(p => ({
                        value: p.nome,
                        label: p.nome
                    }));
                    setPrefixosOptions(options);
                }
            } catch (error) {
                console.error('Erro ao buscar prefixos:', error);
                // Fallback silencioso ou notificação de erro
            }
        };
        fetchPrefixos();
    }, []);
    const [orgaosOptions, setOrgaosOptions] = useState([]);

    // Buscar lista de órgãos da API
    React.useEffect(() => {
        const fetchOrgaos = async () => {
            try {
                const response = await api.get('/orgaos');
                const orgaos = response.data.data || []; // Ajuste para pegar o array correto

                if (!Array.isArray(orgaos)) return;

                // Filtrar e formatar para o Select
                const formattedOptions = orgaos
                    .filter(orgao => orgao.id !== 'prefeito-municipal' && orgao.id !== 'vice-prefeito-municipal')
                    .map(orgao => ({
                        value: orgao.id,
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

    const cargos = data.cargos || [];
    const nomeOrgao = data.nomeOrgao || '';

    // Trava o órgão se houver qualquer cargo Nível 1 ou Subprefeito-Cargo (raízes)
    const orgaoTravado = cargos.some(c => {
        const h = parseFloat(c.hierarquia);
        return h === 1 || h === 0.5;
    });

    const tamanhoFolha = data.tamanhoFolha || 'A3';

    // Helper para achatar árvore de setores
    const flattenSetoresForOptions = (nodes) => {
        let options = [];
        if (!nodes || !Array.isArray(nodes)) return [];

        nodes.forEach(node => {
            options.push({
                value: node.id,
                label: node.nomeSetor || node.nome // Garantir compatibilidade de nome
            });
            if (node.children && node.children.length > 0) {
                options = options.concat(flattenSetoresForOptions(node.children));
            }
        });
        return options;
    };

    // Verificar se o órgão existe e carregar setores estruturais
    React.useEffect(() => {
        const checkOrgao = async () => {
            if (!nomeOrgao) {
                setSetoresOptions([]);
                return;
            }

            try {
                // Resolver nome real se for um ID conhecido
                const orgaoInfo = getOrgaoById(nomeOrgao);
                const nomeParaChecar = orgaoInfo ? orgaoInfo.nome : nomeOrgao;

                const response = await api.get(`/organogramas/${encodeURIComponent(nomeParaChecar)}`);
                const data = response.data?.data;

                // Carregar setores estruturais para referência
                if (data?.organogramaEstrutural?.setores) {
                    const flatSetores = flattenSetoresForOptions(data.organogramaEstrutural.setores);
                    // Ordenar alfabeticamente para facilitar busca
                    flatSetores.sort((a, b) => a.label.localeCompare(b.label));
                    setSetoresOptions(flatSetores);
                } else {
                    setSetoresOptions([]);
                }

            } catch (error: any) {
                if (error.response && error.response.status === 404) {
                    setSetoresOptions([]);
                }
            }
        };

        checkOrgao();

        const timeoutId = setTimeout(() => {
            if (nomeOrgao) {
                checkOrgao();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [nomeOrgao]);

    // Atualizar nome do órgão
    const handleNomeOrgaoChange = (e) => {
        updateData({ nomeOrgao: e.target.value });
    };



    // Atualizar campo do cargo atual
    const handleCargoFieldChange = (field, value) => {
        setCurrentCargo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Adicionar símbolo ao cargo atual (Agrupando por tipo)
    const handleAddSimbolo = () => {
        if (currentSimbolo.tipo && currentSimbolo.quantidade > 0) {
            setCurrentCargo(prev => {
                const existingIndex = prev.simbolos.findIndex(s => s.tipo === currentSimbolo.tipo);

                let newSimbolos;
                if (existingIndex >= 0) {
                    // Símbolo já existe: Soma a quantidade
                    newSimbolos = [...prev.simbolos];
                    newSimbolos[existingIndex] = {
                        ...newSimbolos[existingIndex],
                        quantidade: newSimbolos[existingIndex].quantidade + currentSimbolo.quantidade
                    };
                } else {
                    // Símbolo novo: Adiciona à lista
                    newSimbolos = [...prev.simbolos, { ...currentSimbolo }];
                }

                return {
                    ...prev,
                    simbolos: newSimbolos
                };
            });
            setCurrentSimbolo({ tipo: '', quantidade: 1 });
        }
    };

    // Remover símbolo do cargo atual
    const handleRemoveSimbolo = (index) => {
        setCurrentCargo(prev => ({
            ...prev,
            simbolos: prev.simbolos.filter((_, i) => i !== index)
        }));
    };

    // Adicionar/Atualizar cargo à lista
    const handleAddCargo = () => {
        // Gerar nome completo concatenado
        const nomeCompleto = currentCargo.prefixo && currentCargo.complementoNome
            ? `${currentCargo.prefixo} de ${currentCargo.complementoNome}`
            : currentCargo.prefixo || currentCargo.complementoNome || '';

        const cargoParaValidar = {
            ...currentCargo,
            nomeCargo: nomeCompleto
        };

        const validation = validateCargo(cargoParaValidar);

        if (validation.valid) {
            if (currentCargo.isEditing) {
                // Atualizar cargo existente
                const { isEditing, prefixo, complementoNome, ...cargoLimpo } = cargoParaValidar;
                updateData({
                    cargos: cargos.map(c => c.id === cargoLimpo.id ? cargoLimpo : c)
                });
            } else {
                // Adicionar novo cargo
                const novoCargo = {
                    ...cargoParaValidar,
                    id: uuidv4(),
                    isAssessoria: parseInt(currentCargo.hierarquia) === 0,
                    // Se for nível 1, pai é null. Se for 0 (Assessoria) ou outros níveis, deve ter pai.
                    parentId: parseInt(currentCargo.hierarquia) === 1 ? null : currentCargo.parentId
                };

                updateData({
                    cargos: [...cargos, novoCargo]
                });
            }

            // Resetar formulário
            setCurrentCargo({
                prefixo: '',
                complementoNome: '',
                ocupante: '',
                hierarquia: '',
                isAssessoria: false,
                parentId: null,
                setorRef: null,
                simbolos: []
            });
        } else {
            // Mostrar erros de validação ao usuário
            const errorMessages = validation.errors?.join('\n') || 'Dados inválidos. Verifique os campos.';
            alert('⚠️ Não foi possível adicionar o cargo:\n\n' + errorMessages);
        }
    };

    // Remover cargo da lista com proteção de integridade
    const handleRemoveCargo = (id) => {
        const cargoParaRemover = cargos.find(c => c.id === id);
        if (!cargoParaRemover) return;

        const h = parseFloat(cargoParaRemover.hierarquia);
        const isCargoRaiz = h === 1 || h === 0.5;

        // Se for o único cargo raiz (Nível 1)
        if (isCargoRaiz) {
            const outrasRaizes = cargos.filter(c => {
                const ch = parseFloat(c.hierarquia);
                return (ch === 1 || ch === 0.5) && c.id !== id;
            });

            if (outrasRaizes.length === 0) {
                const confirmar = window.confirm("TEM CERTEZA QUE DESEJA DELETAR?");

                if (!confirmar) return;

                // Se confirmou, limpa tudo
                updateData({ cargos: [] });
                return;
            }
        }

        // Remoção padrão
        updateData({
            cargos: cargos.filter(c => c.id !== id)
        });
    };

    // Opções de hierarquia
    const hierarquiaOptions = Object.entries(HIERARCHY_LEVELS)
        .map(([key, value]) => ({
            value: value.toString(),
            label: key === 'ASSESSORIA' ? 'Assessoria (0)' : `Nível ${value}`
        }));

    // Opções de símbolos DAS
    const simbolosOptions = CARGOS_DAS.map(cargo => ({
        value: cargo,
        label: cargo
    }));

    // Opções de cargos pai (apenas cargos já adicionados)
    const cargosPaiOptions = cargos.map(cargo => ({
        value: cargo.id,
        label: `${cargo.nomeCargo} (Nível ${cargo.hierarquia})`
    }));

    // Carregar cargo para edição
    const handleEditCargo = (cargo) => {
        // Tentar separar o nome em prefixo + complemento
        let prefixoEncontrado = '';
        let complementoEncontrado = cargo.nomeCargo;

        // Usar prefixos carregados do backend
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
            isEditing: true
        });

        // Rolar para o topo do formulário de cargo
        const formElement = document.querySelector('.funcoes-form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Cancelar edição
    const handleCancelEdit = () => {
        setCurrentCargo({
            prefixo: '',
            complementoNome: '',
            ocupante: '',
            isAssessoria: false,
            parentId: null,
            setorRef: null,
            simbolos: []
        });
    };

    return (
        <div className="funcoes-form">
            {/* Configurações Gerais */}
            <Card title="Configurações Gerais" className="mb-24">
                <div className="form-row">
                    <Select
                        label="Nome do Órgão"
                        value={nomeOrgao}
                        onChange={handleNomeOrgaoChange}
                        options={orgaosOptions}
                        placeholder="Selecione o órgão"
                        required
                        disabled={orgaoTravado}
                        error={errors.nomeOrgao}
                        helperText={orgaoTravado ? "Órgão travado após adicionar primeiro cargo" : "Selecione o órgão para criar o diagrama funcional"}
                    />
                </div>


            </Card>

            {/* Adicionar Cargo */}
            <Card title="Adicionar Cargo/Função" className="mb-24">
                <div className="cargo-inputs-grid">
                    <div className="grid-item-prefixo">
                        <Select
                            label="Prefixo do Cargo"
                            value={currentCargo.prefixo}
                            onChange={(e) => handleCargoFieldChange('prefixo', e.target.value)}
                            options={prefixosOptions}
                            placeholder="Selecione..."
                            required
                            helperText="Ex: Secretário, Diretor..."
                        />
                    </div>
                    <div className="grid-item-complemento">
                        <Input
                            label="Complemento do Nome"
                            value={currentCargo.complementoNome}
                            onChange={(e) => handleCargoFieldChange('complementoNome', e.target.value)}
                            placeholder="Ex: de Governo, de Dados..."
                            required
                            helperText="Conectivo ' de ' é automático"
                        />
                    </div>
                    <div className="grid-item-ocupante">
                        <Input
                            label="Nome do Ocupante"
                            value={currentCargo.ocupante}
                            onChange={(e) => handleCargoFieldChange('ocupante', e.target.value)}
                            placeholder="Ex: João da Silva"
                            required={false}
                            helperText="Opcional"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <Select
                        label="Hierarquia"
                        value={currentCargo.hierarquia}
                        onChange={(e) => handleCargoFieldChange('hierarquia', e.target.value)}
                        options={hierarquiaOptions}
                        required
                        placeholder="Selecione o nível hierárquico"
                    />

                    {/* Seleção de Cargo Pai - Renderização Condicional */}
                    {currentCargo.hierarquia && parseInt(currentCargo.hierarquia) !== 1 && cargos.length > 0 && (
                        <Select
                            label="Cargo Pai (Subordinado a)"
                            value={currentCargo.parentId || ''}
                            onChange={(e) => handleCargoFieldChange('parentId', e.target.value || null)}
                            options={cargosPaiOptions}
                            placeholder="Selecione o cargo pai"
                            helperText="Escolha a qual cargo este estará subordinado"
                        />
                    )}
                </div>

                {/* Setor de Referência */}
                <div className="form-row">
                    <Select
                        label="Setor de Referência (Estrutural)"
                        value={currentCargo.setorRef || ''}
                        onChange={(e) => handleCargoFieldChange('setorRef', e.target.value || null)}
                        options={setoresOptions}
                        placeholder="Selecione o setor estrutural correspondente"
                        helperText="Vincula este cargo a um setor estrutural para filtros cruzados"
                    />
                </div>

                {/* Símbolos */}
                <div className="simbolos-section">
                    <h4>Símbolos DAS</h4>
                    <p className="helper-text">
                        Adicione os símbolos (cargos) que compõem esta função.
                        {currentCargo.hierarquia >= 5 && currentCargo.hierarquia <= 10 && (
                            <span className="info-badge">
                                ℹ️ Níveis 5-10 serão agrupados automaticamente na visualização
                            </span>
                        )}
                    </p>
                    <div className="form-row">
                        <Select
                            label="Tipo de Símbolo"
                            value={currentSimbolo.tipo}
                            onChange={(e) => setCurrentSimbolo(prev => ({ ...prev, tipo: e.target.value }))}
                            options={simbolosOptions}
                            placeholder="Selecione o símbolo"
                        />
                        <Input
                            label="Quantidade"
                            type="number"
                            value={currentSimbolo.quantidade}
                            onChange={(e) => setCurrentSimbolo(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                            min="1"
                        />
                        <div className="add-simbolo-btn">
                            <Button onClick={handleAddSimbolo} variant="secondary">
                                + Adicionar Símbolo
                            </Button>
                        </div>
                    </div>

                    {currentCargo.simbolos.length > 0 && (
                        <div className="simbolos-list">
                            {currentCargo.simbolos.map((simbolo, index) => (
                                <div key={index} className="simbolo-item">
                                    <span>{simbolo.tipo} - Quantidade: {simbolo.quantidade}</span>
                                    <button onClick={() => handleRemoveSimbolo(index)} className="remove-btn">×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button onClick={handleAddCargo} fullWidth variant="primary">
                    {currentCargo.isEditing ? '✓ Atualizar Cargo' : '✓ Adicionar Cargo ao Organograma'}
                </Button>
                {currentCargo.isEditing && (
                    <Button onClick={handleCancelEdit} fullWidth variant="outline" style={{ marginTop: '10px' }}>
                        Cancelar Edição
                    </Button>
                )}
            </Card>

            {/* Lista de Cargos Adicionados */}
            {cargos.length > 0 && (
                <Card title={`Cargos Adicionados (${cargos.length})`}>
                    <div className="cargos-list">
                        {cargos.map((cargo) => (
                            <div
                                key={cargo.id}
                                className="cargo-item-card"
                                style={{ borderLeftColor: HIERARCHY_COLORS[cargo.hierarquia] }}
                            >
                                <div className="cargo-info">
                                    <h4>{cargo.nomeCargo}</h4>
                                    <p>
                                        Nível {cargo.hierarquia}
                                        {cargo.isAssessoria && ' (Assessoria)'}
                                    </p>
                                    <div className="cargo-simbolos">
                                        {cargo.simbolos.map((simbolo, idx) => (
                                            <span key={idx} className="simbolo-badge">
                                                {simbolo.tipo} ({simbolo.quantidade})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="cargo-item-actions">
                                    <button
                                        onClick={() => handleEditCargo(cargo)}
                                        className="edit-cargo-btn"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleRemoveCargo(cargo.id)}
                                        className="remove-cargo-btn"
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

export default FuncoesForm;
