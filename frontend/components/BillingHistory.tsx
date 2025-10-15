import React, { useState, useMemo, useEffect } from 'react';
import { Bill } from '../types';
import { InitialLoadState } from '../types';
import { Invoice } from './Invoice';
import { useDebounce } from '../hooks/useDebounce';
import { DocumentPlusIcon, XCircleIcon } from './icons';
import { Pagination } from './Pagination';
import { useClinicData } from '../contexts/ClinicDataContext';


const EmptyState: React.FC<{ message: string; subtext: string }> = ({ message, subtext }) => (
    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
      <DocumentPlusIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600"/>
      <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">{message}</h3>
      <p className="mt-2 text-sm">{subtext}</p>
    </div>
);

const SkeletonRow: React.FC = () => (
    <tr className="animate-pulse even:bg-slate-50 dark:even:bg-slate-800/50">
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5 mb-2"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/5"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div></td>
        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
    </tr>
);

const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-slate-800/95 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 animate-pulse relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-slate-200 dark:bg-slate-700"></div>
        <div className="ml-3">
            <div className="flex justify-between items-start">
                <div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                </div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md w-16"></div>
            </div>
            <div className="border-t dark:border-slate-700 pt-2 mt-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/5 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
            <div className="flex justify-between items-center border-t dark:border-slate-700 pt-2 mt-3">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
        </div>
    </div>
);

interface BillingHistoryProps {
    loadState: InitialLoadState;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({ loadState }) => {
    const { billing, admin } = useClinicData();
    const { bills } = billing;
    const { pharmacyInfo } = admin;
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredBills = useMemo(() => {
        const filtered = debouncedSearchTerm
            ? bills.filter(bill =>
                bill.billNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                bill.patient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (bill.patient.mobile && bill.patient.mobile.includes(debouncedSearchTerm))
            )
            : [...bills]; // Make a shallow copy to sort

        // Sort by date, latest first
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bills, debouncedSearchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredBills.length, itemsPerPage]);

    const paginatedBills = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredBills.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredBills, currentPage, itemsPerPage]);

    if (!pharmacyInfo) return null;

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
            if (filteredBills.length > 0) {
                return (
                    <>
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Payment Mode</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBills.map(bill => (
                                    <tr key={bill.billNumber} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap font-semibold">{bill.billNumber}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{new Date(bill.date).toLocaleDateString('en-GB')}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{bill.patient.name}</p>
                                            <p className="text-slate-600 dark:text-slate-400 whitespace-no-wrap text-xs">{bill.patient.mobile}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap font-bold">₹{bill.totalAmount.toFixed(2)}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{bill.paymentMode}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <button 
                                                onClick={() => setSelectedBill(bill)}
                                                className="text-brand-primary hover:text-brand-primary-hover font-semibold"
                                            >
                                                View Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                     <div className="md:hidden p-4 space-y-4">
                        {paginatedBills.map(bill => (
                            <div key={bill.billNumber} className="bg-white dark:bg-slate-800/95 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden border-l-4 border-brand-primary">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{bill.billNumber}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(bill.date).toLocaleDateString('en-GB')}</p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedBill(bill)}
                                        className="bg-brand-primary text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-primary-hover text-xs font-semibold"
                                    >
                                        View
                                    </button>
                                </div>
                                 <div className="text-sm text-slate-700 dark:text-slate-300 border-t dark:border-slate-700 pt-2 mt-3">
                                    <p className="font-semibold text-brand-secondary dark:text-slate-200">{bill.patient.name}</p>
                                    <p className="text-xs">{bill.patient.mobile}</p>
                                </div>
                                <div className="flex justify-between items-center border-t dark:border-slate-700 pt-2 mt-2">
                                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">₹{bill.totalAmount.toFixed(2)}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{bill.paymentMode}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    </>
                );
            } else {
                return (
                    <EmptyState 
                        message={searchTerm ? "No Bills Match Your Search" : "No Billing History"}
                        subtext={searchTerm ? "Try searching for a different invoice number or patient." : "Once you complete a sale, it will appear here."}
                    />
                );
            }
        }

        return <div className="min-h-[400px]"></div>;
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100">Billing History</h2>
            </div>
            
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Search by Invoice #, Patient Name, or Mobile..."
                    className="w-full p-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
                    totalItems={filteredBills.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                    }}
                />
            </div>
            {selectedBill && (
                <Invoice bill={selectedBill} pharmacyInfo={pharmacyInfo} onClose={() => setSelectedBill(null)} />
            )}
        </div>
    );
};

export default BillingHistory;
