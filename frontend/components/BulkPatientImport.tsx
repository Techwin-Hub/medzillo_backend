import React, { useState, useMemo, useRef } from 'react';
import { Patient, ProcessedPatientItem } from '../types';
import { useToast } from '../hooks/useToast';
import { CloseIcon, ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon, SpinnerIcon, UserPlusIcon } from './icons';
import { Pagination } from './Pagination';

interface BulkPatientImportProps {
    existingPatients: Patient[];
    onClose: () => void;
    onSave: (newPatients: ProcessedPatientItem['data'][]) => Promise<void>;
}

const REQUIRED_FIELDS = {
    name: "Name",
    mobile: "Mobile",
    gender: "Gender",
    dob: "Date of Birth",
    address: "Address",
};

type FieldKey = keyof typeof REQUIRED_FIELDS;

const parseIndianDateString = (dateStr: string | undefined): string | undefined => {
    if (!dateStr || !dateStr.trim()) return undefined;
    const cleanedStr = dateStr.trim();

    const parts = cleanedStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/); // DD-MM-YYYY or DD/MM/YYYY
    if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10);
        const year = parseInt(parts[3], 10);
        
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
             return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
        }
    }
    return undefined;
};

const validateRow = (
    rowData: Record<string, any>,
    lineNumber: number,
    existingPatientKeys: Set<string>
): ProcessedPatientItem => {
    const isProvided = (val: any) => val != null && String(val).trim() !== '';

    const { name, mobile, gender, dob, address } = rowData;

    if (!isProvided(name)) return { status: 'invalid', data: { ...rowData } as any, error: 'Missing required field: Name.', lineNumber };
    if (!isProvided(mobile)) return { status: 'invalid', data: { ...rowData } as any, error: 'Missing required field: Mobile.', lineNumber };

    const cleanedMobile = String(mobile).replace(/\D/g, '').slice(-10);
    if (!/^\d{10}$/.test(cleanedMobile)) {
        return { status: 'invalid', data: { ...rowData, mobile: cleanedMobile } as any, error: 'Invalid mobile (must be 10 digits).', lineNumber };
    }

    const key = `${String(name).toLowerCase().trim()}|${cleanedMobile}`;

    if (existingPatientKeys.has(key)) {
        return { status: 'duplicate', data: { ...rowData, mobile: cleanedMobile } as any, error: 'Patient with same name & mobile exists.', lineNumber };
    }
    
    const validGender = ['Male', 'Female', 'Other'].find(g => g.toLowerCase() === String(gender || '').toLowerCase()) as 'Male' | 'Female' | 'Other' | undefined;
    if (isProvided(gender) && !validGender) {
        return { status: 'invalid', data: { ...rowData, mobile: cleanedMobile } as any, error: 'Invalid gender (use Male/Female/Other).', lineNumber };
    }

    const validDob = parseIndianDateString(String(dob));
    if (isProvided(dob) && !validDob) {
        return { status: 'invalid', data: { ...rowData, mobile: cleanedMobile } as any, error: 'Invalid DOB format (use DD-MM-YYYY).', lineNumber };
    }

    const finalData: ProcessedPatientItem['data'] = {
        name: String(name).trim(),
        mobile: cleanedMobile,
        ...(validGender && { gender: validGender }),
        ...(validDob && { dob: validDob }),
        ...(isProvided(address) && { address: String(address).trim() }),
    };

    return { status: 'ok', data: finalData, lineNumber };
};

