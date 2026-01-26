import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import Login from '../pages/Login';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requireAdmin = false 
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (!authService.isAuthenticated()) {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // Verificar se o token ainda é válido
                await authService.getCurrentUser();
                
                // Verificar se requer admin
                if (requireAdmin && !authService.isAdmin()) {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                setIsAuthenticated(true);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [requireAdmin]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                Carregando...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
