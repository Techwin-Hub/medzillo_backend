// components/PatientDetail.tsx (Corrected Version)

import React, { useState } from 'react';
import { Patient, User, Medicine, Consultation, Appointment, PharmacyInfo, VaccinationRecord, View, Bill, SharedLink, VaccinationOverride } from '../types';
import { EditIcon, CalendarDaysIcon, RxIcon, SyringeIcon, ArrowLeftIcon, BillingIcon, ArrowPathIcon, DocumentTextIcon, ShareIcon, DeleteIcon } from './icons';
import { PatientForm } from './PatientForm';
import { GrowthChart } from './GrowthChart';
import { AppointmentForm } from './AppointmentForm';
import { Prescription } from './Prescription';
import { VaccinationTracker } from './VaccinationTracker';
import { Invoice } from './Invoice';
import { ConfirmModal } from './ConfirmModal';

interface PatientDetailProps {
    patient: Patient;
    patients: Patient[];
    doctors: User[];
    users: User[];
    currentUser: User;
    medicines: Medicine[];
    bills: Bill[];
    pharmacyInfo: PharmacyInfo;
    onBack: () => void;
    onUpdatePatient: (updatedPatient: Patient) => void;
    onDeletePatient: (patientId: string) => Promise<boolean>;
    onAddAppointment: (appointmentData: Omit<Appointment, 'id' | 'clinicId'>) => void;
    onCreateBill: (patient: Patient, consultation: Consultation, appointmentId?: string) => void;
    onCreateRefill: (patient: Patient, consultation: Consultation) => void;
    navigationSource?: View | null;
    createSharedLink: (appointmentId: string) => Promise<SharedLink | null>;
}

const InfoCard: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</p>
    </div>
);

