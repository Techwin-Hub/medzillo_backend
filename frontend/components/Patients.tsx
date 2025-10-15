import React, { useState, useMemo, useEffect } from 'react';
import { Patient, User, Medicine, Consultation, Appointment, PharmacyInfo, View, Bill, SharedLink, ProcessedPatientItem } from '../types';
import { PlusIcon, UserPlusIcon, XCircleIcon, ArrowUpTrayIcon } from './icons';
import { PatientForm } from './PatientForm';
import { PatientDetail } from './PatientDetail';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from './Pagination';
import { BulkPatientImport } from './BulkPatientImport';
import { IMMUNIZATION_SCHEDULE } from '../utils/constants';

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

const getNextDueDate = (patient: Patient): Date | null => {
    const dobDate = parseIndianDate(patient.dob);
    if (!dobDate) return null;
    const ageInYears = new Date().getFullYear() - dobDate.getFullYear();
    if (ageInYears >= 20) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const givenVaccines = new Set((patient.vaccinations || []).map(v => `${v.vaccineName}-${v.dose}`));
    const skippedVaccines = new Set((patient.skippedVaccinations || []).map(s => `${s.vaccineName}-${s.dose}`));

    let nearestDueDate: Date | null = null;

    for (const vaccine of IMMUNIZATION_SCHEDULE) {
        for (const doseInfo of vaccine.doses) {
            const key = `${vaccine.name}-${doseInfo.dose}`;
            if (givenVaccines.has(key) || skippedVaccines.has(key)) continue;

            const override = (patient.vaccinationOverrides || []).find(o => o.vaccineName === vaccine.name && o.dose === doseInfo.dose);
            
            const dueDate = override
                ? new Date(`${override.newDueDate}T00:00:00Z`) // Use overridden date if it exists
                : getDueDate(dobDate, doseInfo.due);

            if (dueDate >= today) {
                if (nearestDueDate === null || dueDate < nearestDueDate) {
                    nearestDueDate = dueDate;
                }
            }
        }
    }
    return nearestDueDate;
};


interface PatientsProps {
    patients: Patient[];
    doctors: User[];
    users: User[];
    currentUser: User;
    medicines: Medicine[];
    bills: Bill[];
    addPatient: (patientData: Omit<Patient, 'id' | 'clinicId' | 'consultations'>) => Promise<Patient | null>;
    addMultiplePatients: (patientsData: ProcessedPatientItem['data'][]) => Promise<void>;
    updatePatient: (updatedPatient: Patient) => void;
    deletePatient: (patientId: string) => Promise<boolean>;
    addAppointment: (appointmentData: Omit<Appointment, 'id' | 'clinicId'>) => void;
    createBillFromConsultation: (patient: Patient, consultation: Consultation) => void;
    createRefillDraftBill: (patient: Patient, consultation: Consultation) => void;
    pharmacyInfo: PharmacyInfo;
    initialPatientId?: string | null;
    onBackFromDetail?: () => void;
    navigationSource?: View | null;
    createSharedLink: (appointmentId: string) => Promise<SharedLink | null>;
}

const EmptyState: React.FC<{ message: string; subtext: string }> = ({ message, subtext }) => (
    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
      <UserPlusIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600"/>
      <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">{message}</h3>
      <p className="mt-2 text-sm">{subtext}</p>
    </div>
);


