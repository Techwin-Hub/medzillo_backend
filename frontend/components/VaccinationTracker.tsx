import React, { useState, useMemo } from 'react';
import { VaccinationRecord, Patient, VaccinationOverride } from '../types';
import { CloseIcon, SyringeIcon, CheckCircleIcon, PlusIcon, EditIcon, DeleteIcon, WhatsAppIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { ConfirmModal } from './ConfirmModal';
import { IMMUNIZATION_SCHEDULE } from '../utils/constants';

interface VaccinationTrackerProps {
    patient: Patient;
    onClose: () => void;
    onSave: (data: { vaccinations: VaccinationRecord[], skippedVaccinations: { vaccineName: string; dose: number | string; }[], vaccinationOverrides?: VaccinationOverride[] }) => void;
}

const parseIndianDate = (indianDateStr: string | undefined): Date | null => {
    if (!indianDateStr) return null;
    const parts = indianDateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!parts) return null;
    const [, day, month, year] = parts;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (isNaN(date.getTime()) || date.getUTCDate() !== parseInt(day, 10)) return null;
    return date;
};

const getDueDate = (dob: Date, due: { at?: string; value?: number; unit?: string }): Date => {
    const dueDate = new Date(dob);
    if (due.at === 'birth') return dueDate;
    if (due.unit === 'weeks') dueDate.setDate(dueDate.getDate() + due.value! * 7);
    if (due.unit === 'months') dueDate.setMonth(dueDate.getMonth() + due.value!);
    if (due.unit === 'years') dueDate.setFullYear(dueDate.getFullYear() + due.value!);
    return dueDate;
};

// Converts YYYY-MM-DD to DD-MM-YYYY
const toInputDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

type ModalState = {
    mode: 'record' | 'edit';
    vaccine: Partial<VaccinationRecord> & { vaccineName: string; dose: number | string };
} | null;

type DeletingItem = {
    type: 'record' | 'schedule' | 'custom_schedule_override';
    data: any;
} | null;


