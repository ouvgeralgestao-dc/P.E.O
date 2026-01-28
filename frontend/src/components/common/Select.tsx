/**
 * Componente Select Reutilizável
 */
import React from 'react';
import './Select.css';

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Option[];
    required?: boolean;
    disabled?: boolean;
    error?: string | null;
    helperText?: string | null;
    name?: string;
    id?: string;
    placeholder?: string;
    className?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    value,
    onChange,
    options = [],
    required = false,
    disabled = false,
    error = null,
    helperText = null,
    name,
    id,
    placeholder = 'Selecione uma opção',
    className = ''
}) => {
    const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = error !== null && error !== '';

    return (
        <div className={`select-wrapper ${className}`}>
            {label && (
                <label htmlFor={selectId} className="select-label">
                    {label}
                    {required && <span className="select-required">*</span>}
                </label>
            )}
            <select
                id={selectId}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`select-field ${hasError ? 'select-error' : ''}`}
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {options.map((option, index) => (
                    <option
                        key={option.value || index}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {hasError && <span className="select-error-message">{error}</span>}
            {helperText && !hasError && <span className="select-helper-text">{helperText}</span>}
        </div>
    );
};

export default Select;
