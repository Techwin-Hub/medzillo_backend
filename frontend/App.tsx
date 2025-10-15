import React, { useState, useEffect } from 'react';
import { ClinicDataProvider } from './contexts/ClinicDataContext';
import { Toaster, ToastProvider } from './hooks/useToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ClinicApp } from './components/ClinicApp';
import { SuperAdminApp } from './components/SuperAdminApp';
import { SuperAdminProvider } from './contexts/SuperAdminContext';
import { SharedDocumentViewer } from './components/SharedDocumentViewer';
import { dbGet } from './utils/db';
import { Clinic } from './types';
import { SpinnerIcon } from './components/icons';

/**
 * The root component of the application, now acting as a top-level router.
 * It determines whether to render the public shared document view, the main
 * Clinic Application, or the Super Admin portal based on the URL path.
 */
const App: React.FC = () => {
    const [route, setRoute] = useState<'loading' | 'share' | 'app'>('loading');
    const [shareViewData, setShareViewData] = useState(null);
    const [allClinics, setAllClinics] = useState<Clinic[]>([]);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/share/')) {
            const linkId = path.split('/')[2];
            
            // Fetch all necessary data for the shared view. This is a public route,
            // so we fetch directly from IndexedDB without authentication.
            Promise.all([
                // FIX: Add type generic to dbGet to resolve 'unknown' type for dataByClinicId, which was causing an error on the for...in loop.
                dbGet<any>('medzillo_dataByClinicId'),
                // FIX: Add type generic to dbGet to resolve 'unknown' type for clinicsData, which was causing an error on setAllClinics.
                dbGet<Clinic[]>('medzillo_clinics')
            ]).then(([dataByClinicId, clinicsData]) => {
                if (!dataByClinicId) {
                    setShareViewData({ error: 'Clinic data not found.' });
                    setRoute('share');
                    return;
                }

                setAllClinics(clinicsData || []);

                // Find the shared link across all clinics
                let foundLink = null;
                let foundClinicData = null;
                for (const clinicId in dataByClinicId) {
                    const clinicData = dataByClinicId[clinicId];
                    const link = clinicData.sharedLinks?.find((l: any) => l.id === linkId);
                    if (link) {
                        foundLink = link;
                        foundClinicData = clinicData;
                        break;
                    }
                }
                
                if (foundLink) {
                    setShareViewData({ link: foundLink, clinicData: foundClinicData });
                } else {
                    setShareViewData({ error: 'The requested link is invalid or has been removed.' });
                }
                setRoute('share');

            }).catch(error => {
                console.error("Failed to load data for shared view:", error);
                setShareViewData({ error: 'Could not load required data to view this document.' });
                setRoute('share');
            });
        } else {
            setRoute('app');
        }
    }, []);

    if (route === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <SpinnerIcon className="w-10 h-10 text-brand-primary animate-spin" />
            </div>
        );
    }
    
    if (route === 'share') {
        return (
            <ToastProvider>
                <ErrorBoundary>
                    <SharedDocumentViewer viewData={shareViewData} allClinics={allClinics} />
                </ErrorBoundary>
                <Toaster />
            </ToastProvider>
        );
    }
    
    // Default application flow (clinic or superadmin)
    return <MainAppRouter />;
};

const MainAppRouter: React.FC = () => {
    const [appMode, setAppMode] = useState<'clinic' | 'superadmin'>('clinic');

    if (appMode === 'superadmin') {
        return (
            <ToastProvider>
                <ErrorBoundary>
                    <SuperAdminProvider>
                        <SuperAdminApp navigateToClinic={() => setAppMode('clinic')} />
                    </SuperAdminProvider>
                </ErrorBoundary>
                <Toaster />
            </ToastProvider>
        );
    }

    return (
        <ToastProvider>
            <ErrorBoundary>
                <ClinicDataProvider>
                    <ClinicApp navigateToSuperAdmin={() => setAppMode('superadmin')} />
                </ClinicDataProvider>
            </ErrorBoundary>
            <Toaster />
        </ToastProvider>
    );
}

export default App;