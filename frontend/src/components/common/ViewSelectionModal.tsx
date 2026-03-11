import React from 'react';
import Button from './Button';
import './ViewSelectionModal.css';

const ViewSelectionModal = ({ isOpen, onClose, onSelect, orgaoName, hasEstrutural = true, hasFuncional = true }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content view-selection-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Visualizar Organograma</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        O órgão <strong>{orgaoName}</strong> possui as seguintes visualizações disponíveis.
                        <br />Selecione qual deseja abrir:
                    </p>

                    <div className="view-options">
                        {hasEstrutural && (
                            <div className="view-option-card" onClick={() => onSelect('estrutura')}>
                                <div className="view-icon">📊</div>
                                <div className="view-info">
                                    <h3>Estrutural</h3>
                                    <p>Hierarquia, departamentos e subordinações.</p>
                                </div>
                            </div>
                        )}

                        {hasFuncional && (
                            <div className="view-option-card" onClick={() => onSelect('funcoes')}>
                                <div className="view-icon">👥</div>
                                <div className="view-info">
                                    <h3>Funcional</h3>
                                    <p>Lista de cargos, funções e quantidades.</p>
                                </div>
                            </div>
                        )}

                        {!hasEstrutural && !hasFuncional && (
                            <div className="no-views-message">
                                <p>Nenhuma visualização disponível para este órgão.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                </div>
            </div>
        </div>
    );
};

export default ViewSelectionModal;
