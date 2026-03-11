import React from 'react';
import './ChartCard.css';

/**
 * Componente de gráfico de colunas simples e bonito
 * Sem dependências externas, usando CSS puro
 */
const ChartCard = ({ title, data, color = '#3b82f6', maxHeight = 200, layout = 'auto', children }: { title: any, data: any[], color?: string, maxHeight?: number, layout?: string, children?: React.ReactNode }) => {
    if ((!data || data.length === 0) && !children) {
        return (
            <div className="chart-card">
                <h3 className="chart-title">{title}</h3>
                <div className="chart-empty">
                    <p>📊 Sem dados disponíveis</p>
                </div>
            </div>
        );
    }

    // Verificar se é gráfico detalhado (tem propriedade details nos dados)
    const isDetailed = data.some(item => item.details && item.details.length > 0);
    const maxValue = Math.max(...data.map(item => item.value));
    const shouldUseListLayout = layout === 'list' || (layout === 'auto' && isDetailed);

    // Renderização para Gráfico Detalhado (Horizontal com Badges)
    if (shouldUseListLayout) {
        return (
            <div className="chart-card">
                <h3 className="chart-title">{title}</h3>
                <div className="chart-container-detailed">
                    {data.map((item, index) => (
                        <div key={index} className="chart-row">
                            <div className="chart-row-header">
                                <span className="chart-row-label">{item.label}</span>
                                <span className="chart-row-total">{item.value}</span>
                            </div>
                            <div className="chart-row-bar-bg">
                                <div
                                    className="chart-row-bar-fill"
                                    style={{
                                        width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                        backgroundColor: color
                                    }}
                                ></div>
                            </div>
                            {item.details && item.details.length > 0 && (
                                <div className="chart-row-details">
                                    {item.details.sort((a: any, b: any) => b.value - a.value).map((detail: any, dIndex: number) => (
                                        <span key={dIndex} className="chart-badge">
                                            {detail.label}: <strong className="qty-emphasis">{detail.value}</strong>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Renderização Padrão (Colunas Verticais)
    return (
        <div className="chart-card">
            <h3 className="chart-title">{title}</h3>
            {children ? children : (
                <div className="chart-container">
                    <div className="chart-bars">
                        {data.map((item, index) => {
                            const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                            return (
                                <div key={index} className="chart-bar-wrapper">
                                    <div className="chart-bar-container">
                                        <div
                                            className="chart-bar"
                                            style={{
                                                height: `${heightPercent}%`,
                                                backgroundColor: color,
                                                maxHeight: `${maxHeight}px`
                                            }}
                                        >
                                            <span className="chart-value qty-emphasis">{item.value}</span>
                                        </div>
                                    </div>
                                    <div className="chart-label">{item.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartCard;
