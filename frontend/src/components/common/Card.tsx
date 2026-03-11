/**
 * Componente Card Reutilizável
 */
import React from 'react';
import './Card.css';

interface CardProps {
    children: React.ReactNode;
    title?: string | null;
    subtitle?: string | null;
    footer?: React.ReactNode | null;
    className?: string;
    onClick?: (() => void) | null;
    hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
    children,
    title = null,
    subtitle = null,
    footer = null,
    className = '',
    onClick = null,
    hoverable = false
}) => {
    const cardClass = `card ${hoverable ? 'card-hoverable' : ''} ${onClick ? 'card-clickable' : ''} ${className}`;

    return (
        <div className={cardClass} onClick={onClick || undefined}>
            {(title || subtitle) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
            {footer && (
                <div className="card-footer">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
