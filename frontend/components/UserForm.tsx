import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SpinnerIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';

interface UserFormProps {
    user: User | null;
    onClose: () => void;
    onSave: (user: User | Omit<User, 'id' | 'clinicId'>) => Promise<boolean>;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Doctor' as 'Doctor' | 'Pharmacist' | 'Admin',
        consultationFee: 0,
        specialty: '',
    });
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();
    
    const inputClass = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary";

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                consultationFee: user.consultationFee || 0,
                specialty: user.specialty || '',
            });
            setPassword('');
        } else {
            setFormData({ name: '', email: '', role: 'Doctor', consultationFee: 0, specialty: '' });
            setPassword('');
        }
    }, [user]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['consultationFee'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumberField ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user && !password) {
            addToast('Password is required for new users.', 'warning');
            return;
        }

        const dataToSave: any = { ...formData, ...(password && { password }) };

        if (dataToSave.role !== 'Doctor') {
            delete dataToSave.consultationFee;
            delete dataToSave.specialty;
        }
        
        setIsSaving(true);
        try {
            let success = false;
            if (user) {
                success = await onSave({ ...user, ...dataToSave });
            } else {
                success = await onSave(dataToSave);
            }
            // The onClose is handled in the parent component based on success
        } finally {
            setIsSaving(false);
        }
    };

    const formFooter = (
        <>
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">Cancel</button>
            <button type="submit" form="user-form" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover w-28 flex justify-center items-center disabled:bg-brand-primary/50">
                {isSaving ? <SpinnerIcon className="animate-spin w-5 h-5" /> : 'Save User'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={user ? 'Edit User' : 'Add New User'}
            footer={formFooter}
        >
            <form id="user-form" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={user ? "Leave blank to keep unchanged" : "Required"} className={inputClass}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                            <option>Doctor</option>
                            <option>Pharmacist</option>
                            <option>Admin</option>
                        </select>
                    </div>
                    {formData.role === 'Doctor' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Specialty</label>
                                <input
                                    type="text"
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="e.g., General Physician, Cardiologist"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Consultation Fee (₹)</label>
                                <input 
                                    type="number" 
                                    name="consultationFee" 
                                    value={formData.consultationFee} 
                                    onChange={handleChange} 
                                    className={inputClass}
                                    placeholder="e.g., 500"
                                    min="0"
                                />
                            </div>
                        </>
                    )}
                </div>
            </form>
        </Modal>
    );
};
