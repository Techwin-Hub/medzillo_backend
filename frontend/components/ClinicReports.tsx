import React, { useState, useMemo, useEffect } from 'react';
import { Patient, Appointment, User, AppointmentStatus, Bill } from '../types';
import { ArrowDownTrayIcon, UsersIcon, ClipboardDocumentCheckIcon, CalendarDaysIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { Pagination } from './Pagination';
import { useClinicData } from '../contexts/ClinicDataContext';

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

interface ClinicReportsProps {
    patients: Patient[];
    appointments: Appointment[];
    doctors: User[];
}

const ReportCard: React.FC<{ title: string, value: number, icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div className="flex items-center gap-3">
            <Icon className="w-8 h-8 text-brand-primary"/>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    </div>
);

export const ClinicReports: React.FC<ClinicReportsProps> = ({ patients, appointments, doctors }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(todayStr);
    const { addToast } = useToast();
    const { billing } = useClinicData();
    const { bills } = billing;
    
    const inputClass = "mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary";

    const filteredAppointments = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        return appointments.filter(apt => {
            const aptDate = new Date(apt.startTime);
            return aptDate >= start && aptDate <= end;
        });
    }, [appointments, startDate, endDate]);
    
    const reportSummary = useMemo(() => {
        const totalAppointments = filteredAppointments.length;
        const statusCounts = filteredAppointments.reduce((acc, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
        }, {} as Record<AppointmentStatus, number>);
        
        const uniquePatientIds = new Set(filteredAppointments.map(apt => apt.patientId));
        
        const newPatients = patients.filter(p => {
            // Gracefully handle patients with no consultations or undefined consultation arrays.
            if (!p.consultations || p.consultations.length === 0) {
                // The original logic defaulted to Date.now() for patients without consultations.
                // We will maintain this behavior to count newly registered patients without consultations.
                const regDate = new Date();
                const start = new Date(startDate); start.setHours(0, 0, 0, 0);
                const end = new Date(endDate); end.setHours(23, 59, 59, 999);
                return regDate >= start && regDate <= end;
            }
            
            // To accurately find the registration date, find the earliest consultation.
            const firstConsultationDate = p.consultations.reduce((earliest, current) => {
                const currentDate = new Date(current.date);
                return currentDate < earliest ? currentDate : earliest;
            }, new Date(p.consultations[0].date));
        
            const regDate = firstConsultationDate;
            const start = new Date(startDate); start.setHours(0,0,0,0);
            const end = new Date(endDate); end.setHours(23,59,59,999);
            return regDate >= start && regDate <= end;
        });

        return {
            totalAppointments,
            completed: statusCounts['Completed'] || 0,
            scheduled: statusCounts['Scheduled'] || 0,
            cancelled: statusCounts['Cancelled'] || 0,
            noShow: statusCounts['No Show'] || 0,
            uniquePatients: uniquePatientIds.size,
            newPatients: newPatients.length,
        }
    }, [filteredAppointments, patients, startDate, endDate]);

    const exportAppointmentReport = () => {
        const getFirstConsultationDate = (patient: Patient | undefined): Date | null => {
            if (!patient || !patient.consultations || patient.consultations.length === 0) {
                return null;
            }
            const sortedConsultations = [...patient.consultations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return new Date(sortedConsultations[0].date);
        };
    
        const calculateAge = (dobStr: string | undefined, atDate: Date): number | null => {
            if (!dobStr) return null;
            const parts = dobStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
            if (!parts) return null;
            const [, day, month, year] = parts;
            const birthDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
            if (isNaN(birthDate.getTime())) return null;

            let age = atDate.getFullYear() - birthDate.getFullYear();
            const m = atDate.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && atDate.getDate() < birthDate.getDate())) {
                age--;
            }
            return Math.max(0, age);
        };

        const data = filteredAppointments.map(apt => {
            const appointmentDate = new Date(apt.startTime);
            const patient = patients.find(p => p.id === apt.patientId);
            const bill = bills.find(b => b.appointmentId === apt.id);

            const firstConsultationDate = getFirstConsultationDate(patient);
            const patientType = firstConsultationDate && 
                                new Date(firstConsultationDate.toDateString()).getTime() === new Date(appointmentDate.toDateString()).getTime()
                                ? 'New' : 'Existing';
            
            const age = patient ? calculateAge(patient.dob, appointmentDate) : null;

            let billedAmount: string;
            if (bill) {
                billedAmount = `₹${bill.totalAmount.toFixed(2)}`;
            } else if (apt.status === 'Ready for Billing') {
                billedAmount = 'Pending';
            } else {
                billedAmount = 'N/A';
            }

            return {
                'Appointment Date': appointmentDate.toLocaleDateString('en-GB'),
                'Time': appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                'Patient Name': apt.patientName,
                'Age': age !== null ? age : 'N/A',
                'Gender': patient?.gender || 'N/A',
                'Doctor Name': apt.doctorName,
                'Billed Amount': billedAmount,
                'Payment Mode': bill?.paymentMode || 'N/A',
                'Status': apt.status,
                'Patient Type': patientType,
            };
        });
        handleExportCSV(data, `clinic-report-${startDate}-to-${endDate}.csv`, addToast as any);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 mb-6">Clinic Reports</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
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
                    <button onClick={exportAppointmentReport} disabled={filteredAppointments.length === 0} className="w-full md:w-auto flex items-center justify-center text-sm bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover disabled:bg-slate-400 shadow-sm">
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Export Report
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ReportCard title="Total Appointments" value={reportSummary.totalAppointments} icon={CalendarDaysIcon} />
                    <ReportCard title="Completed Consultations" value={reportSummary.completed} icon={ClipboardDocumentCheckIcon} />
                    <ReportCard title="Unique Patients" value={reportSummary.uniquePatients} icon={UsersIcon} />
                    <ReportCard title="New Patient Registrations" value={reportSummary.newPatients} icon={UsersIcon} />
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Appointments by Doctor</h3>
                    <div className="space-y-4">
                        {doctors.map(doctor => {
                            const doctorAppointments = filteredAppointments.filter(apt => apt.doctorId === doctor.id);
                            if (doctorAppointments.length === 0) return null;
                            return (
                                <div key={doctor.id} className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <p className="font-semibold text-brand-secondary dark:text-slate-100">{doctor.name}</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mt-2">
                                        <p><strong>Total:</strong> {doctorAppointments.length}</p>
                                        <p><strong>Completed:</strong> {doctorAppointments.filter(a=>a.status === 'Completed').length}</p>
                                        <p><strong>Cancelled:</strong> {doctorAppointments.filter(a=>a.status === 'Cancelled').length}</p>
                                        <p><strong>No Shows:</strong> {doctorAppointments.filter(a=>a.status === 'No Show').length}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};