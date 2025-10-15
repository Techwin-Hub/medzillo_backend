// components/VitalsForm.tsx (Corrected Version)

import React, { useState, useRef, useEffect } from 'react';
import { Appointment, Vitals } from '../types';
import { HeartIcon } from './icons';
import { Modal } from './Modal';

interface VitalsFormProps {
    appointment: Appointment;
    existingVitals?: Vitals;
    onClose: () => void;
    onSave: (vitals: Vitals) => void;
}

export const VitalsForm: React.FC<VitalsFormProps> = ({ appointment, existingVitals, onClose, onSave }) => {
    const [vitals, setVitals] = useState<Vitals>(existingVitals || {});
    const formRef = useRef<HTMLFormElement>(null);
    
    const inputClass = "mt-1 w-full text-sm p-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focusable-field dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";

    // CORRECTED useEffect for keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            e.preventDefault();

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
        
        // This pattern is safer for adding/removing event listeners with refs.
        const currentForm = formRef.current;
        if (currentForm) {
            currentForm.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            if (currentForm) {
                currentForm.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount.


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVitals(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(vitals);
    };

    const formFooter = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
            <button type="submit" form="vitals-form" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover">Save Vitals</button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={existingVitals ? 'Edit Vitals' : 'Add Vitals'}
            footer={formFooter}
        >
            <p className="text-sm text-slate-600 dark:text-slate-400 -mt-2 mb-4">For: {appointment.patientName}</p>
            <form id="vitals-form" ref={formRef} onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bloodPressure" className="block text-sm font-medium text-slate-700 dark:text-slate-300">BP (e.g. 120/80)</label>
                        <input id="bloodPressure" name="bloodPressure" value={vitals.bloodPressure || ''} onChange={handleChange} placeholder="mmHg" className={inputClass}/>
                    </div>
                     <div>
                        <label htmlFor="pulse" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pulse (bpm)</label>
                        <input id="pulse" name="pulse" type="number" value={vitals.pulse || ''} onChange={handleChange} placeholder="bpm" className={inputClass}/>
                    </div>
                    <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Temp (°F)</label>
                        <input id="temperature" name="temperature" type="number" step="0.1" value={vitals.temperature || ''} onChange={handleChange} placeholder="°F" className={inputClass}/>
                    </div>
                     <div>
                        <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">SpO2 (%)</label>
                        <input id="oxygenSaturation" name="oxygenSaturation" type="number" value={vitals.oxygenSaturation || ''} onChange={handleChange} placeholder="%" className={inputClass}/>
                    </div>
                    <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
                        <input id="weight" name="weight" type="number" step="0.1" value={vitals.weight || ''} onChange={handleChange} placeholder="kg" className={inputClass}/>
                    </div>
                    <div>
                        <label htmlFor="height" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
                        <input id="height" name="height" type="number" value={vitals.height || ''} onChange={handleChange} placeholder="cm" className={inputClass}/>
                    </div>
                </div>
            </form>
        </Modal>
    );
};