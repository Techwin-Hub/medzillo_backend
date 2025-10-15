import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Appointment, Patient, Medicine, Vitals, PrescriptionItem, DraftConsultation } from '../types';
import { PlusIcon, DeleteIcon, RxIcon, HeartIcon, DocumentTextIcon } from './icons';
import { useToast } from '../hooks/useToast';

interface ConsultationWorkspaceProps {
    appointment: Appointment;
    patient: Patient;
    medicines: Medicine[];
    onSave: (data: {
        chiefComplaint: string;
        diagnosis: string;
        notes?: string;
        vitals: Vitals;
        prescription: PrescriptionItem[];
        nextReviewDate?: string;
    }) => void;
    onViewPatientProfile: (patientId: string) => void;
    draftConsultation: DraftConsultation | null;
    setDraftConsultation: React.Dispatch<React.SetStateAction<DraftConsultation | null>>;
}

const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 0;
    const lowerCaseStr = durationStr.toLowerCase();
    const numberMatch = lowerCaseStr.match(/\d+/);
    if (!numberMatch) return 0;
    
    const number = parseInt(numberMatch[0], 10);
    
    if (lowerCaseStr.includes('week')) {
        return number * 7;
    }
    if (lowerCaseStr.includes('month')) {
        return number * 30; // Approximation
    }
    return number;
};

