import React, { useState, useMemo, useEffect } from 'react';
import { Consultation, Medicine, PrescriptionItem, Vitals } from '../types';
import { CloseIcon, PlusIcon, DeleteIcon } from './icons';
import { useToast } from '../hooks/useToast';

interface ConsultationFormProps {
    medicines: Medicine[];
    onClose: () => void;
    onSave: (consultationData: Omit<Consultation, 'id' | 'clinicId' | 'date' | 'doctorId' | 'doctorName'>) => void;
}

const parseDosage = (dosageStr: string): number => {
    if (!dosageStr) return 0;
    const parts = dosageStr.split('-').map(part => parseInt(part.trim(), 10));
    if (parts.some(isNaN)) return 0;
    return parts.reduce((sum, part) => sum + part, 0);
};

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

export const ConsultationForm: React.FC<ConsultationFormProps> = ({ medicines, onClose, onSave }) => {
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [vitals, setVitals] = useState<Vitals>({});
    const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
    const [nextReviewDate, setNextReviewDate] = useState('');
    
    const [medicineSearch, setMedicineSearch] = useState('');
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [dosage, setDosage] = useState('');
    const [duration, setDuration] = useState('');
    const [pNotes, setPNotes] = useState('');
    const { addToast } = useToast();
    
    const inputClass = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary";
    const smallInputClass = "mt-1 w-full text-sm p-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500";

    useEffect(() => {
        if (selectedMedicine && (selectedMedicine.form === 'Tablet' || selectedMedicine.form === 'Capsule')) {
            const tabletsPerDay = parseDosage(dosage);
            const numberOfDays = parseDuration(duration);

            if (!isNaN(tabletsPerDay) && !isNaN(numberOfDays) && tabletsPerDay > 0 && numberOfDays > 0) {
                const totalQuantity = tabletsPerDay * numberOfDays;
                setQuantity(totalQuantity);
            }
        }
    }, [selectedMedicine, dosage, duration]);

    const searchedMedicines = useMemo(() => {
        if (!medicineSearch) return [];
        const lowercasedSearch = medicineSearch.toLowerCase();
        return medicines.filter(m => 
          (m.name.toLowerCase().includes(lowercasedSearch) || m.composition.toLowerCase().includes(lowercasedSearch)) 
          && m.totalStockInUnits > 0
        ).slice(0, 5);
    }, [medicineSearch, medicines]);
    
    const handleSelectMedicine = (med: Medicine) => {
        setMedicineSearch(med.name);
        setSelectedMedicine(med);
        // Reset quantity if not a tablet/capsule
        if (med.form !== 'Tablet' && med.form !== 'Capsule') {
            setQuantity(1);
        }
    };

    const handleAddPrescriptionItem = () => {
        if (!selectedMedicine || quantity <= 0 || !dosage || !duration) {
            addToast("Please select a medicine and fill in all prescription details.", 'warning');
            return;
        }
        const newItem: PrescriptionItem = {
            medicineId: selectedMedicine.id,
            medicineName: `${selectedMedicine.name} (${selectedMedicine.strength})`,
            quantity,
            dosage,
            duration,
            notes: pNotes,
        };
        setPrescription(prev => [...prev, newItem]);
        setMedicineSearch('');
        setSelectedMedicine(null);
        setQuantity(1);
        setDosage('');
        setDuration('');
        setPNotes('');
    };
    
    const handleRemovePrescriptionItem = (index: number) => {
        setPrescription(prev => prev.filter((_, i) => i !== index));
    };

    const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVitals(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!chiefComplaint || !diagnosis) {
            addToast("Chief Complaint and Diagnosis are required.", 'error');
            return;
        }
        onSave({
            chiefComplaint,
            diagnosis,
            notes,
            vitals,
            prescription,
            nextReviewDate,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">New Consultation</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Chief Complaint</label>
                                <input type="text" value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} required className={inputClass}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Diagnosis</label>
                                <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required className={inputClass}/>
                            </div>
                             <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Doctor's Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClass}></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Next Review Date (Optional)</label>
                                <input type="date" value={nextReviewDate} onChange={e => setNextReviewDate(e.target.value)} className={inputClass} min={new Date().toISOString().split('T')[0]}/>
                            </div>
                        </div>

                        <div>
                             <h4 className="font-semibold mb-2 text-brand-secondary dark:text-slate-100">Vitals</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                 <div><label className="text-xs text-slate-600 dark:text-slate-400">BP</label><input name="bloodPressure" onChange={handleVitalsChange} placeholder="e.g. 120/80" className="mt-1 w-full text-sm p-1 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400"/></div>
                                 <div><label className="text-xs text-slate-600 dark:text-slate-400">Pulse</label><input name="pulse" type="number" onChange={handleVitalsChange} placeholder="bpm" className="mt-1 w-full text-sm p-1 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400"/></div>
                                 <div><label className="text-xs text-slate-600 dark:text-slate-400">Temp (°C)</label><input name="temperature" type="number" step="0.1" onChange={handleVitalsChange} placeholder="°C" className="mt-1 w-full text-sm p-1 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400"/></div>
                                 <div><label className="text-xs text-slate-600 dark:text-slate-400">Weight (kg)</label><input name="weight" type="number" step="0.1" onChange={handleVitalsChange} placeholder="kg" className="mt-1 w-full text-sm p-1 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400"/></div>
                                 <div><label className="text-xs text-slate-600 dark:text-slate-400">Height (cm)</label><input name="height" type="number" onChange={handleVitalsChange} placeholder="cm" className="mt-1 w-full text-sm p-1 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400"/></div>
                                 <div><label className="text-xs text-slate-600 dark:text-slate-400">SpO2 (%)</label><input name="oxygenSaturation" type="number" onChange={handleVitalsChange} placeholder="%" className="mt-1 w-full text-sm p-1 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400"/></div>
                             </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-2 text-brand-secondary dark:text-slate-100">Prescription</h4>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex-grow min-w-[150px] sm:min-w-[200px] relative"><label className="text-xs text-slate-600 dark:text-slate-400">Medicine</label><input type="text" value={medicineSearch} onChange={e => {setMedicineSearch(e.target.value); setSelectedMedicine(null);}} placeholder="Search medicine..." className={smallInputClass}/>
                                        {searchedMedicines.length > 0 && !selectedMedicine && (
                                            <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 mt-1 rounded-md shadow-lg">
                                                {searchedMedicines.map(med => (
                                                    <div key={med.id} onClick={() => handleSelectMedicine(med)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-slate-900 dark:text-slate-200 text-sm flex justify-between items-center">
                                                        <div>
                                                            <p className="font-semibold">{med.name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{med.composition}</p>
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            Stock: {med.totalStockInUnits}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow" style={{minWidth: '80px', maxWidth: '100px'}}>
                                        <label className="text-xs text-slate-600 dark:text-slate-400">Qty</label>
                                        <input 
                                            type="number" 
                                            value={quantity} 
                                            onChange={e=>setQuantity(Number(e.target.value))} 
                                            min="1" 
                                            className={`${smallInputClass} disabled:bg-slate-200 dark:disabled:bg-slate-700`}
                                            disabled={selectedMedicine?.form === 'Tablet' || selectedMedicine?.form === 'Capsule'}
                                            title={
                                                (selectedMedicine?.form === 'Tablet' || selectedMedicine?.form === 'Capsule')
                                                    ? "Auto-calculated for tablets/capsules"
                                                    : ""
                                            }
                                        />
                                    </div>
                                    <div className="flex-grow" style={{minWidth: '120px'}}><label className="text-xs text-slate-600 dark:text-slate-400">Dosage</label><input type="text" value={dosage} onChange={e=>setDosage(e.target.value)} placeholder="e.g. 1-0-1" className={smallInputClass}/></div>
                                    <div className="flex-grow" style={{minWidth: '120px'}}><label className="text-xs text-slate-600 dark:text-slate-400">Duration</label><input type="text" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g. 5 days" className={smallInputClass}/></div>
                                    <div className="flex-grow" style={{minWidth: '150px'}}><label className="text-xs text-slate-600 dark:text-slate-400">Notes</label><input type="text" value={pNotes} onChange={e=>setPNotes(e.target.value)} placeholder="e.g. After food" className={smallInputClass}/></div>
                                    <button type="button" onClick={handleAddPrescriptionItem} className="bg-brand-primary text-white rounded h-9 w-9 flex items-center justify-center shrink-0"><PlusIcon className="w-5 h-5"/></button>
                                </div>
                                <div>
                                    {prescription.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-700">
                                            <p className="text-sm text-slate-800 dark:text-slate-200">{item.medicineName} (Qty: {item.quantity}) - {item.dosage} for {item.duration}</p>
                                            <button type="button" onClick={() => handleRemovePrescriptionItem(index)} className="text-red-500 hover:text-red-700"><DeleteIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover">Save Consultation</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
