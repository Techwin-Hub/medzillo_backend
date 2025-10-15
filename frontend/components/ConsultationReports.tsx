import React, { useState, useMemo, useEffect } from 'react';
import { Patient, User } from '../types';
import { ArrowDownTrayIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { Pagination } from './Pagination';

interface ConsultationReportsProps {
    patients: Patient[];
    currentUser: User;
}

const handleExportCSV = (data: any[], filename: string, addToast: (msg: string, type: 'warning') => void) => {
    if (data.length === 0) { addToast("No data available to export.", 'warning'); return; }
    const headers = Object.keys(data[0]);
    const csvContent = [ headers.join(','), ...data.map(row => headers.map(header => { let cell = String(row[header] ?? ''); if (/[",\n]/.test(cell)) { cell = `"${cell.replace(/"/g, '""')}"`; } return cell; }).join(',')) ].join('\n');
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

export const ConsultationReports: React.FC<ConsultationReportsProps> = ({ patients, currentUser }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { addToast } = useToast();
    
    const inputClass = "mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary";

    const filteredConsultations = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        
        const results: any[] = [];
        patients.forEach(patient => {
            (patient.consultations || []).forEach(con => {
                const conDate = new Date(con.date);
                if (con.doctorId === currentUser.id && conDate >= start && conDate <= end) {
                    results.push({ ...con, patientName: patient.name, patientMobile: patient.mobile });
                }
            });
        });
        return results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [patients, currentUser.id, startDate, endDate]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredConsultations.length, itemsPerPage]);

    const paginatedConsultations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredConsultations.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredConsultations, currentPage, itemsPerPage]);

    const exportReport = () => {
        const data = filteredConsultations.map(c => ({
            'Date': new Date(c.date).toLocaleString('en-GB'),
            'Patient Name': c.patientName,
            'Patient Mobile': c.patientMobile,
            'Diagnosis': c.diagnosis,
            'Prescribed Medicines': c.prescription.map((p: any) => p.medicineName).join('; '),
        }));
        handleExportCSV(data, `consultation-report-${currentUser.name.replace(' ', '_')}-${startDate}-to-${endDate}.csv`, addToast as any);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 mb-6">Consultation Reports</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass}/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className={inputClass}/>
                        </div>
                    </div>
                    <button onClick={exportReport} disabled={filteredConsultations.length === 0} className="w-full md:w-auto flex items-center justify-center text-sm bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover disabled:bg-slate-400 shadow-sm">
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Export CSV
                    </button>
                </div>
                
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date</th>
                                <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Patient</th>
                                <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Diagnosis</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedConsultations.map(con => (
                                <tr key={con.id}>
                                    <td className="px-5 py-4 text-sm text-slate-900 dark:text-slate-200">{new Date(con.date).toLocaleString('en-GB')}</td>
                                    <td className="px-5 py-4 text-sm text-slate-900 dark:text-slate-200">
                                        <p className="font-semibold">{con.patientName}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">{con.patientMobile}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-900 dark:text-slate-200">{con.diagnosis}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                 {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {paginatedConsultations.map(con => (
                        <div key={con.id} className="bg-white dark:bg-slate-800/95 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{con.patientName}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{con.patientMobile}</p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(con.date).toLocaleDateString('en-GB')}</p>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p><strong>Diagnosis:</strong> {con.diagnosis}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredConsultations.length === 0 && (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">No consultations found for the selected criteria.</div>
                )}
                 <Pagination
                    currentPage={currentPage}
                    totalItems={filteredConsultations.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        </div>
    );
};
