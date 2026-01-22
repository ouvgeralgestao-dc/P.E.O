import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

/**
 * Botão "Voltar" reutilizável
 * Navega para a página anterior ou para uma rota específica
 */
const BackButton = ({ to, className = '' }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button className={`back-button ${className}`} onClick={handleClick}>
            <span className="back-icon">←</span>
            <span className="back-text">Voltar</span>
        </button>
    );
};

export default BackButton;
