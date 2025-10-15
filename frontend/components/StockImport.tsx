import React, { useState, useMemo, useRef } from 'react';
import { Medicine, Supplier, ProcessedStockItem } from '../types';
import { useClinicData } from '../contexts/ClinicDataContext';
import { useToast } from '../hooks/useToast';
import { CloseIcon, ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon, SpinnerIcon } from './icons';
import { Pagination } from './Pagination';

interface StockImportProps {
    onClose: () => void;
}

const REQUIRED_FIELDS = {
    medicineName: "Medicine Name",
    strength: "Strength",
    manufacturer: "Manufacturer",
    composition: "Composition",
    form: "Form",
    hsnCode: "HSN Code",
    batchNumber: "Batch Number",
    expiryDate: "Expiry Date",
    packQuantity: "Pack Quantity",
    unitsPerPack: "Units per Pack",
    purchaseRate: "Purchase Rate (per Pack)",
    mrp: "MRP (per Pack)",
};


type FieldKey = keyof typeof REQUIRED_FIELDS;

const parseDate = (dateStr: string | undefined): string | null => {
  if (!dateStr) return null;
  const cleanedStr = dateStr.trim();
  const formats = [
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/, // DD-MM-YYYY
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/  // DD-MM-YY
  ];
  
  for (const regex of formats) {
    const parts = cleanedStr.match(regex);
    if (parts) {
      let year, month, day;
      if (regex.source.startsWith('^(\\d{4})')) { // YYYY-MM-DD
        [, year, month, day] = parts.map(p => parseInt(p, 10));
      } else if (regex.source.endsWith('(\\d{4})$')) { // DD-MM-YYYY
        [, day, month, year] = parts.map(p => parseInt(p, 10));
      } else { // DD-MM-YY
        [, day, month, year] = parts.map(p => parseInt(p, 10));
        year += year > 50 ? 1900 : 2000; // Guess century
      }
      
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return null;
};

const validateRow = (
    rowData: Record<string, any>,
    lineNumber: number,
    existingMedicinesByName: Map<string, Medicine>,
    existingMedicineBatches: Map<string, Set<string>>,
    supplierName: string
): ProcessedStockItem => {
    // Helper to check if a value is truly required and provided (not just whitespace).
    const isProvided = (val: any) => val != null && String(val).trim() !== '';

    // Helper to check if a value was provided from the source (CSV or user edit),
    // including an empty string, but excluding null/undefined. This is the key to
    // allowing users to clear fields without them being re-populated.
    const valueExists = (val: any) => val !== undefined && val !== null;

    // Deconstruct all possible fields from the row data.
    const { medicineName, strength, manufacturer, composition, form, hsnCode, batchNumber, expiryDate, packQuantity, unitsPerPack, purchaseRate, mrp } = rowData;

    // Step 1: Validate universal required fields first.
    if (!isProvided(medicineName)) return { status: 'error', data: { ...rowData, supplierName } as any, error: `Missing required field: Medicine Name.`, lineNumber };
    if (!isProvided(batchNumber)) return { status: 'error', data: { ...rowData, supplierName } as any, error: `Missing required field: Batch Number.`, lineNumber };
    if (!isProvided(expiryDate)) return { status: 'error', data: { ...rowData, supplierName } as any, error: `Missing required field: Expiry Date.`, lineNumber };
    if (!isProvided(packQuantity)) return { status: 'error', data: { ...rowData, supplierName } as any, error: `Missing required field: Pack Quantity.`, lineNumber };
    if (!isProvided(unitsPerPack)) return { status: 'error', data: { ...rowData, supplierName } as any, error: `Missing required field: Units per Pack.`, lineNumber };

    // Step 2: Parse and validate core numeric/date types.
    const parsedPackQty = parseInt(String(packQuantity), 10);
    const parsedUnitsPerPack = parseInt(String(unitsPerPack), 10);
    const parsedMrp = parseFloat(String(mrp));
    const parsedExpiry = parseDate(String(expiryDate));

    if (isNaN(parsedPackQty) || parsedPackQty <= 0 || isNaN(parsedUnitsPerPack) || parsedUnitsPerPack <= 0 || (isProvided(mrp) && isNaN(parsedMrp)) || !parsedExpiry) {
        return { status: 'error', data: { ...rowData, supplierName } as any, error: 'Invalid number or date format.', lineNumber };
    }

    // Step 3: Identify medicine by NAME ONLY.
    const existingMed = existingMedicinesByName.get(String(medicineName || '').toLowerCase().trim());

    // Step 4: Construct final data object, prioritizing CSV/user-edited data but pre-filling from existingMed if data is missing.
    const finalData = {
        medicineName: String(rowData.medicineName).trim(),
        strength: valueExists(rowData.strength) ? String(rowData.strength) : (existingMed?.strength || ''),
        manufacturer: valueExists(rowData.manufacturer) ? String(rowData.manufacturer) : (existingMed?.manufacturer || ''),
        composition: valueExists(rowData.composition) ? String(rowData.composition) : (existingMed?.composition || ''),
        form: valueExists(rowData.form) ? String(rowData.form) : (existingMed?.form || ''),
        hsnCode: valueExists(rowData.hsnCode) ? String(rowData.hsnCode) : (existingMed?.hsnCode || ''),
        purchaseRate: valueExists(rowData.purchaseRate) ? parseFloat(String(rowData.purchaseRate || '0')) : (existingMed?.batches[0]?.purchaseRate ?? 0),
        
        // These fields are always from the (validated) row data
        batchNumber: String(batchNumber),
        expiryDate: parsedExpiry,
        packQuantity: parsedPackQty,
        unitsPerPack: parsedUnitsPerPack,
        mrp: parsedMrp,
        supplierName: supplierName
    };

    // Step 5: Perform final validation based on whether it's a new or existing medicine.
    if (existingMed) {
        if (existingMedicineBatches.get(existingMed.id)?.has(finalData.batchNumber.toLowerCase().trim())) {
            return { status: 'error', data: finalData, error: `Duplicate batch for existing medicine.`, lineNumber };
        }
        return { status: 'new_batch', data: finalData, medicineId: existingMed.id, lineNumber };
    } else {
        // It's a new medicine. Stricter validation for required fields.
        const newMedRequired: (keyof typeof finalData)[] = ['strength', 'manufacturer', 'composition', 'form', 'hsnCode', 'mrp'];
        for (const field of newMedRequired) {
            if (!isProvided(finalData[field])) {
                 return { status: 'error', data: finalData, error: `Missing required field for new medicine: ${REQUIRED_FIELDS[field as FieldKey]}.`, lineNumber };
            }
        }
        return { status: 'new_medicine', data: finalData, lineNumber };
    }
};

export const StockImport: React.FC<StockImportProps> = ({ onClose }) => {
    // FIX: Destructure from the correct nested properties of the context.
    const { 
        inventory,
        admin 
    } = useClinicData();
    const { medicines, suppliers, importStockData } = inventory;
    const { saveSupplierMappingTemplate, supplierMappingTemplates } = admin;
    const { addToast } = useToast();

    const [step, setStep] = useState(1);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<FieldKey, string>>(() => (
        Object.keys(REQUIRED_FIELDS).reduce((acc, key) => ({...acc, [key]: ''}), {} as Record<FieldKey, string>)
    ));
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [processedData, setProcessedData] = useState<ProcessedStockItem[]>([]);
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
            
            // If a supplier is already selected, check for a template, otherwise just automap
            const savedTemplates = supplierMappingTemplates || {};
            if (selectedSupplierId && savedTemplates[selectedSupplierId]) {
                 setFieldMapping(savedTemplates[selectedSupplierId] as Record<FieldKey, string>);
            } else {
                autoMapFields(headers);
            }
            setStep(2);
        };
        reader.readAsText(file);
    };

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSupplierId = e.target.value;
        setSelectedSupplierId(newSupplierId);
    
        const savedTemplates = supplierMappingTemplates || {};
        if (savedTemplates[newSupplierId]) {
            setFieldMapping(savedTemplates[newSupplierId] as Record<FieldKey, string>);
            const supplierName = suppliers.find(s => s.id === newSupplierId)?.name;
            if (supplierName) {
                addToast(`Mapping template for "${supplierName}" has been applied.`, 'info');
            }
        } else {
            // If no template, re-run autoMap based on the current headers
            autoMapFields(csvHeaders);
        }
    };
    
    const handleSaveTemplate = () => {
        if (!selectedSupplierId) {
            addToast('Please select a supplier first to save a template.', 'warning');
            return;
        }
        saveSupplierMappingTemplate(selectedSupplierId, fieldMapping);
    };

    const processAndValidateAll = () => {
        setIsProcessing(true);
        if (!selectedSupplierId) {
            addToast('Please select a supplier for this import.', 'warning');
            setIsProcessing(false);
            return;
        }

        const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
        if (!selectedSupplier) {
            addToast('Selected supplier not found.', 'error');
            setIsProcessing(false);
            return;
        }

        const existingMedicines = medicines || [];
        // FIX: Explicitly type the Map to prevent type inference issues.
        const medicinesByName: Map<string, Medicine> = new Map(existingMedicines.map(m => [m.name.toLowerCase().trim(), m]));
        const medicineBatches: Map<string, Set<string>> = new Map(existingMedicines.map(m => [m.id, new Set(m.batches.map(b => b.batchNumber.toLowerCase().trim()))]));
        
        const initialProcessedItems = csvData.map((row, index) => {
            const rowData = Object.keys(fieldMapping).reduce((acc, key) => {
                const csvHeader = fieldMapping[key as FieldKey];
                const headerIndex = csvHeaders.indexOf(csvHeader);
                acc[key as FieldKey] = headerIndex > -1 ? row[headerIndex] : undefined;
                return acc;
            }, {} as Record<FieldKey, any>);
            
            return validateRow(rowData, index + 2, medicinesByName, medicineBatches, selectedSupplier.name);
        });

        const finalResults = initialProcessedItems.map((item, index) => {
            if (item.status === 'error') return item;
            const duplicateInCsv = initialProcessedItems.find((otherItem, otherIndex) => 
                index > otherIndex &&
                otherItem.status !== 'error' &&
                String(otherItem.data.medicineName).toLowerCase().trim() === String(item.data.medicineName).toLowerCase().trim() &&
                String(otherItem.data.batchNumber).toLowerCase().trim() === String(item.data.batchNumber).toLowerCase().trim()
            );
            if (duplicateInCsv) {
                const errorItem: ProcessedStockItem = { ...item, status: 'error', error: `Duplicate in CSV (see row ${duplicateInCsv.lineNumber}).` };
                return errorItem;
            }
            return item;
        });

        setProcessedData(finalResults);
        setCurrentPage(1);
        setStep(3);
        setIsProcessing(false);
    };

    const handleDataChange = (lineNumber: number, fieldKey: FieldKey, value: string | number) => {
        setProcessedData(prevData => {
            const newData = [...prevData];
            const itemIndex = newData.findIndex(p => p.lineNumber === lineNumber);
            if (itemIndex === -1) return prevData;

            const originalItem = newData[itemIndex];
            const updatedItemData = { ...originalItem.data, [fieldKey]: value };

            const existingMedicines = medicines || [];
            // FIX: Explicitly type the Map to prevent type inference issues.
            const medicinesByName: Map<string, Medicine> = new Map(existingMedicines.map(m => [m.name.toLowerCase().trim(), m]));
            const medicineBatches: Map<string, Set<string>> = new Map(existingMedicines.map(m => [m.id, new Set(m.batches.map(b => b.batchNumber.toLowerCase().trim()))]));
            
            const revalidatedItem = validateRow(updatedItemData, lineNumber, medicinesByName, medicineBatches, originalItem.data.supplierName);
            newData[itemIndex] = revalidatedItem;
            return newData;
        });
    };

    const handleConfirmImport = async () => {
        setIsProcessing(true);
        const itemsToImport = processedData.filter(item => item.status !== 'error');
        
        if (itemsToImport.length > 0) {
            const success = await importStockData(itemsToImport);
            if (success) onClose();
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
            case 2: return <Step2 headers={csvHeaders} mapping={fieldMapping} setMapping={setFieldMapping} onNext={processAndValidateAll} onBack={() => setStep(1)} isLoading={isProcessing} suppliers={suppliers || []} selectedSupplierId={selectedSupplierId} onSupplierChange={handleSupplierChange} onSaveTemplate={handleSaveTemplate} />;
            // FIX: Pass isProcessing to the isLoading prop instead of the undefined isLoading variable.
            case 3: return <Step3 data={paginatedProcessedData} summary={{ total: processedData.length, valid: processedData.filter(p=>p.status !== 'error').length, errors: processedData.filter(p=>p.status === 'error').length }} onConfirm={handleConfirmImport} onBack={() => setStep(2)} isLoading={isProcessing} pagination={<Pagination currentPage={currentPage} totalItems={processedData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />} onDataChange={handleDataChange} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">Import Stock Data - Step {step} of 3</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">{renderStepContent()}</div>
            </div>
        </div>
    );
};

const Step1: React.FC<{onFileChange: (file: File | null) => void; fileInputRef: React.RefObject<HTMLInputElement>}> = ({ onFileChange, fileInputRef }) => (
    <div className="text-center p-8">
        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Upload your CSV file</h4>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Drag and drop your file here or click to browse.</p>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFileChange(e.dataTransfer.files[0]); }} className="mt-6 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 dark:text-slate-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-900 rounded-md font-medium text-brand-primary hover:text-brand-primary-hover focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" ref={fileInputRef} onChange={e => onFileChange(e.target.files?.[0])} accept=".csv" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">CSV up to 10MB</p>
            </div>
        </div>
    </div>
);