export const BulkPatientImport: React.FC<BulkPatientImportProps> = ({ existingPatients, onClose, onSave }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<FieldKey, string>>(() => (
        Object.keys(REQUIRED_FIELDS).reduce((acc, key) => ({...acc, [key]: ''}), {} as Record<FieldKey, string>)
    ));
    const [processedData, setProcessedData] = useState<ProcessedPatientItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const autoMapFields = (headers: string[]) => {
        const newMapping: Record<FieldKey, string> = {} as any;
        const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[\s_]/g, ''));
        
        for (const key in REQUIRED_FIELDS) {
            const appField = REQUIRED_FIELDS[key as FieldKey].toLowerCase().replace(/[\s_()/-]/g, '');
            const foundIndex = lowerHeaders.findIndex(h => h.includes(appField) || appField.includes(h) || h === key.toLowerCase());
            if (foundIndex > -1) {
                newMapping[key as FieldKey] = headers[foundIndex];
            } else {
                newMapping[key as FieldKey] = '';
            }
        }
        setFieldMapping(newMapping);
    };

    const handleFileChange = (file: File | null) => {
        if (!file) return;
        if (file.type !== 'text/csv') {
            addToast('Invalid file type. Please select a .csv file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.trim().split(/\r?\n/);
            if (lines.length < 2) {
              addToast('CSV file must have at least one header row and one data row.', 'error');
              return;
            }
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = lines.slice(1).map(line => line.split(',').map(item => item.trim().replace(/"/g, '')));

            setCsvHeaders(headers);
            setCsvData(data);
            autoMapFields(headers);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const processAndValidateAll = () => {
        setIsProcessing(true);
        // Fix: Explicitly type the Set to avoid inference issues with `Set<unknown>`.
        const existingPatientKeys = new Set<string>(existingPatients.map(p => `${p.name.toLowerCase().trim()}|${p.mobile.trim()}`));
        // Fix: Use a Map to correctly track row numbers for duplicates within the CSV.
        const newPatientKeysInCsv = new Map<string, number>();

        const results = csvData.map((row, index) => {
            const rowData = Object.keys(fieldMapping).reduce((acc, key) => {
                const csvHeader = fieldMapping[key as FieldKey];
                const headerIndex = csvHeaders.indexOf(csvHeader);
                acc[key as FieldKey] = headerIndex > -1 ? row[headerIndex] : undefined;
                return acc;
            }, {} as Record<FieldKey, any>);

            const validationResult = validateRow(rowData, index + 2, existingPatientKeys);
            
            if (validationResult.status === 'ok') {
                const key = `${validationResult.data.name.toLowerCase().trim()}|${validationResult.data.mobile.trim()}`;
                if (newPatientKeysInCsv.has(key)) {
                    validationResult.status = 'duplicate';
                    validationResult.error = `Duplicate patient in this list (see row ${newPatientKeysInCsv.get(key)}).`;
                } else {
                    newPatientKeysInCsv.set(key, index + 2);
                }
            }
            return validationResult;
        });

        setProcessedData(results);
        setCurrentPage(1);
        setStep(3);
        setIsProcessing(false);
    };
    
    const handleConfirmImport = async () => {
        setIsProcessing(true);
        const itemsToImport = processedData.filter(item => item.status === 'ok').map(item => item.data);
        
        if (itemsToImport.length > 0) {
            await onSave(itemsToImport);
            onClose();
        } else {
            addToast('No valid items to import.', 'warning');
        }
        setIsProcessing(false);
    };
    
    const paginatedProcessedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage]);

    const renderStepContent = () => {
        switch (step) {
            case 1: return <Step1 onFileChange={handleFileChange} fileInputRef={fileInputRef} />;
            case 2: return <Step2 headers={csvHeaders} mapping={fieldMapping} setMapping={setFieldMapping} onNext={processAndValidateAll} onBack={() => setStep(1)} isLoading={isProcessing} />;
            case 3: return <Step3 data={paginatedProcessedData} summary={{ total: processedData.length, valid: processedData.filter(p => p.status === 'ok').length, errors: processedData.filter(p => p.status !== 'ok').length }} onConfirm={handleConfirmImport} onBack={() => setStep(2)} isLoading={isProcessing} pagination={<Pagination currentPage={currentPage} totalItems={processedData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">Import Patient Data - Step {step} of 3</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">{renderStepContent()}</div>
            </div>
        </div>
    );
};

const Step1: React.FC<{onFileChange: (file: File | null) => void; fileInputRef: React.RefObject<HTMLInputElement>}> = ({ onFileChange, fileInputRef }) => (
    <div className="text-center p-8"><h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Upload your Patient CSV file</h4><p className="text-slate-500 dark:text-slate-400 mt-2">Drag and drop your file here or click to browse.</p><div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFileChange(e.dataTransfer.files[0]); }} className="mt-6 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md"><div className="space-y-1 text-center"><UserPlusIcon className="mx-auto h-12 w-12 text-slate-400" /><div className="flex text-sm text-slate-600 dark:text-slate-400"><label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-900 rounded-md font-medium text-brand-primary hover:text-brand-primary-hover focus-within:outline-none"><span>Upload a file</span><input id="file-upload" name="file-upload" type="file" ref={fileInputRef} onChange={e => onFileChange(e.target.files?.[0])} accept=".csv" className="sr-only" /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs text-slate-500 dark:text-slate-500">CSV up to 10MB</p></div></div></div>
);

const Step2: React.FC<{headers: string[], mapping: Record<FieldKey, string>, setMapping: React.Dispatch<React.SetStateAction<Record<FieldKey, string>>>, onNext: () => void, onBack: () => void, isLoading: boolean}> = ({ headers, mapping, setMapping, onNext, onBack, isLoading }) => (
    <div><h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Map CSV Columns</h4><p className="text-slate-500 dark:text-slate-400 mb-6">Match your CSV columns to the application fields. Name and Mobile are required.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Object.entries(REQUIRED_FIELDS).map(([key, label]) => (<div key={key}><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label><select value={mapping[key as FieldKey]} onChange={e => setMapping(prev => ({ ...prev, [key as FieldKey]: e.target.value }))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"><option value="">Select a column...</option>{headers.map((h: string) => <option key={h} value={h}>{h}</option>)}</select></div>))}</div><div className="mt-8 flex justify-between items-center"><button onClick={onBack} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Back</button><button onClick={onNext} disabled={isLoading} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover min-w-[170px] flex justify-center items-center disabled:bg-brand-primary/50 disabled:cursor-not-allowed">{isLoading ? <SpinnerIcon className="animate-spin w-5 h-5"/> : 'Preview & Validate'}</button></div></div>
);

const Step3: React.FC<{data: ProcessedPatientItem[], summary: {total: number, valid: number, errors: number}, onConfirm: () => void, onBack: () => void, isLoading: boolean, pagination: React.ReactNode}> = ({ data, summary, onConfirm, onBack, isLoading, pagination }) => {
    const getStatusInfo = (status: string) => {
        switch(status) {
            case 'ok': return { text: 'OK', icon: <CheckCircleIcon className="w-5 h-5 text-green-500"/>, bg: 'bg-green-50 dark:bg-green-900/50' };
            case 'duplicate': return { text: 'Duplicate', icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500"/>, bg: 'bg-yellow-50 dark:bg-yellow-900/50' };
            case 'invalid': return { text: 'Invalid', icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500"/>, bg: 'bg-red-50 dark:bg-red-900/50' };
            default: return { text: '', icon: null, bg: ''};
        }
    };
    return (
    <div><div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4"><div><h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Preview & Confirm</h4><div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><span className="font-semibold">Total Rows: {summary.total}</span><span className="font-semibold text-green-600 dark:text-green-400">Valid to Import: {summary.valid}</span><span className="font-semibold text-red-600 dark:text-red-400">Errors/Duplicates: {summary.errors}</span></div></div></div><div className="overflow-auto border rounded-lg dark:border-slate-700"><table className="min-w-full text-sm whitespace-nowrap"><thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10"><tr className="text-left"><th className="p-2 font-medium">Status</th><th className="p-2 font-medium">Name</th><th className="p-2 font-medium">Mobile</th><th className="p-2 font-medium">Details</th><th className="p-2 font-medium">Error</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{data.map((item) => { const { icon, bg } = getStatusInfo(item.status); const details = [item.data.gender, item.data.dob, item.data.address].filter(Boolean).join(' | '); return <tr key={item.lineNumber} className={`${bg}`}><td className="p-2 align-top"><div className="flex items-center" title={item.status}>{icon}</div></td><td className="p-2 align-top text-slate-800 dark:text-slate-200 font-semibold">{item.data.name}</td><td className="p-2 align-top text-slate-800 dark:text-slate-200">{item.data.mobile}</td><td className="p-2 align-top text-xs text-slate-600 dark:text-slate-400">{details}</td><td className="p-2 align-top text-xs font-semibold text-red-600 dark:text-red-400">{item.error}</td></tr>})}</tbody></table></div>{pagination}<div className="mt-8 flex justify-between items-center"><button onClick={onBack} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Back</button><button onClick={onConfirm} disabled={isLoading || (summary.valid === 0)} className="px-4 py-2 bg-success text-white rounded-md hover:bg-green-700 w-48 flex justify-center items-center disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">{isLoading ? <SpinnerIcon className="animate-spin w-5 h-5"/> : `Import ${summary.valid} Patients`}</button></div></div>
)};