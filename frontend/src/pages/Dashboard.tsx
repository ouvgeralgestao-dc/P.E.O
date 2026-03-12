import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import api from '../services/api';
import MultiSelect from '../components/common/MultiSelect';
import ChartCard from '../components/common/ChartCard';
import DetailedTableCard from '../components/common/DetailedTableCard';
import ConsolidatedTableCard from '../components/common/ConsolidatedTableCard';
import Button from '../components/common/Button';
import BackButton from '../components/common/BackButton';
import Icons from '../components/common/Icons';
import { DESCRICOES_DAS } from '../constants/cargosDAS';
import './Dashboard.css';

interface Organograma {
    id: string;
    orgaoId?: string;
    orgao: string;
    tipo?: string;
    createdAt?: string;
    updatedAt?: string;
    organogramaEstrutural?: {
        setores: any[];
        tamanhoFolha?: string;
    } | null;
    organogramasFuncoes?: any[] | null;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [organogramas, setOrganogramas] = useState<Organograma[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, estruturais: 0, funcoes: 0 });
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrgaos, setSelectedOrgaos] = useState<string[]>([]);
    const [selectedSetores, setSelectedSetores] = useState<string[]>([]);
    const [selectedSimbolos, setSelectedSimbolos] = useState<string[]>([]);
    const [selectedPrefixos, setSelectedPrefixos] = useState<string[]>([]);

    // Funções de utilidade movidas para fora ou estabilizadas
    const formatOrgaoName = useCallback((name: string) => {
        if (!name) return '';
        // Se já tiver espaços, assume que é nome e não slug. Se tiver _, substitui por espaço.
        const cleanName = name.replace(/_/g, ' ');
        return cleanName
            .split(' ')
            .map((word, index) => {
                const lower = word.toLowerCase();
                // Lista de preposições que devem ficar em minúsculo (exceto se for a primeira palavra)
                const ignoreList = ['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com'];
                if (index > 0 && ignoreList.includes(lower)) {
                    return lower;
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }, []);

    // Helper para reverter Descrição -> Código (ex: "Diretor" -> "DAS-8")
    const getDasCode = useCallback((descricao: string) => {
        if (!descricao) return '';
        const entry = Object.entries(DESCRICOES_DAS).find(([_, value]) => value === descricao);
        return entry ? entry[0] : descricao;
    }, []);

    const formatDate = useCallback((dateString?: string) => {
        if (!dateString) return 'M/D/YYYY';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            return 'M/D/YYYY';
        }
    }, []);

    const getOrgaoStats = useCallback((org: Organograma) => {
        let setoresCount = 0;
        let cargosCount = 0;
        let simbolosCount = 0;

        if (org.organogramaEstrutural?.setores) {
            const scan = (node: any) => {
                setoresCount++;
                if (node.cargos) {
                    node.cargos.forEach((c: any) => {
                        simbolosCount += (parseInt(c.quantidade) || 0);
                    });
                }
                if (node.children) node.children.forEach(scan);
            };
            org.organogramaEstrutural.setores.forEach(scan);
        }

        if (org.organogramasFuncoes && org.organogramasFuncoes.length > 0) {
            // Pegar apenas a versão mais recente para evitar duplicação
            const latestFunc = org.organogramasFuncoes[0];
            const scanFunc = (cargo: any) => {
                if (cargo.nomeCargo && cargo.ocupante) cargosCount++;
                if (cargo.children) cargo.children.forEach(scanFunc);
            };
            if (latestFunc.cargos) latestFunc.cargos.forEach(scanFunc);
        }

        return { setoresCount, cargosCount, simbolosCount };
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/organogramas');
            const apiData: Organograma[] = response.data.data || [];

            // Deduplicar dados por nome de órgão para evitar duplicidade se houver múltiplos registros
            const uniqueOrgansMap = new Map();
            apiData.forEach(org => {
                const name = org.orgao.toLowerCase().trim();
                if (!uniqueOrgansMap.has(name)) {
                    uniqueOrgansMap.set(name, org);
                }
            });
            const uniqueData = Array.from(uniqueOrgansMap.values());

            setOrganogramas(uniqueData);

            // Contagem de órgãos (não de diagramas individuais)
            const estruturais = uniqueData.filter(o => o.organogramaEstrutural).length;
            const funcoes = uniqueData.filter(o => o.organogramasFuncoes && o.organogramasFuncoes.length > 0).length;

            setStats({
                total: uniqueData.length,
                estruturais,
                funcoes
            });
        } catch (err: any) {
            logger.error('Dashboard', 'Erro ao carregar dados', err);
            setError('Não foi possível carregar os dados do dashboard.');
        } finally {
            setLoading(false);
        }
    };


    // Opções COMPLETAS (sem filtro) - usadas para manter todas as opções disponíveis nos dropdowns
    const allFilterOptions = useMemo(() => {
        const orgaosSet = new Set<string>();
        const setoresSet = new Set<string>();
        const simbolosSet = new Set<string>();
        const prefixosSet = new Set<string>();

        organogramas.forEach(org => {
            if (org.orgao) orgaosSet.add(org.orgao);

            if (org.organogramaEstrutural?.setores) {
                const processNode = (node: any) => {
                    if (node.nomeSetor) setoresSet.add(node.nomeSetor);
                    if (node.cargos) {
                        node.cargos.forEach((c: any) => {
                            if (c.tipo) simbolosSet.add(c.tipo);
                        });
                    }
                    if (node.children) node.children.forEach(processNode);
                };
                org.organogramaEstrutural.setores.forEach(processNode);
            }

            if (org.organogramasFuncoes) {
                org.organogramasFuncoes.forEach(func => {
                    const processCargo = (cargo: any) => {
                        if (cargo.nomeCargo) {
                            const prefixo = cargo.nomeCargo.split(' ')[0];
                            if (prefixo) prefixosSet.add(prefixo);
                        }
                        if (cargo.children) cargo.children.forEach(processCargo);
                    };
                    if (func.cargos) func.cargos.forEach(processCargo);
                });
            }
        });

        return {
            orgaos: Array.from(orgaosSet).sort().map(v => ({ value: v, label: v })),
            setores: Array.from(setoresSet).sort().map(v => ({ value: v, label: v })),
            simbolos: Array.from(simbolosSet).sort().map(v => ({ value: v, label: v })),
            prefixos: Array.from(prefixosSet).sort().map(v => ({ value: v, label: v }))
        };
    }, [organogramas]);

    // Usar as opções completas para os dropdowns (sem cross-filtering para evitar problemas de UX)
    const filterOptions = allFilterOptions;

    // Lógica de Filtragem Cascateada
    const filteredOrganogramas = useMemo(() => {
        return organogramas.filter(org => {
            // Filtro por Nome (Search)
            const matchesSearch = org.orgao.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Filtro por Órgão
            if (selectedOrgaos.length > 0 && !selectedOrgaos.includes(org.orgao)) return false;

            // Filtro por Conteúdo (Setor, Símbolo, Prefixo) - Lógica OR (qualquer um pode ser usado independentemente)
            if (selectedSetores.length > 0 || selectedSimbolos.length > 0 || selectedPrefixos.length > 0) {
                let matchesSetor = false;
                let matchesSimbolo = false;
                let matchesPrefixo = false;

                // Verificar na Estrutura (Setores e Símbolos)
                if (org.organogramaEstrutural?.setores) {
                    const checkEstrutura = (node: any) => {
                        // Verificar Setor
                        if (selectedSetores.length > 0 && selectedSetores.includes(node.nomeSetor)) {
                            matchesSetor = true;
                        }
                        // Verificar Símbolo
                        if (selectedSimbolos.length > 0 && node.cargos) {
                            if (node.cargos.some((c: any) => selectedSimbolos.includes(c.tipo))) {
                                matchesSimbolo = true;
                            }
                        }
                        if (node.children) node.children.forEach(checkEstrutura);
                    };
                    org.organogramaEstrutural.setores.forEach(checkEstrutura);
                }

                // Verificar nas Funções (Prefixos e Setor Ref)
                if ((selectedPrefixos.length > 0 || selectedSetores.length > 0) && org.organogramasFuncoes) {
                    const checkFuncoes = (cargo: any) => {
                        const prefixo = cargo.nomeCargo?.split(' ')[0];
                        if (selectedPrefixos.length > 0 && selectedPrefixos.includes(prefixo)) {
                            matchesPrefixo = true;
                        }
                        // Verificar Setor de Referência
                        if (selectedSetores.length > 0 && cargo.nome_setor_ref && selectedSetores.includes(cargo.nome_setor_ref)) {
                            matchesSetor = true;
                        }

                        if (cargo.children) cargo.children.forEach(checkFuncoes);
                    };
                    org.organogramasFuncoes.forEach(f => f.cargos?.forEach(checkFuncoes));
                }

                // Verificar se pelo menos um dos filtros ativos foi satisfeito
                const hasSetorFilter = selectedSetores.length > 0;
                const hasSimboloFilter = selectedSimbolos.length > 0;
                const hasPrefixoFilter = selectedPrefixos.length > 0;

                // Se o filtro está ativo mas não foi satisfeito, rejeitar
                if (hasSetorFilter && !matchesSetor) return false;
                if (hasSimboloFilter && !matchesSimbolo) return false;
                if (hasPrefixoFilter && !matchesPrefixo) return false;
            }

            return true;
        });
    }, [organogramas, searchTerm, selectedOrgaos, selectedSetores, selectedSimbolos, selectedPrefixos]);

    // Estatísticas FILTRADAS - respondem aos filtros selecionados
    const filteredStats = useMemo(() => {
        const total = filteredOrganogramas.length;
        const estruturais = filteredOrganogramas.filter(o => o.organogramaEstrutural).length;
        const funcoes = filteredOrganogramas.filter(o => o.organogramasFuncoes && o.organogramasFuncoes.length > 0).length;
        return { total, estruturais, funcoes };
    }, [filteredOrganogramas]);

    // Helper memoizado para evitar recalcular estatísticas de cards a cada render
    // IMPORTANTE: Usa `organogramas` (sem filtro) para que os cards de órgãos não sejam afetados pelos filtros gerais
    const organogramasComStats = useMemo(() => {
        return organogramas.map(org => ({
            ...org,
            stats: getOrgaoStats(org)
        }));
    }, [organogramas, getOrgaoStats]);

    // 1. Componente de Card Memoizado (Órgão Individual)
    const OrgaoCard = memo(({ org, onVisualize, formatDate, formatOrgaoName }: any) => {
        return (
            <div className="orgao-card">
                <div className="orgao-card-header-badges">
                    {org.organogramaEstrutural && <span className="badge badge-estrutural">ESTRUTURAL</span>}
                    {org.organogramasFuncoes && org.organogramasFuncoes.length > 0 && <span className="badge badge-funcional">FUNCIONAL</span>}
                </div>
                <div className="orgao-card-body">
                    <h3 className="orgao-name">{formatOrgaoName(org.orgao)}</h3>
                    <div className="orgao-stats">
                        <span><Icons name="refresh" size={14} className="mr-1" /> {formatDate(org.updatedAt || org.createdAt)}</span>
                        <span><Icons name="chart" size={14} className="mr-1" /> {org.stats.setoresCount} setores</span>
                        <span><Icons name="printer" size={14} className="mr-1" /> {org.stats.simbolosCount} símbolos</span>
                    </div>
                </div>
                <div className="orgao-card-actions">
                    <Button
                        variant="primary"
                        fullWidth
                        className="btn-visualizar-full"
                        onClick={() => onVisualize(org)}
                    >
                        <Icons name="eye" className="mr-2" />
                        Visualizar
                    </Button>

                    {/* Botão Premium para criar Funcional se apenas Estrutural existir */}
                    {org.organogramaEstrutural && (!org.organogramasFuncoes || org.organogramasFuncoes.length === 0) && (
                        <Button
                            variant="primary"
                            fullWidth
                            className="btn-criar-funcional-premium"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                navigate(`/criar?tipo=funcoes&orgao=${encodeURIComponent(org.orgao)}`);
                            }}
                        >
                            <Icons name="plus" className="mr-2" />
                            CRIAR ORGANOGRAMA FUNCIONAL
                        </Button>
                    )}
                </div>
            </div>
        );
    });

    // 2. Componente de Filtros Memoizado
    const FilterSection = memo(({ filterOptions, selectedOrgaos, setSelectedOrgaos, selectedSetores, setSelectedSetores, selectedSimbolos, setSelectedSimbolos, selectedPrefixos, setSelectedPrefixos }: any) => {
        return (
            <div className="dashboard-controls-section" style={{ marginTop: '32px' }}>
                <div className="filters-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    <MultiSelect
                        label="Órgão"
                        options={filterOptions.orgaos}
                        value={selectedOrgaos}
                        onChange={setSelectedOrgaos}
                        placeholder="Todos os Órgãos"
                    />
                    <MultiSelect
                        label="Setor"
                        options={filterOptions.setores}
                        value={selectedSetores}
                        onChange={setSelectedSetores}
                        placeholder="Todos os Setores"
                    />
                    <MultiSelect
                        label="Símbolo"
                        options={filterOptions.simbolos}
                        value={selectedSimbolos}
                        onChange={setSelectedSimbolos}
                        placeholder="Todos os Símbolos"
                    />
                    <MultiSelect
                        label="Prefixo"
                        options={filterOptions.prefixos}
                        value={selectedPrefixos}
                        onChange={setSelectedPrefixos}
                        placeholder="Todos os Prefixos"
                    />
                </div>
            </div>
        );
    });

    // 3. Componente de Estatísticas Memoizado
    const StatsSection = memo(({ stats, totalCargosFull, totalSetores, totalSimbolosFull }: any) => {
        return (
            <div className="stats-grid" style={{ marginTop: '32px' }}>
                <div className="stat-card stat-info">
                    <div className="stat-icon"><Icons name="chart" size={32} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.estruturais}</div>
                        <div className="stat-label">ORGANOGRAMAS ESTRUTURAIS</div>
                    </div>
                </div>
                <div className="stat-card stat-purple">
                    <div className="stat-icon"><Icons name="printer" size={32} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.funcoes}</div>
                        <div className="stat-label">ORGANOGRAMAS FUNCIONAIS</div>
                    </div>
                </div>
                <div className="stat-card stat-primary">
                    <div className="stat-icon"><Icons name="eye" size={32} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total de Órgãos</div>
                    </div>
                </div>
                <div className="stat-card stat-warning">
                    <div className="stat-icon"><Icons name="palette" size={32} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalSetores}</div>
                        <div className="stat-label">Total de Setores</div>
                    </div>
                </div>
                <div className="stat-card stat-indigo">
                    <div className="stat-icon"><Icons name="edit" size={32} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalSimbolosFull}</div>
                        <div className="stat-label">Total de Símbolos</div>
                    </div>
                </div>
                <div className="stat-card stat-success">
                    <div className="stat-icon"><Icons name="plus" size={32} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalCargosFull}</div>
                        <div className="stat-label">Total de Cargos</div>
                    </div>
                </div>
            </div>
        );
    });

    // Cálculos de Estatísticas Filtradas (Totais Full Recursivos)
    const { totalSetores, totalCargosFull, totalSimbolosFull, isConsistent } = useMemo(() => {
        let totalSetoresCount = 0;
        let totalCargosCount = 0;
        let totalSimbolosCount = 0;

        filteredOrganogramas.forEach(org => {
            const { cargosCount, simbolosCount } = getOrgaoStats(org);

            if (org.organogramaEstrutural?.setores) {
                const processEstrutura = (node: any) => {
                    totalSetoresCount++;
                    if (node.children) node.children.forEach(processEstrutura);
                };
                org.organogramaEstrutural.setores.forEach(processEstrutura);
            }
            totalCargosCount += cargosCount;
            totalSimbolosCount += simbolosCount;
        });

        const consistent = totalCargosCount === totalSimbolosCount;

        return {
            totalSetores: totalSetoresCount,
            totalCargosFull: totalCargosCount,
            totalSimbolosFull: totalSimbolosCount,
            isConsistent: consistent
        };
    }, [filteredOrganogramas, getOrgaoStats]);

    // Helper de Ordenação Hierárquica
    const getSymbolRank = useCallback((symbol: string) => {
        const s = symbol.toUpperCase().trim();

        // 1. Topo da Pirâmide
        if (s === 'DAS-S') return 1;
        if (s === 'SS') return 2;
        if (s === 'VP') return 3;

        // 2. FC-1 (Solicitado explicitamente após DAS-S)
        if (s === 'FC-1') return 5;
        if (s === 'FC-2') return 6; // Caso exista

        // 3. DAS Numéricos (DAS-10A -> DAS-1)
        // Usamos regex para extrair o número. Quanto maior o número, menor o rank (aparece antes)
        const matchDas = s.match(/^DAS-(\d+)/);
        if (matchDas) {
            const num = parseInt(matchDas[1]);
            // Ex: DAS-10 -> 20 - 10 = 10
            // Ex: DAS-1 -> 20 - 1 = 19
            return 20 - num;
        }

        // 4. CAI / DAI
        const matchDai = s.match(/^DAI-(\d+)/);
        if (matchDai) {
            const num = parseInt(matchDai[1]);
            return 40 - num; // 40-10=30 ... 40-1=39
        }

        // 5. Outros (Ficam no final)
        return 100;
    }, []);

    const sortSymbolsByRank = useCallback((a: any, b: any) => {
        // Suporta tanto objeto com 'label' quanto 'tipo' (para o caso consolidado)
        const labelA = a.label || a.tipo || '';
        const labelB = b.label || b.tipo || '';
        return getSymbolRank(labelA) - getSymbolRank(labelB);
    }, [getSymbolRank]);

    // Dados para os Gráficos (com filtragem interna por setor, símbolo e prefixo)
    const { chartDataSimbolos, chartDataCargosDetalhados, setoresPorOrgaoFull, cargosPorOrgaoFull, simbolosPorOrgaoFull, cargosPorSetorNaoNivel1Full } = useMemo(() => {
        const simbolosCount: Record<string, number> = {};
        const cargosPrefix: Record<string, { total: number, simbolosMap: Record<string, number> }> = {};
        const orgaoStats: Record<string, { setores: Set<string>; cargos: number; simbolos: number, simbolosMap: Record<string, number> }> = {};
        const setorStats: Record<string, { total: number, simbolosMap: Record<string, number> }> = {};

        filteredOrganogramas.forEach(org => {
            const oName = org.orgao;
            if (!orgaoStats[oName]) orgaoStats[oName] = { setores: new Set(), cargos: 0, simbolos: 0, simbolosMap: {} };

            // Estatísticas da Estrutura
            if (org.organogramaEstrutural?.setores) {
                const processEstrutura = (node: any, level = 0) => {
                    const setorPassaFiltro = selectedSetores.length === 0 || selectedSetores.includes(node.nomeSetor);
                    let setorTemSimbolo = true;
                    if (selectedSimbolos.length > 0) {
                        setorTemSimbolo = node.cargos && node.cargos.some((c: any) => selectedSimbolos.includes(c.tipo));
                    }

                    if (node.nomeSetor && setorPassaFiltro && setorTemSimbolo) {
                        orgaoStats[oName].setores.add(node.nomeSetor);
                    }

                    if (node.cargos) {
                        if (setorPassaFiltro) {
                            node.cargos.forEach((c: any) => {
                                const simboloPassaFiltro = selectedSimbolos.length === 0 || selectedSimbolos.includes(c.tipo);
                                if (simboloPassaFiltro) {
                                    const qtd = (parseInt(c.quantidade) || 0);
                                    simbolosCount[c.tipo] = (simbolosCount[c.tipo] || 0) + qtd;
                                    orgaoStats[oName].simbolos += qtd;

                                    if (level > 0 && node.nomeSetor) {
                                        if (!setorStats[node.nomeSetor]) {
                                            setorStats[node.nomeSetor] = { total: 0, simbolosMap: {} };
                                        }
                                        setorStats[node.nomeSetor].total += qtd;
                                        setorStats[node.nomeSetor].simbolosMap[c.tipo] = (setorStats[node.nomeSetor].simbolosMap[c.tipo] || 0) + qtd;
                                    }

                                    if (!orgaoStats[oName].simbolosMap) orgaoStats[oName].simbolosMap = {};
                                    orgaoStats[oName].simbolosMap[c.tipo] = (orgaoStats[oName].simbolosMap[c.tipo] || 0) + qtd;
                                }
                            });
                        }
                    }
                    if (node.children) node.children.forEach((c: any) => processEstrutura(c, level + 1));
                };
                org.organogramaEstrutural.setores.forEach(n => processEstrutura(n));
            }

            // Estatísticas das Funções
            if (org.organogramasFuncoes && org.organogramasFuncoes.length > 0) {
                const latestFunc = org.organogramasFuncoes[0];
                const processFuncao = (cargo: any) => {
                    if (cargo.nomeCargo) {
                        const prefixo = cargo.nomeCargo.split(' ')[0].trim();
                        const prefixoPassaFiltro = selectedPrefixos.length === 0 || selectedPrefixos.includes(prefixo);
                        const setorRefPassaFiltro = selectedSetores.length === 0 || (cargo.nome_setor_ref && selectedSetores.includes(cargo.nome_setor_ref));

                        if (prefixoPassaFiltro && setorRefPassaFiltro) {
                            if (!cargosPrefix[prefixo]) {
                                cargosPrefix[prefixo] = { total: 0, simbolosMap: {} };
                            }
                            const qtdCargo = parseInt(cargo.quantidade || cargo.qtd || '1') || 1;
                            cargosPrefix[prefixo].total += qtdCargo;
                            orgaoStats[oName].cargos += qtdCargo;

                            if (cargo.simbolos && Array.isArray(cargo.simbolos)) {
                                cargo.simbolos.forEach((sim: any) => {
                                    const qtdSim = parseInt(sim.quantidade) || 0;
                                    const tipoSim = sim.tipo;
                                    const simboloPassaFiltro = selectedSimbolos.length === 0 || selectedSimbolos.includes(tipoSim);
                                    if (tipoSim && qtdSim > 0 && simboloPassaFiltro) {
                                        cargosPrefix[prefixo].simbolosMap[tipoSim] = (cargosPrefix[prefixo].simbolosMap[tipoSim] || 0) + qtdSim;
                                    }
                                });
                            }
                        }
                    }
                    if (cargo.children) cargo.children.forEach(processFuncao);
                };
                if (latestFunc.cargos) latestFunc.cargos.forEach(processFuncao);
            }
        });

        // Aplicar ordenação hierárquica nos dados de saída
        return {
            // Sorting Chart 1: Símbolos (Principal change)
            chartDataSimbolos: Object.entries(simbolosCount)
                .map(([name, value]) => ({ label: getDasCode(name), value }))
                .sort(sortSymbolsByRank), // Ordenado por Rank

            // Sorting Chart 2: Detalhes de Símbolos dentro dos cargos
            chartDataCargosDetalhados: Object.entries(cargosPrefix)
                .map(([name, info]) => ({
                    label: name,
                    value: info.total,
                    details: Object.entries(info.simbolosMap)
                        .map(([sName, sValue]) => ({ label: getDasCode(sName), value: sValue }))
                        .sort(sortSymbolsByRank) // Ordenado por Rank
                }))
                .sort((a, b) => b.value - a.value),

            setoresPorOrgaoFull: Object.entries(orgaoStats)
                .filter(([_, s]) => s.setores.size > 0)
                .map(([name, s]) => ({
                    label: formatOrgaoName(name),
                    value: s.setores.size,
                    details: Array.from(s.setores).sort().map(setorName => ({ label: setorName, value: 1 }))
                })),

            cargosPorOrgaoFull: Object.entries(orgaoStats)
                .filter(([_, s]) => s.cargos > 0)
                .map(([orgaoName, s]) => {
                    const cargosPorPrefixo: Record<string, number> = {};
                    const orgData = filteredOrganogramas.find(o => o.orgao === orgaoName);
                    if (orgData?.organogramasFuncoes && orgData.organogramasFuncoes.length > 0) {
                        const latestFunc = orgData.organogramasFuncoes[0];
                        const collectCargos = (cargo: any) => {
                            if (cargo.nomeCargo) {
                                const prefixo = cargo.nomeCargo.split(' ')[0].trim();
                                const prefixoPassaFiltro = selectedPrefixos.length === 0 || selectedPrefixos.includes(prefixo);
                                const setorRefPassaFiltro = selectedSetores.length === 0 || (cargo.nome_setor_ref && selectedSetores.includes(cargo.nome_setor_ref));

                                if (prefixoPassaFiltro && setorRefPassaFiltro) {
                                    const qtd = parseInt(cargo.quantidade || cargo.qtd || '1') || 1;
                                    cargosPorPrefixo[prefixo] = (cargosPorPrefixo[prefixo] || 0) + qtd;
                                }
                            }
                            if (cargo.children) cargo.children.forEach(collectCargos);
                        };
                        if (latestFunc.cargos) latestFunc.cargos.forEach(collectCargos);
                    }
                    return {
                        label: formatOrgaoName(orgaoName),
                        value: s.cargos,
                        details: Object.entries(cargosPorPrefixo)
                            .map(([prefixo, qtd]) => ({ label: prefixo, value: qtd }))
                            .sort((a, b) => b.value - a.value)
                    };
                }),

            // Sorting Chart 3: Detalhes de Símbolos por Órgão
            simbolosPorOrgaoFull: Object.entries(orgaoStats)
                .filter(([_, s]) => s.simbolos > 0)
                .map(([name, s]) => ({
                    label: formatOrgaoName(name),
                    value: s.simbolos,
                    details: Object.entries(s.simbolosMap)
                        .map(([sName, sValue]) => ({ label: getDasCode(sName), value: sValue }))
                        .sort(sortSymbolsByRank) // Ordenado por Rank
                }))
                .sort((a, b) => b.value - a.value),

            // Sorting Chart 4: Detalhes de Símbolos por Setor
            cargosPorSetorNaoNivel1Full: Object.entries(setorStats)
                .map(([name, s]) => ({
                    label: name,
                    value: s.total,
                    details: Object.entries(s.simbolosMap)
                        .map(([sName, sValue]) => ({ label: getDasCode(sName), value: sValue }))
                        .sort(sortSymbolsByRank) // Ordenado por Rank
                }))
                .sort((a, b) => b.value - a.value)
        };
    }, [filteredOrganogramas, formatOrgaoName, selectedSetores, selectedSimbolos, selectedPrefixos, getSymbolRank, sortSymbolsByRank]);

    // Dados Consolidados (Setores + Símbolos por Órgão) - vindo do ESTRUTURAL
    const setoresESimbolosPorOrgao = useMemo(() => {
        const consolidatedData: any[] = [];

        filteredOrganogramas.forEach(org => {
            const orgaoName = org.orgao;
            const setoresData: Record<string, { setor: string; simbolos: Record<string, number> }> = {};
            let totalSetores = 0;
            let totalSimbolos = 0;

            if (org.organogramaEstrutural?.setores) {
                const processSetor = (node: any) => {
                    if (node.nomeSetor) {
                        const setorPassaFiltro = selectedSetores.length === 0 || selectedSetores.includes(node.nomeSetor);

                        // Coletar símbolos deste setor
                        const simbolosDoSetor: Record<string, number> = {};
                        let temSimboloNoFiltro = selectedSimbolos.length === 0;

                        if (node.cargos && Array.isArray(node.cargos)) {
                            node.cargos.forEach((c: any) => {
                                const qtd = parseInt(c.quantidade) || 0;
                                const tipo = c.tipo;

                                const simboloPassaFiltro = selectedSimbolos.length === 0 || selectedSimbolos.includes(tipo);
                                if (tipo && qtd > 0 && simboloPassaFiltro) {
                                    simbolosDoSetor[tipo] = (simbolosDoSetor[tipo] || 0) + qtd;
                                    totalSimbolos += qtd;
                                    if (selectedSimbolos.includes(tipo)) temSimboloNoFiltro = true;
                                }
                            });
                        }

                        // Só adiciona se passar pelos filtros de setor e símbolo
                        if (setorPassaFiltro && temSimboloNoFiltro && Object.keys(simbolosDoSetor).length > 0) {
                            totalSetores++;
                            if (!setoresData[node.id || node.nomeSetor]) {
                                setoresData[node.id || node.nomeSetor] = {
                                    setor: node.nomeSetor,
                                    simbolos: simbolosDoSetor
                                };
                            }
                        }
                    }
                    if (node.children) node.children.forEach(processSetor);
                };
                org.organogramaEstrutural.setores.forEach(processSetor);
            }

            if (Object.keys(setoresData).length > 0) {
                consolidatedData.push({
                    orgao: formatOrgaoName(orgaoName),
                    totalSetores,
                    totalSimbolos,
                    setores: Object.values(setoresData)
                        .map(s => ({
                            setor: s.setor,
                            simbolos: Object.entries(s.simbolos)
                                .map(([tipo, quantidade]) => ({ tipo: getDasCode(tipo), quantidade }))
                                .sort(sortSymbolsByRank)
                        }))
                        .sort((a, b) => {
                            const totalA = a.simbolos.reduce((sum, s) => sum + s.quantidade, 0);
                            const totalB = b.simbolos.reduce((sum, s) => sum + s.quantidade, 0);
                            return totalB - totalA;
                        })
                });
            }
        });

        return consolidatedData.sort((a, b) => b.totalSimbolos - a.totalSimbolos);
    }, [filteredOrganogramas, formatOrgaoName, selectedSetores, selectedSimbolos, sortSymbolsByRank]);

    const handleVisualizeClick = useCallback((org: Organograma) => {
        const hasEstrutural = !!org.organogramaEstrutural;
        const hasFuncional = !!(org.organogramasFuncoes && org.organogramasFuncoes.length > 0);

        // Se tiver os dois, abre a "Pasta do Órgão" para escolha (Tela Nova)
        if (hasEstrutural && hasFuncional) {
            navigate(`/orgao/${encodeURIComponent(org.orgao)}`);
            return;
        }

        // Se tiver apenas UM tipo, navega direto
        if (hasEstrutural) {
            navigate(`/visualizar/${encodeURIComponent(org.orgao)}?tipo=estrutura`);
        } else if (hasFuncional) {
            navigate(`/visualizar/${encodeURIComponent(org.orgao)}?tipo=funcoes`);
        } else {
            logger.warn('Dashboard', 'Órgão sem visualizações disponíveis', { orgao: org.orgao });
            alert('Nenhuma visualização disponível para este órgão.');
        }
    }, [navigate]);

    if (loading) return <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#64748b' }}>Carregando Dashboard...</div>;
    if (error) return <div className="error-container" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;

    return (
        <div className="dashboard textured-bg">
            <div className="container">
                <header className="dashboard-header" style={{ marginBottom: '32px' }}>
                    <h2 className="welcome-title">ESTRUTURA ORGANIZACIONAL</h2>
                    <p className="welcome-subtitle">Visão da estrutura organizacional da Prefeitura Municipal de Duque de Caxias</p>
                </header>

                {/* 1. GRID DE ÓRGÃOS (PREMIUM CARDS) */}
                <div className="organogramas-grid">
                    {filteredOrganogramas.length > 0 ? (
                        filteredOrganogramas.map(org => {
                            // Pegar os stats memoizados para este órgão específico
                            // (ou calcular on-the-fly se preferir, mas aqui usamos a lógica de stats que já temos)
                            const orgWithStats = {
                                ...org,
                                stats: getOrgaoStats(org)
                            };
                            return (
                                <OrgaoCard
                                    key={org.orgaoId || org.id}
                                    org={orgWithStats}
                                    onVisualize={handleVisualizeClick}
                                    formatDate={formatDate}
                                    formatOrgaoName={formatOrgaoName}
                                />
                            );
                        })
                    ) : (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <div className="empty-icon"><Icons name="info" size={48} /></div>
                            <h3>Nenhum Órgão Encontrado</h3>
                            <p>Tente ajustar os filtros acima para encontrar o que procura.</p>
                        </div>
                    )}
                </div>

                {/* 2. FILTROS */}
                <FilterSection
                    filterOptions={filterOptions}
                    selectedOrgaos={selectedOrgaos}
                    setSelectedOrgaos={setSelectedOrgaos}
                    selectedSetores={selectedSetores}
                    setSelectedSetores={setSelectedSetores}
                    selectedSimbolos={selectedSimbolos}
                    setSelectedSimbolos={setSelectedSimbolos}
                    selectedPrefixos={selectedPrefixos}
                    setSelectedPrefixos={setSelectedPrefixos}
                />

                {/* 3. ESTATÍSTICAS (usa filteredStats para responder aos filtros) */}
                <StatsSection
                    stats={filteredStats}
                    totalCargosFull={totalCargosFull}
                    totalSetores={totalSetores}
                    totalSimbolosFull={totalSimbolosFull}
                />

                {/* 4. ALERTA */}
                {!isConsistent && (
                    <div className="consistency-alert" style={{
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fcd34d',
                        borderRadius: '8px',
                        padding: '16px',
                        marginTop: '32px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                    }}>
                        <span style={{ fontSize: '24px', marginTop: '-2px' }}>⚠️</span>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '4px', color: '#92400e', fontSize: '16px' }}>
                                Cargos e Símbolos estão discrepantes. É necessário verificar as informações inseridas nos organogramas!
                            </strong>
                            <span style={{ display: 'block', lineHeight: '1.5', color: '#b45309' }}>
                                A quantidade de <strong>Símbolos</strong> (Organogramas Estruturais) difere da quantidade de <strong>Cargos</strong> (Organogramas Funcionais).
                                <br />
                                Por favor, verifique as informações inseridas nos organogramas para corrigir essa inconsistência.
                            </span>
                        </div>
                    </div>
                )}

                {/* 5. GRÁFICOS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', margin: '32px 0 40px' }}>
                    <ChartCard
                        title="📊 Quantidade por Símbolo"
                        data={chartDataSimbolos}
                        color="#667eea"
                    />
                    <ChartCard
                        title="🏢 Símbolo por Setores"
                        data={cargosPorSetorNaoNivel1Full}
                        layout="list"
                        color="#10b981"
                    />
                    <DetailedTableCard
                        title="🏢 Setores por Órgão"
                        data={setoresPorOrgaoFull}
                        itemLabel="Setor"
                    />
                    <ConsolidatedTableCard
                        title="📊 Setores e Símbolos por Órgão"
                        data={setoresESimbolosPorOrgao}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