const Patients: React.FC<PatientsProps> = ({ patients, doctors, users, currentUser, medicines, bills, addPatient, addMultiplePatients, updatePatient, deletePatient, addAppointment, createBillFromConsultation, createRefillDraftBill, pharmacyInfo, initialPatientId = null, onBackFromDetail = () => {}, navigationSource = null, createSharedLink }) => {
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        setSelectedPatientId(initialPatientId);
    }, [initialPatientId]);

    const filteredPatients = useMemo(() => {
        let results = patients.filter(p =>
            p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            p.mobile.includes(debouncedSearchTerm)
        );

        if (showUpcomingOnly) {
            results = results.filter(p => getNextDueDate(p) !== null);

            // Sort by the nearest due date, then by name as a tie-breaker
            results.sort((a, b) => {
                const dueDateA = getNextDueDate(a);
                const dueDateB = getNextDueDate(b);

                if (dueDateA && dueDateB) {
                    if (dueDateA.getTime() !== dueDateB.getTime()) {
                        return dueDateA.getTime() - dueDateB.getTime();
                    }
                    return a.name.localeCompare(b.name);
                }
                if (dueDateA) return -1;
                if (dueDateB) return 1;
                return 0;
            });
            
            return results;
        }
        
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }, [patients, debouncedSearchTerm, showUpcomingOnly]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredPatients.length, itemsPerPage]);

    const paginatedPatients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPatients, currentPage, itemsPerPage]);

    const selectedPatient = useMemo(() => {
        return patients.find(p => p.id === selectedPatientId) || null;
    }, [patients, selectedPatientId]);

    const handleAddNew = () => {
        setIsFormOpen(true);
    };

    const handleSavePatient = async (
        patientData: Omit<Patient, 'id' | 'clinicId' | 'consultations'>,
        appointmentDetails?: {
            doctorId: string;
            date: string;
            startTime: string;
        }
    ) => {
        const newPatient = await addPatient(patientData);
        
        if (appointmentDetails && newPatient) {
            const selectedDoctor = doctors.find(d => d.id === appointmentDetails.doctorId);
            if (selectedDoctor) {
                const startDateTime = new Date(`${appointmentDetails.date}T${appointmentDetails.startTime}`);

                addAppointment({
                    patientId: newPatient.id,
                    patientName: newPatient.name,
                    doctorId: selectedDoctor.id,
                    doctorName: selectedDoctor.name,
                    startTime: startDateTime.toISOString(),
                    status: 'Scheduled',
                });
            }
        }
        
        setIsFormOpen(false);
    };
    
    const handleSaveBulkPatients = async (newPatients: ProcessedPatientItem['data'][]) => {
        await addMultiplePatients(newPatients);
        setIsBulkImportOpen(false);
    };

    const handleUpdatePatient = (updatedData: Patient) => {
        updatePatient(updatedData);
    };
    
    const formatDisplayDate = (dateStr: string | undefined): string => {
        if (!dateStr) return 'N/A';
        return dateStr.replace(/-/g, '/');
    };

    if (selectedPatient) {
        return (
            <PatientDetail
                patient={selectedPatient}
                patients={patients}
                doctors={doctors}
                users={users}
                currentUser={currentUser}
                medicines={medicines}
                bills={bills}
                pharmacyInfo={pharmacyInfo}
                onBack={initialPatientId ? onBackFromDetail : () => setSelectedPatientId(null)}
                onUpdatePatient={handleUpdatePatient}
                onDeletePatient={deletePatient}
                onAddAppointment={addAppointment}
                onCreateBill={createBillFromConsultation}
                onCreateRefill={createRefillDraftBill}
                navigationSource={navigationSource}
                createSharedLink={createSharedLink}
            />
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100">Patient Records</h2>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => setIsBulkImportOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors">
                        <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                        Bulk Import
                    </button>
                    <button onClick={handleAddNew} className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add New Patient
                    </button>
                </div>
            </div>
            
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:flex-grow">
                    <input
                        type="text"
                        placeholder="Search by name or mobile..."
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
                 <label className="flex items-center space-x-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap self-start sm:self-center">
                    <input
                        type="checkbox"
                        checked={showUpcomingOnly}
                        onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                        className={`appearance-none h-4 w-4 rounded-sm border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 checked:bg-brand-primary checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-slate-800 checked:bg-no-repeat checked:bg-center checked:bg-[url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")]`}
                    />
                    <span>Show Upcoming Vaccinations</span>
                </label>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {paginatedPatients.length > 0 ? (
                    <>
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Mobile</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Gender</th>
                                    <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date of Birth</th>
                                    {showUpcomingOnly && <th className="px-5 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Next Due Date</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPatients.map(p => {
                                    const nextDueDate = showUpcomingOnly ? getNextDueDate(p) : null;
                                    const isDueSoon = nextDueDate && (nextDueDate.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 3600 * 24) <= 7;
                                    return (
                                        <tr key={p.id} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors" onClick={() => setSelectedPatientId(p.id)}>
                                            <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                                <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap font-semibold">{p.name}</p>
                                            </td>
                                            <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                                <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{p.mobile}</p>
                                            </td>
                                            <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                                <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{p.gender || 'N/A'}</p>
                                            </td>
                                            <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                                <p className="text-slate-900 dark:text-slate-100 whitespace-no-wrap">{formatDisplayDate(p.dob)}</p>
                                            </td>
                                            {showUpcomingOnly && (
                                                <td className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-sm">
                                                    {nextDueDate && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDueSoon ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                                                            {nextDueDate.toLocaleDateString('en-GB')}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                     {/* Mobile Card View */}
                    <div className="md:hidden p-4 space-y-3">
                        {paginatedPatients.map(p => {
                            const nextDueDate = showUpcomingOnly ? getNextDueDate(p) : null;
                            const isDueSoon = nextDueDate && (nextDueDate.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 3600 * 24) <= 7;
                            return (
                                <div key={p.id} className="bg-white dark:bg-slate-800/95 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-brand-primary" onClick={() => setSelectedPatientId(p.id)}>
                                    <p className="font-bold text-brand-secondary dark:text-slate-100">{p.name}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{p.mobile}</p>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
                                        <span>{p.gender || 'N/A'}</span>
                                        <span>DOB: {formatDisplayDate(p.dob)}</span>
                                        {nextDueDate && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDueSoon ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                                                Due: {nextDueDate.toLocaleDateString('en-GB')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                ) : (
                    <EmptyState 
                        message={searchTerm || showUpcomingOnly ? "No Patients Match Your Filters" : "No Patient Records"}
                        subtext={searchTerm || showUpcomingOnly ? "Try adjusting your search or filter criteria." : "Get started by adding your first patient record."}
                    />
                )}
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredPatients.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {isFormOpen && (
                <PatientForm
                    patient={null}
                    doctors={doctors}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSavePatient}
                />
            )}
             {isBulkImportOpen && (
                <BulkPatientImport
                    existingPatients={patients}
                    onClose={() => setIsBulkImportOpen(false)}
                    onSave={handleSaveBulkPatients}
                />
            )}
        </div>
    );
};

export default Patients;