export const VaccinationTracker: React.FC<VaccinationTrackerProps> = ({ patient, onClose, onSave }) => {
    const [vaccinations, setVaccinations] = useState(patient.vaccinations || []);
    const [skippedVaccinations, setSkippedVaccinations] = useState(patient.skippedVaccinations || []);
    const [modalState, setModalState] = useState<ModalState>(null);
    const [deletingItem, setDeletingItem] = useState<DeletingItem>(null);
    const [editingDueDateItem, setEditingDueDateItem] = useState<{ name: string, dose: number | string, dueDate: Date } | null>(null);
    const { addToast } = useToast();
    
    const [customVaccine, setCustomVaccine] = useState({ name: '', dose: '', dueDate: new Date().toISOString().split('T')[0] });
    
    const standardVaccineNames = useMemo(() => new Set(IMMUNIZATION_SCHEDULE.map(v => v.name)), []);
    
    const inputClass = "mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary";

    const combinedScheduleData = useMemo(() => {
        const dobDate = parseIndianDate(patient.dob);
        if (!patient.dob || !dobDate) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isSkipped = (vaccineName: string, dose: number | string) =>
            skippedVaccinations.some(s => s.vaccineName === vaccineName && s.dose === dose);

        // Process standard schedule items
        const standardItems = IMMUNIZATION_SCHEDULE.flatMap(vaccine =>
            vaccine.doses
                .filter(doseInfo => !isSkipped(vaccine.name, doseInfo.dose))
                .map(doseInfo => {
                    const override = (patient.vaccinationOverrides || []).find(o => o.vaccineName === vaccine.name && o.dose === doseInfo.dose);
                    const dueDate = override ? new Date(`${override.newDueDate}T00:00:00Z`) : getDueDate(dobDate, doseInfo.due);

                    const givenRecord = vaccinations.find(v => v.vaccineName === vaccine.name && v.dose === doseInfo.dose);
                    let status: 'Completed' | 'Overdue' | 'Upcoming' = 'Upcoming';
                    if (givenRecord) status = 'Completed';
                    else if (today > dueDate) status = 'Overdue';
                    return { name: vaccine.name, dose: doseInfo.dose, dueDate, status, givenRecord, hasOverride: !!override, isCustom: false };
                })
        );

        // Get completed custom vaccines (those not in the standard schedule)
        const completedCustomItems = vaccinations
            .filter(v => !standardVaccineNames.has(v.vaccineName))
            .map(v => ({
                name: v.vaccineName,
                dose: v.dose,
                dueDate: new Date(v.dateGiven),
                status: 'Completed' as 'Completed',
                givenRecord: v,
                hasOverride: false,
                isCustom: true
            }));

        // Get UPCOMING custom vaccines from overrides
        const upcomingCustomItems = (patient.vaccinationOverrides || [])
            .filter(o => !standardVaccineNames.has(o.vaccineName))
            .map(o => {
                const dueDate = new Date(`${o.newDueDate}T00:00:00Z`);
                const givenRecord = vaccinations.find(v => v.vaccineName === o.vaccineName && v.dose === o.dose);
                
                // Don't show if already completed
                if (givenRecord) return null;

                let status: 'Overdue' | 'Upcoming' = 'Upcoming';
                if (today > dueDate) status = 'Overdue';
                
                return {
                    name: o.vaccineName,
                    dose: o.dose,
                    dueDate,
                    status,
                    givenRecord: undefined,
                    hasOverride: true,
                    isCustom: true
                };
            }).filter(Boolean);

        const combinedItems = [...standardItems, ...completedCustomItems, ...upcomingCustomItems] as ({
            name: string;
            dose: string | number;
            dueDate: Date;
            status: "Completed" | "Overdue" | "Upcoming";
            givenRecord: VaccinationRecord | undefined;
            hasOverride: boolean;
            isCustom: boolean;
        })[];

        // Sort the entire list by due date, ascending.
        combinedItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        return combinedItems;

    }, [patient.dob, patient.vaccinationOverrides, vaccinations, skippedVaccinations, standardVaccineNames]);

    
    const handleSaveAll = (updatedVaccinations: VaccinationRecord[], updatedSkipped: { vaccineName: string; dose: number | string; }[], updatedOverrides?: VaccinationOverride[]) => {
        setVaccinations(updatedVaccinations);
        setSkippedVaccinations(updatedSkipped);
        onSave({ 
            vaccinations: updatedVaccinations, 
            skippedVaccinations: updatedSkipped,
            vaccinationOverrides: updatedOverrides || patient.vaccinationOverrides || []
        });
    };

    const handleModalSave = ({ vaccineName, dose, dateGiven, batchNumber }: { vaccineName: string; dose: string | number; dateGiven: string; batchNumber?: string; }) => {
        if (!modalState) return;
        let updatedVaccinations;
        if (modalState.mode === 'edit') {
            const originalRecord = modalState.vaccine;
            updatedVaccinations = vaccinations.map(v => 
                (v.vaccineName === originalRecord.vaccineName && v.dose === originalRecord.dose) 
                ? { ...v, vaccineName: vaccineName.trim(), dose: dose, dateGiven, batchNumber } 
                : v
            );
            addToast(`${vaccineName} record updated.`, 'success');
        } else { // mode === 'record'
            const newRecord: VaccinationRecord = {
                vaccineName: modalState.vaccine.vaccineName, // Name/dose are fixed when recording a standard vaccine
                dose: modalState.vaccine.dose,
                dateGiven,
                batchNumber,
            };
            updatedVaccinations = [...vaccinations, newRecord];
            addToast(`${newRecord.vaccineName} (Dose ${newRecord.dose}) recorded.`, 'success');
        }
        
        let updatedOverrides = patient.vaccinationOverrides || [];
        if (modalState.mode === 'record') {
            const recordedVaccineName = modalState.vaccine.vaccineName;
            const recordedDose = modalState.vaccine.dose;
            updatedOverrides = updatedOverrides.filter(o => !(o.vaccineName === recordedVaccineName && o.dose === recordedDose));
        }

        handleSaveAll(updatedVaccinations, skippedVaccinations, updatedOverrides);
        setModalState(null);
    };
    
    const handleAddCustomSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, dose, dueDate } = customVaccine;
        if (!name.trim() || !dose) {
            addToast("Vaccine Name and Dose are required.", "warning");
            return;
        }

        const newOverride: VaccinationOverride = {
            vaccineName: name.trim(),
            dose: isNaN(Number(dose)) ? dose : Number(dose),
            newDueDate: dueDate
        };

        const updatedOverrides = [...(patient.vaccinationOverrides || []), newOverride];
        handleSaveAll(vaccinations, skippedVaccinations, updatedOverrides);

        addToast(`Custom vaccine "${name}" scheduled.`, 'success');
        setCustomVaccine({ name: '', dose: '', dueDate: new Date().toISOString().split('T')[0] });
    };

    const handleSendReminder = (vaccineName: string, dose: string | number, dueDate: Date) => {
        if (!patient || !patient.mobile) {
            addToast('Patient mobile number is not available.', 'warning');
            return;
        }
        let phoneNumber;
        if (patient.mobile.startsWith('+')) {
            phoneNumber = patient.mobile.replace(/\D/g, '');
        } else {
            let cleanedNumber = patient.mobile.replace(/\D/g, '');
            if (cleanedNumber.startsWith('0')) {
                cleanedNumber = cleanedNumber.substring(1);
            }
            phoneNumber = `91${cleanedNumber}`;
        }
        const formattedDueDate = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const doseDisplay = dose === 0 ? 'Birth Dose' : `Dose ${dose}`;

        const message = `Hi, this is a friendly reminder from your clinic. The next vaccination for ${patient.name} (${vaccineName} - ${doseDisplay}) is due on ${formattedDueDate}. Please schedule a visit. Thank you!`;
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(url, '_blank', 'noopener,noreferrer');
    };
    
    const handleRestore = (itemToRestore: { vaccineName: string; dose: number | string }) => {
        const updatedSkipped = skippedVaccinations.filter(s => !(s.vaccineName === itemToRestore.vaccineName && s.dose === itemToRestore.dose));
        handleSaveAll(vaccinations, updatedSkipped);
        addToast(`${itemToRestore.vaccineName} restored to schedule.`, 'success');
    };

    const confirmDelete = () => {
        if (!deletingItem) return;
        switch (deletingItem.type) {
            case 'record':
                const record = deletingItem.data as VaccinationRecord;
                const updatedVaccinations = vaccinations.filter(v => !(v.vaccineName === record.vaccineName && v.dose === record.dose));
                handleSaveAll(updatedVaccinations, skippedVaccinations);
                addToast(`Record for ${record.vaccineName} deleted.`, 'success');
                break;
            case 'schedule':
                const scheduleItem = deletingItem.data as { vaccineName: string; dose: number | string };
                const updatedSkipped = [...skippedVaccinations, scheduleItem];
                handleSaveAll(vaccinations, updatedSkipped);
                addToast(`${scheduleItem.vaccineName} removed from schedule.`, 'info');
                break;
            case 'custom_schedule_override':
                const overrideItem = deletingItem.data as { vaccineName: string; dose: number | string };
                const updatedOverrides = (patient.vaccinationOverrides || []).filter(o => !(o.vaccineName === overrideItem.vaccineName && o.dose === overrideItem.dose));
                handleSaveAll(vaccinations, skippedVaccinations, updatedOverrides);
                addToast(`${overrideItem.vaccineName} removed from schedule.`, 'info');
                break;
        }
        setDeletingItem(null);
    };

    const handleSaveDueDate = (vaccineName: string, dose: number | string, newDueDate: string) => {
        const updatedOverrides = [...(patient.vaccinationOverrides || [])];
        const existingOverrideIndex = updatedOverrides.findIndex(o => o.vaccineName === vaccineName && o.dose === dose);

        if (existingOverrideIndex > -1) {
            updatedOverrides[existingOverrideIndex].newDueDate = newDueDate;
        } else {
            updatedOverrides.push({ vaccineName, dose, newDueDate });
        }
        
        handleSaveAll(vaccinations, skippedVaccinations, updatedOverrides);
        setEditingDueDateItem(null);
        addToast('Due date updated successfully.', 'success');
    };
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"><h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 flex items-center gap-3"><SyringeIcon className="w-6 h-6 text-purple-600"/>Vaccination Tracker for {patient.name}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><CloseIcon className="w-6 h-6" /></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div>
                        <h4 className="font-semibold text-lg mb-3 text-brand-secondary dark:text-slate-200">Immunization Schedule</h4>
                        <div className="border rounded-lg overflow-hidden dark:border-slate-700">
                             {/* Desktop Table View */}
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800"><tr className="text-left"><th className="p-3 font-medium text-slate-600 dark:text-slate-400">Vaccine</th><th className="p-3 font-medium text-slate-600 dark:text-slate-400">Dose</th><th className="p-3 font-medium text-slate-600 dark:text-slate-400">Due Date</th><th className="p-3 font-medium text-slate-600 dark:text-slate-400">Status</th><th className="p-3 font-medium text-slate-600 dark:text-slate-400">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{combinedScheduleData.map(item => <VaccineRow key={`${item.name}-${item.dose}`} item={item} onRecord={() => setModalState({ mode: 'record', vaccine: { vaccineName: item.name, dose: item.dose } })} onEdit={() => setModalState({ mode: 'edit', vaccine: item.givenRecord! })} onEditDueDate={() => setEditingDueDateItem(item)} onDeleteRecord={() => setDeletingItem({ type: 'record', data: item.givenRecord! })} onDeleteSchedule={() => setDeletingItem({ type: item.isCustom ? 'custom_schedule_override' : 'schedule', data: { vaccineName: item.name, dose: item.dose } })} onSendReminder={handleSendReminder} getStatusColor={getStatusColor} />)}</tbody>
                                </table>
                            </div>
                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">{combinedScheduleData.map(item => <VaccineCard key={`${item.name}-${item.dose}`} item={item} onRecord={() => setModalState({ mode: 'record', vaccine: { vaccineName: item.name, dose: item.dose } })} onEdit={() => setModalState({ mode: 'edit', vaccine: item.givenRecord! })} onEditDueDate={() => setEditingDueDateItem(item)} onDeleteRecord={() => setDeletingItem({ type: 'record', data: item.givenRecord! })} onDeleteSchedule={() => setDeletingItem({ type: item.isCustom ? 'custom_schedule_override' : 'schedule', data: { vaccineName: item.name, dose: item.dose } })} onSendReminder={handleSendReminder} getStatusColor={getStatusColor} />)}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-lg mb-3 text-brand-secondary dark:text-slate-200">Schedule Other Vaccine</h4>
                            <form onSubmit={handleAddCustomSchedule} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400">Vaccine Name</label><input type="text" value={customVaccine.name} onChange={e => setCustomVaccine(p => ({ ...p, name: e.target.value }))} className={inputClass}/></div>
                                    <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400">Dose</label><input type="text" value={customVaccine.dose} onChange={e => setCustomVaccine(p => ({ ...p, dose: e.target.value }))} placeholder="e.g., 1, Booster" className={inputClass}/></div>
                                    <div className="col-span-2"><label className="text-xs font-medium text-slate-600 dark:text-slate-400">Due Date</label><input type="date" value={customVaccine.dueDate} onChange={e => setCustomVaccine(p => ({ ...p, dueDate: e.target.value }))} className={inputClass}/></div>
                                </div>
                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover font-semibold"><PlusIcon className="w-5 h-5"/>Schedule Other Vaccine</button>
                            </form>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mb-3 text-brand-secondary dark:text-slate-200">Ignored / Skipped Vaccines</h4>
                             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 min-h-[100px]">{skippedVaccinations.length > 0 ? <div className="space-y-2">{skippedVaccinations.map(s => <div key={`${s.vaccineName}-${s.dose}`} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-700 rounded-md"><p>{s.vaccineName} (Dose {s.dose})</p><button onClick={() => handleRestore(s)} className="text-xs font-semibold text-blue-600 hover:underline">Restore</button></div>)}</div> : <p className="text-sm text-center text-slate-500 pt-4">No vaccines have been skipped.</p>}</div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end"><button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover font-semibold">Close</button></div>
            </div>
        </div>
        {modalState && <RecordEditModal state={modalState} onClose={() => setModalState(null)} onSave={handleModalSave} />}
        {editingDueDateItem && <DueDateEditModal item={editingDueDateItem} onClose={() => setEditingDueDateItem(null)} onSave={(newDate) => handleSaveDueDate(editingDueDateItem.name, editingDueDateItem.dose, newDate)} />}
        {deletingItem && <ConfirmModal isOpen={!!deletingItem} onClose={() => setDeletingItem(null)} onConfirm={confirmDelete} title="Confirm Action" message={deletingItem.type === 'schedule' ? 'Are you sure you want to remove this vaccine from the schedule? You can restore it later.' : 'Are you sure you want to delete this vaccination record? This action cannot be undone.'}/>}
        </>
    );
};

