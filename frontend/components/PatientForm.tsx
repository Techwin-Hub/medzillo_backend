import React, { useState, useEffect, useRef } from 'react';
import { Patient, User } from '../types';
import { Modal } from './Modal';
import { useToast } from '../hooks/useToast';

interface PatientFormProps {
    patient: Patient | null;
    doctors?: User[];
    onClose: () => void;
    onSave: (
        patientData: Omit<Patient, 'id' | 'clinicId' | 'consultations'>,
        appointmentDetails?: {
            doctorId: string;
            date: string;
            startTime: string;
        }
    ) => Promise<void> | void;
}

// A safe utility function to convert DD-MM-YYYY to YYYY-MM-DD for input[type=date]
const getSafeInputDateString = (indianDateStr: string | undefined): string => {
    if (!indianDateStr) return '';
    // Handle both DD-MM-YYYY and DD/MM/YYYY
    const parts = indianDateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!parts) return '';
    const [, day, month, year] = parts;
    const isoDate = `${year}-${month}-${day}`;
    // Final check for validity before returning
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
        return '';
    }
    return isoDate;
};


export const PatientForm: React.FC<PatientFormProps> = ({ patient, doctors, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: patient?.name || '',
        mobile: patient?.mobile || '',
        dob: getSafeInputDateString(patient?.dob),
        gender: patient?.gender || 'Male',
        address: patient?.address || '',
        bloodGroup: patient?.bloodGroup || '',
        allergies: patient?.allergies || '',
    });

    const [scheduleAppointment, setScheduleAppointment] = useState(false);
    const [appointmentDetails, setAppointmentDetails] = useState(() => ({
        doctorId: doctors?.[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
    }));
    
    const { addToast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const inputClass = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary";

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            e.preventDefault();

            // Fix: Cast the result of querySelectorAll to ensure correct type for focusableElements.
            const focusableElements: HTMLElement[] = Array.from(
                formRef.current?.querySelectorAll('.focusable-field') as NodeListOf<HTMLElement> || []
            ).filter((el: HTMLElement) => el.offsetParent !== null);

            const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
            if (currentIndex === -1) {
                if (focusableElements.length > 0) focusableElements[0].focus();
                return;
            }

            let nextIndex = currentIndex;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % focusableElements.length;
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
            }
            focusableElements[nextIndex]?.focus();
        };

        const container = formRef.current;
        if (container) container.addEventListener('keydown', handleKeyDown);
        return () => {
            if (container) container.removeEventListener('keydown', handleKeyDown);
        };
    }, [formRef, scheduleAppointment]); // Re-run when appointment section appears/disappears

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

     const handleAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAppointmentDetails(prev => ({ ...prev, [name]: value }));
    };

    const validateAndSanitize = () => {
        const { name, mobile } = formData;
        if (!name.trim()) {
            addToast('Patient name is required.', 'error');
            return null;
        }
        if (!mobile.trim()) {
            addToast('Mobile number is required.', 'error');
            return null;
        }
        if (!/^\d{10}$/.test(mobile.trim())) {
            addToast('Please enter a valid 10-digit mobile number.', 'error');
            return null;
        }
        
        // Sanitize and trim all string fields
        return {
            name: formData.name.trim(),
            mobile: formData.mobile.trim(),
            dob: formData.dob,
            gender: formData.gender,
            address: formData.address.trim(),
            bloodGroup: formData.bloodGroup.trim(),
            allergies: formData.allergies.trim(),
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const sanitizedData = validateAndSanitize();
        if (!sanitizedData) return;

        // Convert YYYY-MM-DD from input back to DD-MM-YYYY for storage
        let dobToSave: string | undefined = undefined;
        if (sanitizedData.dob) {
            const parts = sanitizedData.dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (parts) {
                const [, year, month, day] = parts;
                dobToSave = `${day}-${month}-${year}`;
            }
        }
        
        const finalFormData = { ...sanitizedData, dob: dobToSave, vaccinations: [], skippedVaccinations: [] };
        await onSave(finalFormData, scheduleAppointment ? appointmentDetails : undefined);
    };

    const formFooter = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focusable-field">Cancel</button>
            <button type="submit" form="patient-form" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover focusable-field">Save Patient</button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={patient ? 'Edit Patient' : 'Add New Patient'}
            footer={formFooter}
        >
            <form id="patient-form" ref={formRef} onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={`${inputClass} focusable-field`}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label>
                        <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required className={`${inputClass} focusable-field`}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={`${inputClass} focusable-field`}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className={`${inputClass} focusable-field`}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Blood Group</label>
                        <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={`${inputClass} focusable-field`}/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className={`${inputClass} focusable-field`}></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Known Allergies</label>
                        <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2} className={`${inputClass} focusable-field`}></textarea>
                    </div>
                </div>
                
                {!patient && doctors && doctors.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={scheduleAppointment}
                                onChange={(e) => setScheduleAppointment(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-800 focusable-field"
                            />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Schedule Initial Appointment</span>
                        </label>

                        {scheduleAppointment && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Doctor</label>
                                    <select name="doctorId" value={appointmentDetails.doctorId} onChange={handleAppointmentChange} required className={`${inputClass} focusable-field`}>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name} {d.specialty ? `(${d.specialty})` : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                                    <input type="date" name="date" value={appointmentDetails.date} onChange={handleAppointmentChange} required className={`${inputClass} focusable-field`}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Time</label>
                                    <input type="time" name="startTime" value={appointmentDetails.startTime} onChange={handleAppointmentChange} required className={`${inputClass} focusable-field`}/>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </Modal>
    );
};
