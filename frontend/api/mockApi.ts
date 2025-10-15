// api/clinicService.ts

import { 
    Patient, Medicine, Batch, Bill, Appointment, AppointmentStatus, Supplier,
    User, PharmacyInfo, TodoItem, ChatMessage, SharedLink, Consultation, Vitals, ProcessedStockItem, ProcessedPatientItem
} from '../types';

/**
 * @file This service acts as a mock API layer, abstracting all data manipulation logic.
 * In a real application, these functions would make network requests to a backend.
 * For now, they operate on local data structures to simulate backend behavior.
 */

// --- Patient Management ---

export const apiAddPatient = async (
    patients: Patient[], 
    patientData: Omit<Patient, 'id' | 'clinicId' | 'consultations'>,
    clinicId: string
): Promise<Patient> => {
    const newPatient: Patient = {
        id: `pat_${Date.now()}`,
        clinicId: clinicId,
        ...patientData,
        consultations: [],
        vaccinations: patientData.vaccinations || [],
        skippedVaccinations: patientData.skippedVaccinations || [],
        vaccinationOverrides: []
    };
    return newPatient;
};

export const apiUpdatePatient = async (patients: Patient[], updatedPatient: Patient): Promise<Patient[]> => {
    return patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
};

export const apiDeletePatient = async (
    patientId: string, 
    patients: Patient[], 
    appointments: Appointment[], 
    bills: Bill[]
): Promise<{ patients: Patient[], appointments: Appointment[], bills: Bill[] }> => {
    return {
        patients: patients.filter(p => p.id !== patientId),
        appointments: appointments.filter(a => a.patientId !== patientId),
        bills: bills.filter(b => b.patient.id !== patientId),
    };
};

export const apiAddMultiplePatients = async (
    patientsData: ProcessedPatientItem['data'][],
    clinicId: string
): Promise<Patient[]> => {
    return patientsData.map(p => ({
        id: `pat_${Date.now()}_${Math.random()}`,
        clinicId: clinicId,
        ...p,
        consultations: [],
        vaccinations: [],
        skippedVaccinations: [],
    }));
};

// --- Medicine & Inventory Management ---

export const apiAddMedicine = async (
    medicineData: Omit<Medicine, 'id' | 'clinicId' | 'totalStockInUnits' | 'batches'>,
    clinicId: string
): Promise<Medicine> => {
    return { 
        id: `med_${Date.now()}`, 
        clinicId: clinicId, 
        ...medicineData, 
        totalStockInUnits: 0, 
        batches: [] 
    };
};

export const apiUpdateMedicine = async (medicines: Medicine[], updatedMedicine: Medicine): Promise<Medicine[]> => {
    return medicines.map(m => m.id === updatedMedicine.id ? updatedMedicine : m);
};

export const apiDeleteMedicine = async (medicines: Medicine[], medicineId: string): Promise<Medicine[]> => {
    return medicines.filter(m => m.id !== medicineId);
};

const calculateStock = (batches: Batch[]): number => {
    return batches.reduce((acc, batch) => acc + (Number(batch.packQuantity || 0) * Number(batch.packSize || 0)) + Number(batch.looseQuantity || 0), 0);
};

export const apiAddBatchToMedicine = async (medicines: Medicine[], medicineId: string, batch: Batch): Promise<Medicine[]> => {
    return medicines.map(med => {
        if (med.id === medicineId) {
            const newBatches = [...med.batches, batch];
            return { ...med, batches: newBatches, totalStockInUnits: calculateStock(newBatches) };
        }
        return med;
    });
};

export const apiDeleteBatchFromMedicine = async (medicines: Medicine[], medicineId: string, batchNumber: string): Promise<Medicine[]> => {
    return medicines.map(med => {
        if (med.id === medicineId) {
            const newBatches = med.batches.filter(b => b.batchNumber !== batchNumber);
            return { ...med, batches: newBatches, totalStockInUnits: calculateStock(newBatches) };
        }
        return med;
    });
};