const Step2: React.FC<{headers: string[], mapping: Record<FieldKey, string>, setMapping: React.Dispatch<React.SetStateAction<Record<FieldKey, string>>>, onNext: () => void, onBack: () => void, isLoading: boolean, suppliers: Supplier[], selectedSupplierId: string, onSupplierChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, onSaveTemplate: () => void}> = ({ headers, mapping, setMapping, onNext, onBack, isLoading, suppliers, selectedSupplierId, onSupplierChange, onSaveTemplate }) => (
    <div>
        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Map CSV Columns & Select Supplier</h4>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Match your CSV columns to the application fields and select a supplier for this entire import.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Supplier for this Import <span className="text-red-500">*</span></label>
                <select value={selectedSupplierId} onChange={onSupplierChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <option value="" disabled>Select a supplier...</option>
                    {suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            {Object.entries(REQUIRED_FIELDS).map(([key, label]) => (
                <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                    <select value={mapping[key as FieldKey]} onChange={e => setMapping(prev => ({ ...prev, [key as FieldKey]: e.target.value }))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        <option value="">Select a column...</option>
                        {headers.map((h: string) => <option key={h} value={h}>{h}</option>)}
                    </select>
                </div>
            ))}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button onClick={onBack} className="w-full sm:w-auto px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Back</button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={onSaveTemplate} disabled={isLoading || !selectedSupplierId} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">Save Template</button>
                <button onClick={onNext} disabled={isLoading || !selectedSupplierId} className="w-full sm:w-auto px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover min-w-[170px] flex justify-center items-center disabled:bg-brand-primary/50 disabled:cursor-not-allowed">{isLoading ? <SpinnerIcon className="animate-spin w-5 h-5"/> : 'Preview & Validate'}</button>
            </div>
        </div>
    </div>
);

const Step3: React.FC<{data: ProcessedStockItem[], summary: {total: number, valid: number, errors: number}, onConfirm: () => void, onBack: () => void, isLoading: boolean, pagination: React.ReactNode, onDataChange: (lineNumber: number, fieldKey: FieldKey, value: string | number) => void}> = ({ data, summary, onConfirm, onBack, isLoading, pagination, onDataChange }) => {
    const getStatusInfo = (status: string) => {
        switch(status) {
            case 'new_medicine': return { text: 'New Medicine', icon: <CheckCircleIcon className="w-5 h-5 text-green-500"/> };
            case 'new_batch': return { text: 'New Batch', icon: <CheckCircleIcon className="w-5 h-5 text-blue-500"/> };
            case 'error': return { text: 'Error', icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500"/> };
            default: return { text: '', icon: null};
        }
    };
    const inputClass = "w-full text-sm p-1 border border-slate-300 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary dark:border-slate-500";
    
    const standardForms = useMemo(() => ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Bottle'], []);
    const numCols = 12; // Total number of editable columns

    const handleTableKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            return;
        }

        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT') {
            return;
        }
        e.preventDefault();

        const currentInput = target as HTMLInputElement | HTMLSelectElement;
        const currentRow = parseInt(currentInput.dataset.row || '0', 10);
        const currentCol = parseInt(currentInput.dataset.col || '0', 10);
        
        let nextRow = currentRow;
        let nextCol = currentCol;

        switch (e.key) {
            case 'ArrowUp':
                nextRow = Math.max(0, currentRow - 1);
                break;
            case 'ArrowDown':
                nextRow = Math.min(data.length - 1, currentRow + 1);
                break;
            case 'ArrowLeft':
                nextCol = Math.max(0, currentCol - 1);
                break;
            case 'ArrowRight':
                nextCol = Math.min(numCols - 1, currentCol + 1);
                break;
        }

        const nextInput = (e.currentTarget as HTMLTableElement).querySelector<HTMLInputElement | HTMLSelectElement>(`[data-row='${nextRow}'][data-col='${nextCol}']`);
        if (nextInput) {
            nextInput.focus();
            if (nextInput.tagName === 'INPUT') {
                 (nextInput as HTMLInputElement).select();
            }
        }
    };

    return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Preview, Edit & Confirm</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="font-semibold">Total Rows: {summary.total}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">Valid: {summary.valid}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">Errors: {summary.errors}</span>
                </div>
            </div>
        </div>
        <div className="overflow-auto border rounded-lg dark:border-slate-700">
            {/* Desktop Table */}
            <table onKeyDown={handleTableKeyDown} className="min-w-full text-sm whitespace-nowrap hidden md:table">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10"><tr className="text-left"><th className="p-2 font-medium">Status</th><th className="p-2 font-medium">Medicine Name</th><th className="p-2 font-medium">Strength</th><th className="p-2 font-medium">Manufacturer</th><th className="p-2 font-medium">Composition</th><th className="p-2 font-medium">Form</th><th className="p-2 font-medium">HSN</th><th className="p-2 font-medium">Batch #</th><th className="p-2 font-medium">Expiry</th><th className="p-2 font-medium">Packs</th><th className="p-2 font-medium">Units/Pack</th><th className="p-2 font-medium">Purchase Rate</th><th className="p-2 font-medium">MRP</th><th className="p-2 font-medium">Supplier</th><th className="p-2 font-medium">Details / Error</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {data.map((item: ProcessedStockItem, rowIndex) => {
                        const { icon } = getStatusInfo(item.status);
                        const isError = item.status === 'error';
                        const formOptions = [...standardForms];
                        if (item.data.form && !standardForms.includes(item.data.form)) {
                            formOptions.push(item.data.form);
                        }

                        return <tr key={item.lineNumber} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isError ? 'bg-red-50 dark:bg-red-900/50' : ''}`}>
                            <td className="p-2 align-top"><div className="flex items-center" title={item.status}>{icon}</div></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={0} value={item.data.medicineName || ''} onChange={e => onDataChange(item.lineNumber, 'medicineName', e.target.value)} className={inputClass} style={{minWidth: '150px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={1} value={item.data.strength || ''} onChange={e => onDataChange(item.lineNumber, 'strength', e.target.value)} className={inputClass} style={{width: '80px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={2} value={item.data.manufacturer || ''} onChange={e => onDataChange(item.lineNumber, 'manufacturer', e.target.value)} className={inputClass} style={{minWidth: '150px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={3} value={item.data.composition || ''} onChange={e => onDataChange(item.lineNumber, 'composition', e.target.value)} className={inputClass} style={{minWidth: '150px'}}/></td>
                            <td className="p-1 align-top">
                                <select data-row={rowIndex} data-col={4} value={item.data.form || ''} onChange={e => onDataChange(item.lineNumber, 'form', e.target.value)} className={inputClass} style={{width: '120px'}}>
                                    <option value="" disabled>Select a form...</option>
                                    {formOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={5} value={item.data.hsnCode || ''} onChange={e => onDataChange(item.lineNumber, 'hsnCode', e.target.value)} className={inputClass} style={{width: '100px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={6} value={item.data.batchNumber || ''} onChange={e => onDataChange(item.lineNumber, 'batchNumber', e.target.value)} className={inputClass} style={{width: '100px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={7} value={item.data.expiryDate || ''} onChange={e => onDataChange(item.lineNumber, 'expiryDate', e.target.value)} className={inputClass} style={{width: '120px'}} placeholder="YYYY-MM-DD"/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={8} type="number" value={item.data.packQuantity || ''} onChange={e => onDataChange(item.lineNumber, 'packQuantity', e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} style={{width: '70px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={9} type="number" value={item.data.unitsPerPack || ''} onChange={e => onDataChange(item.lineNumber, 'unitsPerPack', e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} style={{width: '70px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={10} type="number" value={item.data.purchaseRate || ''} onChange={e => onDataChange(item.lineNumber, 'purchaseRate', e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} style={{width: '80px'}}/></td>
                            <td className="p-1 align-top"><input data-row={rowIndex} data-col={11} type="number" value={item.data.mrp || ''} onChange={e => onDataChange(item.lineNumber, 'mrp', e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} style={{width: '80px'}}/></td>
                            <td className="p-2 align-top text-slate-800 dark:text-slate-200">{item.data.supplierName}</td>
                            <td className="p-2 text-xs text-slate-600 dark:text-slate-400 align-top">{isError ? <span className="font-semibold text-red-600 dark:text-red-400">{item.error}</span> : `New ${item.status === 'new_batch' ? 'batch for existing medicine' : 'medicine record'}`}</td>
                        </tr>
                    })}
                </tbody>
            </table>
             {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                {data.map((item: ProcessedStockItem, rowIndex) => {
                    const { icon } = getStatusInfo(item.status);
                    const isError = item.status === 'error';
                    const formOptions = [...standardForms];
                    if (item.data.form && !standardForms.includes(item.data.form)) {
                        formOptions.push(item.data.form);
                    }
                    return (
                        <div key={item.lineNumber} className={`p-3 ${isError ? 'bg-red-50 dark:bg-red-900/50' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {icon}
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{item.data.medicineName}</span>
                                </div>
                                {isError && <p className="text-xs text-red-700 dark:text-red-300 font-semibold text-right">{item.error}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div><label className="font-medium text-slate-500">Name</label><input value={item.data.medicineName || ''} onChange={e => onDataChange(item.lineNumber, 'medicineName', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Batch #</label><input value={item.data.batchNumber || ''} onChange={e => onDataChange(item.lineNumber, 'batchNumber', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Strength</label><input value={item.data.strength || ''} onChange={e => onDataChange(item.lineNumber, 'strength', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Expiry</label><input value={item.data.expiryDate || ''} onChange={e => onDataChange(item.lineNumber, 'expiryDate', e.target.value)} placeholder="YYYY-MM-DD" className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Manufacturer</label><input value={item.data.manufacturer || ''} onChange={e => onDataChange(item.lineNumber, 'manufacturer', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Packs</label><input type="number" value={item.data.packQuantity || ''} onChange={e => onDataChange(item.lineNumber, 'packQuantity', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Composition</label><input value={item.data.composition || ''} onChange={e => onDataChange(item.lineNumber, 'composition', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Units/Pack</label><input type="number" value={item.data.unitsPerPack || ''} onChange={e => onDataChange(item.lineNumber, 'unitsPerPack', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">Form</label><select value={item.data.form || ''} onChange={e => onDataChange(item.lineNumber, 'form', e.target.value)} className={inputClass}><option value="" disabled>Select...</option>{formOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
                                <div><label className="font-medium text-slate-500">Purchase Rate</label><input type="number" value={item.data.purchaseRate || ''} onChange={e => onDataChange(item.lineNumber, 'purchaseRate', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">HSN</label><input value={item.data.hsnCode || ''} onChange={e => onDataChange(item.lineNumber, 'hsnCode', e.target.value)} className={inputClass}/></div>
                                <div><label className="font-medium text-slate-500">MRP</label><input type="number" value={item.data.mrp || ''} onChange={e => onDataChange(item.lineNumber, 'mrp', e.target.value)} className={inputClass}/></div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
        {pagination}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button onClick={onBack} className="w-full sm:w-auto px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Back</button>
            <button onClick={onConfirm} disabled={isLoading || (summary.valid === 0)} className="w-full sm:w-auto px-4 py-2 bg-success text-white rounded-md hover:bg-green-700 w-48 flex justify-center items-center disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">{isLoading ? <SpinnerIcon className="animate-spin w-5 h-5"/> : `Import ${summary.valid} Records`}</button>
        </div>
    </div>
)};