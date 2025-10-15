import React, { useState, useMemo, useRef } from 'react';
import { Patient } from '../types';
import { CloseIcon, UserPlusIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';
import { useToast } from '../hooks/useToast';

interface BulkPatientFormProps {
    existingPatients: Patient[];
    onClose: () => void;
    onSave: (newPatients: { name: string; mobile: string; gender?: 'Male' | 'Female' | 'Other'; dob?: string; address?: string; }[]) => void;
}

type ParsedPatient = {
    name: string;
    mobile: string;
    gender?: 'Male' | 'Female' | 'Other';
    dob?: string;
    address?: string;
    status: 'ok' | 'duplicate' | 'invalid';
    error?: string;
};

// New smart date parsing function, prioritizing Indian format
const parseIndianDateString = (dateStr: string | undefined): string | undefined => {
    if (!dateStr || !dateStr.trim()) return undefined;

    // Indian format DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10);
        const year = parseInt(parts[3], 10);
        
        // Basic validation for month and day ranges
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return undefined;
        }

        // More complex validation for days in month (e.g., 31st Feb)
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
             // Return in a consistent DD-MM-YYYY format
             return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
        }
    }
    
    // Return undefined if format is not the expected Indian format or is invalid
    return undefined;
};


export const BulkPatientForm: React.FC<BulkPatientFormProps> = ({ existingPatients, onClose, onSave }) => {
    const [bulkData, setBulkData] = useState('');
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parsedPatients = useMemo((): ParsedPatient[] => {
        if (!bulkData.trim()) {
            return [];
        }

        const lines = bulkData.trim().split('\n');
        const headerLine = lines[0].toLowerCase();
        const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));

        // Header detection
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const mobileIdx = headers.findIndex(h => h.includes('mobile') || h.includes('phone'));
        const genderIdx = headers.findIndex(h => h.includes('gender'));
        const dobIdx = headers.findIndex(h => h.includes('dob') || h.includes('birth'));
        const addressIdx = headers.findIndex(h => h.includes('address') || h.includes('location') || h.includes('city'));

        const hasHeader = nameIdx !== -1 && mobileIdx !== -1;
        const dataLines = hasHeader ? lines.slice(1) : lines;
        
        const existingPatientKeys = new Set(existingPatients.map(p => `${p.name.toLowerCase().trim()}|${p.mobile.trim()}`));
        const newPatientKeys = new Set<string>();

        return dataLines.map((line, index) => {
            const columns = line.split(',').map(item => item.trim().replace(/"/g, ''));
            
            let name, mobile, genderStr, dobStr, address;

            if (hasHeader) {
                name = columns[nameIdx];
                mobile = columns[mobileIdx];
                genderStr = genderIdx > -1 ? columns[genderIdx] : undefined;
                dobStr = dobIdx > -1 ? columns[dobIdx] : undefined;
                address = addressIdx > -1 ? columns[addressIdx] : undefined;
            } else {
                [name, mobile, genderStr, dobStr, address] = columns;
            }

            if (!name || !mobile) {
                return { name: name || `Row ${index + 1}`, mobile: '', status: 'invalid', error: 'Name and Mobile are required.' };
            }
            
            if (!/^\d{10}$/.test(mobile)) {
                 return { name, mobile, status: 'invalid', error: 'Invalid mobile (must be 10 digits).' };
            }

            const key = `${name.toLowerCase().trim()}|${mobile.trim()}`;
            
            if (existingPatientKeys.has(key)) {
                return { name, mobile, status: 'duplicate', error: 'Patient with same name & mobile exists.' };
            }

            if (newPatientKeys.has(key)) {
                return { name, mobile, status: 'duplicate', error: 'Duplicate patient in this list.' };
            }
            newPatientKeys.add(key);
            
            const validGender = ['Male', 'Female', 'Other'].find(g => g.toLowerCase() === genderStr?.toLowerCase()) as 'Male' | 'Female' | 'Other' | undefined;
            
            const dob = parseIndianDateString(dobStr);
            if (dobStr && !dob) {
                return { name, mobile, status: 'invalid', error: 'Invalid DOB format (use DD-MM-YYYY).' };
            }

            return { name, mobile, gender: validGender, dob, address, status: 'ok' };
        });
    }, [bulkData, existingPatients]);
    
    const validPatients = parsedPatients.filter(p => p.status === 'ok');
    const duplicateCount = parsedPatients.filter(p => p.status === 'duplicate').length;
    const invalidCount = parsedPatients.filter(p => p.status === 'invalid').length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validPatients.length === 0) {
            addToast('No valid new patient data to import. Please check the preview for errors.', 'warning');
            return;
        }
        onSave(validPatients);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setBulkData(text);
                addToast(`CSV file "${file.name}" loaded successfully.`, 'success');
            };
            reader.readAsText(file);
        }
        // Reset file input to allow re-uploading the same file
        if (event.target) {
            event.target.value = '';
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };
    
    const getStatusInfo = (status: 'ok' | 'duplicate' | 'invalid') => {
        switch(status) {
            case 'ok': return { bg: 'bg-green-50 dark:bg-green-900/50', icon: <CheckCircleIcon className="w-5 h-5 text-green-500"/> };
            case 'duplicate': return { bg: 'bg-yellow-50 dark:bg-yellow-900/50', icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500"/> };
            case 'invalid': return { bg: 'bg-red-50 dark:bg-red-900/50', icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500"/> };
            default: return { bg: '', icon: null };
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 flex items-center gap-3">
                        <UserPlusIcon className="w-6 h-6 text-indigo-500" />
                        Bulk Add Patients
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
                    <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">Instructions</h4>
                                     <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden"/>
                                     <button type="button" onClick={triggerFileUpload} className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Upload CSV</button>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                                    Paste patient data or upload a CSV file.
                                </p>
                                <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                                    Use headers like: <code className="font-mono bg-blue-100 dark:bg-blue-900/50 p-0.5 rounded">Name</code>, <code className="font-mono bg-blue-100 dark:bg-blue-900/50 p-0.5 rounded">Mobile</code>, <code className="font-mono bg-blue-100 dark:bg-blue-900/50 p-0.5 rounded">Gender</code>, <code className="font-mono bg-blue-100 dark:bg-blue-900/50 p-0.5 rounded">DOB</code>, & <code className="font-mono bg-blue-100 dark:bg-blue-900/50 p-0.5 rounded">Address</code>.
                                    Gender, DOB, & Address are optional. If no headers are found, format must be <code className="font-mono bg-blue-100 dark:bg-blue-900/50 p-0.5 rounded">Name, Mobile</code>.
                                </p>
                            </div>
                            <textarea
                                value={bulkData}
                                onChange={(e) => setBulkData(e.target.value)}
                                rows={12}
                                placeholder="Paste data here..."
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Preview ({parsedPatients.length} rows found)</h4>
                            <div className="flex gap-4 text-sm mt-2">
                                <span className="font-medium text-green-600 dark:text-green-400">Valid: {validPatients.length}</span>
                                <span className="font-medium text-red-600 dark:text-red-400">Invalid: {invalidCount}</span>
                                <span className="font-medium text-yellow-600 dark:text-yellow-400">Duplicates: {duplicateCount}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto mt-2 border dark:border-slate-700 rounded-md">
                                {parsedPatients.length > 0 ? (
                                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {parsedPatients.map((p, i) => {
                                            const { bg, icon } = getStatusInfo(p.status);
                                            const details = [p.gender, p.dob, p.address].filter(Boolean).join(', ');
                                            return (
                                                <li key={i} className={`p-3 flex items-start gap-3 text-sm ${bg}`}>
                                                    <div className="flex-shrink-0 mt-0.5">{icon}</div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-slate-800 dark:text-slate-200 font-semibold">{p.name} <span className="font-normal text-slate-600 dark:text-slate-400">{p.mobile}</span></p>
                                                            {p.error && <p className="text-xs text-red-700 dark:text-red-300 font-semibold text-right">{p.error}</p>}
                                                        </div>
                                                        {details && <p className="text-xs text-slate-500 dark:text-slate-400">{details}</p>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-center text-slate-500 dark:text-slate-400 p-4">Paste data or upload a CSV to see a preview.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={validPatients.length === 0} className="px-4 py-2 bg-success text-white rounded-md hover:bg-green-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Save {validPatients.length} Patient(s)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};