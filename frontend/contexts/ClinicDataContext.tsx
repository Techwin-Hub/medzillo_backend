// contexts/ClinicDataContext.tsx (Corrected Version)

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import * as api from '../api/apiService';
import { useToast } from '../hooks/useToast';
import { dbGet, dbSet, dbDelete } from '../utils/db';
import { 
    User, View, Medicine, Patient, Supplier, Bill, Appointment, PharmacyInfo, Notification, 
    TodoItem, ChatMessage, DraftBill, BillItem, SharedLink, 
    AppointmentStatus, ProcessedPatientItem, DraftConsultation, Consultation
} from '../types';
import { generateBillItemsFromPrescription } from '../utils/helpers';
import { SpinnerIcon } from '../components/icons';

const initialDataState = {
    users: [], medicines: [], patients: [], suppliers: [], appointments: [], bills: [],
    pharmacyInfo: {} as PharmacyInfo, todos: [], chatMessages: [], sharedLinks: [],
};

interface ClinicDataContextType {
    currentUser: User | null;
    activeView: View;
    setActiveView: (view: View) => void;
    notifications: Notification[];
    toBeBilledCount: number;
    unreadChatCount: number;
    todaysQueueCount: number;
    markAllNotificationsAsRead: () => void;
    clearAllNotifications: () => void;

    handleLogin: (email: string, password: string) => Promise<boolean>;
    handleLogout: () => void;
    handleSendOtp: (data: any, context: 'register' | 'reset') => Promise<{ success: boolean; message: string; }>;
    handleVerifyOtpAndRegister: (email: string, otp: string, registrationData: any) => Promise<boolean>;
    verifyPasswordResetOtp: (email: string, otp: string) => Promise<boolean>;
    resetPassword: (email: string, newPass: string) => Promise<boolean>;
    handleRegisterClinic: (clinicName: string, adminName: string, email: string, password: string) => Promise<boolean>;

    inventory: any;
    patients: any;
    billing: any;
    admin: any;
    communication: any;
}

const ClinicDataContext = createContext<ClinicDataContextType | undefined>(undefined);

