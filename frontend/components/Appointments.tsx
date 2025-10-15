import React, { useState } from 'react';
import { Appointment, Patient, User, AppointmentStatus, Vitals } from '../types';
import { PlusIcon } from './icons';
import { AppointmentForm } from './AppointmentForm';
import { CalendarView } from './CalendarView';

interface AppointmentsProps {
    appointments: Appointment[];
    patients: Patient[];
    doctors: User[];
    addAppointment: (appointmentData: Omit<Appointment, 'id' | 'clinicId'>) => void;
    updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
    addVitalsForAppointment: (appointment: Appointment, vitals: Vitals) => void;
}


const Appointments: React.FC<AppointmentsProps> = ({ appointments, patients, doctors, addAppointment, updateAppointmentStatus, addVitalsForAppointment }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'clinicId' | 'status'>) => {
        addAppointment({ ...appointmentData, status: 'Scheduled' });
        setIsFormOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-secondary dark:text-slate-100">Appointments</h2>
                <button onClick={() => setIsFormOpen(true)} className="flex items-center bg-brand-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors text-sm sm:text-base">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Appointment
                </button>
            </div>

            <CalendarView 
                appointments={appointments}
                patients={patients}
                doctors={doctors}
                onUpdateStatus={updateAppointmentStatus}
                addVitalsForAppointment={addVitalsForAppointment}
            />

            {isFormOpen && (
                <AppointmentForm
                    patients={patients}
                    doctors={doctors}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSaveAppointment}
                />
            )}
        </div>
    );
};

export default Appointments;
