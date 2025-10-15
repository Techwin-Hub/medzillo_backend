import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { View, InitialLoadState } from '../types';
import { useClinicData } from '../contexts/ClinicDataContext';
import { useToast } from '../hooks/useToast';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SpinnerIcon } from './icons';

// Lazy load all the main view components
const Dashboard = lazy(() => import('./Dashboard'));
const Medicines = lazy(() => import('./Medicines'));
const Billing = lazy(() => import('./Billing'));
const BillingHistory = lazy(() => import('./BillingHistory'));
const Suppliers = lazy(() => import('./Suppliers'));
const Reports = lazy(() => import('./Reports'));
const Settings = lazy(() => import('./Settings'));
const Patients = lazy(() => import('./Patients'));
const Appointments = lazy(() => import('./Appointments'));
const DoctorDashboard = lazy(() => import('./DoctorDashboard'));
const ClinicDashboard = lazy(() => import('./ClinicDashboard'));
const TodaysAppointments = lazy(() => import('./TodaysConsultation'));
const ToBeBilled = lazy(() => import('./ToBeBilled').then(module => ({ default: module.ToBeBilled })));
const ConsultationReports = lazy(() => import('./ConsultationReports').then(module => ({ default: module.ConsultationReports })));
const ClinicReports = lazy(() => import('./ClinicReports').then(module => ({ default: module.ClinicReports })));
const Chat = lazy(() => import('./Chat').then(module => ({ default: module.Chat })));

interface ClinicLayoutProps {
    isViewOnly?: boolean;
    onLogout: () => void;
}