export const ConsultationWorkspace: React.FC<ConsultationWorkspaceProps> = ({ appointment, patient, medicines, onSave, onViewPatientProfile, draftConsultation, setDraftConsultation }) => {
    
    // Local state for the prescription item being added
    const [medicineSearch, setMedicineSearch] = useState('');
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [quantity, setQuantity] = useState<number | string>(1);
    const [doseM, setDoseM] = useState<number | ''>('');
    const [doseA, setDoseA] = useState<number | ''>('');
    const [doseE, setDoseE] = useState<number | ''>('');
    const [textDosage, setTextDosage] = useState('');
    const [duration, setDuration] = useState('');
    const [pNotes, setPNotes] = useState('');
    const { addToast } = useToast();
    const workspaceRef = useRef<HTMLDivElement>(null);
    
    const inputClass = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:border-slate-600";
    const smallInputClass = "w-full text-sm p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500";
    const vitalsInputClass = "mt-1 w-full text-sm p-1.5 border border-slate-300 dark:border-slate-500 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400";


    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                return;
            }

            e.preventDefault();

            // Fix: Cast the result of querySelectorAll to ensure correct type for focusableElements.
            const focusableElements: HTMLElement[] = Array.from(
                workspaceRef.current?.querySelectorAll('.focusable-field') as NodeListOf<HTMLElement> || []
            ).filter((el: HTMLElement) => el.offsetParent !== null); // Filter out hidden elements

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

        const container = workspaceRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (container) {
                container.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [workspaceRef, selectedMedicine]); // Rerun if selectedMedicine changes to account for dynamic inputs

    // When the component mounts or the appointment changes, initialize or load the draft.
    useEffect(() => {
        if (!draftConsultation) { // If no draft exists for this specific appointment
            const preRecordedVitals = (patient.consultations || []).find(c => c.id === `con_vitals_${appointment.id}`)?.vitals || {};
            setDraftConsultation({
                appointmentId: appointment.id,
                vitals: preRecordedVitals,
                chiefComplaint: '',
                diagnosis: '',
                notes: '',
                prescription: [],
                nextReviewDate: '',
            });
        }
    }, [appointment.id, patient, draftConsultation, setDraftConsultation]);

    // Derived state for local rendering, shows current draft or a default while initializing
    const currentDraftData = useMemo(() => {
        if (draftConsultation) { // It's already the specific draft
            return draftConsultation;
        }
        // Provide a default empty structure while the draft is being initialized by the useEffect
        return {
            appointmentId: appointment.id, vitals: {}, chiefComplaint: '', diagnosis: '',
            notes: '', prescription: [], nextReviewDate: '',
        };
    }, [draftConsultation, appointment.id]);

    // Updater function to modify the draft state in App.tsx
    const updateDraft = (updates: Partial<DraftConsultation>) => {
        setDraftConsultation(prev => ({ ...(prev!), ...updates }));
    };


    useEffect(() => {
        if (selectedMedicine && (selectedMedicine.form === 'Tablet' || selectedMedicine.form === 'Capsule')) {
            const tabletsPerDay = (Number(doseM) || 0) + (Number(doseA) || 0) + (Number(doseE) || 0);
            const numberOfDays = parseDuration(duration);

            if (!isNaN(tabletsPerDay) && !isNaN(numberOfDays) && tabletsPerDay > 0 && numberOfDays > 0) {
                const totalQuantity = tabletsPerDay * numberOfDays;
                setQuantity(totalQuantity);
            }
        }
    }, [selectedMedicine, doseM, doseA, doseE, duration]);

    const searchedMedicines = useMemo(() => {
        if (!medicineSearch) return [];
        const lowercasedSearch = medicineSearch.toLowerCase();
        return medicines.filter(m => 
            m.name.toLowerCase().includes(lowercasedSearch) ||
            m.composition.toLowerCase().includes(lowercasedSearch)
        ).slice(0, 5);
    }, [medicineSearch, medicines]);
    
    const handleSelectMedicine = (med: Medicine) => {
        setMedicineSearch(med.name);
        setSelectedMedicine(med);
        // Reset dosage fields on new selection
        setDoseM('');
        setDoseA('');
        setDoseE('');
        setTextDosage('');
         // Reset quantity if not a tablet/capsule
        if (med.form !== 'Tablet' && med.form !== 'Capsule') {
            setQuantity(1);
        }
    };

    const handleAddPrescriptionItem = () => {
        const isTablet = selectedMedicine && (selectedMedicine.form === 'Tablet' || selectedMedicine.form === 'Capsule');
        const dosageString = isTablet
            ? `${Number(doseM) || 0}-${Number(doseA) || 0}-${Number(doseE) || 0}`
            : textDosage;
        
        const isDosageValid = isTablet ? dosageString !== '0-0-0' : dosageString.trim() !== '';
        
        const medicineNameDisplay = selectedMedicine ? `${selectedMedicine.name} (${selectedMedicine.strength})` : medicineSearch.trim();

        const canAddItem = (selectedMedicine || medicineSearch.trim()) && Number(quantity) > 0 && isDosageValid && duration;
        
        if (!canAddItem) {
            addToast("Please provide medicine, quantity, dosage, and duration.", 'warning');
            return;
        }

        if (selectedMedicine && Number(quantity) > selectedMedicine.totalStockInUnits) {
            addToast(`Prescribed quantity (${quantity}) exceeds stock (${selectedMedicine.totalStockInUnits}). Bill will be adjusted.`, 'info');
        }
        
        const newItem: PrescriptionItem = {
            medicineId: selectedMedicine ? selectedMedicine.id : null,
            medicineName: medicineNameDisplay,
            quantity: Number(quantity),
            dosage: dosageString,
            duration,
            notes: pNotes,
        };
        
        updateDraft({ prescription: [...currentDraftData.prescription, newItem] });
        
        setMedicineSearch(''); 
        setSelectedMedicine(null); 
        setQuantity(1); 
        setDoseM(''); 
        setDoseA(''); 
        setDoseE(''); 
        setTextDosage('');
        setDuration(''); 
        setPNotes('');
    };


    const handleRemovePrescriptionItem = (index: number) => {
        updateDraft({ prescription: currentDraftData.prescription.filter((_, i) => i !== index) });
    };

    const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['pulse', 'temperature', 'weight', 'height', 'oxygenSaturation'].includes(name);
        const newVitals = {
            ...currentDraftData.vitals,
            [name]: isNumberField ? (value ? parseFloat(value) : undefined) : value
        };
        updateDraft({ vitals: newVitals });
    };

    const handleSubmit = () => {
        if (!currentDraftData.chiefComplaint || !currentDraftData.diagnosis) {
            addToast("Chief Complaint and Diagnosis are required.", 'error');
            return;
        }
        const { appointmentId, ...consultationData } = currentDraftData;
        onSave(consultationData); // onSave now also clears the draft in App.tsx
    };

    const isTabletOrCapsule = selectedMedicine && (selectedMedicine.form === 'Tablet' || selectedMedicine.form === 'Capsule');

    return (
        <div ref={workspaceRef} className="p-4 sm:p-6 space-y-6 bg-slate-100 dark:bg-slate-900/50">
            {/* Vitals Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl">
                    <h3 className="text-lg font-semibold text-brand-secondary dark:text-slate-200 flex items-center gap-2">
                        <HeartIcon className="w-6 h-6 text-red-500" /> Vitals
                    </h3>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                     <div><label className="text-xs text-slate-600 dark:text-slate-400">BP</label><input name="bloodPressure" value={currentDraftData.vitals.bloodPressure || ''} onChange={handleVitalsChange} placeholder="e.g. 120/80" className={`${vitalsInputClass} focusable-field`}/></div>
                     <div><label className="text-xs text-slate-600 dark:text-slate-400">Pulse</label><input name="pulse" type="number" value={currentDraftData.vitals.pulse || ''} onChange={handleVitalsChange} onWheel={(e) => (e.target as HTMLElement).blur()} placeholder="bpm" className={`${vitalsInputClass} focusable-field`}/></div>
                     <div><label className="text-xs text-slate-600 dark:text-slate-400">Temp (°F)</label><input name="temperature" type="number" step="0.1" value={currentDraftData.vitals.temperature || ''} onChange={handleVitalsChange} onWheel={(e) => (e.target as HTMLElement).blur()} placeholder="°F" className={`${vitalsInputClass} focusable-field`}/></div>
                     <div><label className="text-xs text-slate-600 dark:text-slate-400">Weight (kg)</label><input name="weight" type="number" step="0.1" value={currentDraftData.vitals.weight || ''} onChange={handleVitalsChange} onWheel={(e) => (e.target as HTMLElement).blur()} placeholder="kg" className={`${vitalsInputClass} focusable-field`}/></div>
                     <div><label className="text-xs text-slate-600 dark:text-slate-400">Height (cm)</label><input name="height" type="number" value={currentDraftData.vitals.height || ''} onChange={handleVitalsChange} onWheel={(e) => (e.target as HTMLElement).blur()} placeholder="cm" className={`${vitalsInputClass} focusable-field`}/></div>
                     <div><label className="text-xs text-slate-600 dark:text-slate-400">SpO2 (%)</label><input name="oxygenSaturation" type="number" value={currentDraftData.vitals.oxygenSaturation || ''} onChange={handleVitalsChange} onWheel={(e) => (e.target as HTMLElement).blur()} placeholder="%" className={`${vitalsInputClass} focusable-field`}/></div>
                </div>
            </div>

            {/* Consultation Details Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <h3 className="text-lg font-semibold text-brand-secondary dark:text-slate-200 flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-brand-primary" /> Consultation Details
                    </h3>
                    <button type="button" onClick={() => onViewPatientProfile(patient.id)} className="px-3 py-1.5 text-xs sm:text-sm bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 font-semibold self-start sm:self-center">
                        View Full Profile
                    </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Chief Complaint</label>
                        <input type="text" value={currentDraftData.chiefComplaint} onChange={e => updateDraft({ chiefComplaint: e.target.value })} required className={`${inputClass} focusable-field`}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Diagnosis</label>
                        <input type="text" value={currentDraftData.diagnosis} onChange={e => updateDraft({ diagnosis: e.target.value })} required className={`${inputClass} focusable-field`}/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Doctor's Notes</label>
                        <textarea value={currentDraftData.notes || ''} onChange={e => updateDraft({ notes: e.target.value })} rows={3} className={`${inputClass} focusable-field`}></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Next Review Date (Optional)</label>
                        <input type="date" value={currentDraftData.nextReviewDate || ''} onChange={e => updateDraft({ nextReviewDate: e.target.value })} className={`${inputClass} focusable-field`} min={new Date().toISOString().split('T')[0]}/>
                    </div>
                </div>
            </div>

            {/* Prescription Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl">
                    <h3 className="text-lg font-semibold text-brand-secondary dark:text-slate-200 flex items-center gap-2">
                        <RxIcon className="w-6 h-6 text-brand-primary" /> Prescription
                    </h3>
                </div>
                <div className="p-4 space-y-4">
                     <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex-grow min-w-[200px] relative"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Medicine</label><input type="text" value={medicineSearch} onChange={e => {setMedicineSearch(e.target.value); setSelectedMedicine(null);}} placeholder="Search or type custom..." className={`${smallInputClass} focusable-field`}/>
                            {searchedMedicines.length > 0 && !selectedMedicine && (
                                <div className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 mt-1 rounded-md shadow-lg">{searchedMedicines.map(med => (
                                    <div key={med.id} onClick={() => handleSelectMedicine(med)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-slate-900 dark:text-slate-200 text-sm flex justify-between items-center">
                                        <div><p className="font-semibold">{med.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{med.composition}</p></div>
                                        <div className="text-right"><span className={`text-xs font-medium ${med.totalStockInUnits > 0 ? 'text-slate-500 dark:text-slate-400' : 'text-red-500'}`}>Stock: {med.totalStockInUnits}</span>{med.totalStockInUnits === 0 && <span className="block text-xs text-red-500">(Out of Stock)</span>}</div>
                                    </div>
                                ))}</div>
                            )}
                        </div>

                        {isTabletOrCapsule ? (
                            <div style={{flexBasis: '200px'}} className="flex-grow"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dosage (M-A-E)</label><div className="flex items-center gap-1 mt-1"><input type="number" value={doseM} onChange={e => setDoseM(e.target.value === '' ? '' : parseInt(e.target.value, 10))} onWheel={(e) => (e.target as HTMLElement).blur()} min="0" className={`${smallInputClass} text-center p-1.5 focusable-field`} placeholder="M" /><span className="text-slate-400">-</span><input type="number" value={doseA} onChange={e => setDoseA(e.target.value === '' ? '' : parseInt(e.target.value, 10))} onWheel={(e) => (e.target as HTMLElement).blur()} min="0" className={`${smallInputClass} text-center p-1.5 focusable-field`} placeholder="A" /><span className="text-slate-400">-</span><input type="number" value={doseE} onChange={e => setDoseE(e.target.value === '' ? '' : parseInt(e.target.value, 10))} onWheel={(e) => (e.target as HTMLElement).blur()} min="0" className={`${smallInputClass} text-center p-1.5 focusable-field`} placeholder="E" /></div></div>
                        ) : (
                            <div style={{flexBasis: '200px'}} className="flex-grow"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dosage</label><input type="text" value={textDosage} onChange={e => setTextDosage(e.target.value)} placeholder="e.g., 5ml twice daily" className={`${smallInputClass} focusable-field`} /></div>
                        )}
                        
                         <div style={{flexBasis: '120px'}}><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Duration</label><input type="text" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g. 5 days" className={`${smallInputClass} focusable-field`}/></div>
                        <div style={{width: '80px'}}>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{isTabletOrCapsule ? "Calculated Qty" : "Qty"}</label>
                            <input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} min="1" className={`${smallInputClass} focusable-field ${isTabletOrCapsule ? 'bg-slate-200 dark:bg-slate-900/50 cursor-not-allowed' : ''}`} readOnly={isTabletOrCapsule} title={isTabletOrCapsule ? "Auto-calculated" : ""}/>
                        </div>
                        <div style={{flexBasis: '150px'}} className="flex-grow"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Notes</label><input type="text" value={pNotes} onChange={e=>setPNotes(e.target.value)} placeholder="e.g. After food" className={`${smallInputClass} focusable-field`}/></div>
                        <div className="shrink-0">
                            <button type="button" onClick={handleAddPrescriptionItem} className="bg-brand-primary text-white rounded-lg h-10 w-full sm:w-auto flex items-center justify-center px-4 shadow-sm hover:bg-brand-primary-hover transition-colors focusable-field">
                                <PlusIcon className="w-5 h-5 sm:mr-2"/><span className="hidden sm:inline font-semibold">Add</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {currentDraftData.prescription.map((item, index) => (
                            <div key={index} className="bg-blue-50 dark:bg-slate-700/50 p-3 rounded-lg border-l-4 border-blue-400 shadow-sm flex items-center justify-between gap-4">
                                <div className="flex-1"><p className="font-semibold text-slate-800 dark:text-slate-100">{item.medicineName}</p><div className="text-sm text-slate-600 dark:text-slate-400 flex items-center flex-wrap gap-x-4"><span><strong>Qty:</strong> {item.quantity}</span><span><strong>Dosage:</strong> {item.dosage}</span><span><strong>Duration:</strong> {item.duration}</span></div>{item.notes && <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-1">Note: {item.notes}</p>}</div>
                                <button type="button" onClick={() => handleRemovePrescriptionItem(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={handleSubmit} className="px-8 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focusable-field">
                    Save & Complete Consultation
                </button>
            </div>
        </div>
    );
};