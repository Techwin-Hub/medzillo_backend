import React, { useState } from 'react';
import { Supplier } from '../types';
import { SpinnerIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';

interface SupplierFormProps {
    supplier: Supplier | null;
    onClose: () => void;
    onSave: (supplierData: Omit<Supplier, 'id' | 'clinicId'>) => Promise<boolean>;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        contactPerson: supplier?.contactPerson || '',
        mobile: supplier?.mobile || '',
        address: supplier?.address || '',
        gstin: supplier?.gstin || '',
        paymentTerms: supplier?.paymentTerms || '30 Days',
    });
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();
    
    const inputClass = "mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:border-slate-600";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateAndSanitize = () => {
        const { name, mobile, gstin } = formData;
        if (!name.trim()) {
            addToast('Supplier name is required.', 'error');
            return null;
        }
        if (!mobile.trim() || !/^\d{10}$/.test(mobile.trim())) {
            addToast('Please enter a valid 10-digit mobile number.', 'error');
            return null;
        }
        if (gstin.trim() && !/^[a-zA-Z0-9]{15}$/.test(gstin.trim())) {
             addToast('GSTIN must be 15 alphanumeric characters.', 'error');
            return null;
        }
        
        return {
            name: formData.name.trim(),
            contactPerson: formData.contactPerson.trim(),
            mobile: formData.mobile.trim(),
            address: formData.address.trim(),
            gstin: formData.gstin.trim().toUpperCase(),
            paymentTerms: formData.paymentTerms.trim(),
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const sanitizedData = validateAndSanitize();
        if (!sanitizedData) return;

        setIsSaving(true);
        try {
            const success = await onSave(sanitizedData);
            if (success) {
                onClose();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const formFooter = (
        <>
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">Cancel</button>
            <button type="submit" form="supplier-form" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover w-32 flex justify-center items-center disabled:bg-brand-primary/50">
                {isSaving ? <SpinnerIcon className="animate-spin w-5 h-5" /> : 'Save Supplier'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
            footer={formFooter}
        >
            <form id="supplier-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Supplier Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Person</label>
                            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className={inputClass}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label>
                            <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required className={inputClass}/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className={inputClass}></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">GSTIN</label>
                            <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className={inputClass}/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Terms</label>
                            <input type="text" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className={inputClass}/>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
