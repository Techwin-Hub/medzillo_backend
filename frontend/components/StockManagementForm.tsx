import React, { useState } from 'react';
import { Medicine, Batch, Supplier } from '../types';
import { CloseIcon, PlusIcon, DeleteIcon } from './icons';
import { useToast } from '../hooks/useToast';

interface StockManagementFormProps {
    medicine: Medicine;
    suppliers: Supplier[];
    onClose: () => void;
    onAddBatch: (batch: Batch) => void;
    onDeleteBatch: (batchNumber: string) => void;
}

export const StockManagementForm: React.FC<StockManagementFormProps> = ({ medicine, suppliers, onClose, onAddBatch, onDeleteBatch }) => {
    const getTodayString = () => new Date().toISOString().split('T')[0];

    const [batchData, setBatchData] = useState(() => ({
        batchNumber: '',
        purchaseDate: getTodayString(),
        expiryDate: '',
        packQuantity: '',
        purchaseRate: '',
        sellingRate: '',
        supplierId: suppliers[0]?.id || '',
        packSize: '',
    }));
    const [deletingBatchNumber, setDeletingBatchNumber] = useState<string | null>(null);
    const { addToast } = useToast();
    
    const inputClass = "mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:border-slate-600";
    const isFractional = medicine.form === 'Tablet' || medicine.form === 'Capsule';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBatchData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const selectedSupplier = suppliers.find(s => s.id === batchData.supplierId);
        const packQuantityNum = Number(batchData.packQuantity);
        const purchaseRateNum = Number(batchData.purchaseRate);
        const sellingRateNum = Number(batchData.sellingRate);
        const packSizeNum = Number(batchData.packSize);

        if(!batchData.batchNumber || !batchData.expiryDate || !selectedSupplier || isNaN(packQuantityNum) || packQuantityNum <= 0 || isNaN(packSizeNum) || packSizeNum <= 0) {
            addToast("Please fill all batch details correctly (Batch No, Supplier, Expiry, Packs > 0, Units/Pack > 0).", 'warning');
            return;
        }
        if (medicine.batches.some(b => b.batchNumber === batchData.batchNumber)) {
            addToast("This batch number already exists for this medicine.", 'error');
            return;
        }
        
        const newBatch: Batch = {
            batchNumber: batchData.batchNumber,
            purchaseDate: batchData.purchaseDate,
            expiryDate: batchData.expiryDate,
            packQuantity: packQuantityNum,
            looseQuantity: 0,
            purchaseRate: purchaseRateNum,
            sellingRate: sellingRateNum,
            supplierId: batchData.supplierId,
            supplierName: selectedSupplier.name,
            packSize: packSizeNum,
        };
        
        onAddBatch(newBatch);
        addToast(`Batch ${newBatch.batchNumber} added successfully.`, 'success');
        setBatchData({ batchNumber: '', purchaseDate: getTodayString(), expiryDate: '', packQuantity: '', purchaseRate: '', sellingRate: '', supplierId: suppliers[0]?.id || '', packSize: '' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">
                        Manage Stock for <span className="text-brand-primary">{medicine.name}</span>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-4">
                            <h4 className="text-lg font-semibold text-brand-secondary dark:text-slate-100">Add New Stock / Batch</h4>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Batch Number</label>
                                    <input type="text" name="batchNumber" value={batchData.batchNumber} onChange={handleChange} required className={inputClass}/>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Supplier</label>
                                    <select name="supplierId" value={batchData.supplierId} onChange={handleChange} required className={inputClass}>
                                        <option value="" disabled>Select a supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Date</label>
                                    <input type="date" name="purchaseDate" value={batchData.purchaseDate} onChange={handleChange} required className={inputClass}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry Date</label>
                                    <input type="date" name="expiryDate" value={batchData.expiryDate} onChange={handleChange} min={getTodayString()} required className={inputClass}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Number of Packs</label>
                                    <input type="number" name="packQuantity" value={batchData.packQuantity} onChange={handleChange} min="1" placeholder="e.g., 10" required className={inputClass}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Units per Pack</label>
                                    <input type="number" name="packSize" value={batchData.packSize} onChange={handleChange} min="1" placeholder="e.g., 10" required className={inputClass} disabled={!isFractional} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Rate / Pack (₹)</label>
                                    <input type="number" step="0.01" name="purchaseRate" value={batchData.purchaseRate} onChange={handleChange} placeholder="e.g., 85.50" required className={inputClass}/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">MRP / Pack (₹)</label>
                                    <input type="number" step="0.01" name="sellingRate" value={batchData.sellingRate} onChange={handleChange} placeholder="e.g., 120.00" required className={inputClass}/>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="flex items-center justify-center bg-brand-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors font-semibold">
                                   <PlusIcon className="w-5 h-5 mr-2" /> Add Batch
                                </button>
                            </div>
                        </form>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-brand-secondary dark:text-slate-100">Existing Batches (Total Stock: {medicine.totalStockInUnits} units)</h4>
                        <div className="border rounded-lg dark:border-slate-700" style={{maxHeight: '300px', overflow: 'auto'}}>
                             {medicine.batches.length > 0 ? (
                                <>
                                    {/* Desktop Table */}
                                    <div className="overflow-x-auto hidden md:block">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                                <tr>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">Batch No.</th>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">Supplier</th>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">Expiry Date</th>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">MRP</th>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">Packs</th>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">Units/Pack</th>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">Total Units</th>
                                                    <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {medicine.batches.map((batch) => (
                                                    <tr key={batch.batchNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="p-3 text-slate-900 dark:text-slate-200 whitespace-nowrap">{batch.batchNumber}</td>
                                                        <td className="p-3 text-slate-900 dark:text-slate-200 whitespace-nowrap">{batch.supplierName}</td>
                                                        <td className="p-3 text-slate-900 dark:text-slate-200 whitespace-nowrap">{new Date(batch.expiryDate).toLocaleDateString('en-GB')}</td>
                                                        <td className="p-3 text-slate-900 dark:text-slate-200 whitespace-nowrap">₹{batch.sellingRate.toFixed(2)}</td>
                                                        <td className="p-3 text-slate-900 dark:text-slate-200 whitespace-nowrap">{batch.packQuantity}</td>
                                                        <td className="p-3 text-slate-900 dark:text-slate-200 whitespace-nowrap">{batch.packSize}</td>
                                                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                            {(batch.packQuantity * batch.packSize) + batch.looseQuantity}
                                                        </td>
                                                        <td className="p-3 text-slate-900 dark:text-slate-200 whitespace-nowrap">
                                                            {deletingBatchNumber === batch.batchNumber ? (
                                                                <div className="flex items-center space-x-2">
                                                                    <button onClick={() => { onDeleteBatch(batch.batchNumber); setDeletingBatchNumber(null); }} className="text-xs font-semibold text-danger hover:underline">Confirm</button>
                                                                    <button onClick={() => setDeletingBatchNumber(null)} className="text-xs text-slate-600 dark:text-slate-400 hover:underline">Cancel</button>
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => setDeletingBatchNumber(batch.batchNumber)}
                                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" 
                                                                    title={`Delete batch ${batch.batchNumber}`}>
                                                                    <DeleteIcon className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Mobile Cards */}
                                    <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                                        {medicine.batches.map((batch) => (
                                            <div key={batch.batchNumber} className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">Batch: {batch.batchNumber}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{batch.supplierName}</p>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Expires: {new Date(batch.expiryDate).toLocaleDateString('en-GB')}
                                                    </p>
                                                </div>
                                                <div className="mt-2 pt-2 border-t dark:border-slate-700 grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-slate-500 dark:text-slate-400">Stock</p>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200">{(batch.packQuantity * batch.packSize) + batch.looseQuantity} units</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 dark:text-slate-400">Packs</p>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200">{batch.packQuantity} x {batch.packSize}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 dark:text-slate-400">MRP/Pack</p>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200">₹{batch.sellingRate.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-2">
                                                    {deletingBatchNumber === batch.batchNumber ? (
                                                        <div className="flex items-center space-x-2">
                                                            <button onClick={() => { onDeleteBatch(batch.batchNumber); setDeletingBatchNumber(null); }} className="text-xs font-semibold text-danger hover:underline">Confirm Delete</button>
                                                            <button onClick={() => setDeletingBatchNumber(null)} className="text-xs text-slate-600 dark:text-slate-400 hover:underline">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setDeletingBatchNumber(batch.batchNumber)}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" 
                                                            title={`Delete batch ${batch.batchNumber}`}>
                                                            <DeleteIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="p-4 text-center text-slate-500 dark:text-slate-400">No batch information available.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 font-semibold">Done</button>
                </div>
            </div>
        </div>
    );
};