import React from 'react';
import './ConsolidatedTableCard.css';

interface Simbolo {
    tipo: string;
    quantidade: number;
}

interface SetorData {
    setor: string;
    simbolos: Simbolo[];
}

interface OrgaoData {
    orgao: string;
    totalSetores: number;
    totalSimbolos: number;
    setores: SetorData[];
}

interface ConsolidatedTableCardProps {
    title: string;
    data: OrgaoData[];
}

/**
 * Componente de tabela consolidada que exibe cargos e símbolos por órgão
 * Unifica as informações de 3 gráficos em uma única visualização
 */
const ConsolidatedTableCard: React.FC<ConsolidatedTableCardProps> = ({ title, data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="consolidated-table-card">
                <h3 className="consolidated-table-title">{title}</h3>
                <div className="consolidated-table-empty">
                    <p>📊 Sem dados disponíveis</p>
                </div>
            </div>
        );
    }

    return (
        <div className="consolidated-table-card">
            <h3 className="consolidated-table-title">{title}</h3>
            <div className="consolidated-table-container">
                <table className="consolidated-table">
                    <thead>
                        <tr>
                            <th className="col-orgao">Órgão</th>
                            <th className="col-prefixo">SETOR</th>
                            <th className="col-simbolos">Símbolos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((orgao, orgaoIndex) => {
                            const totalSetores = orgao.setores?.length || 1;

                            return (
                                <React.Fragment key={orgaoIndex}>
                                    {orgao.setores && orgao.setores.length > 0 ? (
                                        orgao.setores.map((setorData, setorIndex) => (
                                            <tr key={`${orgaoIndex}-${setorIndex}`} className={setorIndex === 0 ? 'first-row' : ''}>
                                                {setorIndex === 0 && (
                                                    <td className="orgao-cell" rowSpan={totalSetores}>
                                                        <div className="orgao-name">{orgao.orgao}</div>
                                                        <div className="orgao-stats">
                                                            <span className="stat-badge cargos">Setores: {orgao.totalSetores}</span>
                                                            <span className="stat-badge simbolos">Símbolos: {orgao.totalSimbolos}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="prefixo-cell">{setorData.setor}</td>
                                                <td className="simbolos-cell">
                                                    <div className="simbolos-list">
                                                        {setorData.simbolos.map((sim, simIndex) => (
                                                            <span key={simIndex} className="simbolo-badge">
                                                                {sim.tipo}: <strong className="qty-emphasis">{sim.quantidade}</strong>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="first-row">
                                            <td className="orgao-cell">
                                                <div className="orgao-name">{orgao.orgao}</div>
                                                <div className="orgao-stats">
                                                    <span className="stat-badge cargos">Setores: {orgao.totalSetores}</span>
                                                    <span className="stat-badge simbolos">Símbolos: {orgao.totalSimbolos}</span>
                                                </div>
                                            </td>
                                            <td className="prefixo-cell empty-cell" colSpan={2}>
                                                Sem setores cadastrados
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConsolidatedTableCard;
