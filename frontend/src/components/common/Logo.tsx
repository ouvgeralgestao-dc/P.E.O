import React from 'react';
import './Logo.css';

/**
 * Componente de Logo reutilizável com abreviação P.E.O
 * Suporta diferentes tamanhos e variantes de cor
 * 
 * @param {string} size - Tamanho da logo: 'small', 'medium', 'large', 'xlarge'
 * @param {string} variant - Variante de cor: 'white' (para fundos escuros), 'blue' (para fundos claros)
 * @param {string} className - Classes CSS adicionais
 * @param {boolean} showText - Mostrar abreviação P.E.O (padrão: true)
 */
const Logo = ({ size = 'medium', variant = 'blue', className = '', showText = true }) => {
    const sizeMap = {
        small: 48,
        medium: 64,
        large: 128,
        xlarge: 160
    };

    const pixelSize = sizeMap[size] || sizeMap.medium;

    // Seleciona a logo apropriada baseada na variante
    const logoSrc = variant === 'white' ? '/peo/logo-white.png' : '/peo/logo-blue.png';
    const altText = 'Planejador de Estrutura Organizacional - PMDC';

    return (
        <div className={`logo-container ${className}`}>
            <img
                src={logoSrc}
                alt={altText}
                className={`logo logo-${size} logo-${variant}`}
                style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
            />
            {showText && (
                <div className={`logo-text logo-text-${size} logo-text-${variant}`}>
                    P.E.O
                </div>
            )}
        </div>
    );
};

export default Logo;
