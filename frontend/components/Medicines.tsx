import React, { useState, useMemo, useEffect } from 'react';
import { Medicine, Batch } from '../types';
import { InitialLoadState } from '../types';
import { MedicineForm } from './MedicineForm';
import { StockManagementForm } from './StockManagementForm';
import { PlusIcon, EditIcon, DeleteIcon, StockIcon, SortAscIcon, SortDescIcon, ArchiveBoxIcon, XCircleIcon, ArrowUpTrayIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { useClinicData } from '../contexts/ClinicDataContext';
import { StockImport } from './StockImport';

type SortKey = keyof Medicine | 'status';

interface MedicinesProps {
  loadState: InitialLoadState;
}

const EmptyState: React.FC<{ message: string; subtext: string }> = ({ message, subtext }) => (
    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
      <ArchiveBoxIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600"/>
      <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">{message}</h3>
      <p className="mt-2 text-sm">{subtext}</p>
    </div>
);

const SkeletonRow: React.FC = () => (
    <tr className="animate-pulse even:bg-slate-50 dark:even:bg-slate-800/50">
        <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div></td>
        <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
        <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
        <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div></td>
        <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700"><div className="flex items-center space-x-3"><div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div><div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div><div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div></td>
    </tr>
);

const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 animate-pulse relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-slate-200 dark:bg-slate-700"></div>
        <div className="ml-3">
            <div className="flex justify-between items-start">
                <div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t dark:border-slate-700 pt-2 mt-3">
                <div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-1"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md w-32"></div>
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
            </div>
        </div>
    </div>
);

