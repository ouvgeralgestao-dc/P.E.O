import React from 'react';
import Card from './Card';
import './TabelaQuantidades.css';

const TabelaQuantidades = ({ dados }: { dados: Record<string, any> }) => {
    if (!dados || Object.keys(dados).length === 0) {
        return null;
    }

    const totalGeral = Object.values(dados).reduce((acc: number, curr: any) => acc + (curr.total || curr || 0), 0);

    return (
        <Card title={`Quantitativo Símbolos por Cargo`}>
            <div className="tabela-quantidades-container">
                <table className="tabela-simples">
                    <thead>
                        <tr>
                            <th>Cargo / Função</th>
                            <th className="text-right">Qtd.</th>
                            <th className="text-left" style={{ paddingLeft: '20px' }}>Detalhamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(dados)
                            .sort(([, a]: [string, any], [, b]: [string, any]) => (b.total || b) - (a.total || a))
                            .map(([cargo, valor], index) => {
                                const quantidade = valor.total !== undefined ? valor.total : valor;
                                const detalhes = valor.detalhes || '-';

                                return (
                                    <tr key={index}>
                                        <td>
                                            <div className="cargo-nome-cell">
                                                <span className="dot-indicator"></span>
                                                {cargo}
                                            </div>
                                        </td>
                                        <td className="text-right font-bold">{quantidade}</td>
                                        <td className="text-sm text-gray-600" style={{ paddingLeft: '20px' }}>
                                            {detalhes}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                            <td style={{ paddingTop: '12px' }}>Total de Cargos do Órgão</td>
                            <td className="text-right" style={{ paddingTop: '12px' }}>{totalGeral}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </Card>
    );
};

export default TabelaQuantidades;
