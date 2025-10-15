import React, { useState } from 'react';
import { Appointment } from '../types';
import { DeleteIcon, DocumentPlusIcon } from './icons';

interface ToBeBilledProps {
    appointments: Appointment[];
    onBillIt: (appointmentId: string) => void;
    onCancelBill: (appointmentId: string) => void;
}

const EmptyState: React.FC<{ message: string; subtext: string }> = ({ message, subtext }) => (
    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
      <DocumentPlusIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600"/>
      <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">{message}</h3>
      <p className="mt-2 text-sm">{subtext}</p>
    </div>
);


export const ToBeBilled: React.FC<ToBeBilledProps> = ({ appointments, onBillIt, onCancelBill }) => {
    
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const appointmentsToBill = appointments
        .filter(apt => apt.status === 'Ready for Billing')
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100">Prescriptions to be Billed</h2>
            </div>
            
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {appointmentsToBill.length > 0 ? (
                    <>
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Consultation Time</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Doctor</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointmentsToBill.map(apt => (
                                    <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap font-semibold">
                                                {new Date(apt.startTime).toLocaleString('en-GB')}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{apt.patientName}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{apt.doctorName}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <div className="flex items-center space-x-3">
                                                <button 
                                                    onClick={() => onBillIt(apt.id)}
                                                    className="bg-success text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors font-semibold"
                                                >
                                                    Bill It
                                                </button>
                                                {cancellingId === apt.id ? (
                                                    <>
                                                        <button onClick={() => { onCancelBill(apt.id); setCancellingId(null); }} className="text-sm font-semibold text-danger hover:underline">Confirm</button>
                                                        <button onClick={() => setCancellingId(null)} className="text-sm text-slate-600 dark:text-slate-400 hover:underline">Cancel</button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setCancellingId(apt.id)}
                                                        className="text-danger hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                                                        title="Cancel Billing"
                                                    >
                                                        <DeleteIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {/* Mobile Card View */}
                     <div className="md:hidden p-4 space-y-4">
                        {appointmentsToBill.map(apt => (
                            <div key={apt.id} className="bg-white dark:bg-slate-800/95 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{apt.patientName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(apt.startTime).toLocaleString('en-GB')}</p>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{apt.doctorName}</p>
                                </div>
                                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                                    <button 
                                        onClick={() => onBillIt(apt.id)}
                                        className="bg-success text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors font-semibold"
                                    >
                                        Bill It
                                    </button>
                                    {cancellingId === apt.id ? (
                                        <>
                                            <button onClick={() => { onCancelBill(apt.id); setCancellingId(null); }} className="text-sm font-semibold text-danger hover:underline">Confirm</button>
                                            <button onClick={() => setCancellingId(null)} className="text-sm text-slate-600 dark:text-slate-400 hover:underline">Cancel</button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setCancellingId(apt.id)}
                                            className="text-danger hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                                            title="Cancel Billing"
                                        >
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    </>
                ) : (
                    <EmptyState 
                        message="No Prescriptions to Bill"
                        subtext="Completed consultations with prescriptions will appear here."
                    />
                )}
            </div>
        </div>
    );
};

export default ToBeBilled;
