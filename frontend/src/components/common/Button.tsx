/**
 * Componente Button Reutilizável
 */
import React from 'react';
import './Button.css';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    fullWidth = false,
    icon = null,
    className = ''
}) => {
    const buttonClass = `btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${fullWidth ? 'btn-full-width' : ''} ${className}`.trim();

    return (
        <button
            type={type}
            className={buttonClass}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span className="btn-icon">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
