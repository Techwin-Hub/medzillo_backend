import React, { useState, Suspense, lazy } from 'react';
import { SuperAdmin } from '../types';
import { SuperAdminLoginPage } from './SuperAdminLoginPage';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { useMockData } from '../hooks/useMockData';
import { useToast } from '../hooks/useToast';
import { ClinicDataProvider } from '../contexts/ClinicDataContext';
import { SpinnerIcon } from './icons';
import { useSuperAdminData } from '../contexts/SuperAdminContext';

const ClinicLayout = lazy(() => import('./ClinicLayout'));

interface SuperAdminAppProps {
    navigateToClinic: () => void;
}

export const SuperAdminApp: React.FC<SuperAdminAppProps> = ({ navigateToClinic }) => {
    const [viewingClinicId, setViewingClinicId] = useState<string | null>(null);
    const { superAdmin, logout, clinics } = useSuperAdminData();

    const handleLogout = () => {
        logout();
        setViewingClinicId(null);
    };

    if (!superAdmin) {
        return (
            <SuperAdminLoginPage 
                navigateToClinic={navigateToClinic} 
            />
        );
    }
    
    if (viewingClinicId) {
        const viewingClinic = clinics.find(c => c.id === viewingClinicId);
        return (
            <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900">
                <div className="p-2 text-center bg-yellow-400 text-yellow-900 font-bold flex justify-between items-center shadow-md z-20">
                    <span>
                        You are viewing <span className="underline">{viewingClinic?.name || 'a clinic'}</span> in read-only mode.
                    </span>
                    <button 
                        onClick={() => setViewingClinicId(null)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    >
                        Back to Super Admin Dashboard
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><SpinnerIcon className="w-10 h-10 text-brand-primary animate-spin" /></div>}>
                         <ClinicDataProvider viewOnlyClinicId={viewingClinicId}>
                             <ClinicLayout isViewOnly={true} onLogout={handleLogout} />
                         </ClinicDataProvider>
                    </Suspense>
                </div>
            </div>
        );
    }

    return (
        <SuperAdminDashboard 
            onViewClinic={setViewingClinicId}
            onLogout={handleLogout}
            adminName={superAdmin.name}
        />
    );
};