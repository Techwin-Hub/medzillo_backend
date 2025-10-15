import React, { useState, useMemo, useEffect } from 'react';
import { Patient, User, Appointment } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { Modal } from './Modal';

interface AppointmentFormProps {
    patients: Patient[];
    doctors: User[];
    initialPatientId?: string;
    initialDoctorId?: string;
    initialDate?: string;
    onClose: () => void;
    onSave: (appointmentData: Omit<Appointment, 'id' | 'clinicId' | 'status'>) => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ patients, doctors, initialPatientId, initialDoctorId, initialDate, onClose, onSave }) => {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearch, setPatientSearch] = useState('');
    const debouncedPatientSearch = useDebounce(patientSearch, 300);
    const [isPatientSearchVisible, setIsPatientSearchVisible] = useState(false);
    
    const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    
    const inputClass = "mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:ring-brand-accent dark:border-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

    useEffect(() => {
        if (initialPatientId) {
            const patient = patients.find(p => p.id === initialPatientId);
            if (patient) {
                setSelectedPatient(patient);
                setPatientSearch(`${patient.name} - ${patient.mobile}`);
            }
        }
        if (initialDoctorId) {
            setDoctorId(initialDoctorId);
        }
        if (initialDate) {
            setDate(initialDate);
        }
    }, [initialPatientId, initialDoctorId, initialDate, patients]);

    const searchedPatients = useMemo(() => {
        if (!debouncedPatientSearch || (selectedPatient && `${selectedPatient.name} - ${selectedPatient.mobile}` === patientSearch)) {
            return [];
        }
        return patients.filter(p =>
            p.name.toLowerCase().includes(debouncedPatientSearch.toLowerCase()) ||
            p.mobile.includes(debouncedPatientSearch)
        ).slice(0, 5);
    }, [debouncedPatientSearch, patients, selectedPatient, patientSearch]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDoctor = doctors.find(d => d.id === doctorId);

        if (!selectedPatient || !selectedDoctor) {
            alert("Please select a valid patient and doctor.");
            return;
        }

        const startDateTime = new Date(`${date}T${startTime}`);

        onSave({
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            doctorId,
            doctorName: selectedDoctor.name,
            startTime: startDateTime.toISOString(),
        });
        onClose();
    };

    const formFooter = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
            <button type="submit" form="appointment-form" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover">Save Appointment</button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="New Appointment"
            footer={formFooter}
        >
            <form id="appointment-form" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Patient</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={patientSearch}
                                onChange={e => {
                                    setPatientSearch(e.target.value);
                                    setSelectedPatient(null);
                                    setIsPatientSearchVisible(true);
                                }}
                                onFocus={() => setIsPatientSearchVisible(true)}
                                onBlur={() => setTimeout(() => setIsPatientSearchVisible(false), 200)}
                                placeholder="Search by name or mobile..."
                                required
                                disabled={!!initialPatientId}
                                className={inputClass}
                            />
                            {isPatientSearchVisible && searchedPatients.length > 0 && (
                                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 mt-1 rounded-md shadow-lg">
                                    {searchedPatients.map(p => (
                                        <div 
                                            key={p.id} 
                                            onMouseDown={() => {
                                                setSelectedPatient(p);
                                                setPatientSearch(`${p.name} - ${p.mobile}`);
                                                setIsPatientSearchVisible(false);
                                            }}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-slate-900 dark:text-slate-200"
                                        >
                                            {p.name} - {p.mobile}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Doctor</label>
                         <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required className={inputClass} disabled={!!initialDoctorId}>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name} {d.specialty ? `(${d.specialty})` : ''}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className={inputClass} />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
