import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import api from '../services/api';
import MultiSelect from '../components/common/MultiSelect';
import ChartCard from '../components/common/ChartCard';
import DetailedTableCard from '../components/common/DetailedTableCard';
import ConsolidatedTableCard from '../components/common/ConsolidatedTableCard';
import Button from '../components/common/Button';
import ViewSelectionModal from '../components/common/ViewSelectionModal';
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

    // Modal de Visualização
    const [viewSelectionOrg, setViewSelectionOrg] = useState<Organograma | null>(null);

    // Funções de utilidade movidas para fora ou estabilizadas
    const formatOrgaoName = useCallback((name: string) => {
        if (!name) return '';
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
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
                        <span>📅 {formatDate(org.updatedAt || org.createdAt)}</span>
                        <span>🏢 {org.stats.setoresCount} setores</span>
                        <span>👥 {org.stats.cargosCount} cargos</span>
                    </div>
                </div>
                <div className="orgao-card-actions">
                    <Button
                        variant="primary"
                        fullWidth
                        className="btn-visualizar-full"
                        onClick={() => onVisualize(org)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        Visualizar
                    </Button>
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
                <div className="stat-card stat-primary">
                    <div className="stat-icon">🏛️</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total de Órgãos</div>
                    </div>
                </div>
                <div className="stat-card stat-info">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.estruturais}</div>
                        <div className="stat-label">ORGANOGRAMAS ESTRUTURAIS</div>
                    </div>
                </div>
                <div className="stat-card stat-success">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{totalCargosFull}</div>
                        <div className="stat-label">Total de Cargos</div>
                    </div>
                </div>
                <div className="stat-card stat-purple">
                    <div className="stat-icon">📂</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.funcoes}</div>
                        <div className="stat-label">ORGANOGRAMAS FUNCIONAIS</div>
                    </div>
                </div>
                <div className="stat-card stat-warning">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <div className="stat-value">{totalSetores}</div>
                        <div className="stat-label">Total de Setores</div>
                    </div>
                </div>
                <div className="stat-card stat-indigo">
                    <div className="stat-icon">🏷️</div>
                    <div className="stat-content">
                        <div className="stat-value">{totalSimbolosFull}</div>
                        <div className="stat-label">Total de Símbolos</div>
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
            // NOTA: Setores são coletados SEM filtro interno para que todos os setores dos organogramas filtrados apareçam
            if (org.organogramaEstrutural?.setores) {
                const processEstrutura = (node: any, level = 0) => {
                    // Verificar se o setor passa no filtro (de Setor)
                    const setorPassaFiltro = selectedSetores.length === 0 || selectedSetores.includes(node.nomeSetor);

                    // Refinamento: Se houver filtro de Símbolo, o setor só passa se tiver o símbolo
                    let setorTemSimbolo = true;
                    if (selectedSimbolos.length > 0) {
                        setorTemSimbolo = node.cargos && node.cargos.some((c: any) => selectedSimbolos.includes(c.tipo));
                    }

                    // Só adicionar à lista de setores visualizados se passar em TODOS os filtros aplicáveis
                    if (node.nomeSetor && setorPassaFiltro && setorTemSimbolo) {
                        orgaoStats[oName].setores.add(node.nomeSetor);
                    }

                    // Para estatísticas de símbolos
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

            // Estatísticas das Funções (com filtro de prefixo)
            if (org.organogramasFuncoes && org.organogramasFuncoes.length > 0) {
                const latestFunc = org.organogramasFuncoes[0];
                const processFuncao = (cargo: any) => {
                    if (cargo.nomeCargo) {
                        const prefixo = cargo.nomeCargo.split(' ')[0].trim();

                        // Verificar se o prefixo passa no filtro (se houver filtro de prefixo)
                        const prefixoPassaFiltro = selectedPrefixos.length === 0 || selectedPrefixos.includes(prefixo);
                        // Verificar se o setor de referência passa no filtro (CROSS-FILTERING)
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
                                    // Verificar se o símbolo passa no filtro
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

        return {
            chartDataSimbolos: Object.entries(simbolosCount).map(([name, value]) => ({ label: name, value })),
            chartDataCargosDetalhados: Object.entries(cargosPrefix)
                .map(([name, info]) => ({
                    label: name,
                    value: info.total,
                    details: Object.entries(info.simbolosMap).map(([sName, sValue]) => ({ label: sName, value: sValue }))
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
                    // Coletar todos os cargos deste órgão agrupados por PREFIXO
                    const cargosPorPrefixo: Record<string, number> = {};

                    const orgData = filteredOrganogramas.find(o => o.orgao === orgaoName);
                    if (orgData?.organogramasFuncoes && orgData.organogramasFuncoes.length > 0) {
                        const latestFunc = orgData.organogramasFuncoes[0];
                        const collectCargos = (cargo: any) => {
                            if (cargo.nomeCargo) {
                                // Extrair prefixo (primeira palavra)
                                const prefixo = cargo.nomeCargo.split(' ')[0].trim();
                                // Verificar se o prefixo passa no filtro
                                const prefixoPassaFiltro = selectedPrefixos.length === 0 || selectedPrefixos.includes(prefixo);
                                // Verificar se o setor de referência passa no filtro
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
                            .sort((a, b) => b.value - a.value) // Ordenar por quantidade (maior primeiro)
                    };
                }),
            simbolosPorOrgaoFull: Object.entries(orgaoStats)
                .filter(([_, s]) => s.simbolos > 0)
                .map(([name, s]) => ({
                    label: formatOrgaoName(name),
                    value: s.simbolos,
                    details: Object.entries(s.simbolosMap).map(([sName, sValue]) => ({ label: sName, value: sValue }))
                }))
                .sort((a, b) => b.value - a.value),
            cargosPorSetorNaoNivel1Full: Object.entries(setorStats)
                .map(([name, s]) => ({
                    label: name,
                    value: s.total,
                    details: Object.entries(s.simbolosMap).map(([sName, sValue]) => ({ label: sName, value: sValue }))
                }))
                .sort((a, b) => b.value - a.value)
        };
    }, [filteredOrganogramas, formatOrgaoName, selectedSetores, selectedSimbolos, selectedPrefixos]);

    // Dados Consolidados (Cargos + Símbolos por Órgão) - com filtros aplicados
    const cargosESimbolosPorOrgao = useMemo(() => {
        const consolidatedData: any[] = [];

        filteredOrganogramas.forEach(org => {
            const orgaoName = org.orgao;
            const prefixosData: Record<string, { prefixo: string; simbolos: Record<string, number> }> = {};
            let totalCargos = 0;
            let totalSimbolos = 0;

            // Processar organograma funcional para coletar prefixos e símbolos
            if (org.organogramasFuncoes && org.organogramasFuncoes.length > 0) {
                const latestFunc = org.organogramasFuncoes[0];
                const processCargo = (cargo: any) => {
                    if (cargo.nomeCargo) {
                        const prefixo = cargo.nomeCargo.split(' ')[0].trim();

                        // Verificar se o prefixo passa no filtro
                        const prefixoPassaFiltro = selectedPrefixos.length === 0 || selectedPrefixos.includes(prefixo);
                        // Verificar se o setor de referência passa no filtro
                        const setorRefPassaFiltro = selectedSetores.length === 0 || (cargo.nome_setor_ref && selectedSetores.includes(cargo.nome_setor_ref));

                        if (prefixoPassaFiltro && setorRefPassaFiltro) {
                            const qtdCargo = parseInt(cargo.quantidade || cargo.qtd || '1') || 1;
                            totalCargos += qtdCargo;

                            if (!prefixosData[prefixo]) {
                                prefixosData[prefixo] = { prefixo, simbolos: {} };
                            }

                            // Coletar símbolos deste cargo (com filtro)
                            if (cargo.simbolos && Array.isArray(cargo.simbolos)) {
                                cargo.simbolos.forEach((sim: any) => {
                                    const qtdSim = parseInt(sim.quantidade) || 0;
                                    const tipoSim = sim.tipo;
                                    // Verificar se o símbolo passa no filtro
                                    const simboloPassaFiltro = selectedSimbolos.length === 0 || selectedSimbolos.includes(tipoSim);
                                    if (tipoSim && qtdSim > 0 && simboloPassaFiltro) {
                                        prefixosData[prefixo].simbolos[tipoSim] = (prefixosData[prefixo].simbolos[tipoSim] || 0) + qtdSim;
                                        totalSimbolos += qtdSim;
                                    }
                                });
                            }
                        }
                    }
                    if (cargo.children) cargo.children.forEach(processCargo);
                };
                if (latestFunc.cargos) latestFunc.cargos.forEach(processCargo);
            }

            // Montar estrutura final para este órgão
            if (Object.keys(prefixosData).length > 0) {
                consolidatedData.push({
                    orgao: formatOrgaoName(orgaoName),
                    totalCargos,
                    totalSimbolos,
                    prefixos: Object.values(prefixosData)
                        .map(p => ({
                            prefixo: p.prefixo,
                            simbolos: Object.entries(p.simbolos)
                                .map(([tipo, quantidade]) => ({ tipo, quantidade }))
                                .sort((a, b) => b.quantidade - a.quantidade)
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
    }, [filteredOrganogramas, formatOrgaoName, selectedPrefixos, selectedSimbolos]);

    const handleVisualizeClick = useCallback((org: Organograma) => {
        setViewSelectionOrg(org);
    }, []);

    const handleViewSelection = useCallback((tipo: string) => {
        if (!viewSelectionOrg) return;
        const path = tipo === 'estrutura'
            ? `/visualizar/${encodeURIComponent(viewSelectionOrg.orgao)}?tipo=estrutura`
            : `/visualizar/${encodeURIComponent(viewSelectionOrg.orgao)}?tipo=funcoes`;
        navigate(path);
    }, [viewSelectionOrg, navigate]);

    if (loading) return <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#64748b' }}>Carregando Dashboard...</div>;
    if (error) return <div className="error-container" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;

    return (
        <div className="dashboard">
            <div className="container">
                <header className="dashboard-header" style={{ marginBottom: '32px' }}>
                    <h2 className="welcome-title">ESTRUTURA ORGANIZACIONAL</h2>
                    <p className="welcome-subtitle">Visão da estrutura organizacional da Prefeitura Municipal de Duque de Caxias</p>
                </header>

                {/* 1. GRID DE ÓRGÃOS (PREMIUM CARDS) */}
                <div className="organogramas-grid">
                    {organogramasComStats.length > 0 ? (
                        organogramasComStats.map(org => (
                            <OrgaoCard
                                key={org.orgaoId || org.id}
                                org={org}
                                onVisualize={handleVisualizeClick}
                                formatDate={formatDate}
                                formatOrgaoName={formatOrgaoName}
                            />
                        ))
                    ) : (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <div className="empty-icon">📂</div>
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
                        title="📊 Cargos e Símbolos por Órgão"
                        data={cargosESimbolosPorOrgao}
                    />
                </div>
            </div>

            <ViewSelectionModal
                isOpen={!!viewSelectionOrg}
                onClose={() => setViewSelectionOrg(null)}
                // @ts-ignore
                onSelect={handleViewSelection}
                orgaoName={formatOrgaoName(viewSelectionOrg?.orgao || '')}
            />
        </div>
    );
};

export default Dashboard;
