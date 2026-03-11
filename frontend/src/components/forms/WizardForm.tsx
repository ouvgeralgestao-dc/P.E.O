/**
 * Componente Wizard Form - Formulário Multi-Etapas
 */
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Icons from '../common/Icons';
import './WizardForm.css';

const WizardForm = ({
    steps,
    onComplete,
    onCancel,
    onDataChange,
    initialData = {}
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});

    // Sincronizar dados iniciais quando carregados assincronamente (ex: API)
    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setFormData(prev => {
                // Se prev tem setores mas initialData também tem, decidimos qual manter.
                // Para edição de Sandbox, se o initialData (do banco) chegou, ele deve preencher o formulário.
                // Usamos um merge onde prev (mudanças locais) tem precedência, mas initialData preenche o resto.
                return {
                    ...prev,
                    ...initialData,
                    // Especial: se o usuário já adicionou setores no prev, mantemos o que for mais completo ou os do usuário?
                    // No caso de carregamento inicial lento, queremos o initialData.
                    setores: (prev.setores && prev.setores.length > 0) ? prev.setores : (initialData.setores || []),
                    cargos: (prev.cargos && prev.cargos.length > 0) ? prev.cargos : (initialData.cargos || [])
                };
            });
        }
    }, [initialData]);

    const currentStepConfig = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    // Atualizar dados do formulário
    const updateFormData = (stepData) => {
        setFormData(prev => ({
            ...prev,
            ...stepData
        }));
    };

    // Notificar mudanças de dados para o preview (com proteção contra loops)
    const lastNotifiedData = React.useRef<string | null>(null);
    useEffect(() => {
        if (onDataChange) {
            const dataStr = JSON.stringify(formData);
            if (lastNotifiedData.current !== dataStr) {
                onDataChange(formData);
                lastNotifiedData.current = dataStr;
            }
        }
    }, [formData, onDataChange]);

    // Validar etapa atual
    const validateCurrentStep = () => {
        if (currentStepConfig.validate) {
            const validation = currentStepConfig.validate(formData);
            setErrors(validation.errors || {});
            return validation.valid;
        }
        return true;
    };

    // Próxima etapa
    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
            setErrors({});
        }
    };

    // Etapa anterior
    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        setErrors({});
    };

    // Finalizar wizard
    const handleComplete = () => {
        if (validateCurrentStep()) {
            // Garantir que tamanhoFolha tenha um valor padrão (A3 para organogramas)
            const dataComDefaults = {
                ...formData,
                tamanhoFolha: formData.tamanhoFolha || 'A3'
            };
            onComplete(dataComDefaults);
        }
    };

    // Renderizar componente da etapa atual
    const StepComponent = currentStepConfig.component;

    // Renderizar indicador de progresso
    const renderProgressIndicator = () => (
        <div className="wizard-progress">
            {steps.map((step, index) => (
                <div
                    key={index}
                    className={`wizard-progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                >
                    <div className="wizard-progress-circle">
                        {index < currentStep ? <Icons name="check" size={14} /> : index + 1}
                    </div>
                    <div className="wizard-progress-label">{step.title}</div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="wizard-form">
            {renderProgressIndicator()}

            <div className="wizard-content">
                <div className="wizard-step-header">
                    <h2 className="wizard-step-title">{currentStepConfig.title}</h2>
                    <div className="wizard-header-actions">
                        {onCancel && (
                            <Button
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancelar
                            </Button>
                        )}
                        {isLastStep && (
                            <Button
                                variant="success"
                                onClick={handleComplete}
                            >
                                <Icons name="check" className="mr-2" /> Finalizar
                            </Button>
                        )}
                    </div>
                </div>
                {currentStepConfig.description && (
                    <p className="wizard-step-description">{currentStepConfig.description}</p>
                )}

                <div className="wizard-step-content">
                    <StepComponent
                        data={formData}
                        updateData={updateFormData}
                        errors={errors}
                        {...(currentStepConfig.props || {})}
                    />
                </div>
            </div>

            <div className="wizard-actions">
                <div className="wizard-actions-left">
                    {onCancel && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                    )}
                </div>
                <div className="wizard-actions-right">
                    {!isFirstStep && (
                        <Button
                            variant="secondary"
                            onClick={handlePrevious}
                        >
                            <Icons name="arrow-left" className="mr-2" /> Anterior
                        </Button>
                    )}
                    {!isLastStep && (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                        >
                            Próximo <Icons name="arrow-left" className="ml-2" style={{ transform: 'rotate(180deg)' }} />
                        </Button>
                    )}
                    {isLastStep && (
                        <Button
                            variant="success"
                            onClick={handleComplete}
                        >
                            <Icons name="check" className="mr-2" /> Finalizar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WizardForm;
