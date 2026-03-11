/**
 * Componente Input Reutilizável
 */
import React from 'react';
import './Input.css';

interface InputProps {
    label?: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string | null;
    helperText?: string | null;
    name?: string;
    id?: string;
    className?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
}

const Input: React.FC<InputProps> = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    disabled = false,
    error = null,
    helperText = null,
    name,
    id,
    className = '',
    min,
    max,
    step
}) => {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = error !== null && error !== '';

    return (
        <div className={`input-wrapper ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}
            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                className={`input-field ${hasError ? 'input-error' : ''}`}
            />
            {hasError && <span className="input-error-message">{error}</span>}
            {helperText && !hasError && <span className="input-helper-text">{helperText}</span>}
        </div>
    );
};

export default Input;
