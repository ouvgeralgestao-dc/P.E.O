import React, { useState, useEffect, useRef } from 'react';
import './MultiSelect.css';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    label: string;
    options: Option[];
    value: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Selecionar...',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleSelectAll = () => {
        if (value.length === filteredOptions.length && value.length > 0) {
            onChange([]);
        } else {
            const allValues = filteredOptions.map(o => o.value);
            // Combine with currently selected that might be filtered out? 
            // Better behavior: select all visible
            const combined = Array.from(new Set([...value, ...allValues]));
            onChange(combined);
        }
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    // Renderizar texto do trigger
    const renderTriggerText = () => {
        if (value.length === 0) return placeholder;
        if (value.length === 1) {
            const selectedOption = options.find(o => o.value === value[0]);
            return selectedOption ? selectedOption.label : value[0];
        }
        if (value.length === options.length && options.length > 0) return 'Todos Selecionados';
        return `${value.length} selecionados`;
    };

    return (
        <div className="multi-select-container" ref={containerRef}>
            {label && <label className="input-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{label}</label>}
            <div
                className={`multi-select-trigger ${isOpen ? 'is-open' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={`multi-select-label ${value.length > 0 ? 'has-value' : ''}`}>
                    {renderTriggerText()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {value.length > 0 && (
                        <span className="count-badge">{value.length}</span>
                    )}
                    <span className={`multi-select-arrow ${isOpen ? 'is-open' : ''}`}>▼</span>
                </div>
            </div>

            {isOpen && (
                <div className="multi-select-dropdown">
                    <div className="multi-select-search">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    <div className="multi-select-options">
                        {filteredOptions.length > 0 && (
                            <div
                                className="multi-select-option"
                                onClick={handleSelectAll}
                                style={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#3b82f6' }}
                            >
                                <div className={`multi-select-checkbox ${value.length === filteredOptions.length && filteredOptions.length > 0 ? 'checked' : ''}`}>
                                    {value.length === filteredOptions.length && filteredOptions.length > 0 && <span className="checkbox-check">✓</span>}
                                </div>
                                Selecionar Todos
                            </div>
                        )}

                        {filteredOptions.length === 0 ? (
                            <div className="multi-select-empty">Nenhuma opção encontrada</div>
                        ) : (
                            filteredOptions.map(option => {
                                const isSelected = value.includes(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleOption(option.value)}
                                    >
                                        <div className="multi-select-checkbox">
                                            {isSelected && <span className="checkbox-check">✓</span>}
                                        </div>
                                        {option.label}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
