import React, { useState, useEffect, useRef } from 'react';
import { Medicine } from '../types';
import { CameraIcon, SpinnerIcon } from './icons';
import { BarcodeScanner } from './BarcodeScanner';
import { Modal } from './Modal';

interface MedicineFormProps {
    medicine: Medicine | null;
    hsnMaster: { [key: string]: number };
    onClose: () => void;
    onSave: (medicineData: Omit<Medicine, 'id' | 'clinicId' | 'totalStockInUnits' | 'batches' | 'packSize'>) => Promise<boolean>;
}

const capitalizeFirstLetter = (str: string | undefined): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const MedicineForm: React.FC<MedicineFormProps> = ({ medicine, hsnMaster, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: medicine?.name || '',
        manufacturer: medicine?.manufacturer || '',
        composition: medicine?.composition || '',
        strength: medicine?.strength || '',
        form: capitalizeFirstLetter(medicine?.form) || 'Tablet',
        unitType: medicine?.unitType || 'Tablet',
        hsnCode: medicine?.hsnCode || '',
        gstRate: medicine?.gstRate || 0,
        minStockLevel: medicine?.minStockLevel || 10,
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const isFractional = formData.form === 'Tablet' || formData.form === 'Capsule';

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
    }, [formRef, isFractional]);

    useEffect(() => {
        if (!isFractional) {
            setFormData(prev => ({
                ...prev,
                unitType: prev.form,
            }));
        } else {
             if (formData.unitType !== 'Tablet' && formData.unitType !== 'Capsule') {
                setFormData(prev => ({ ...prev, unitType: prev.form }));
             }
        }
    }, [formData.form, isFractional]);
    
    useEffect(() => {
        const rate = hsnMaster?.[formData.hsnCode] ?? 0;
        setFormData(prev => ({ ...prev, gstRate: rate }));
    }, [formData.hsnCode, hsnMaster]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['minStockLevel', 'gstRate'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumberField ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const success = await onSave(formData);
            if (success) {
                onClose();
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleScanSuccess = (scannedCode: string) => {
        setFormData(prev => ({ ...prev, hsnCode: scannedCode }));
        setIsScannerOpen(false);
    };

    const inputClass = "mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:border-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400";
    
    const formFooter = (
        <>
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focusable-field disabled:opacity-50">Cancel</button>
            <button type="submit" form="medicine-form" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover w-32 flex justify-center items-center disabled:bg-brand-primary/50">
                {isSaving ? <SpinnerIcon className="animate-spin w-5 h-5" /> : 'Save Medicine'}
            </button>
        </>
    );

    return (
        <>
            <Modal
                isOpen={true}
                onClose={onClose}
                title={medicine ? 'Edit Medicine' : 'Add New Medicine'}
                footer={formFooter}
            >
                <form id="medicine-form" ref={formRef} onSubmit={handleSubmit}>
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Medicine Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={`${inputClass} focusable-field`}/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Manufacturer</label>
                                <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required className={`${inputClass} focusable-field`}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Composition</label>
                                <input type="text" name="composition" value={formData.composition} onChange={handleChange} required className={`${inputClass} focusable-field`}/>
                            </div>
                        </div>
                         
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Strength</label>
                                <input type="text" name="strength" value={formData.strength} onChange={handleChange} className={`${inputClass} focusable-field`}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Form</label>
                                <select name="form" value={formData.form} onChange={handleChange} className={`${inputClass} focusable-field`}>
                                    <option>Tablet</option>
                                    <option>Capsule</option>
                                    <option>Syrup</option>
                                    <option>Injection</option>
                                    <option>Ointment</option>
                                    <option>Cream</option>
                                    <option>Bottle</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">HSN Code</label>
                                <div className="relative">
                                    <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} className={`${inputClass} focusable-field`}/>
                                    <button type="button" onClick={() => setIsScannerOpen(true)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400 hover:text-brand-primary" title="Scan Barcode">
                                        <CameraIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                {hsnMaster && hsnMaster[formData.hsnCode] === undefined && formData.hsnCode.length > 3 && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">HSN code not in master. GST set to 0%.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">GST Rate (%)</label>
                                <input type="text" value={`${formData.gstRate}%`} readOnly className={`${inputClass} bg-slate-100 dark:bg-slate-800`} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Unit Type</label>
                                <input type="text" name="unitType" value={formData.unitType} onChange={handleChange} required className={`${inputClass} focusable-field`} placeholder="e.g., Tablet, ml, Bottle" disabled={!isFractional}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Minimum Stock Level (in Units)</label>
                                <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} onWheel={(e) => (e.target as HTMLElement).blur()} className={`${inputClass} focusable-field`}/>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {isScannerOpen && (
                <BarcodeScanner
                    onScan={handleScanSuccess}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </>
    );
};