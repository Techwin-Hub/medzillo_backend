import React, { useState, useMemo, useEffect } from 'react';
import { Supplier } from '../types';
import { InitialLoadState } from '../types';
import { SupplierForm } from './SupplierForm';
import { PlusIcon, EditIcon, DeleteIcon, SupplierIcon, WhatsAppIcon, ExclamationCircleIcon, XCircleIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useToast';
import { Pagination } from './Pagination';
import { useClinicData } from '../contexts/ClinicDataContext';
import { ConfirmModal } from './ConfirmModal';

interface SuppliersProps {
  loadState: InitialLoadState;
}

const SkeletonRow: React.FC = () => (
    <tr className="animate-pulse even:bg-slate-50 dark:even:bg-slate-800/50">
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/5"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/5"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="flex items-center space-x-3"><div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div><div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div><div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div></td>
    </tr>
);

const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-2 border-t dark:border-slate-700 pt-3 mt-3">
            <div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-1"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
            <div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-10 mb-1"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28"></div>
            </div>
        </div>
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
    </div>
);

const Suppliers: React.FC<SuppliersProps> = ({ loadState }) => {
  const { inventory } = useClinicData();
  const { medicines, suppliers, addSupplier, updateSupplier, deleteSupplier } = inventory;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupId, setDeletingSupId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const suppliersNeedingAlert = useMemo(() => {
    const supplierIds = new Set<string>();
    const relevantMedicines = medicines.filter(med => med.totalStockInUnits < med.minStockLevel);

    relevantMedicines.forEach(med => {
        med.batches.forEach(batch => {
            supplierIds.add(batch.supplierId);
        });
    });
    return supplierIds;
  }, [medicines]);

  const filteredSuppliers = useMemo(() => {
    if (!debouncedSearchTerm) return suppliers;
    return suppliers.filter(sup =>
      (sup.name?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
      (sup.contactPerson?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
      (sup.gstin?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
    );
  }, [suppliers, debouncedSearchTerm]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSuppliers.length, itemsPerPage]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (supId: string) => {
    setDeletingSupId(supId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingSupId) {
        setIsDeleting(true);
        await deleteSupplier(deletingSupId);
        setIsDeleting(false);
    }
    setIsConfirmModalOpen(false);
    setDeletingSupId(null);
  };

  const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id' | 'clinicId'>) => {
    if (editingSupplier) {
        return await updateSupplier({ ...editingSupplier, ...supplierData });
    } else {
        return await addSupplier(supplierData);
    }
  };


  const handleSendStockAlert = (supplier: Supplier) => {
    const relevantMedicines = medicines.filter(med => {
        const isLowOrOutOfStock = med.totalStockInUnits < med.minStockLevel;
        if (!isLowOrOutOfStock) return false;

        const isSuppliedBy = med.batches.some(batch => batch.supplierId === supplier.id);
        return isSuppliedBy;
    });

    if (relevantMedicines.length === 0) {
        addToast(`No low-stock or out-of-stock items found for ${supplier.name}.`, 'info');
        return;
    }

    let message = `Hi ${supplier.name},\n\nPlease note we require the following items:\n\n`;
    relevantMedicines.forEach(med => {
        const status = med.totalStockInUnits === 0 ? "Out of Stock" : `Low Stock (${med.totalStockInUnits} units left)`;
        message += `- ${med.name} (${med.strength}): ${status}\n`;
    });
    message += "\nPlease let us know the availability. Thank you!";

    let phoneNumber;
    if (supplier.mobile.startsWith('+')) {
        phoneNumber = supplier.mobile.replace(/\D/g, '');
    } else {
        let cleanedNumber = supplier.mobile.replace(/\D/g, '');
        if (cleanedNumber.startsWith('0')) {
            cleanedNumber = cleanedNumber.substring(1);
        }
        phoneNumber = `91${cleanedNumber}`;
    }
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
};

const renderContent = () => {
  if (loadState === 'loading') {
    return (
        <>
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full">
                    <tbody>
                    {Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                </table>
            </div>
            <div className="md:hidden p-4 space-y-4">
                {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        </>
    );
  }

  if (loadState === 'done') {
      if (filteredSuppliers.length > 0) {
        return (
            <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full leading-normal">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Supplier Name</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contact Person</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Mobile</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">GSTIN</th>
                        <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedSuppliers.map(sup => {
                        const needsAlert = suppliersNeedingAlert.has(sup.id);
                        return (
                        <tr key={sup.id} className={`transition-colors duration-300 ${needsAlert ? 'bg-yellow-50 dark:bg-yellow-900/50' : 'even:bg-slate-50 dark:even:bg-slate-800/50'} hover:bg-slate-100 dark:hover:bg-slate-700/50`}>
                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <div className="flex items-center gap-2">
                                {needsAlert && <span title="This supplier has low stock items."><ExclamationCircleIcon className="w-5 h-5 text-yellow-500 shrink-0" /></span>}
                                <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap font-semibold">{sup.name}</p>
                            </div>
                        </td>
                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <p className="text-slate-800 dark:text-slate-300 whitespace-no-wrap">{sup.contactPerson}</p>
                        </td>
                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <p className="text-slate-800 dark:text-slate-300 whitespace-no-wrap">{sup.mobile}</p>
                        </td>
                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <p className="text-slate-800 dark:text-slate-300 whitespace-no-wrap">{sup.gstin}</p>
                        </td>
                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                            <div className="flex items-center space-x-3">
                            <button onClick={() => handleSendStockAlert(sup)} className={`p-1.5 rounded-full text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors ${needsAlert ? 'animate-pulse bg-green-100 dark:bg-green-900/50' : 'hover:bg-green-100 dark:hover:bg-green-900/50'}`} title={needsAlert ? "Send reminder for low stock items" : "Send Stock Alert"}>
                                <WhatsAppIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => handleEdit(sup)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit Supplier">
                                <EditIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => handleDeleteClick(sup.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete Supplier">
                                <DeleteIcon className="w-5 h-5"/>
                            </button>
                            </div>
                        </td>
                        </tr>
                    )})}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
                {paginatedSuppliers.map(sup => {
                    const needsAlert = suppliersNeedingAlert.has(sup.id);
                    return (
                    <div key={sup.id} className={`rounded-lg p-4 border shadow-sm space-y-3 transition-colors duration-300 ${needsAlert ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-400 dark:border-yellow-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex items-start gap-2">
                           {needsAlert && <span title="This supplier has low stock items."><ExclamationCircleIcon className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" /></span>}
                           <div className="flex-grow">
                                <p className="font-bold text-brand-primary text-lg">{sup.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{sup.contactPerson}</p>
                           </div>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2 border-t dark:border-slate-700 pt-3 mt-3">
                             <div>
                                <p className="font-medium text-slate-500 dark:text-slate-400 text-xs">Mobile</p>
                                <p>{sup.mobile}</p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-500 dark:text-slate-400 text-xs">GSTIN</p>
                                <p>{sup.gstin}</p>
                            </div>
                        </div>
                         <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                            <button onClick={() => handleSendStockAlert(sup)} className={`p-1.5 rounded-full text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors ${needsAlert ? 'animate-pulse bg-green-100 dark:bg-green-900/50' : 'hover:bg-green-100 dark:hover:bg-green-900/50'}`} title={needsAlert ? "Send reminder for low stock items" : "Send Stock Alert"}>
                                <WhatsAppIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => handleEdit(sup)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit Supplier">
                               <EditIcon className="w-5 h-5"/> 
                            </button>
                            <button onClick={() => handleDeleteClick(sup.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete Supplier">
                                <DeleteIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                )})}
            </div>
            </>
        );
      } else {
        return (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <SupplierIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600"/>
              <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">No Suppliers Found</h3>
              <p className="mt-2 text-sm">Get started by adding your first supplier.</p>
            </div>
          );
      }
  }

  return <div className="min-h-[400px]"></div>;
};

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 flex items-center gap-3">
          <SupplierIcon className="w-8 h-8 text-brand-primary"/>
          Suppliers
        </h2>
        <button onClick={handleAddNew} className="flex items-center justify-center bg-brand-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors font-semibold">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Supplier
        </button>
      </div>
      
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <input
          type="text"
          placeholder="Search by name, contact, or GSTIN..."
          className="w-full p-3 pl-10 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
            <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Clear search"
            >
                <XCircleIcon className="w-5 h-5" />
            </button>
        )}
      </div>

       <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {renderContent()}
            <Pagination
                currentPage={currentPage}
                totalItems={filteredSuppliers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                }}
            />
       </div>
       {isModalOpen && (
        <SupplierForm 
          supplier={editingSupplier}
          onClose={() => setIsModalOpen(false)}
          onSave={async (supplierData) => {
              const success = await handleSaveSupplier(supplierData);
              if (success) {
                  setIsModalOpen(false);
              }
              return success;
          }}
        />
       )}
        <ConfirmModal
            isOpen={isConfirmModalOpen}
            isLoading={isDeleting}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmDelete}
            title="Delete Supplier"
            message="Are you sure you want to delete this supplier? This action cannot be undone."
        />
    </div>
  );
};

export default Suppliers;
