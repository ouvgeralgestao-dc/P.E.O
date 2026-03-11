import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Editor de cores compacto - aplica cores automaticamente ao selecionar
 * Usa React Portal para renderizar fora da hierarquia do ReactFlow
 */
const StyleEditor = ({ initialStyle, onStyleChange, onClose }) => {
    // Converter "transparent" para hex válido
    const sanitizeColor = (color) => {
        if (!color || color === 'transparent' || color === '') {
            return '#ffffff';
        }
        return color;
    };

    const handleColorChange = (field, value) => {
        const newStyle = {
            ...initialStyle,
            [field]: value
        };
        onStyleChange(newStyle);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const currentStyle = {
        backgroundColor: sanitizeColor(initialStyle?.backgroundColor) || '#ffffff',
        borderColor: sanitizeColor(initialStyle?.borderColor) || '#cccccc',
        color: sanitizeColor(initialStyle?.color) || '#000000'
    };

    // Conteúdo do editor
    const editorContent = (
        <>
            {/* Overlay escuro para focar no editor */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 2147483646
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2147483647,
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    border: '2px solid #667eea',
                    width: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    pointerEvents: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>🎨 Cores</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '16px',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '2px 6px'
                        }}
                    >✕</button>
                </div>

                {/* Cores em linha compacta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <input
                            type="color"
                            value={currentStyle.backgroundColor}
                            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                            style={{ width: '40px', height: '30px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                            title="Fundo"
                        />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Fundo</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <input
                            type="color"
                            value={currentStyle.borderColor}
                            onChange={(e) => handleColorChange('borderColor', e.target.value)}
                            style={{ width: '40px', height: '30px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                            title="Borda"
                        />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Borda</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <input
                            type="color"
                            value={currentStyle.color}
                            onChange={(e) => handleColorChange('color', e.target.value)}
                            style={{ width: '40px', height: '30px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                            title="Texto"
                        />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Texto</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: '4px',
                        padding: '8px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}
                >✓ Fechar</button>
            </div>
        </>
    );

    // Usar createPortal para renderizar no body, fora da hierarquia do ReactFlow
    return createPortal(editorContent, document.body);
};

export default StyleEditor;