const FilterButton: React.FC<{ label: string, value: string, currentFilter: string, setFilter: (value: string) => void }> = ({ label, value, currentFilter, setFilter }) => (
    <button
        onClick={() => setFilter(value)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentFilter === value 
                ? 'bg-brand-primary text-white shadow-sm' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
    >
        {label}
    </button>
);


const Medicines: React.FC<MedicinesProps> = ({ loadState }) => {
  const { 
    inventory: { 
      medicines, 
      suppliers, 
      addMedicine, 
      updateMedicine, 
      deleteMedicine, 
      addBatchToMedicine, 
      deleteBatchFromMedicine
    },
    admin: { hsnCodes: hsnMaster }
  } = useClinicData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  const [deletingMedId, setDeletingMedId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [stockFilter, setStockFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const selectedMedicine = useMemo(() => {
    if (!selectedMedicineId) return null;
    return medicines.find(m => m.id === selectedMedicineId) || null;
  }, [selectedMedicineId, medicines]);


  const getStockStatus = (med: Medicine): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    if (med.totalStockInUnits <= 0) return 'Out of Stock';
    if (med.totalStockInUnits < med.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };
  
  const formatStock = (med: Medicine): string => {
    return `${med.totalStockInUnits} ${med.unitType}(s)`;
  };


  const sortedAndFilteredMedicines = useMemo(() => {
    let filtered = [...medicines];

    if (stockFilter !== 'all') {
      filtered = filtered.filter(med => {
        const status = getStockStatus(med);
        if (stockFilter === 'in-stock') return status === 'In Stock';
        if (stockFilter === 'low-stock') return status === 'Low Stock';
        if (stockFilter === 'out-of-stock') return status === 'Out of Stock';
        return true;
      });
    }
    
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(med => med.batches.some(b => b.supplierId === supplierFilter));
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter(med =>
        (med.name?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
        (med.composition?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
        (med.manufacturer?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'status') {
            aValue = getStockStatus(a);
            bValue = getStockStatus(b);
        } else if (sortConfig.key === 'totalStockInUnits') {
            aValue = a.totalStockInUnits;
            bValue = b.totalStockInUnits;
        } else {
            aValue = a[sortConfig.key as keyof Medicine];
            bValue = b[sortConfig.key as keyof Medicine];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [medicines, debouncedSearchTerm, stockFilter, supplierFilter, sortConfig]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [sortedAndFilteredMedicines.length, itemsPerPage]);

  const paginatedMedicines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredMedicines.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredMedicines, currentPage, itemsPerPage]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAddNew = () => {
    setSelectedMedicineId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (med: Medicine) => {
    setSelectedMedicineId(med.id);
    setIsFormOpen(true);
  };
  
  const handleManageStock = (med: Medicine) => {
      setSelectedMedicineId(med.id);
      setIsStockModalOpen(true);
  }

  const handleSaveMedicine = async (medicineData: Omit<Medicine, 'id' | 'clinicId' | 'totalStockInUnits' | 'batches' | 'packSize'>) => {
    if (selectedMedicine) {
      const updatedMed: Medicine = {
        ...selectedMedicine,
        ...medicineData,
      };
      return await updateMedicine(updatedMed);
    } else {
      return await addMedicine(medicineData);
    }
  };
  
  const handleAddBatch = (batch: Batch) => {
      if (selectedMedicine) {
          addBatchToMedicine(selectedMedicine.id, batch);
      }
  };

  const handleDeleteBatch = (batchNumber: string) => {
    if (selectedMedicine) {
        deleteBatchFromMedicine(selectedMedicine.id, batchNumber);
    }
  };

   const handleDeleteClick = (medId: string) => {
        setDeletingMedId(medId);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingMedId) {
            setIsDeleting(true);
            await deleteMedicine(deletingMedId);
            setIsDeleting(false);
        }
        setIsConfirmModalOpen(false);
        setDeletingMedId(null);
    };

  const getStatusInfo = (status: string) => {
    switch (status) {
        case 'In Stock': return { color: 'border-green-500', tag: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
        case 'Low Stock': return { color: 'border-yellow-500', tag: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
        case 'Out of Stock': return { color: 'border-red-500', tag: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
        default: return { color: 'border-slate-300', tag: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' };
    }
  };
  
  const SortableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode }> = ({ sortKey, children }) => (
    <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
        <div className="flex items-center">
            {children}
            <span className="ml-2 w-4 h-4">
                {sortConfig?.key === sortKey && (
                    sortConfig.direction === 'ascending' ? <SortAscIcon className="w-4 h-4" /> : <SortDescIcon className="w-4 h-4" />
                )}
            </span>
        </div>
    </th>
  );
  
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
        if (sortedAndFilteredMedicines.length > 0) {
            return (
                <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full leading-normal">
                        <thead>
                        <tr>
                            <SortableHeader sortKey="name">Name</SortableHeader>
                            <SortableHeader sortKey="manufacturer">Manufacturer</SortableHeader>
                            <SortableHeader sortKey="totalStockInUnits">Stock</SortableHeader>
                            <SortableHeader sortKey="status">Status</SortableHeader>
                            <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedMedicines.map(med => {
                            const status = getStockStatus(med);
                            const { tag } = getStatusInfo(status);
                            return (
                            <tr key={med.id} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap font-semibold">{med.name}</p>
                                    <p className="text-slate-600 dark:text-slate-400 whitespace-no-wrap text-xs">{med.composition} {med.strength}</p>
                                </td>
                                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <p className="text-slate-900 dark:text-slate-200 whitespace-no-wrap">{med.manufacturer}</p>
                                </td>
                                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <p className="text-slate-900 dark:text-slate-200 whitespace-no-wrap font-semibold">{formatStock(med)}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Min: {med.minStockLevel} units</p>
                                </td>
                                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${tag}`}>
                                        {status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => handleManageStock(med)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" title="Manage Stock">
                                            <StockIcon className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => handleEdit(med)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit Medicine">
                                            <EditIcon className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => handleDeleteClick(med.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete Medicine">
                                            <DeleteIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                    {paginatedMedicines.map(med => {
                        const status = getStockStatus(med);
                        const { color, tag } = getStatusInfo(status);
                        return (
                        <div key={med.id} className={`rounded-lg p-4 border shadow-sm space-y-3 relative overflow-hidden border-l-4 ${color}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-brand-primary text-lg">{med.name}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{med.manufacturer}</p>
                                </div>
                                 <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${tag}`}>{status}</span>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2 border-t dark:border-slate-700 pt-3 mt-3">
                                <div>
                                    <p className="font-medium text-slate-500 dark:text-slate-400 text-xs">Stock</p>
                                    <p className="font-semibold">{formatStock(med)}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-500 dark:text-slate-400 text-xs">Min. Level</p>
                                    <p>{med.minStockLevel} units</p>
                                </div>
                            </div>
                             <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                                <button onClick={() => handleManageStock(med)} className="flex-1 flex items-center justify-center gap-2 text-sm bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-900">
                                    <StockIcon className="w-4 h-4"/> Manage Stock
                                </button>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => handleEdit(med)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit Medicine"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteClick(med.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete Medicine"><DeleteIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
                </>
            );
        } else {
            return (
                <EmptyState 
                    message={searchTerm ? "No Medicines Match Your Search" : "No Medicines in Inventory"}
                    subtext={searchTerm ? "Try searching for a different medicine or clear the filters." : "Get started by adding your first medicine to the inventory."}
                />
            );
        }
    }
    return <div className="min-h-[400px]"></div>;
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 flex items-center gap-3">
          <ArchiveBoxIcon className="w-8 h-8 text-brand-primary"/>
          Medicines
        </h2>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors font-semibold">
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                Import Stock
            </button>
            <button onClick={handleAddNew} className="flex items-center justify-center bg-brand-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors font-semibold">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add New Medicine
            </button>
        </div>
      </div>
      
      <div className="mb-4 space-y-4">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, composition, or manufacturer..."
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Stock Status:</span>
                <FilterButton label="All" value="all" currentFilter={stockFilter} setFilter={setStockFilter} />
                <FilterButton label="In Stock" value="in-stock" currentFilter={stockFilter} setFilter={setStockFilter} />
                <FilterButton label="Low Stock" value="low-stock" currentFilter={stockFilter} setFilter={setStockFilter} />
                <FilterButton label="Out of Stock" value="out-of-stock" currentFilter={stockFilter} setFilter={setStockFilter} />
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
                <label htmlFor="supplier-filter" className="text-sm font-semibold text-slate-600 dark:text-slate-400">Supplier:</label>
                <select id="supplier-filter" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 text-sm">
                    <option value="all">All Suppliers</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </div>
      </div>

       <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {renderContent()}
            <Pagination
                currentPage={currentPage}
                totalItems={sortedAndFilteredMedicines.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                }}
            />
       </div>
       {isFormOpen && (
        <MedicineForm 
          medicine={selectedMedicine}
          hsnMaster={hsnMaster}
          onClose={() => setIsFormOpen(false)}
          onSave={async (medicineData) => {
              const success = await handleSaveMedicine(medicineData);
              if (success) { setIsFormOpen(false); }
              return success;
          }}
        />
       )}
       {isStockModalOpen && selectedMedicine && (
        <StockManagementForm
          medicine={selectedMedicine}
          suppliers={suppliers}
          onClose={() => setIsStockModalOpen(false)}
          onAddBatch={handleAddBatch}
          onDeleteBatch={handleDeleteBatch}
        />
       )}
        {isImportModalOpen && (
            <StockImport onClose={() => setIsImportModalOpen(false)} />
        )}
        <ConfirmModal
            isOpen={isConfirmModalOpen}
            isLoading={isDeleting}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmDelete}
            title="Delete Medicine"
            message="Are you sure you want to delete this medicine? All stock and batch information will be lost. This action cannot be undone."
        />
    </div>
  );
};

export default Medicines;