export const apiImportStock = async (
    items: ProcessedStockItem[],
    currentMedicines: Medicine[],
    currentSuppliers: Supplier[],
    hsnCodes: { [key: string]: number },
    clinicId: string
): Promise<Medicine[]> => {
    const medicinesToProcess = [...currentMedicines];
    let newMedicinesFromImport: Medicine[] = [];

    items.forEach(item => {
        const { data } = item;
        const supplier = currentSuppliers.find(s => s.name.toLowerCase() === data.supplierName.toLowerCase().trim());
        if (!supplier) return;

        const batch: Batch = {
            batchNumber: data.batchNumber,
            expiryDate: data.expiryDate,
            packQuantity: Number(data.packQuantity),
            looseQuantity: 0,
            purchaseRate: Number(data.purchaseRate),
            sellingRate: Number(data.mrp),
            packSize: Number(data.unitsPerPack),
            supplierId: supplier.id,
            supplierName: supplier.name,
            purchaseDate: new Date().toISOString().split('T')[0],
        };
        
        if (item.status === 'new_batch' && item.medicineId) {
            const medIndex = medicinesToProcess.findIndex(m => m.id === item.medicineId);
            if (medIndex > -1) {
                const existingMed = medicinesToProcess[medIndex];
                const newBatches = [...existingMed.batches, batch];
                medicinesToProcess[medIndex] = { ...existingMed, batches: newBatches, totalStockInUnits: calculateStock(newBatches) };
            }
        } else if (item.status === 'new_medicine') {
            const newMed: Medicine = {
                id: `med_${Date.now()}_${Math.random()}`,
                clinicId: clinicId,
                name: data.medicineName, manufacturer: data.manufacturer, composition: data.composition, strength: data.strength,
                form: data.form, unitType: data.form, hsnCode: data.hsnCode, gstRate: hsnCodes[data.hsnCode] || 0,
                minStockLevel: 10, batches: [batch], totalStockInUnits: 0,
            };
            newMed.totalStockInUnits = calculateStock(newMed.batches);
            newMedicinesFromImport.push(newMed);
        }
    });

    return [...medicinesToProcess, ...newMedicinesFromImport];
};

// --- Supplier Management ---

export const apiAddSupplier = async (supplierData: Omit<Supplier, "id" | "clinicId">, clinicId: string): Promise<Supplier> => {
    return { id: `sup_${Date.now()}`, clinicId, ...supplierData };
};

export const apiUpdateSupplier = async (suppliers: Supplier[], updatedSupplier: Supplier): Promise<Supplier[]> => {
    return suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s);
};

export const apiDeleteSupplier = async (suppliers: Supplier[], supplierId: string): Promise<Supplier[]> => {
    return suppliers.filter(s => s.id !== supplierId);
};

// --- Billing ---

export const apiProcessSale = async (
    medicines: Medicine[],
    bills: Bill[],
    appointments: Appointment[],
    newBill: Bill
): Promise<{ updatedMedicines: Medicine[], updatedBills: Bill[], updatedAppointments: Appointment[], processedBill: Bill }> => {
    let updatedMedicines = [...medicines];
    
    newBill.items.forEach(item => {
        if (item.itemType === 'Medicine' && item.medicineId && item.batchNumber) {
            const medIndex = updatedMedicines.findIndex(m => m.id === item.medicineId);
            if (medIndex !== -1) {
                const med = { ...updatedMedicines[medIndex] };
                const batchIndex = med.batches.findIndex(b => b.batchNumber === item.batchNumber);
                if (batchIndex !== -1) {
                    const batch = { ...med.batches[batchIndex] };
                    const batchStockInUnits = (batch.packQuantity * batch.packSize) + batch.looseQuantity;
                    const newBatchStockInUnits = batchStockInUnits - item.quantity;
                    
                    batch.packQuantity = Math.floor(newBatchStockInUnits / batch.packSize);
                    batch.looseQuantity = newBatchStockInUnits % batch.packSize;
                    
                    med.batches = [...med.batches];
                    med.batches[batchIndex] = batch;
                    med.totalStockInUnits = calculateStock(med.batches);
                    updatedMedicines[medIndex] = med;
                }
            }
        }
    });

    const updatedAppointments = appointments.map(apt => 
        apt.id === newBill.appointmentId ? { ...apt, status: 'Completed' as AppointmentStatus } : apt
    );
    
    const updatedBills = [...bills, newBill];

    return { updatedMedicines, updatedBills, updatedAppointments, processedBill: newBill };
};

// --- Appointment & Consultation ---

export const apiAddAppointment = async (appointmentData: Omit<Appointment, 'id' | 'clinicId'>, clinicId: string): Promise<Appointment> => {
    return { id: `apt_${Date.now()}`, clinicId, ...appointmentData };
};

export const apiUpdateAppointmentStatus = async (appointments: Appointment[], appointmentId: string, status: AppointmentStatus): Promise<Appointment[]> => {
    return appointments.map(a => a.id === appointmentId ? { ...a, status } : a);
};

