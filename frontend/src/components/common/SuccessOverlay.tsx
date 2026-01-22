import React, { useEffect, useState } from 'react';
import './SuccessOverlay.css';

const SuccessOverlay = ({ message = 'Sua estrutura foi criada!', onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onComplete) onComplete();
        }, 2500); // 2.5 segundos para garantir que a animação seja vista

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className="success-overlay">
            <div className="success-content">
                <div className="check-icon-wrapper">
                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                </div>
                <h2 className="success-message">{message}</h2>
            </div>
        </div>
    );
};

export default SuccessOverlay;