const parseIndianDate = (indianDateStr: string | undefined): Date | null => {
    if (!indianDateStr) return null;
    const parts = indianDateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!parts) return null;
    const [, day, month, year] = parts;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (isNaN(date.getTime()) || date.getUTCDate() !== parseInt(day, 10)) return null;
    return date;
};

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, patients, doctors, users, currentUser, medicines, bills, pharmacyInfo, onBack, onUpdatePatient, onDeletePatient, onAddAppointment, onCreateBill, onCreateRefill, navigationSource, createSharedLink }) => {
    const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
    const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
    const [viewingPrescription, setViewingPrescription] = useState<Consultation | null>(null);
    const [isVaccinationModalOpen, setIsVaccinationModalOpen] = useState(false);
    const [viewingBill, setViewingBill] = useState<Bill | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'clinicId' | 'status'>) => {
        onAddAppointment({ ...appointmentData, status: 'Scheduled' });
        setIsAppointmentFormOpen(false);
    };
    
    const handleSavePatient = (patientData: Omit<Patient, 'id' | 'consultations'>) => {
        onUpdatePatient({ ...patient, ...patientData });
        setIsPatientFormOpen(false);
    };

    const handleDelete = () => {
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        const success = await onDeletePatient(patient.id);
        setIsDeleting(false);
        setIsConfirmDeleteOpen(false);
        if (success) {
            onBack();
        }
    };

    const handleTrackerSave = (data: { vaccinations: VaccinationRecord[], skippedVaccinations: { vaccineName: string; dose: number | string }[], vaccinationOverrides?: VaccinationOverride[] }) => {
        onUpdatePatient({ ...patient, ...data });
    };
    
    const handleShare = async (appointmentId: string, consultation: Consultation) => {
        const link = await createSharedLink(appointmentId);
        if (!link) {
            return;
        }

        const shareUrl = `${window.location.origin}/share/${link.id}`;
        
        const message = `Hello ${patient.name},\n\nHere are the documents from your consultation with ${consultation.doctorName} on ${new Date(consultation.date).toLocaleDateString('en-GB')}:\n\n${shareUrl}\n\nThis link will expire in 7 days.\n\nThank you,\n${pharmacyInfo.name}`;
        
        let phoneNumber = patient.mobile;
        if (phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber.replace(/\D/g, '');
        } else {
            let cleanedNumber = phoneNumber.replace(/\D/g, '');
            if (cleanedNumber.startsWith('0')) {
                cleanedNumber = cleanedNumber.substring(1);
            }
            phoneNumber = `91${cleanedNumber}`;
        }
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(url, '_blank', 'noopener,noreferrer');
    };


    const getAgeDetails = (dobStr: string | undefined) => {
        const birthDate = parseIndianDate(dobStr);
        if (!birthDate) return { years: null, display: 'N/A' };
        
        const today = new Date();
        
        let years = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            years--;
        }
        
        if (years < 1) {
            let totalMonths = (today.getFullYear() * 12 + today.getMonth()) - (birthDate.getFullYear() * 12 + birthDate.getMonth());
            if(today.getDate() < birthDate.getDate()){
                 totalMonths--;
            }
            const displayMonths = Math.max(0, totalMonths);

            return { years: 0, display: `${displayMonths} month${displayMonths !== 1 ? 's' : ''}` };
        }
        
        return { years, display: `${years} year${years !== 1 ? 's' : ''}` };
    };

    const ageDetails = getAgeDetails(patient.dob);
    const isUnder20 = ageDetails.years !== null && ageDetails.years < 20;

    const visibleConsultations = (patient.consultations || [])
        .filter(con => con.diagnosis !== 'Vitals Recorded')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const doctorForPrescription = viewingPrescription ? doctors.find(d => d.id === viewingPrescription.doctorId) : null;

    const getBackButtonLabel = () => {
        if (navigationSource === 'todays-appointments') {
            return 'Back to Consultation Queue';
        }
        return 'Back to Patient List';
    };
    
    const primaryAdminId = (users || [])[0]?.id;
    const isPrimaryAdmin = currentUser.id === primaryAdminId;

    return (
        <div className="dark:text-slate-200">
            <div className="mb-6">
                <button onClick={onBack} className="flex items-center text-brand-primary hover:underline mb-2 font-medium">
                    <ArrowLeftIcon className="w-5 h-5 mr-1"/>
                    {getBackButtonLabel()}
                </button>
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100">{patient.name}</h2>
                    <div className="flex items-center space-x-3 shrink-0">
                        {isUnder20 && (
                            <button onClick={() => setIsVaccinationModalOpen(true)} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-purple-700 transition-colors text-sm font-semibold">
                                <SyringeIcon className="w-5 h-5 mr-2" />
                                Vaccination Tracker
                            </button>
                        )}
                        <button onClick={() => setIsAppointmentFormOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors text-sm font-semibold">
                            <CalendarDaysIcon className="w-5 h-5 mr-2" />
                            Schedule
                        </button>
                    </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Patient Details</h3>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setIsPatientFormOpen(true)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800" title="Edit Patient Info">
                            <EditIcon className="w-5 h-5"/>
                        </button>
                        <button 
                            onClick={handleDelete} 
                            className="text-red-600 dark:text-red-400 hover:text-red-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed" 
                            title={isPrimaryAdmin ? "Delete Patient" : "Only the primary admin can delete patients."}
                            disabled={!isPrimaryAdmin}
                        >
                            <DeleteIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoCard label="Mobile" value={patient.mobile} />
                    <InfoCard label="Age" value={ageDetails.display} />
                    <InfoCard label="Gender" value={patient.gender} />
                    <InfoCard label="Blood Group" value={patient.bloodGroup} />
                    <div className="col-span-2 md:col-span-4"><InfoCard label="Address" value={patient.address} /></div>
                    <div className="col-span-2 md:col-span-4"><InfoCard label="Allergies" value={patient.allergies} /></div>
                </div>
            </div>

            {(patient.consultations || []).length > 0 && <GrowthChart consultations={patient.consultations} />}

            <div className="mt-6">
                <h3 className="text-2xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Consultation History</h3>
                <div className="space-y-4">
                    {visibleConsultations.map(con => {
                        // THIS IS A CORRECTED LINE
                        const associatedBill = (bills || []).find(b => b.appointmentId === con.appointmentId);
                        const isBilled = !!associatedBill;

                        return (
                            <div key={con.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-l-4 border-blue-400 border-slate-200 dark:border-slate-700">
                               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <DocumentTextIcon className="w-8 h-8 text-blue-500" />
                                        <div>
                                            <p className="font-semibold text-brand-secondary dark:text-slate-100">{new Date(con.date).toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{con.doctorName}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                                        <button
                                            onClick={() => setViewingPrescription(con)}
                                            className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            <RxIcon className="w-4 h-4 mr-1.5" />
                                            View Rx
                                        </button>
                                        {isBilled ? (
                                            <button
                                                onClick={() => setViewingBill(associatedBill)}
                                                className="flex items-center text-sm bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-900"
                                            >
                                                <BillingIcon className="w-4 h-4 mr-1.5" />
                                                View Invoice
                                            </button>
                                        ) : (
                                            (con.prescription || []).length > 0 && (
                                                <button
                                                    // THIS IS THE MAIN FIX: Use con.appointmentId directly
                                                    onClick={() => onCreateBill(patient, con, con.appointmentId)}
                                                    className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors"
                                                >
                                                    Create Bill
                                                </button>
                                            )
                                        )}
                                        {(con.prescription || []).length > 0 && (
                                            <button
                                                onClick={() => onCreateRefill(patient, con)}
                                                className="flex items-center text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-3 py-1.5 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900"
                                            >
                                                <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                                                Refill
                                            </button>
                                        )}
                                        {isBilled && con.appointmentId && (
                                            <button
                                                onClick={() => handleShare(con.appointmentId!, con)}
                                                className="flex items-center text-sm bg-slate-600 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
                                            >
                                                <ShareIcon className="w-4 h-4 mr-1.5" />
                                                Share
                                            </button>
                                        )}
                                    </div>
                               </div>
                               <div className="mt-4 space-y-3">
                                    <div className="flex"><p className="w-28 font-semibold text-slate-800 dark:text-slate-200 shrink-0">Complaint:</p><p className="text-slate-700 dark:text-slate-400">{con.chiefComplaint}</p></div>
                                    <div className="flex"><p className="w-28 font-semibold text-slate-800 dark:text-slate-200 shrink-0">Diagnosis:</p><p className="text-slate-700 dark:text-slate-400">{con.diagnosis}</p></div>
                                    {con.nextReviewDate && <div className="flex"><p className="w-28 font-semibold text-slate-800 dark:text-slate-200 shrink-0">Next Review:</p><p className="text-slate-700 dark:text-slate-400 font-semibold">{new Date(con.nextReviewDate).toLocaleDateString('en-GB')}</p></div>}
                                    
                                    {con.vitals && Object.values(con.vitals).some(v => v) && (
                                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700 dark:text-slate-300">
                                                {con.vitals.bloodPressure && <span><strong>BP:</strong> {con.vitals.bloodPressure}</span>}
                                                {con.vitals.pulse && <span><strong>Pulse:</strong> {con.vitals.pulse} bpm</span>}
                                                {con.vitals.temperature && <span><strong>Temp:</strong> {con.vitals.temperature}°F</span>}
                                                {con.vitals.weight && <span><strong>Weight:</strong> {con.vitals.weight} kg</span>}
                                                {con.vitals.height && <span><strong>Height:</strong> {con.vitals.height} cm</span>}
                                            </div>
                                        </div>
                                    )}
                                    {(con.prescription || []).length > 0 && (
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">Prescription:</p>
                                            <ul className="mt-1 space-y-1 list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                                                {con.prescription.map((p, i) => <li key={i}><span className="font-medium text-slate-800 dark:text-slate-200">{p.medicineName}</span> - {p.dosage} for {p.duration.replace(/\D/g, '')} days (Qty: {p.quantity})</li>)}
                                            </ul>
                                        </div>
                                    )}
                               </div>
                            </div>
                        )
                    })}
                    {visibleConsultations.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">No consultation history found.</p>}
                </div>
            </div>

            {isAppointmentFormOpen && (
                <AppointmentForm
                    patients={patients}
                    doctors={doctors}
                    initialPatientId={patient.id}
                    onClose={() => setIsAppointmentFormOpen(false)}
                    onSave={(appointmentData) => {
                        onAddAppointment({ ...appointmentData, status: 'Scheduled' });
                        setIsAppointmentFormOpen(false);
                    }}
                />
            )}
            
             {isPatientFormOpen && (
                <PatientForm
                    patient={patient}
                    onClose={() => setIsPatientFormOpen(false)}
                    onSave={(patientData) => {
                         onUpdatePatient({ ...patient, ...patientData });
                         setIsPatientFormOpen(false);
                    }}
                />
            )}

            {viewingPrescription && doctorForPrescription && (
                <Prescription 
                    consultation={viewingPrescription}
                    patient={patient}
                    doctor={doctorForPrescription}
                    pharmacyInfo={pharmacyInfo}
                    medicines={medicines}
                    onClose={() => setViewingPrescription(null)}
                />
            )}
             {isVaccinationModalOpen && (
                <VaccinationTracker
                    patient={patient}
                    onClose={() => setIsVaccinationModalOpen(false)}
                    onSave={handleTrackerSave}
                />
            )}
            {viewingBill && (
                <Invoice
                    bill={viewingBill}
                    pharmacyInfo={pharmacyInfo}
                    onClose={() => setViewingBill(null)}
                />
            )}
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                isLoading={isDeleting}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Patient"
                message={`Are you sure you want to permanently delete ${patient.name}? All of their associated appointments, consultations, and billing history will also be deleted. This action cannot be undone.`}
            />
        </div>
    );
};