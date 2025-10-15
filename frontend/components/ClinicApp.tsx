import React from 'react';
import { useClinicData } from '../contexts/ClinicDataContext';
import { AuthPage } from './AuthPage';
import { ClinicLayout } from './ClinicLayout';

interface ClinicAppProps {
    navigateToSuperAdmin: () => void;
}

export const ClinicApp: React.FC<ClinicAppProps> = ({ navigateToSuperAdmin }) => {
    const { currentUser, handleLogout } = useClinicData();

    if (!currentUser) {
        // The new AuthPage gets its functions from the context directly,
        // so we don't need to pass them as props anymore.
        return <AuthPage navigateToSuperAdmin={navigateToSuperAdmin} />;
    }
    
    return <ClinicLayout onLogout={handleLogout} />;
};