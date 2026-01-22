/**
 * Componente Card Reutilizável
 */
import React from 'react';
import './Card.css';

const Card = ({
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
        <div className={cardClass} onClick={onClick}>
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
