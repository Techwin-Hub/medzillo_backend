import React, { useState, useMemo } from 'react';
import { Appointment, Patient, User, Medicine, Vitals, PrescriptionItem, DraftConsultation } from '../types';
import { ConsultationWorkspace } from './ConsultationWorkspace';
import { CalendarDaysIcon } from './icons';

interface TodaysAppointmentsProps {
    currentUser: User;
    appointments: Appointment[];
    patients: Patient[];
    medicines: Medicine[];
    onSave: (
        appointment: Appointment,
        consultationData: {
            chiefComplaint: string;
            diagnosis: string;
            notes?: string;
            vitals: Vitals;
            prescription: PrescriptionItem[];
            nextReviewDate?: string;
        }
    ) => void;
    onViewPatientProfile: (patientId: string) => void;
    draftConsultations: { [key: string]: DraftConsultation };
    setDraftConsultations: React.Dispatch<React.SetStateAction<{ [key: string]: DraftConsultation }>>;
}

const parseIndianDate = (indianDateStr: string | undefined): Date | null => {
    if (!indianDateStr) return null;
    const parts = indianDateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!parts) return null;
    const [, day, month, year] = parts;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (isNaN(date.getTime()) || date.getUTCDate() !== parseInt(day, 10)) return null;
    return date;
};


const getAge = (dob: string | undefined): string | null => {
    if (!dob) return null;
    const birthDate = parseIndianDate(dob);
    if (!birthDate) return null;

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
        return `${displayMonths} mos`;
    }
    
    return `${years} yrs`;
};

const TodaysAppointments: React.FC<TodaysAppointmentsProps> = ({ currentUser, appointments, patients, medicines, onSave, onViewPatientProfile, draftConsultations, setDraftConsultations }) => {
    const [expandedAppointmentId, setExpandedAppointmentId] = useState<string | null>(null);

    const todaysAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointments
            .filter(apt => {
                const aptDate = new Date(apt.startTime);
                aptDate.setHours(0, 0, 0, 0);
                return apt.doctorId === currentUser.id && aptDate.getTime() === today.getTime() && apt.status === 'Scheduled';
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [appointments, currentUser.id]);

    const handleToggleWorkspace = (appointmentId: string) => {
        setExpandedAppointmentId(prevId => (prevId === appointmentId ? null : appointmentId));
    };

    const handleSave = (appointment: Appointment, data: any) => {
        onSave(appointment, data);
        setExpandedAppointmentId(null);
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 mb-6">Today's Appointment Queue</h2>
            <div className="space-y-4">
                {todaysAppointments.length > 0 ? (
                    todaysAppointments.map(apt => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        if (!patient) return null;

                        const isExpanded = expandedAppointmentId === apt.id;

                        const patientDetails: string[] = [];
                        const age = getAge(patient.dob);
                        if (age) patientDetails.push(age);
                        if (patient.gender) patientDetails.push(patient.gender);
                        if (patient.bloodGroup) patientDetails.push(`Blood: ${patient.bloodGroup}`);
                        
                        const draftForThisAppointment = draftConsultations[apt.id];

                        const setDraftForThisAppointment: React.Dispatch<React.SetStateAction<DraftConsultation | null>> = (updater) => {
                            setDraftConsultations(prev => {
                                const currentDraft = prev?.[apt.id] || null;
                                const newDraft = typeof updater === 'function' ? updater(currentDraft) : updater;
                        
                                const newDrafts = { ...(prev || {}) };
                                if (newDraft) {
                                    newDrafts[apt.id] = newDraft;
                                } else {
                                    delete newDrafts[apt.id];
                                }
                                return newDrafts;
                            });
                        };


                        return (
                            <div key={apt.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-shadow duration-300 border border-slate-200 dark:border-slate-700">
                                <div 
                                    className={`p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isExpanded ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
                                    onClick={() => handleToggleWorkspace(apt.id)}
                                >
                                    <div className="w-full sm:w-auto">
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{apt.patientName}</p>
                                            {patient.mobile && <p className="text-sm text-slate-500 dark:text-slate-400">{patient.mobile}</p>}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-x-3 text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            <span>{new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {patientDetails.length > 0 && <span className="text-slate-300 dark:text-slate-600">|</span>}
                                            <span>{patientDetails.join(' | ')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`}>
                                            {apt.status}
                                        </span>
                                        <svg className={`w-6 h-6 text-slate-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <ConsultationWorkspace
                                        appointment={apt}
                                        patient={patient}
                                        medicines={medicines}
                                        onSave={(data) => handleSave(apt, data)}
                                        onViewPatientProfile={onViewPatientProfile}
                                        draftConsultation={draftForThisAppointment}
                                        setDraftConsultation={setDraftForThisAppointment}
                                    />
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <CalendarDaysIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600"/>
                        <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">All Clear for Today</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You have no appointments scheduled for today.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodaysAppointments;