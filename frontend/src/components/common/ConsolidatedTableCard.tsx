import React from 'react';
import './ConsolidatedTableCard.css';

interface Simbolo {
    tipo: string;
    quantidade: number;
}

interface PrefixoData {
    prefixo: string;
    simbolos: Simbolo[];
}

interface OrgaoData {
    orgao: string;
    totalCargos: number;
    totalSimbolos: number;
    prefixos: PrefixoData[];
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
                            <th className="col-prefixo">Prefixo Cargo</th>
                            <th className="col-simbolos">Símbolos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((orgao, orgaoIndex) => {
                            const totalPrefixos = orgao.prefixos.length || 1;

                            return (
                                <React.Fragment key={orgaoIndex}>
                                    {orgao.prefixos.length > 0 ? (
                                        orgao.prefixos.map((prefixo, prefixoIndex) => (
                                            <tr key={`${orgaoIndex}-${prefixoIndex}`} className={prefixoIndex === 0 ? 'first-row' : ''}>
                                                {prefixoIndex === 0 && (
                                                    <td className="orgao-cell" rowSpan={totalPrefixos}>
                                                        <div className="orgao-name">{orgao.orgao}</div>
                                                        <div className="orgao-stats">
                                                            <span className="stat-badge cargos">Cargos: {orgao.totalCargos}</span>
                                                            <span className="stat-badge simbolos">Símbolos: {orgao.totalSimbolos}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="prefixo-cell">{prefixo.prefixo}</td>
                                                <td className="simbolos-cell">
                                                    <div className="simbolos-list">
                                                        {prefixo.simbolos.map((sim, simIndex) => (
                                                            <span key={simIndex} className="simbolo-badge">
                                                                {sim.tipo}: <strong>{sim.quantidade}</strong>
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
                                                    <span className="stat-badge cargos">Cargos: {orgao.totalCargos}</span>
                                                    <span className="stat-badge simbolos">Símbolos: {orgao.totalSimbolos}</span>
                                                </div>
                                            </td>
                                            <td className="prefixo-cell empty-cell" colSpan={2}>
                                                Sem cargos cadastrados
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
