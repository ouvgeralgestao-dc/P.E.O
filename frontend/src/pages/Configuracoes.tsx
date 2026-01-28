import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import './ConfigurarOrgaos.css'; // Reutilizando estilos base

const Configuracoes = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: 'Configurar Órgãos',
            description: 'Gerencie Secretarias e departamentos.',
            icon: '⚙️',
            path: '/configurar-orgaos',
            variant: 'primary'
        },
        {
            title: 'Configurar Setores',
            description: 'Padronize nomes de setores (RH, Protocolo...).',
            icon: '🛠️',
            path: '/configurar-setores',
            variant: 'secondary'
        },
        {
            title: 'Configurar Cargos',
            description: 'Gerencie prefixos (Diretor, Gerente...).',
            icon: '👔',
            path: '/configurar-prefixos',
            variant: 'secondary'
        },
        {
            title: 'Gerenciar Acesso',
            description: 'Gerencie usuários e controle de acesso.',
            icon: '👥',
            path: '/gerenciar-acesso',
            variant: 'danger' // Destaque visual
        }
    ];

    return (
        <div className="configurar-orgaos">
            <div className="page-header">
                <h1>Painel de Configurações</h1>
                <Button onClick={() => navigate('/')} variant="secondary">
                    ← Home
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '20px' }}>
                {menuItems.map((item, index) => (
                    <Card key={index} className="config-card" style={{ cursor: 'pointer', transition: 'transform 0.2s', height: '100%' }} onClick={() => navigate(item.path)}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                            <span style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</span>
                            <h3 style={{ marginBottom: '8px', color: '#1a202c' }}>{item.title}</h3>
                            <p style={{ color: '#718096', marginBottom: '20px', flex: 1 }}>{item.description}</p>
                            <Button
                                onClick={(e) => { e.stopPropagation(); navigate(item.path); }}
                                variant={item.variant === 'danger' ? 'danger' : 'primary'}
                                fullWidth
                            >
                                Acessar
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Configuracoes;