export const ClinicLayout: React.FC<ClinicLayoutProps> = ({ isViewOnly = false, onLogout }) => {
    const clinicData = useClinicData();
    const { 
        currentUser, activeView, setActiveView, notifications, markAllNotificationsAsRead, clearAllNotifications,
        toBeBilledCount, unreadChatCount, todaysQueueCount,
        patients: patientsData,
        billing: billingData,
        admin: adminData,
        communication: commsData,
    } = clinicData;
    
    const { addToast } = useToast();
    
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [navigationSource, setNavigationSource] = useState<View | null>(null);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [theme, setTheme] = usePersistentState<'light' | 'dark'>('medzillo_theme', 'light');
    const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
    const [initialLoadState, setInitialLoadState] = useState<InitialLoadState>('grace');

    useEffect(() => {
        const fakeFetchTime = 100 + Math.random() * 600;
        const graceTimer = setTimeout(() => {
            setInitialLoadState(current => (current === 'grace' ? 'loading' : current));
        }, 200);
        const loadTimer = setTimeout(() => {
            setInitialLoadState('done');
        }, fakeFetchTime);

        return () => { clearTimeout(graceTimer); clearTimeout(loadTimer); };
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = useCallback(() => {
        if (installPromptEvent && 'prompt' in installPromptEvent) {
            (installPromptEvent as any).prompt();
            (installPromptEvent as any).userChoice.then(() => setInstallPromptEvent(null));
        }
    }, [installPromptEvent]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, [setTheme]);
    
    const navigateToPatientProfile = useCallback((patientId: string, fromView: View) => {
        setSelectedPatientId(patientId);
        setNavigationSource(fromView);
        setActiveView('patients');
    }, [setActiveView]);

    const handleBackFromPatientProfile = useCallback(() => {
        if (navigationSource) {
            setActiveView(navigationSource);
        }
        setSelectedPatientId(null);
        setNavigationSource(null);
    }, [navigationSource, setActiveView]);

    const handleBillIt = useCallback((appointmentId: string) => {
        // Safety check using optional chaining as suggested.
        const appointment = patientsData?.appointments?.find((a: any) => a.id === appointmentId);
        if (!appointment) {
            addToast('Error: Could not find the selected appointment.', 'error');
            return;
        }
        
        const patient = patientsData?.patients?.find((p: any) => p.id === appointment.patientId);
        if (!patient) {
            addToast('Error: Could not find the patient for this appointment.', 'error');
            return;
        }

        // CORRECTED: This now finds the consultation by matching its 'appointmentId' property,
        // which is how the real backend links them.
        const consultation = (patient.consultations || []).find((c: any) => c.appointmentId === appointment.id);
        
        if (patient && consultation) {
            billingData.createBillFromConsultation(patient, consultation, appointmentId);
        } else {
            addToast('Consultation data not found. Please try again or bill from the patient\'s profile.', 'error');
            console.error('Failed to find consultation for appointment ID:', appointmentId, 'on patient:', patient);
        }
    }, [patientsData, billingData, addToast]);

    const handleCancelBill = useCallback((appointmentId: string) => {
        patientsData.updateAppointmentStatus(appointmentId, 'Completed');
    }, [patientsData]);
    
    // Set default view on login based on role
    useEffect(() => {
        if (currentUser) {
            const defaultView: View = currentUser.role === 'Doctor' ? 'doctor-dashboard' : currentUser.role === 'Admin' ? 'clinic-dashboard' : 'dashboard';
            setActiveView(defaultView);
        }
    }, [currentUser?.id, setActiveView]);

    const renderContent = () => {
        if (!currentUser) return null;

        switch (activeView) {
            case 'dashboard': return <Dashboard theme={theme} />;
            case 'medicines': return <Medicines loadState={initialLoadState} />;
            case 'billing': return <Billing />;
            case 'billing-history': return <BillingHistory loadState={initialLoadState} />;
            case 'suppliers': return <Suppliers loadState={initialLoadState} />;
            case 'reports': return <Reports />;
            case 'settings': return <Settings />;
            case 'doctor-dashboard': return <DoctorDashboard theme={theme} currentUser={currentUser} patients={patientsData.patients} appointments={patientsData.appointments} todos={adminData.todos} addTodo={adminData.addTodo} updateTodoStatus={adminData.updateTodoStatus} deleteTodo={adminData.deleteTodo} setActiveView={setActiveView} />;
            case 'clinic-dashboard': return <ClinicDashboard theme={theme} patients={patientsData.patients} appointments={patientsData.appointments} setActiveView={setActiveView} />;
            case 'todays-appointments': return <TodaysAppointments onViewPatientProfile={(patientId) => navigateToPatientProfile(patientId, 'todays-appointments')} currentUser={currentUser} appointments={patientsData.appointments} patients={patientsData.patients} medicines={clinicData.inventory.medicines} onSave={patientsData.saveConsultation} draftConsultations={patientsData.draftConsultations} setDraftConsultations={patientsData.setDraftConsultations} />;
            case 'patients': return <Patients initialPatientId={selectedPatientId} onBackFromDetail={handleBackFromPatientProfile} navigationSource={navigationSource} patients={patientsData.patients} doctors={patientsData.doctors} users={adminData.users} currentUser={currentUser} medicines={clinicData.inventory.medicines} bills={billingData.bills} addPatient={patientsData.addPatient} addMultiplePatients={patientsData.addMultiplePatients} updatePatient={patientsData.updatePatient} deletePatient={patientsData.deletePatient} addAppointment={patientsData.addAppointment} createBillFromConsultation={billingData.createBillFromConsultation} createRefillDraftBill={billingData.createRefillDraftBill} pharmacyInfo={adminData.pharmacyInfo} createSharedLink={adminData.createSharedLink} />;
            case 'appointments': return <Appointments appointments={patientsData.appointments} patients={patientsData.patients} doctors={patientsData.doctors} addAppointment={patientsData.addAppointment} updateAppointmentStatus={patientsData.updateAppointmentStatus} addVitalsForAppointment={patientsData.addVitalsForAppointment} />;
            case 'to-be-billed': return <ToBeBilled appointments={patientsData.appointments} onBillIt={handleBillIt} onCancelBill={handleCancelBill} />;
            case 'consultation-reports': return <ConsultationReports patients={patientsData.patients} currentUser={currentUser} />;
            case 'clinic-reports': return <ClinicReports patients={patientsData.patients} appointments={patientsData.appointments} doctors={patientsData.doctors} />;
            case 'chat': return <Chat currentUser={currentUser} users={adminData.users} messages={commsData.chatMessages} onSendMessage={commsData.sendMessage} onMarkMessagesAsRead={commsData.markMessagesAsRead} />;
            default: return <div>Not implemented</div>;
        }
    };
    
    if (!currentUser) {
        return <div>Error: No user session found.</div>;
    }

    const suspenseFallback = (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <SpinnerIcon className="w-10 h-10 text-brand-primary animate-spin" />
        </div>
    );

    return (
        <div className="flex h-screen">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                currentUser={currentUser}
                isMobileOpen={isMobileSidebarOpen}
                setMobileOpen={setMobileSidebarOpen}
                toBeBilledCount={toBeBilledCount}
                unreadChatCount={unreadChatCount}
                todaysQueueCount={todaysQueueCount}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    activeView={activeView}
                    user={currentUser}
                    onLogout={onLogout}
                    onToggleSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    notifications={notifications}
                    onMarkNotificationsAsRead={markAllNotificationsAsRead}
                    onClearNotifications={clearAllNotifications}
                    installPromptEvent={installPromptEvent}
                    onInstallClick={handleInstallClick}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
                    <Suspense fallback={suspenseFallback}>
                        {renderContent()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default ClinicLayout;