const VaccineRow: React.FC<any> = ({ item, onRecord, onEdit, onEditDueDate, onDeleteRecord, onDeleteSchedule, onSendReminder, getStatusColor }) => (
    <tr>
        <td className="p-3 text-slate-800 dark:text-slate-200 font-semibold">{item.name}</td>
        <td className="p-3">{item.dose}</td>
        <td className="p-3">
            <div className="flex items-center gap-2">
                {item.dueDate.toLocaleDateString('en-GB')}
                {item.hasOverride && <span className="text-indigo-500 font-bold" title="Custom due date set">*</span>}
            </div>
        </td>
        <td className="p-3"><span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${getStatusColor(item.status)}`}>{item.status}</span></td>
        <td className="p-3">
            <div className="flex items-center space-x-2">
                {item.status === 'Completed' ? (
                    <>
                        <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Edit Record"><EditIcon className="w-5 h-5"/></button>
                        <button onClick={onDeleteRecord} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Delete Record"><DeleteIcon className="w-5 h-5"/></button>
                    </>
                ) : (
                    <>
                        <button onClick={onRecord} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" title="Record as Given"><CheckCircleIcon className="w-5 h-5"/></button>
                        <button onClick={onEditDueDate} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" title="Edit Due Date"><EditIcon className="w-5 h-5"/></button>
                        <button onClick={onDeleteSchedule} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300" title="Remove from Schedule"><DeleteIcon className="w-5 h-5"/></button>
                    </>
                )}
                 {item.status !== 'Completed' && <button onClick={() => onSendReminder(item.name, item.dose, item.dueDate)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" title="Send Reminder"><WhatsAppIcon className="w-5 h-5"/></button>}
            </div>
        </td>
    </tr>
);

const VaccineCard: React.FC<any> = ({ item, onRecord, onEdit, onEditDueDate, onDeleteRecord, onDeleteSchedule, onSendReminder, getStatusColor }) => (
    <div className="p-4">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">{item.name} (Dose {item.dose})</p>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Due: {item.dueDate.toLocaleDateString('en-GB')}</span>
                    {item.hasOverride && <span className="text-indigo-500 font-bold" title="Custom due date set">*</span>}
                </div>
            </div>
            <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
        </div>
        {item.status === 'Completed' && item.givenRecord && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Given on: {new Date(item.givenRecord.dateGiven).toLocaleDateString('en-GB')}</p>}
        <div className="flex items-center justify-end space-x-3 mt-2 pt-2 border-t dark:border-slate-700">
            {item.status === 'Completed' ? (
                <>
                    <button onClick={onEdit} className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-md"><EditIcon className="w-4 h-4"/> Edit</button>
                    <button onClick={onDeleteRecord} className="text-red-600 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
                </>
            ) : (
                <>
                    <button onClick={onRecord} className="flex items-center gap-1 text-sm bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-md"><CheckCircleIcon className="w-4 h-4"/> Record</button>
                    <button onClick={onEditDueDate} className="text-indigo-600 p-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={onDeleteSchedule} className="text-slate-500 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><DeleteIcon className="w-5 h-5"/></button>
                </>
            )}
            {item.status !== 'Completed' && <button onClick={() => onSendReminder(item.name, item.dose, item.dueDate)} className="text-green-600 p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"><WhatsAppIcon className="w-5 h-5"/></button>}
        </div>
    </div>
);

const RecordEditModal: React.FC<{ state: ModalState; onClose: () => void; onSave: (data: { vaccineName: string; dose: string | number; dateGiven: string; batchNumber?: string; }) => void; }> = ({ state, onClose, onSave }) => {
    if (!state) return null;

    const [name, setName] = useState(state.vaccine.vaccineName || '');
    const [dose, setDose] = useState(String(state.vaccine.dose) || '');
    const [date, setDate] = useState(() => toInputDate(state.vaccine.dateGiven) || new Date().toISOString().split('T')[0]);
    const [batch, setBatch] = useState(state.vaccine.batchNumber || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !String(dose).trim()) {
            return; 
        }
        onSave({ vaccineName: name, dose: isNaN(Number(dose)) ? dose : Number(dose), dateGiven: date, batchNumber: batch });
    };
    
    const isEditing = state.mode === 'edit';
    const inputClass = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700"><h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">{isEditing ? 'Edit' : 'Record'} Vaccine: {state.vaccine.vaccineName} (Dose {state.vaccine.dose})</h3></div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vaccine Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dose</label>
                            <input type="text" value={dose} onChange={e => setDose(e.target.value)} disabled={!isEditing} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date Given</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Batch Number (Optional)</label>
                            <input type="text" value={batch} onChange={e => setBatch(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button><button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover">Save Record</button></div>
                </form>
            </div>
        </div>
    );
};

const DueDateEditModal: React.FC<{
    item: { name: string, dose: number | string, dueDate: Date };
    onClose: () => void;
    onSave: (newDate: string) => void;
}> = ({ item, onClose, onSave }) => {
    const [newDate, setNewDate] = useState(item.dueDate.toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(newDate);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">Edit Due Date</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">For {item.name} (Dose {item.dose})</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Due Date</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                required
                                className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover">Save Date</button>
                    </div>
                </form>
            </div>
        </div>
    );
};