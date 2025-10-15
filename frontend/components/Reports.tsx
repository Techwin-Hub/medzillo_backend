import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bill, Medicine, PharmacyInfo, Supplier, BillItem } from '../types';
import { ArrowDownTrayIcon, HistoryIcon as ClockIcon, ExclamationCircleIcon, SpinnerIcon } from './icons';
import { InvoiceTemplate } from './InvoiceTemplate';
import { useToast } from '../hooks/useToast';
import { ConfirmModal } from './ConfirmModal';
import { useClinicData } from '../contexts/ClinicDataContext';

// Add type declarations for the window object to inform TypeScript about the CDN libraries
declare global {
    interface Window {
        html2canvas: any;
        jspdf: { jsPDF: new (options?: any) => any };
    }
}


const handleExportCSV = (data: any[], filename: string, addToast: (msg: string, type: 'warning') => void) => {
    if (data.length === 0) {
        addToast("No data available to export.", 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                if (/[",\n]/.test(cell)) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const getDaysUntilExpiry = (expiryDateStr: string) => {
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getExpiryColor = (days: number) => {
    if (days < 30) return 'text-danger font-bold';
    if (days < 90) return 'text-warning font-semibold';
    return 'text-slate-700 dark:text-slate-300';
};

const formatMonthForDisplay = (monthStr: string): string => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};


interface ReportsProps {}

const InventoryReportCard: React.FC<{ title: string; count: number; onExport: () => void; children: React.ReactNode; icon: React.ElementType; iconColor: string; }> = ({ title, count, onExport, children, icon: Icon, iconColor }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                <Icon className={`w-6 h-6 mr-3 ${iconColor}`} />
                {title} <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full ml-2">{count}</span>
            </h4>
            <button onClick={onExport} disabled={count === 0} className="flex items-center self-start sm:self-center text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export CSV</button>
        </div>
        {children}
    </div>
);


const Reports: React.FC<ReportsProps> = () => {
    const { billing, inventory, admin } = useClinicData();
    const { bills } = billing;
    const { medicines, suppliers } = inventory;
    const { pharmacyInfo } = admin;

    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const { addToast } = useToast();
    const inputClass = "mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary";

    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [isDownloading, setIsDownloading] = useState(false);
    const [billsToPrint, setBillsToPrint] = useState<Bill[]>([]);
    const printContainerRef = useRef<HTMLDivElement>(null);
    const [isConfirmDownloadOpen, setIsConfirmDownloadOpen] = useState(false);

    if (!pharmacyInfo) return null;

    const filteredBills = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        return bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= start && billDate <= end;
        });
    }, [bills, startDate, endDate]);

    const salesSummary = useMemo(() => {
        const totalSales = filteredBills.reduce((acc, bill) => acc + bill.totalAmount, 0);
        const totalItemsSold = filteredBills.reduce((acc, bill) => acc + (bill.items || []).reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);
        return { totalSales, totalBills: filteredBills.length, totalItemsSold };
    }, [filteredBills]);

    const lowStockItems = useMemo(() => medicines.filter(m => m.totalStockInUnits > 0 && m.totalStockInUnits < m.minStockLevel), [medicines]);
    const outOfStockItems = useMemo(() => medicines.filter(m => m.totalStockInUnits === 0), [medicines]);
    const nearExpiryItems = useMemo(() => {
        const results: { medicine: Medicine; batch: any; supplier?: Supplier }[] = [];
        medicines.forEach(med => {
            med.batches.forEach(batch => {
                const days = getDaysUntilExpiry(batch.expiryDate);
                if (days > 0 && days <= 90) {
                    const supplier = suppliers.find(s => s.id === batch.supplierId);
                    results.push({ medicine: med, batch, supplier });
                }
            });
        });
        return results.sort((a,b) => getDaysUntilExpiry(a.batch.expiryDate) - getDaysUntilExpiry(b.batch.expiryDate));
    }, [medicines, suppliers]);
    
    const monthlyBills = useMemo(() => {
        if (!selectedMonth) return [];
        return bills.filter(bill => bill.date.startsWith(selectedMonth));
    }, [bills, selectedMonth]);

    const loadPdfScripts = async () => {
        const scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        ];
        
        for (const src of scripts) {
            if (!document.querySelector(`script[src="${src}"]`)) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }
        }
    };

    useEffect(() => {
        if (billsToPrint.length > 0 && printContainerRef.current) {
            const generatePdf = async () => {
                await loadPdfScripts(); // Load scripts on-demand
                
                const invoiceElements = printContainerRef.current?.querySelectorAll<HTMLDivElement>('.invoice-page-container');
                if (!invoiceElements || invoiceElements.length === 0 || typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
                    console.error('PDF generation libraries not found or no invoices to print.');
                    addToast('Could not generate PDF. Please try again.', 'error');
                    setIsDownloading(false);
                    setBillsToPrint([]);
                    return;
                }

                const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                
                for (let i = 0; i < invoiceElements.length; i++) {
                    const element = invoiceElements[i];
                    try {
                        const canvas = await window.html2canvas(element, { 
                            scale: 2, 
                            useCORS: true, 
                            backgroundColor: '#ffffff',
                            height: element.scrollHeight,
                            windowHeight: element.scrollHeight
                        });
                        const imgData = canvas.toDataURL('image/png');
                        const imgProps = pdf.getImageProperties(imgData);
                        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        if (i > 0) {
                            pdf.addPage();
                        }
                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
                    } catch (error) {
                         console.error('Error generating canvas for invoice:', error);
                         addToast(`Failed to process invoice ${i + 1}.`, 'error');
                    }
                }

                pdf.save(`Invoices-${selectedMonth}.pdf`);

                setIsDownloading(false);
                setBillsToPrint([]);
            };
            setTimeout(generatePdf, 100); // Small delay to ensure DOM is ready
        }
    }, [billsToPrint, selectedMonth, addToast]);


    const getSuppliersForMedicine = (medicine: Medicine) => {
        const supplierIds = new Set(medicine.batches.map(b => b.supplierId));
        return suppliers.filter(s => supplierIds.has(s.id));
    };

    const exportSalesReport = () => {
        const determineItemType = (items: BillItem[]): string => {
            const itemTypes = new Set(items.map(i => i.itemType));
            if (itemTypes.has('Medicine')) {
                return 'Medicine';
            }
            if (itemTypes.has('Consultation Fee')) {
                return 'Consultation';
            }
            if (itemTypes.has('Service')) {
                return 'Service';
            }
            if (itemTypes.has('Product')) {
                return 'Product';
            }
            return items.length > 0 ? items[0].itemType.replace(' Fee', '') : 'N/A';
        };

        const dataToExport = filteredBills.map(b => {
            const consultationItem = b.items.find(item => item.itemType === 'Consultation Fee');
            const doctorName = consultationItem ? consultationItem.itemName.replace('Consultation - ', '') : 'N/A';
    
            const itemType = determineItemType(b.items);
            
            const taxesString = b.taxDetails.map(t => `GST ${t.rate}%: ₹${(t.cgst + t.sgst).toFixed(2)} on ₹${t.taxableAmount.toFixed(2)}`).join('; ');
    
            return {
                'Bill No': b.billNumber,
                'Date': new Date(b.date).toLocaleString('en-GB'),
                'Patient Name': b.patient.name,
                'Patient Mobile': b.patient.mobile || 'N/A',
                'Doctor Name': doctorName,
                'Item Type': itemType,
                'Subtotal': b.subTotal.toFixed(2),
                'Taxes': taxesString || 'N/A',
                'Total Amount': b.totalAmount.toFixed(2),
                'Payment Mode': b.paymentMode,
            };
        });
    
        handleExportCSV(dataToExport, `sales-report-${startDate}-to-${endDate}.csv`, addToast as any); 
    };
    const exportLowStockReport = () => { handleExportCSV(lowStockItems.map(m => ({ Name: m.name, Stock: m.totalStockInUnits, MinLevel: m.minStockLevel, Supplier: getSuppliersForMedicine(m).map(s=>s.name).join('/'), SupplierMobile: getSuppliersForMedicine(m).map(s=>s.mobile).join('/') })), 'low-stock.csv', addToast as any); };
    const exportOutOfStockReport = () => { handleExportCSV(outOfStockItems.map(m => ({ Name: m.name, Manufacturer: m.manufacturer, Supplier: getSuppliersForMedicine(m).map(s=>s.name).join('/'), SupplierMobile: getSuppliersForMedicine(m).map(s=>s.mobile).join('/') })), 'out-of-stock.csv', addToast as any); };
    const exportNearExpiryReport = () => { handleExportCSV(nearExpiryItems.map(i => ({ Name: i.medicine.name, Batch: i.batch.batchNumber, Expiry: i.batch.expiryDate, DaysLeft: getDaysUntilExpiry(i.batch.expiryDate), Supplier: i.supplier?.name, SupplierMobile: i.supplier?.mobile })), 'near-expiry.csv', addToast as any); };
    
    const handleBulkDownload = () => {
        setIsDownloading(true);
        setBillsToPrint(monthlyBills);
    };

    const handleConfirmDownload = () => {
        setIsConfirmDownloadOpen(false);
        handleBulkDownload();
    };


    return (
        <div>
            <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 mb-6">Pharmacy Reports</h2>
            <div className="space-y-6">
                <InventoryReportCard title="Near Expiry Items" count={nearExpiryItems.length} onExport={exportNearExpiryReport} icon={ClockIcon} iconColor="text-orange-500">
                    <div className="max-h-72 overflow-y-auto border dark:border-slate-700 rounded-md">
                        {nearExpiryItems.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="overflow-x-auto hidden md:block">
                                    <table className="min-w-full text-sm"><thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0"><tr className="text-left">{['Medicine', 'Batch', 'Days to Expire', 'Stock', 'Supplier'].map(h => <th key={h} className="p-3 font-medium text-slate-600 dark:text-slate-400">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{nearExpiryItems.map(({ medicine, batch, supplier }) => { const days = getDaysUntilExpiry(batch.expiryDate); return (<tr key={`${medicine.id}-${batch.batchNumber}`}><td className="p-3 text-slate-900 dark:text-slate-200">{medicine.name}</td><td className="p-3 text-slate-700 dark:text-slate-300">{batch.batchNumber}</td><td className={`p-3 ${getExpiryColor(days)}`}>{days} days</td><td className="p-3 text-slate-700 dark:text-slate-300">{(batch.packQuantity * batch.packSize) + batch.looseQuantity}</td><td className="p-3 text-slate-700 dark:text-slate-400 text-xs">{supplier?.name || 'N/A'}</td></tr>) })}</tbody></table>
                                </div>
                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                                    {nearExpiryItems.map(({ medicine, batch, supplier }) => {
                                        const days = getDaysUntilExpiry(batch.expiryDate);
                                        return (
                                            <div key={`${medicine.id}-${batch.batchNumber}`} className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{medicine.name}</p>
                                                    <p className={`${getExpiryColor(days)} text-sm font-bold`}>{days} days</p>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 grid grid-cols-2 gap-1">
                                                    <p>Batch: <span className="font-medium text-slate-700 dark:text-slate-300">{batch.batchNumber}</span></p>
                                                    <p>Stock: <span className="font-medium text-slate-700 dark:text-slate-300">{(batch.packQuantity * batch.packSize) + batch.looseQuantity} units</span></p>
                                                    <p className="col-span-2">Supplier: <span className="font-medium text-slate-700 dark:text-slate-300">{supplier?.name || 'N/A'}</span></p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (<p className="text-center text-slate-500 dark:text-slate-400 p-4">No items to display.</p>)}
                    </div>
                </InventoryReportCard>

                <InventoryReportCard title="Low Stock Items" count={lowStockItems.length} onExport={exportLowStockReport} icon={ExclamationCircleIcon} iconColor="text-yellow-500">
                     <div className="max-h-72 overflow-y-auto border dark:border-slate-700 rounded-md">
                        {lowStockItems.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="overflow-x-auto hidden md:block">
                                    <table className="min-w-full text-sm"><thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0"><tr className="text-left">{['Medicine', 'Stock Level', 'Min. Stock', 'Supplier(s)'].map(h => <th key={h} className="p-3 font-medium text-slate-600 dark:text-slate-400">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{lowStockItems.map(med => (<tr key={med.id}><td className="p-3 text-slate-900 dark:text-slate-200">{med.name}</td><td className="p-3 text-slate-700 dark:text-slate-300 min-w-[120px]"><div className="w-full bg-yellow-100 dark:bg-yellow-900/50 rounded-full h-4"><div className="bg-yellow-400 h-4 rounded-full text-center text-xs text-yellow-800 font-semibold" style={{ width: `${(med.totalStockInUnits/med.minStockLevel)*100}%` }}>{med.totalStockInUnits}</div></div></td><td className="p-3 text-slate-700 dark:text-slate-300">{med.minStockLevel}</td><td className="p-3 text-slate-700 dark:text-slate-400 text-xs">{getSuppliersForMedicine(med).map(s=>s.name).join(', ')}</td></tr>))}</tbody></table>
                                </div>
                                 {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                                    {lowStockItems.map(med => (
                                         <div key={med.id} className="p-3">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{med.name}</p>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 grid grid-cols-2 gap-1">
                                                <p>Stock: <span className="font-medium text-slate-700 dark:text-slate-300">{med.totalStockInUnits}</span></p>
                                                <p>Min Level: <span className="font-medium text-slate-700 dark:text-slate-300">{med.minStockLevel}</span></p>
                                                <p className="col-span-2">Suppliers: <span className="font-medium text-slate-700 dark:text-slate-300">{getSuppliersForMedicine(med).map(s=>s.name).join(', ')}</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (<p className="text-center text-slate-500 dark:text-slate-400 p-4">No items to display.</p>)}
                     </div>
                </InventoryReportCard>

                <InventoryReportCard title="Out of Stock Items" count={outOfStockItems.length} onExport={exportOutOfStockReport} icon={ExclamationCircleIcon} iconColor="text-danger">
                     <div className="max-h-72 overflow-y-auto border dark:border-slate-700 rounded-md">
                        {outOfStockItems.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="overflow-x-auto hidden md:block">
                                    <table className="min-w-full text-sm"><thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0"><tr className="text-left">{['Medicine', 'Manufacturer', 'Supplier(s)'].map(h => <th key={h} className="p-3 font-medium text-slate-600 dark:text-slate-400">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{outOfStockItems.map(med => (<tr key={med.id}><td className="p-3 font-medium text-danger">{med.name}</td><td className="p-3 text-slate-700 dark:text-slate-300">{med.manufacturer}</td><td className="p-3 text-slate-700 dark:text-slate-400 text-xs">{getSuppliersForMedicine(med).map(s=>s.name).join(', ')}</td></tr>))}</tbody></table>
                                </div>
                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                                    {outOfStockItems.map(med => (
                                        <div key={med.id} className="p-3">
                                            <p className="font-semibold text-danger">{med.name}</p>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 grid grid-cols-2 gap-1">
                                                <p>Mfr: <span className="font-medium text-slate-700 dark:text-slate-300">{med.manufacturer}</span></p>
                                                <p>Suppliers: <span className="font-medium text-slate-700 dark:text-slate-300">{getSuppliersForMedicine(med).map(s=>s.name).join(', ')}</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (<p className="text-center text-slate-500 dark:text-slate-400 p-4">No items to display.</p>)}
                    </div>
                </InventoryReportCard>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                        <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">Sales Report</h3>
                        <button onClick={exportSalesReport} disabled={filteredBills.length === 0} className="flex items-center self-start sm:self-center text-sm bg-brand-primary text-white px-3 py-1.5 rounded-md hover:bg-brand-primary-hover disabled:bg-slate-400"><ArrowDownTrayIcon className="w-4 h-4 mr-2"/> Export Sales</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass}/></div>
                        <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className={inputClass}/></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-sm text-slate-500 dark:text-slate-400">Total Sales</p><p className="text-2xl font-bold text-success">₹{salesSummary.totalSales.toFixed(2)}</p></div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-sm text-slate-500 dark:text-slate-400">Bills Generated</p><p className="text-2xl font-bold text-brand-primary">{salesSummary.totalBills}</p></div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-sm text-slate-500 dark:text-slate-400">Items Sold</p><p className="text-2xl font-bold text-indigo-600">{salesSummary.totalItemsSold}</p></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Bulk Invoice Download</h3>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div>
                            <label htmlFor="month-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Month</label>
                            <input type="month" id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={`${inputClass} sm:w-52`}/>
                        </div>
                        <button 
                            onClick={() => setIsConfirmDownloadOpen(true)}
                            disabled={monthlyBills.length === 0 || isDownloading}
                            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            {isDownloading ? <SpinnerIcon className="animate-spin w-5 h-5 mr-2" /> : <ArrowDownTrayIcon className="w-5 h-5 mr-2" />}
                            Download Invoices ({monthlyBills.length})
                        </button>
                    </div>
                     {monthlyBills.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">No invoices found for the selected month.</p>}
                </div>

            </div>
             {/* Hidden container for printing */}
            {billsToPrint.length > 0 && (
                <div 
                    ref={printContainerRef} 
                    style={{ position: 'absolute', left: '-9999px' }}
                    className="bg-white"
                >
                    {billsToPrint.map(bill => (
                        <div key={bill.billNumber} className="invoice-page-container" style={{ width: '794px' }}>
                           <InvoiceTemplate bill={bill} pharmacyInfo={pharmacyInfo} />
                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal
                isOpen={isConfirmDownloadOpen}
                onClose={() => setIsConfirmDownloadOpen(false)}
                onConfirm={handleConfirmDownload}
                title="Confirm Bulk Download"
                message={`Are you sure you want to download all ${monthlyBills.length} invoices for ${formatMonthForDisplay(selectedMonth)}? This may take a moment.`}
            />
        </div>
    );
};

export default Reports;