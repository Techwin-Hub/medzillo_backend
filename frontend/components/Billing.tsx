import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Patient, Medicine, BillItem, Bill, DraftBill, PharmacyInfo, User, BillItemType, TaxDetail, Batch } from '../types';
import { PlusIcon, DeleteIcon, CloseIcon, SpinnerIcon } from './icons';
import { Invoice } from './Invoice';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useToast';
import { useClinicData } from '../contexts/ClinicDataContext';

const calculateTaxDetails = (items: BillItem[]): TaxDetail[] => {
    const taxMap: { [rate: number]: number } = {};
    items.forEach(item => {
        if (item.gstRate > 0) {
            taxMap[item.gstRate] = (taxMap[item.gstRate] || 0) + item.amount;
        }
    });
    
    return Object.entries(taxMap).map(([rateStr, taxableAmount]) => {
        const rate = Number(rateStr);
        const totalTax = taxableAmount * (rate / 100);
        return {
            rate,
            taxableAmount,
            cgst: totalTax / 2,
            sgst: totalTax / 2,
        };
    }).sort((a,b) => a.rate - b.rate);
};

const Billing: React.FC = () => {
  const { 
    billing: { draftBill, setDraftBill, clearDraftBill, processSale },
    patients: { patients, doctors, addPatient },
    inventory: { medicines },
    admin: { pharmacyInfo }
  } = useClinicData();

  const isGstEnabledGlobally = pharmacyInfo.isGstEnabled ?? true;

  const defaultDraftBill: DraftBill = {
      clinicId: pharmacyInfo.clinicId,
      patientId: null,
      patientTab: 'existing',
      newPatientName: '',
      newPatientMobile: '',
      items: [],
      paymentMode: 'Cash',
  };

  const [patientSearch, setPatientSearch] = useState('');
  const debouncedPatientSearch = useDebounce(patientSearch, 300);
  const [isPatientSearchVisible, setIsPatientSearchVisible] = useState(false);
  
  const [medicineSearch, setMedicineSearch] = useState('');
  const debouncedMedicineSearch = useDebounce(medicineSearch, 300);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
  
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [feeModalState, setFeeModalState] = useState<{ open: boolean; type: BillItemType | null }>({ open: false, type: null });
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState<number | string>(''); // Represents MRP for products
  const [feeQty, setFeeQty] = useState<number | string>(1);
  const [feeGst, setFeeGst] = useState<number | string>(0);
  const [selectedFeeDoctorId, setSelectedFeeDoctorId] = useState<string>(doctors[0]?.id || '');
  
  const [applyGst, setApplyGst] = useState(isGstEnabledGlobally);
  const { addToast } = useToast();
  
  const currentDraft = draftBill ?? defaultDraftBill;

  const inputClass = "mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:border-slate-600";
  const selectClass = "mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-brand-primary focus:border-brand-primary disabled:bg-slate-100 disabled:text-slate-500";


  useEffect(() => {
    setApplyGst(isGstEnabledGlobally);
  }, [isGstEnabledGlobally]);

  useEffect(() => {
    if (feeModalState.type === 'Consultation Fee') {
        const doctor = doctors.find(d => d.id === selectedFeeDoctorId);
        setFeeAmount(doctor?.consultationFee || '');
    }
  }, [selectedFeeDoctorId, feeModalState.type, doctors]);
  
  const selectedPatient = useMemo(() => {
      return patients.find(p => p.id === currentDraft.patientId) || null;
  }, [currentDraft.patientId, patients]);

  useEffect(() => {
      if (selectedPatient) {
          setPatientSearch(`${selectedPatient.name} - ${selectedPatient.mobile}`);
      } else {
          setPatientSearch('');
      }
  }, [selectedPatient]);

  const stockInDraft = useMemo(() => {
    const stockMap: { [medicineId: string]: number } = {};
    currentDraft.items.forEach(item => {
      if (item.medicineId) {
        stockMap[item.medicineId] = (stockMap[item.medicineId] || 0) + item.quantity;
      }
    });
    return stockMap;
  }, [currentDraft.items]);

  const searchedMedicines = useMemo(() => {
    if (!debouncedMedicineSearch) return [];
    const lowercasedSearch = debouncedMedicineSearch.toLowerCase();
    return medicines.map(med => {
        const availableStock = med.totalStockInUnits - (stockInDraft[med.id] || 0);
        return { ...med, availableStock };
    }).filter(m => 
        (m.name.toLowerCase().includes(lowercasedSearch) || m.composition.toLowerCase().includes(lowercasedSearch)) &&
        m.availableStock > 0
    ).slice(0, 5);
  }, [debouncedMedicineSearch, medicines, stockInDraft]);

  const searchedPatients = useMemo(() => {
    if (!debouncedPatientSearch) return [];
    if (selectedPatient && `${selectedPatient.name} - ${selectedPatient.mobile}` === patientSearch) return [];

    return patients.filter(p =>
        p.name.toLowerCase().includes(debouncedPatientSearch.toLowerCase()) ||
        p.mobile.includes(debouncedPatientSearch)
    ).slice(0, 5);
  }, [debouncedPatientSearch, patients, selectedPatient, patientSearch]);
  
  const updateDraft = (updates: Partial<DraftBill>) => {
      setDraftBill(prev => ({ ...(prev ?? defaultDraftBill), ...updates }));
  };
  
  const handleSelectMedicine = (med: Medicine & { availableStock: number }) => {
    setMedicineSearch(med.name);
    setSelectedMedicine(med);
  };

    const handleAddBillItem = () => {
        const numQuantity = Number(quantity);
        if (!selectedMedicine || !Number.isInteger(numQuantity) || numQuantity <= 0) {
            addToast("Please select a medicine and enter a valid quantity.", 'warning');
            return;
        }
        
        const availableStock = selectedMedicine.totalStockInUnits - (stockInDraft[selectedMedicine.id] || 0);
        if (numQuantity > availableStock) {
            addToast(`Cannot add ${numQuantity} units. Only ${availableStock} units are available in stock.`, 'error');
            return;
        }

        const itemsToAdd: BillItem[] = [];
        const prescribedQty = numQuantity;

        let quantityToBillFromBatches = prescribedQty;
        const sortedBatches = [...selectedMedicine.batches]
            .filter((b: Batch) => {
                const packQty = Number(b.packQuantity || 0);
                const packSz = Number(b.packSize || 0);
                const looseQty = Number(b.looseQuantity || 0);
                return (packQty * packSz) + looseQty > 0;
            })
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        
        for (const batch of sortedBatches) {
            if (quantityToBillFromBatches === 0) break;
            const packQty = Number(batch.packQuantity || 0);
            const packSz = Number(batch.packSize || 0);
            const looseQty = Number(batch.looseQuantity || 0);
            const batchStockInUnits = (packQty * packSz) + looseQty;
            
            const billAmountFromBatch = Math.min(quantityToBillFromBatches, batchStockInUnits);
            if (billAmountFromBatch > 0) {
                const unitRate = batch.packSize > 0 ? batch.sellingRate / batch.packSize : batch.sellingRate;
                itemsToAdd.push({
                    itemType: 'Medicine',
                    medicineId: selectedMedicine.id,
                    itemName: `${selectedMedicine.name} (${selectedMedicine.strength})`,
                    hsnCode: selectedMedicine.hsnCode,
                    quantity: billAmountFromBatch,
                    rate: unitRate,
                    amount: unitRate * billAmountFromBatch,
                    gstRate: selectedMedicine.gstRate,
                    batchNumber: batch.batchNumber,
                    isRemovable: true,
                });
                quantityToBillFromBatches -= billAmountFromBatch;
            }
        }
        
        updateDraft({ items: [...currentDraft.items, ...itemsToAdd] });
        setMedicineSearch('');
        setSelectedMedicine(null);
        setQuantity(1);
    };
  
  const closeAndResetFeeModal = () => {
    setFeeModalState({ open: false, type: null });
    setFeeName('');
    setFeeAmount('');
    setFeeQty(1);
    setFeeGst(0);
    setSelectedFeeDoctorId(doctors[0]?.id || '');
  };

  const handleAddFeeItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(feeAmount);
    if (!feeModalState.type) return;

    let newItem: BillItem | null = null;

    if (feeModalState.type === 'Product') {
      const qty = Number(feeQty);
      const mrp = Number(feeAmount);
      const gst = Number(feeGst);
      if (!feeName.trim() || qty <= 0 || mrp <= 0) {
        addToast('Product name, valid quantity, and MRP are required.', 'warning');
        return;
      }
      newItem = {
        itemType: 'Product',
        itemName: feeName,
        quantity: qty,
        rate: mrp,
        amount: qty * mrp,
        gstRate: gst,
        isRemovable: true,
      };
    } else { // Handles 'Service' and 'Consultation Fee'
      if (amount <= 0) {
        addToast('Amount must be greater than zero.', 'warning');
        return;
      }
      let itemName = feeModalState.type === 'Consultation Fee'
        ? `Consultation - ${doctors.find(d => d.id === selectedFeeDoctorId)?.name}`
        : feeName;

      if (!itemName.trim()) {
        addToast('Item name is required.', 'warning');
        return;
      }
      newItem = {
        itemType: feeModalState.type,
        itemName,
        quantity: 1,
        rate: amount,
        amount,
        gstRate: 0,
        isRemovable: true,
      };
    }

    if (newItem) {
      updateDraft({ items: [...currentDraft.items, newItem] });
    }
    closeAndResetFeeModal();
  };


  const handleRemoveItem = (index: number) => {
    updateDraft({ items: currentDraft.items.filter((_, i) => i !== index) });
  };

  const resetBill = useCallback(() => {
    clearDraftBill();
    setPatientSearch('');
    setMedicineSearch('');
    setSelectedMedicine(null);
    setQuantity(1);
    setCurrentBill(null);
    setIsInvoiceVisible(false);
    setApplyGst(isGstEnabledGlobally);
  }, [isGstEnabledGlobally, clearDraftBill]);
  
    const billSummary = useMemo(() => {
        const subTotal = currentDraft.items.reduce((acc, item) => acc + item.amount, 0);
        const taxDetails = applyGst ? calculateTaxDetails(currentDraft.items) : [];
        const totalTax = taxDetails.reduce((acc, tax) => acc + tax.cgst + tax.sgst, 0);
        const totalAmount = subTotal + totalTax;
        return { subTotal, taxDetails, totalAmount };
    }, [currentDraft.items, applyGst]);

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    let finalPatient = selectedPatient;

    if (currentDraft.patientTab === 'new') {
        if (!currentDraft.newPatientName.trim() || !currentDraft.newPatientMobile.trim()) {
            addToast('Please enter new patient name and mobile number.', 'warning');
            setIsGenerating(false);
            return;
        }
        const createdPatient = await addPatient({ 
            name: currentDraft.newPatientName, 
            mobile: currentDraft.newPatientMobile,
            vaccinations: [],
            skippedVaccinations: []
        });
        if (createdPatient) {
            finalPatient = createdPatient;
        }
    }

    if (!finalPatient) {
        addToast('Please select or add a patient.', 'warning');
        setIsGenerating(false);
        return;
    }

    if (currentDraft.items.length === 0) {
        addToast('Please add at least one item to the bill.', 'warning');
        setIsGenerating(false);
        return;
    }

    const newBill: Bill = {
        billNumber: `INV-${Date.now()}`, date: new Date().toISOString(), patient: finalPatient,
        items: currentDraft.items, subTotal: billSummary.subTotal, taxDetails: billSummary.taxDetails,
        totalAmount: billSummary.totalAmount, paymentMode: currentDraft.paymentMode,
        clinicId: pharmacyInfo.clinicId,
        appointmentId: currentDraft.appointmentId,
    };

    const processedBill = await processSale(newBill);
    setIsGenerating(false);

    if (processedBill) { 
        setCurrentBill(processedBill); 
        setIsInvoiceVisible(true); 
    }
  };

  const isGenerateDisabled = (currentDraft.patientTab === 'existing' && !currentDraft.patientId) || (currentDraft.patientTab === 'new' && (!currentDraft.newPatientName || !currentDraft.newPatientMobile)) || currentDraft.items.length === 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-secondary dark:text-slate-100">Create New Bill</h2>
        <button onClick={resetBill} className="bg-slate-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-slate-600 transition-colors">
            Clear Bill
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-brand-secondary dark:text-slate-100">Bill Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border dark:border-slate-700">
                <div className="md:col-span-8 relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Search Medicine</label>
                    <input type="text" value={medicineSearch} onChange={(e) => { setMedicineSearch(e.target.value); setSelectedMedicine(null); }} className={inputClass} placeholder="Type to search..." />
                    {searchedMedicines.length > 0 && !selectedMedicine && (
                        <div className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 mt-1 rounded-md shadow-lg">
                            {searchedMedicines.map(med => (
                                <div key={med.id} onClick={() => handleSelectMedicine(med)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-900 dark:text-slate-200 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{med.name} ({med.strength})</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{med.composition}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${med.availableStock > 0 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
                                        Stock: {med.availableStock}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity (Units)</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} placeholder="e.g., 4" min="1"/>
                </div>
                <button onClick={handleAddBillItem} className="md:col-span-1 flex items-center justify-center bg-brand-primary text-white h-10 rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors"> <PlusIcon className="w-5 h-5"/> </button>
            </div>
            <div className="mb-4 flex items-center flex-wrap gap-2">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Add other charges:</h4>
                <button type="button" onClick={() => setFeeModalState({ open: true, type: 'Consultation Fee' })} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-md hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900">Consultation Fee</button>
                <button type="button" onClick={() => setFeeModalState({ open: true, type: 'Service' })} className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:hover:bg-indigo-900">Service</button>
                <button type="button" onClick={() => setFeeModalState({ open: true, type: 'Product' })} className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-md hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:hover:bg-purple-900">Other Product</button>
            </div>
            <div className="overflow-x-auto hidden sm:block"><table className="min-w-full"><thead className="bg-slate-50 dark:bg-slate-900/50"><tr><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Item</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Details</th><th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Qty</th><th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Rate</th><th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">GST</th><th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Amount</th><th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Action</th></tr></thead><tbody>{currentDraft.items.length === 0 ? (<tr><td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">No items added to the bill yet.</td></tr>) : (currentDraft.items.map((item, index) => (<tr key={index} className="border-b border-slate-200 dark:border-slate-700 even:bg-slate-50 dark:even:bg-slate-800/50"><td className="px-4 py-3"><p className="font-semibold text-slate-900 dark:text-slate-200">{item.itemName}</p></td><td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{item.hsnCode && `HSN: ${item.hsnCode}`}<br/>{item.batchNumber && `Batch: ${item.batchNumber}`}</td><td className="px-4 py-3 text-center">{item.quantity}</td><td className="px-4 py-3 text-right">₹{item.rate.toFixed(2)}</td><td className="px-4 py-3 text-center">{item.gstRate > 0 ? `${item.gstRate}%` : '—'}</td><td className="px-4 py-3 text-right font-semibold">₹{item.amount.toFixed(2)}</td><td className="px-4 py-3 text-center">{item.isRemovable && <button onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><DeleteIcon className="w-5 h-5"/></button>}</td></tr>)))}</tbody></table></div>
            <div className="sm:hidden space-y-3">{currentDraft.items.length === 0 ? (<div className="text-center py-8 text-slate-500 dark:text-slate-400">No items added yet.</div>) : (currentDraft.items.map((item, index) => (<div key={index} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border-l-4 border-brand-primary"><div className="flex justify-between items-start"><p className="font-semibold text-slate-900 dark:text-slate-200">{item.itemName}</p>{item.isRemovable && <button onClick={() => handleRemoveItem(index)} className="text-red-600 dark:text-red-400"><DeleteIcon className="w-5 h-5"/></button>}</div><div className="text-sm text-slate-700 dark:text-slate-300 mt-2 flex justify-between items-end"><div><p>{item.quantity} x ₹{item.rate.toFixed(2)} {item.gstRate > 0 ? `(+${item.gstRate}%)` : ''}</p>{item.hsnCode && <p className="text-xs text-slate-500">HSN: {item.hsnCode}</p>}</div><p className="font-bold text-lg text-slate-900 dark:text-slate-100">₹{item.amount.toFixed(2)}</p></div></div>)))}</div>
        </div>
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-brand-secondary dark:text-slate-100">Patient Details</h3>
                <div className="flex rounded-md shadow-sm"><button type="button" onClick={() => updateDraft({ patientTab: 'existing' })} className={`px-4 py-2 text-sm font-medium rounded-l-md flex-1 ${currentDraft.patientTab === 'existing' ? 'bg-brand-primary text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>Existing Patient</button><button type="button" onClick={() => updateDraft({ patientTab: 'new' })} className={`px-4 py-2 text-sm font-medium rounded-r-md flex-1 ${currentDraft.patientTab === 'new' ? 'bg-brand-primary text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>New Patient</button></div>
                <div className="mt-4">{currentDraft.patientTab === 'existing' ? (<div className="relative"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Search Patient</label><input type="text" value={patientSearch} onChange={(e) => { setPatientSearch(e.target.value); updateDraft({ patientId: null }); setIsPatientSearchVisible(true); }} onFocus={() => setIsPatientSearchVisible(true)} onBlur={() => setTimeout(() => setIsPatientSearchVisible(false), 200)} className={inputClass} placeholder="Type to search..."/>{isPatientSearchVisible && searchedPatients.length > 0 && (<div className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 mt-1 rounded-md shadow-lg">{searchedPatients.map(p => (<div key={p.id} onMouseDown={() => { updateDraft({ patientId: p.id }); setIsPatientSearchVisible(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-slate-900 dark:text-slate-200">{p.name} - {p.mobile}</div>))}</div>)}</div>) : (<div className="space-y-4"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Patient Name</label><input type="text" value={currentDraft.newPatientName} onChange={(e) => updateDraft({ newPatientName: e.target.value })} className={inputClass}/><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label><input type="text" value={currentDraft.newPatientMobile} onChange={(e) => updateDraft({ newPatientMobile: e.target.value })} className={inputClass}/></div>)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-brand-secondary dark:text-slate-100">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300"><p>Subtotal</p><p>₹{billSummary.subTotal.toFixed(2)}</p></div>
                    {billSummary.taxDetails.map((tax, i) => (<div key={i}><div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs"><p>CGST @{(tax.rate / 2).toFixed(2)}%</p><p>₹{tax.cgst.toFixed(2)}</p></div><div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs"><p>SGST @{(tax.rate / 2).toFixed(2)}%</p><p>₹{tax.sgst.toFixed(2)}</p></div></div>))}
                    <div className="flex justify-between items-center text-xl font-bold text-brand-secondary dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-600"><p>Total</p><p className="text-green-600 dark:text-green-400">₹{billSummary.totalAmount.toFixed(2)}</p></div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Mode</label>
                    <select value={currentDraft.paymentMode} onChange={(e) => updateDraft({ paymentMode: e.target.value as any })} className={selectClass}>
                        <option>Cash</option><option>Card</option><option>UPI</option>
                    </select>
                </div>
                 {isGstEnabledGlobally && <div className="mt-4 flex justify-between items-center"><label htmlFor="gst-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">Apply GST</label><div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in"><input type="checkbox" name="gst-toggle" id="gst-toggle" checked={applyGst} onChange={() => setApplyGst(!applyGst)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/><label htmlFor="gst-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer"></label></div></div>}
                <button onClick={handleGenerateInvoice} disabled={isGenerateDisabled || isGenerating} className="mt-6 w-full bg-success text-white py-3 rounded-lg shadow-sm hover:bg-green-700 transition-colors font-bold text-lg disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex justify-center items-center">
                    {isGenerating ? <SpinnerIcon className="animate-spin w-6 h-6"/> : `Generate Invoice (₹${billSummary.totalAmount.toFixed(2)})`}
                </button>
            </div>
        </div>
      </div>
       {isInvoiceVisible && currentBill && <Invoice bill={currentBill} pharmacyInfo={pharmacyInfo} onClose={() => { resetBill(); }}/>}
       {feeModalState.open && (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"><div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm"><form onSubmit={handleAddFeeItem}><div className="p-6"><h4 className="font-semibold text-lg text-brand-secondary dark:text-slate-200 mb-4">{feeModalState.type === 'Product' ? 'Add Product' : `Add ${feeModalState.type}`}</h4><div className="space-y-4">{feeModalState.type === 'Consultation Fee' ? <div><label className="block text-sm font-medium">Doctor</label><select value={selectedFeeDoctorId} onChange={e => setSelectedFeeDoctorId(e.target.value)} className={inputClass}><option value="" disabled>Select Doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div> : <div><label className="block text-sm font-medium">{feeModalState.type === 'Product' ? 'Product Name' : 'Service Name'}</label><input type="text" value={feeName} onChange={e => setFeeName(e.target.value)} required className={inputClass}/></div>} {feeModalState.type === 'Product' && <><div><label className="block text-sm font-medium">Quantity</label><input type="number" value={feeQty} onChange={e => setFeeQty(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} required className={inputClass}/></div><div><label className="block text-sm font-medium">GST (%)</label><input type="number" value={feeGst} onChange={e => setFeeGst(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass}/></div></>} <div><label className="block text-sm font-medium">{feeModalState.type === 'Product' ? 'MRP (per item)' : 'Amount'}</label><input type="number" step="0.01" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} required className={inputClass} readOnly={feeModalState.type === 'Consultation Fee'}/></div></div></div><div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2"><button type="button" onClick={closeAndResetFeeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button><button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover">Add</button></div></form></div></div>)}
       <style>{`.toggle-checkbox:checked { right: 0; border-color: #2563eb; } .toggle-checkbox:checked + .toggle-label { background-color: #2563eb; }`}</style>
    </div>
  );
};

export default Billing;
