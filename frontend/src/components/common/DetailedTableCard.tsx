import React from 'react';
import './DetailedTableCard.css';

interface DetailItem {
    label: string;
    value: number;
}

interface TableData {
    label: string; // Nome do órgão
    value: number; // Total
    details: DetailItem[]; // Lista de itens (cargos ou setores)
}

interface DetailedTableCardProps {
    title: string;
    data: TableData[];
    itemLabel: string; // "Cargo" ou "Setor"
}

/**
 * Componente de tabela detalhada compacta e minimalista
 * Exibe dados agrupados por órgão em formato de tabela com scroll vertical
 */
const DetailedTableCard: React.FC<DetailedTableCardProps> = ({ title, data, itemLabel }) => {
    if (!data || data.length === 0) {
        return (
            <div className="detailed-table-card">
                <h3 className="detailed-table-title">{title}</h3>
                <div className="detailed-table-empty">
                    <p>📊 Sem dados disponíveis</p>
                </div>
            </div>
        );
    }

    return (
        <div className="detailed-table-card">
            <h3 className="detailed-table-title">{title}</h3>
            <div className="detailed-table-container">
                <table className="detailed-table">
                    <thead>
                        <tr>
                            <th>Órgão</th>
                            <th>{itemLabel}</th>
                            <th className="detailed-table-qty">Qtd</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((orgao, orgaoIndex) => (
                            <React.Fragment key={orgaoIndex}>
                                {orgao.details && orgao.details.length > 0 ? (
                                    orgao.details.map((item, itemIndex) => (
                                        <tr key={`${orgaoIndex}-${itemIndex}`} className={itemIndex === 0 ? 'first-row' : ''}>
                                            {itemIndex === 0 && (
                                                <td className="orgao-cell" rowSpan={orgao.details.length}>
                                                    <div className="orgao-name">{orgao.label}</div>
                                                    <div className="orgao-total">Total: {orgao.value}</div>
                                                </td>
                                            )}
                                            <td className="item-cell">{item.label}</td>
                                            <td className="qty-cell">{item.value}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="first-row">
                                        <td className="orgao-cell">
                                            <div className="orgao-name">{orgao.label}</div>
                                            <div className="orgao-total">Total: {orgao.value}</div>
                                        </td>
                                        <td className="item-cell empty-cell" colSpan={2}>
                                            Sem {itemLabel.toLowerCase()}s cadastrados
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DetailedTableCard;