export const apiSaveConsultation = async (
    patients: Patient[],
    appointments: Appointment[],
    appointment: Appointment,
    consultationData: Omit<Consultation, 'id' | 'clinicId' | 'date' | 'doctorId' | 'doctorName'>,
    currentUser: User
): Promise<{ updatedPatients: Patient[], updatedAppointments: Appointment[] }> => {
    const newConsultation: Consultation = {
        id: `con_${appointment.id}`, clinicId: currentUser.clinicId, date: new Date().toISOString(),
        doctorId: currentUser.id, doctorName: currentUser.name, ...consultationData
    };
    
    const updatedPatients = patients.map(p => {
        if (p.id === appointment.patientId) {
            const otherConsultations = p.consultations.filter(c => c.id !== newConsultation.id);
            return { ...p, consultations: [...otherConsultations, newConsultation] };
        }
        return p;
    });
    
    const newStatus: AppointmentStatus = consultationData.prescription.length > 0 ? 'Ready for Billing' : 'Completed';
    const updatedAppointments = appointments.map(apt => 
        apt.id === appointment.id ? { ...apt, status: newStatus } : apt
    );

    return { updatedPatients, updatedAppointments };
};

export const apiAddVitals = async (
    patients: Patient[],
    appointment: Appointment,
    vitals: Vitals,
    currentUser: User
): Promise<Patient[]> => {
    const vitalsConsultation: Consultation = {
        id: `con_vitals_${appointment.id}`, clinicId: currentUser.clinicId, date: new Date().toISOString(),
        doctorId: appointment.doctorId, doctorName: appointment.doctorName,
        chiefComplaint: "Vitals Recorded", diagnosis: "Vitals Recorded",
        prescription: [], vitals,
    };
    return patients.map(p => {
        if (p.id === appointment.patientId) {
            const otherConsultations = p.consultations.filter(c => c.id !== vitalsConsultation.id);
            return { ...p, consultations: [...otherConsultations, vitalsConsultation] };
        }
        return p;
    });
};

export const apiScheduleAppointmentFromReview = async (
    patients: Patient[],
    appointments: Appointment[],
    appointmentData: Omit<Appointment, 'id' | 'clinicId'>,
    consultationId: string,
    clinicId: string
): Promise<{ updatedPatients: Patient[], updatedAppointments: Appointment[] }> => {
    const newAppointment: Appointment = { id: `apt_${Date.now()}`, clinicId, ...appointmentData };
    const updatedAppointments = [...appointments, newAppointment];
    
    const updatedPatients = patients.map(p => {
        if (p.id === appointmentData.patientId) {
            const updatedConsultations = p.consultations.map(c => {
                if (c.id === consultationId) {
                    const { nextReviewDate, ...rest } = c;
                    return rest as Consultation;
                }
                return c;
            });
            return { ...p, consultations: updatedConsultations };
        }
        return p;
    });

    return { updatedPatients, updatedAppointments };
};


// --- User & Settings Management ---

export const apiAddUser = async (userData: Omit<User, 'id' | 'clinicId'>, clinicId: string): Promise<User> => {
    return { id: `user_${Date.now()}`, clinicId, ...userData };
};

export const apiUpdateUser = async (users: User[], updatedUser: User): Promise<User[]> => {
    return users.map(u => u.id === updatedUser.id ? updatedUser : u);
};

export const apiDeleteUser = async (users: User[], userId: string): Promise<User[]> => {
    return users.filter(u => u.id !== userId);
};

export const apiUpdatePharmacyInfo = async (info: PharmacyInfo): Promise<PharmacyInfo> => {
    return info;
};

// --- Communication & Todos ---

export const apiSendMessage = async (
    messages: ChatMessage[],
    senderId: string,
    receiverId: string,
    content: string,
    clinicId: string
): Promise<ChatMessage> => {
    return {
        id: `msg_${Date.now()}`, clinicId, senderId, receiverId, content,
        timestamp: new Date().toISOString(), read: false
    };
};

export const apiMarkMessagesAsRead = async (
    messages: ChatMessage[],
    senderId: string,
    currentUserId: string
): Promise<ChatMessage[]> => {
    return messages.map(msg => 
        msg.senderId === senderId && msg.receiverId === currentUserId ? { ...msg, read: true } : msg
    );
};

export const apiCreateSharedLink = async (appointmentId: string, clinicId: string): Promise<SharedLink> => {
    return {
        id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        appointmentId, clinicId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
};

// --- To-Do Management ---

export const apiAddTodo = async (
    task: string, 
    dueDate: string | null,
    clinicId: string,
    doctorId: string
): Promise<TodoItem> => {
    return {
        id: `todo_${Date.now()}`,
        clinicId,
        doctorId,
        task,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        dueDate,
    };
};

export const apiUpdateTodoStatus = async (
    todos: TodoItem[],
    todoId: string,
    isCompleted: boolean
): Promise<TodoItem[]> => {
    return todos.map(todo =>
        todo.id === todoId ? { ...todo, isCompleted } : todo
    );
};

export const apiDeleteTodo = async (
    todos: TodoItem[],
    todoId: string
): Promise<TodoItem[]> => {
    return todos.filter(todo => todo.id !== todoId);
};