export const ClinicDataProvider: React.FC<{ children: ReactNode; viewOnlyClinicId?: string; }> = ({ children, viewOnlyClinicId }) => {
    const { addToast } = useToast();
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [data, setData] = useState(initialDataState);
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [draftBill, setDraftBill] = useState<DraftBill | null>(null);
    const [draftConsultations, setDraftConsultations] = useState<{ [key: string]: DraftConsultation }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [supplierMappingTemplates, setSupplierMappingTemplates] = useState({});

    const isViewOnly = !!viewOnlyClinicId;

    const handleLogout = useCallback(async () => {
        setCurrentUser(null);
        setData(initialDataState);
        setSupplierMappingTemplates({});
        await dbDelete('medzillo_authToken');
        await dbDelete('medzillo_currentUser');
        await dbDelete('medzillo_supplierMappingTemplates');
    }, []);

    const fetchData = useCallback(async () => {
        if(isViewOnly) return;
        try {
            const [users, patients, medicines, suppliers, appointments, bills, pharmacyInfo, todos, chatMessages] = await api.fetchInitialData();
            setData({ 
                users, patients, medicines, suppliers, appointments, bills, 
                pharmacyInfo, todos, chatMessages, sharedLinks: [] 
            });
        } catch (error) {
            addToast((error as Error).message, 'error');
            if ((error as Error).message.toLowerCase().includes('token')) {
                handleLogout();
            }
        }
    }, [addToast, isViewOnly, handleLogout]);

    useEffect(() => {
        const checkSession = async () => {
            if(isViewOnly) {
                setIsLoading(false);
                return;
            };
            const user = await dbGet<User>('medzillo_currentUser');
            const token = await dbGet<string>('medzillo_authToken');
            const templates = await dbGet('medzillo_supplierMappingTemplates');
            if (templates) {
                setSupplierMappingTemplates(templates);
            }
            if (user && token) {
                setCurrentUser(user);
                await fetchData();
            }
            setIsLoading(false);
        };
        checkSession();
    }, [fetchData, isViewOnly]);

    const handleLogin = async (email: any, password: any) => {
        try {
            const { token, user } = await api.login(email, password);
            await dbSet('medzillo_authToken', token);
            await dbSet('medzillo_currentUser', user);
            setCurrentUser(user);
            await fetchData();
            const defaultView: View = user.role === 'Doctor' ? 'doctor-dashboard' : user.role === 'Admin' ? 'clinic-dashboard' : 'dashboard';
            setActiveView(defaultView);
            return true;
        } catch (error) {
            addToast((error as Error).message, 'error');
            return false;
        }
    };

    const handleSendOtp = async (data: any, context: 'register' | 'reset') => {
        try {
            if (context === 'register') {
                 return await api.sendRegistrationOtp(data);
            } else {
                 return await api.sendPasswordResetOtp(data.email);
            }
        } catch(error) {
            addToast((error as Error).message, 'error');
            return { success: false, message: (error as Error).message };
        }
    };

    const handleVerifyOtpAndRegister = async (email: any, otp: any, registrationData: any) => {
        try {
            const { token, user } = await api.verifyOtpAndRegister(email, otp, registrationData);
            await dbSet('medzillo_authToken', token);
            await dbSet('medzillo_currentUser', user);
            setCurrentUser(user);
            await fetchData();
            setActiveView('clinic-dashboard');
            addToast(`Welcome, ${user.name}! Your clinic has been registered.`, "success");
            return true;
        } catch (error) {
            addToast((error as Error).message, 'error');
            return false;
        }
    };
    
    const verifyPasswordResetOtp = async (email: any, otp: any) => {
        try {
            await api.verifyPasswordResetOtp(email, otp);
            return true;
        } catch(error) {
            addToast((error as Error).message, 'error');
            return false;
        }
    };

    const resetPassword = async (email: any, newPass: any) => {
        try {
            await api.resetPassword(email, newPass);
            addToast('Password has been reset successfully. Please log in.', 'success');
            return true;
        } catch(error) {
            addToast((error as Error).message, 'error');
            return false;
        }
    };
    
    const notifications = useMemo(() => {
        const alerts: Notification[] = [];
        const now = new Date();
        (data.medicines || []).forEach(med => {
            if (med.totalStockInUnits <= 0) {
                alerts.push({ id: `oos-${med.id}`, clinicId: med.clinicId, type: 'out-of-stock', message: `${med.name} is out of stock.`, timestamp: now.toISOString(), read: false });
            } else if (med.totalStockInUnits < med.minStockLevel) {
                alerts.push({ id: `low-${med.id}`, clinicId: med.clinicId, type: 'low-stock', message: `${med.name} is low on stock (${med.totalStockInUnits} left).`, timestamp: now.toISOString(), read: false });
            }
        });
        return alerts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [data.medicines]);

    const toBeBilledCount = useMemo(() => (data.appointments || []).filter(apt => apt.status === 'Ready for Billing').length, [data.appointments]);
    const unreadChatCount = useMemo(() => currentUser ? (data.chatMessages || []).filter(m => m.receiverId === currentUser.id && !m.read).length : 0, [currentUser, data.chatMessages]);
    const todaysQueueCount = useMemo(() => {
        if (!currentUser || currentUser.role !== 'Doctor') return 0;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return (data.appointments || []).filter(apt => {
            const aptDate = new Date(apt.startTime); aptDate.setHours(0, 0, 0, 0);
            return apt.doctorId === currentUser.id && aptDate.getTime() === today.getTime() && apt.status === 'Scheduled';
        }).length;
    }, [currentUser, data.appointments]);

    const inventory = useMemo(() => ({
        medicines: data.medicines,
        suppliers: data.suppliers,
        addMedicine: async (medData: any) => { try { await api.medicinesApi.create(medData); await fetchData(); addToast("Medicine added.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        updateMedicine: async (medData: any) => { try { await api.medicinesApi.update(medData.id, medData); await fetchData(); addToast("Medicine updated.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        deleteMedicine: async (id: any) => { try { await api.medicinesApi.delete(id); await fetchData(); addToast("Medicine deleted.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        addBatchToMedicine: async (medId: any, batch: any) => { try { await api.addBatch(medId, batch); await fetchData(); addToast("Batch added.", "success"); } catch(e){ addToast((e as Error).message, 'error'); }},
        deleteBatchFromMedicine: async (medId: any, batchId: any) => { try { await api.deleteBatch(medId, batchId); await fetchData(); addToast("Batch deleted.", "success"); } catch(e){ addToast((e as Error).message, 'error'); }},
        addSupplier: async (supData: any) => { try { await api.suppliersApi.create(supData); await fetchData(); addToast("Supplier added.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        updateSupplier: async (supData: any) => { try { await api.suppliersApi.update(supData.id, supData); await fetchData(); addToast("Supplier updated.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        deleteSupplier: async (id: any) => { try { await api.suppliersApi.delete(id); await fetchData(); addToast("Supplier deleted.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        importStockData: async (items: any) => { try { await api.importStock(items); await fetchData(); addToast("Stock imported.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; } },
    }), [data.medicines, data.suppliers, addToast, fetchData]);

    const patients = useMemo(() => ({
        patients: data.patients,
        appointments: data.appointments,
        doctors: (data.users || []).filter(u => u.role === 'Doctor'),
        addPatient: async (patientData: any) => { try { const newPatient = await api.patientsApi.create(patientData); await fetchData(); addToast("Patient added.", "success"); return newPatient; } catch(e){ addToast((e as Error).message, 'error'); return null; }},
        updatePatient: async (patientData: any) => { try { await api.patientsApi.update(patientData.id, patientData); await fetchData(); addToast("Patient updated.", "success"); } catch(e){ addToast((e as Error).message, 'error'); }},
        deletePatient: async (id: any) => { try { await api.patientsApi.delete(id); await fetchData(); addToast("Patient deleted.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        addAppointment: async (aptData: any) => { try { await api.appointmentsApi.create(aptData); await fetchData(); addToast("Appointment added.", "success"); } catch(e){ addToast((e as Error).message, 'error'); }},
        updateAppointmentStatus: async (id: any, status: any) => { try { await api.updateAppointmentStatus(id, status); await fetchData(); addToast("Status updated.", "info"); } catch(e){ addToast((e as Error).message, 'error'); }},
        addMultiplePatients: async (patientsData: any) => { try { await api.bulkImportPatients(patientsData); await fetchData(); addToast("Patients imported.", "success"); } catch(e){ addToast((e as Error).message, 'error'); }},
        draftConsultations, setDraftConsultations,
        addVitalsForAppointment: async (appointment: any, vitals: any) => {
            try {
                // The API returns the full consultation object with vitals flattened
                const newVitalsConsultation = await api.addVitals(appointment.id, vitals);

                setData(prevData => {
                    const updatedPatients = prevData.patients.map(p => {
                        if (p.id === appointment.patientId) {
                            // Add the new consultation to the patient's record
                            const existingConsultations = p.consultations || [];
                            return {
                                ...p,
                                consultations: [...existingConsultations, newVitalsConsultation],
                            };
                        }
                        return p;
                    });
                    return { ...prevData, patients: updatedPatients };
                });

                addToast('Vitals have been recorded successfully.', 'success');
                // We don't need to call fetchData() here anymore because we've manually
                // updated the state with the exact response from the server.
            } catch(e) {
                addToast((e as Error).message, 'error');
            }
        },
        saveConsultation: async (appointment: any, consultationData: any) => {
            try {
                if (!currentUser) throw new Error("Authentication error: No user is currently logged in.");

                const payload = {
                    ...consultationData,
                    ...consultationData.vitals,
                    patientId: appointment.patientId,
                    doctorId: currentUser.id,
                    appointmentId: appointment.id,
                };
                delete payload.vitals;

                const newConsultation = await api.saveConsultation(payload);

                setData(prevData => {
                    const updatedPatients = prevData.patients.map(p => {
                        if (p.id === appointment.patientId) {
                            const existingConsultations = p.consultations || [];
                            return { ...p, consultations: [...existingConsultations, newConsultation] };
                        }
                        return p;
                    });

                    const newStatus: AppointmentStatus = (newConsultation.prescription && newConsultation.prescription.length > 0) ? 'Ready for Billing' : 'Completed';
                    
                    const updatedAppointments = prevData.appointments.map(apt =>
                        apt.id === appointment.id ? { ...apt, status: newStatus } : apt
                    );

                    return {
                        ...prevData,
                        patients: updatedPatients,
                        appointments: updatedAppointments,
                    };
                });

                setDraftConsultations(prev => {
                    const d = { ...prev };
                    delete d[appointment.id];
                    return d;
                });

                addToast("Consultation saved successfully.", "success");
            } catch (e) {
                addToast((e as Error).message, 'error');
            }
        },
        scheduleAppointmentFromReview: async (appointmentData: any, consultationId: any) => { try { await api.scheduleAppointmentFromReview(consultationId, appointmentData); await fetchData(); addToast("Appointment scheduled from review.", "success"); setActiveView('appointments'); } catch(e) { addToast((e as Error).message, 'error'); } },
    }), [data.patients, data.appointments, data.users, draftConsultations, currentUser, addToast, fetchData, setActiveView]);

    const billing = useMemo(() => ({
        bills: data.bills,
        draftBill, setDraftBill, clearDraftBill: () => setDraftBill(null),
        processSale: async (newBill: any) => { try { const processedBill = await api.billsApi.create(newBill); await fetchData(); addToast(`Invoice ${processedBill.billNumber} generated!`, 'success'); return processedBill; } catch(e){ addToast((e as Error).message, 'error'); return null; }},
        createBillFromConsultation: (patient: Patient, consultation: Consultation, appointmentId: any) => {
            const doctor = (data.users || []).find(u => u.id === consultation.doctorId);
            const feeItem: BillItem | null = doctor?.consultationFee ? { itemType: 'Consultation Fee', itemName: `Consultation - ${doctor.name}`, quantity: 1, rate: doctor.consultationFee, amount: doctor.consultationFee, gstRate: 0, isRemovable: true } : null;
            const presItems = generateBillItemsFromPrescription(consultation, data.medicines || []);
            const allItems = feeItem ? [feeItem, ...presItems] : presItems;
            setDraftBill({
                clinicId: currentUser!.clinicId, patientId: patient.id, patientTab: 'existing', newPatientName: '', newPatientMobile: '',
                items: allItems, paymentMode: 'Cash',
                // THIS IS THE FIX: Remove faulty fallback logic. Trust the passed ID.
                appointmentId: appointmentId,
            });
            setActiveView('billing');
        },
        createRefillDraftBill: (patient: Patient, consultation: Consultation) => {
            const presItems = generateBillItemsFromPrescription(consultation, data.medicines || []).filter(item => item.itemType === 'Medicine');
            if (presItems.length === 0) {
                addToast("No medicines in the original prescription to refill.", "info");
                return;
            }
            setDraftBill({
                clinicId: currentUser!.clinicId,
                patientId: patient.id,
                patientTab: 'existing',
                newPatientName: '',
                newPatientMobile: '',
                items: presItems,
                paymentMode: 'Cash',
                appointmentId: undefined,
            });
            setActiveView('billing');
        },
    }), [data.bills, data.users, data.medicines, draftBill, currentUser, fetchData, addToast, setActiveView]);

    const admin = useMemo(() => ({
        users: data.users,
        pharmacyInfo: data.pharmacyInfo,
        todos: data.todos,
        supplierMappingTemplates,
        addUser: async (userData: any) => { try { await api.usersApi.create(userData); await fetchData(); addToast("User added.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        updateUser: async (userData: any) => { try { await api.usersApi.update(userData.id, userData); await fetchData(); addToast("User updated.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        deleteUser: async (id: any) => { try { await api.usersApi.delete(id); await fetchData(); addToast("User deleted.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        setPharmacyInfo: async (info: any) => { try { await api.updateClinicProfile(info); await fetchData(); addToast("Info updated.", "success"); return true; } catch(e){ addToast((e as Error).message, 'error'); return false; }},
        handleSetGstEnabled: async (isEnabled: any) => { try { await api.updateClinicProfile({ ...data.pharmacyInfo, isGstEnabled: isEnabled }); await fetchData(); addToast(`GST calculations ${isEnabled ? 'enabled' : 'disabled'}.`, 'info'); } catch(e){ addToast((e as Error).message, 'error'); }},
        addTodo: async (task: any, dueDate: any) => { try { await api.todosApi.create({ task, dueDate }); await fetchData(); addToast("To-do added.", "success"); } catch(e){ addToast((e as Error).message, 'error'); }},
        updateTodoStatus: async (id: any, isCompleted: any) => { try { await api.todosApi.update(id, { isCompleted }); await fetchData(); } catch(e){ addToast((e as Error).message, 'error'); }},
        deleteTodo: async (id: any) => { try { await api.todosApi.delete(id); await fetchData(); addToast("To-do deleted.", "success"); } catch(e){ addToast((e as Error).message, 'error'); }},
        createSharedLink: async (aptId: any) => { try { const newLink = await api.createSharedLink(aptId); await fetchData(); addToast("Share link created.", "success"); return newLink; } catch(e){ addToast((e as Error).message, 'error'); return null; }},
        saveSupplierMappingTemplate: async (supplierId: string, mapping: any) => {
            const newTemplates = { ...supplierMappingTemplates, [supplierId]: mapping };
            setSupplierMappingTemplates(newTemplates);
            await dbSet('medzillo_supplierMappingTemplates', newTemplates);
            addToast("Mapping template saved.", "success");
        },
    }), [data.users, data.pharmacyInfo, data.todos, addToast, fetchData, supplierMappingTemplates]);

    const communication = useMemo(() => ({
        chatMessages: data.chatMessages,
        sendMessage: async (receiverId: any, content: any) => { try { await api.sendMessage(receiverId, content); await fetchData(); } catch(e){ addToast((e as Error).message, 'error'); }},
        markMessagesAsRead: async (senderId: any) => { try { await api.markMessagesAsRead(senderId); await fetchData(); } catch(e){ addToast((e as Error).message, 'error'); }},
    }), [data.chatMessages, addToast, fetchData]);

    const value: ClinicDataContextType = {
        currentUser: isViewOnly ? { id: 'viewer', clinicId: viewOnlyClinicId, name: 'Viewer', email: '', role: 'Admin' } as User : currentUser, 
        activeView, setActiveView, notifications,
        toBeBilledCount, unreadChatCount, todaysQueueCount,
        handleLogin, handleLogout, 
        handleSendOtp, handleVerifyOtpAndRegister, verifyPasswordResetOtp, resetPassword,
        inventory, patients, billing, admin, communication,
        handleRegisterClinic: async () => true, // Placeholder for type compatibility
        markAllNotificationsAsRead: () => {},
        clearAllNotifications: () => {},
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <SpinnerIcon className="w-10 h-10 text-brand-primary animate-spin" />
            </div>
        );
    }

    return <ClinicDataContext.Provider value={value}>{children}</ClinicDataContext.Provider>;
};

export const useClinicData = (): ClinicDataContextType => {
    const context = useContext(ClinicDataContext);
    if (context === undefined) {
        throw new Error('useClinicData must be used within a ClinicDataProvider');
    }
    return context;
};