// components/CalendarView.tsx (FINAL CORRECTED VERSION)

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Appointment, AppointmentStatus, Vitals, Patient, User } from '../types';
import { VitalsForm } from './VitalsForm';
import { HeartIcon, CalendarDaysIcon, WhatsAppIcon, ChevronDownIcon, DeleteIcon } from './icons';
import { useClinicData } from '../contexts/ClinicDataContext';
import { useToast } from '../hooks/useToast';
import { AppointmentForm } from './AppointmentForm';
import { ConfirmModal } from './ConfirmModal';

interface CalendarViewProps {
    appointments: Appointment[];
    patients: Patient[];
    doctors: User[];
    onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
    addVitalsForAppointment: (appointment: Appointment, vitals: Vitals) => void;
}

const statusColors: { [key in AppointmentStatus]: { base: string, text: string, border: string } } = {
    Scheduled: { base: 'bg-blue-50 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500' },
    Completed: { base: 'bg-green-50 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300', border: 'border-green-500' },
    Cancelled: { base: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200', border: 'border-slate-400' },
    'No Show': { base: 'bg-red-50 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300', border: 'border-red-500' },
    'Ready for Billing': { base: 'bg-yellow-50 dark:bg-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-500' },
};

const AppointmentCard: React.FC<{ 
    appointment: Appointment, 
    patient: Patient | undefined,
    onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void,
    onAddVitals: () => void,
}> = ({ appointment, patient, onUpdateStatus, onAddVitals }) => {
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isVitalsVisible, setIsVitalsVisible] = useState(false);
    const statusMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setIsChangingStatus(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleStatusChange = (newStatus: AppointmentStatus) => {
        onUpdateStatus(appointment.id, newStatus);
        setIsChangingStatus(false);
    };

    const startTime = new Date(appointment.startTime);
    
    const vitalsConsultation = (patient?.consultations || []).find(c => c.id === `con_vitals_${appointment.id}`);
    const hasVitals = !!vitalsConsultation;
    const statusStyle = statusColors[appointment.status];

    return (
        <div className={`${statusStyle.base} p-4 rounded-lg border-l-4 ${statusStyle.border}`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-4">
                     <div className="w-20 text-center">
                        <p className={`text-xl font-bold ${statusStyle.text}`}>{startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{appointment.patientName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">with {appointment.doctorName}</p>
                    </div>
                </div>
                <div className="flex items-center flex-wrap justify-end gap-3 sm:gap-4 self-end sm:self-center">
                    {patient && appointment.status === 'Scheduled' && (
                        <button 
                            onClick={() => handleSendReminder(appointment, patient)}
                            className="flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" 
                            title="Send WhatsApp Reminder"
                        >
                            <WhatsAppIcon className="w-5 h-5"/>
                        </button>
                    )}
                    {appointment.status === 'Scheduled' && (
                        <div 
                            className="relative"
                            onMouseEnter={() => hasVitals && setIsVitalsVisible(true)}
                            onMouseLeave={() => hasVitals && setIsVitalsVisible(false)}
                        >
                            <button
                                onClick={onAddVitals}
                                disabled={hasVitals}
                                className={`flex items-center text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
                                    hasVitals
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 cursor-not-allowed opacity-70'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                                }`}
                                title={hasVitals ? "Vitals have already been added" : "Add Patient Vitals"}
                            >
                                <HeartIcon className={`w-5 h-5 mr-1.5 ${hasVitals ? 'text-green-500' : 'text-slate-500'}`}/>
                                {hasVitals ? 'Vitals Added' : 'Add Vitals'}
                            </button>
                            {isVitalsVisible && vitalsConsultation && (
                                <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-md shadow-lg z-20 p-3 text-sm">
                                    <h4 className="font-bold mb-2 text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-1">Saved Vitals</h4>
                                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                                        {vitalsConsultation.bloodPressure && <li><strong>BP:</strong> {vitalsConsultation.bloodPressure} mmHg</li>}
                                        {vitalsConsultation.pulse && <li><strong>Pulse:</strong> {vitalsConsultation.pulse} bpm</li>}
                                        {vitalsConsultation.temperature && <li><strong>Temp:</strong> {vitalsConsultation.temperature}°F</li>}
                                        {vitalsConsultation.oxygenSaturation && <li><strong>SpO2:</strong> {vitalsConsultation.oxygenSaturation}%</li>}
                                        {vitalsConsultation.weight && <li><strong>Weight:</strong> {vitalsConsultation.weight} kg</li>}
                                        {vitalsConsultation.height && <li><strong>Height:</strong> {vitalsConsultation.height} cm</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={statusMenuRef} className="relative">
                        <button onClick={() => setIsChangingStatus(!isChangingStatus)} className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${statusStyle.base} ${statusStyle.text} border border-transparent hover:border-current`}>
                            {appointment.status} <ChevronDownIcon className="w-4 h-4"/>
                        </button>
                        {isChangingStatus && (
                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-lg z-10">
                                {(['Scheduled', 'Completed', 'Cancelled', 'No Show'] as AppointmentStatus[]).map(status => (
                                    <button key={status} onClick={() => handleStatusChange(status)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        {status}
                                    </button>
                                ))}
                           </div>
                       )}
                   </div>
               </div>
           </div>
        </div>
    );
};

const EmptyState: React.FC<{ message: string; subtext: string }> = ({ message, subtext }) => (
    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
      <CalendarDaysIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600"/>
      <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">{message}</h3>
      <p className="mt-2 text-sm">{subtext}</p>
    </div>
);

const handleSendReminder = (appointment: Appointment, patient: Patient) => {
    if (!patient || !patient.mobile) {
        alert('Patient mobile number is not available.');
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
    
    const date = new Date(appointment.startTime).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const time = new Date(appointment.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    const message = `Hi ${patient.name}, this is a reminder for your appointment with ${appointment.doctorName} on ${date} at ${time}. We look forward to seeing you!`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(url, '_blank', 'noopener,noreferrer');
};

const UpcomingAppointmentItem: React.FC<{
    appointment: Appointment;
    patient: Patient | undefined;
    onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
}> = ({ appointment, patient, onUpdateStatus }) => {
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const statusMenuRef = useRef<HTMLDivElement>(null);
    const startTime = new Date(appointment.startTime);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setIsChangingStatus(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const handleStatusChange = (newStatus: AppointmentStatus) => {
        onUpdateStatus(appointment.id, newStatus);
        setIsChangingStatus(false);
    };

    const statusStyle = statusColors[appointment.status];

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border-l-4 ${statusStyle.border} ${statusStyle.base}`}>
            <div className="w-full sm:w-24 text-left sm:text-center">
                <p className={`text-lg font-bold ${statusStyle.text}`}>{startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            </div>
            <div className="flex-grow w-full">
                <div className="flex items-baseline gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{appointment.patientName}</p>
                    {patient?.mobile && <p className="text-sm text-slate-500 dark:text-slate-400">{patient.mobile}</p>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">with {appointment.doctorName}</p>
            </div>
            <div className="flex items-center gap-4 self-end sm:self-center">
                {patient && appointment.status === 'Scheduled' && (
                    <button 
                        onClick={() => handleSendReminder(appointment, patient)}
                        className="flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" 
                        title="Send WhatsApp Reminder"
                    >
                        <WhatsAppIcon className="w-5 h-5"/>
                    </button>
                )}
                <div ref={statusMenuRef} className="relative">
                     <button onClick={() => setIsChangingStatus(!isChangingStatus)} className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${statusStyle.base} ${statusStyle.text} border border-transparent hover:border-current`}>
                        {appointment.status} <ChevronDownIcon className="w-4 h-4"/>
                    </button>
                    {isChangingStatus && (
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-lg z-10">
                            {(['Scheduled', 'Completed', 'Cancelled', 'No Show'] as AppointmentStatus[]).map(status => (
                                <button key={status} onClick={() => handleStatusChange(status)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    {status}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const formatDateHeader = (dateStr: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointmentDate = new Date(`${dateStr}T00:00:00`);

    if (appointmentDate.getTime() === tomorrow.getTime()) {
        return `Tomorrow, ${appointmentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }

    return appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const TabButton: React.FC<{ label: string; count: number; isActive: boolean; onClick: () => void; }> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-semibold text-center border-b-2 transition-colors duration-200 focus:outline-none ${
            isActive
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        aria-selected={isActive}
        role="tab"
    >
        {label}
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs transition-colors duration-200 ${
            isActive
                ? 'bg-brand-primary text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}>
            {count}
        </span>
    </button>
);

type UpcomingReview = {
    patientId: string;
    patientName: string;
    patientMobile: string;
    doctorId: string;
    doctorName: string;
    reviewDate: string;
    consultationId: string;
};
type GroupedReviews = Record<string, { doctorName: string; reviews: UpcomingReview[] }>;


export const CalendarView: React.FC<CalendarViewProps> = ({ appointments, patients, doctors, onUpdateStatus, addVitalsForAppointment }) => {
    const [vitalsModalAppointment, setVitalsModalAppointment] = useState<Appointment | null>(null);
    const [todayDoctorFilter, setTodayDoctorFilter] = useState('all');
    const [upcomingDoctorFilter, setUpcomingDoctorFilter] = useState('all');
    const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'reviews'>('today');
    const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

    const { patients: patientsContext, admin, setActiveView } = useClinicData();
    const { updatePatient, scheduleAppointmentFromReview } = patientsContext;
    const { addToast } = useToast();
    const clinicName = admin.pharmacyInfo.name || 'Your Clinic';
    
    const [appointmentModalData, setAppointmentModalData] = useState<{ patientId: string; doctorId: string; date: string; consultationId: string; } | null>(null);
    const [clearingReview, setClearingReview] = useState<{ patientId: string; consultationId: string; patientName: string; } | null>(null);
    
    const tabs: ('today' | 'upcoming' | 'reviews')[] = ['today', 'upcoming', 'reviews'];
    const prevTabIndexRef = useRef(tabs.indexOf(activeTab));
    const touchStartRef = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const changeTab = (newTab: 'today' | 'upcoming' | 'reviews') => {
        const newIndex = tabs.indexOf(newTab);
        const oldIndex = prevTabIndexRef.current;
        
        if (newIndex > oldIndex) setAnimationDirection('right');
        else if (newIndex < oldIndex) setAnimationDirection('left');
        else setAnimationDirection(null);

        setActiveTab(newTab);
        prevTabIndexRef.current = newIndex;
    };

    const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.targetTouches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile || touchStartRef.current === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const distance = touchStartRef.current - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        const currentIndex = tabs.indexOf(activeTab);
        if (isLeftSwipe && currentIndex < tabs.length - 1) changeTab(tabs[currentIndex + 1]);
        else if (isRightSwipe && currentIndex > 0) changeTab(tabs[currentIndex - 1]);
        touchStartRef.current = null;
    };

    const upcomingReviews = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const reviews: UpcomingReview[] = [];

        (patients || []).forEach(patient => {
            (patient.consultations || []).forEach(con => {
                if (con.nextReviewDate) {
                    const reviewDateUTC = new Date(con.nextReviewDate + 'T00:00:00');
                    if (reviewDateUTC >= today) {
                        reviews.push({ patientId: patient.id, patientName: patient.name, patientMobile: patient.mobile, doctorId: con.doctorId, doctorName: con.doctorName, reviewDate: con.nextReviewDate, consultationId: con.id });
                    }
                }
            });
        });

        reviews.sort((a, b) => new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime());
        return reviews.reduce((acc: GroupedReviews, review) => {
            if (!acc[review.doctorId]) acc[review.doctorId] = { doctorName: review.doctorName, reviews: [] };
            acc[review.doctorId].reviews.push(review);
            return acc;
        }, {} as GroupedReviews);
    }, [patients]);

    const totalReviews = useMemo(() => Object.values(upcomingReviews).reduce((sum: number, group: { reviews: any[] }) => sum + group.reviews.length, 0), [upcomingReviews]);

    const { todayAppointments, upcomingAppointments } = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0); const todayMillis = today.getTime();
        let todayApts: Appointment[] = []; let upcomingApts: Appointment[] = [];
        (appointments || []).forEach(apt => {
            const aptDate = new Date(apt.startTime); aptDate.setHours(0, 0, 0, 0); const aptMillis = aptDate.getTime();
            if (aptMillis === todayMillis) todayApts.push(apt);
            else if (aptMillis > todayMillis) upcomingApts.push(apt);
        });
        if (todayDoctorFilter !== 'all') todayApts = todayApts.filter(apt => apt.doctorId === todayDoctorFilter);
        if (upcomingDoctorFilter !== 'all') upcomingApts = upcomingApts.filter(apt => apt.doctorId === upcomingDoctorFilter);
        todayApts.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        upcomingApts.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return { todayAppointments: todayApts, upcomingAppointments: upcomingApts };
    }, [appointments, todayDoctorFilter, upcomingDoctorFilter]);

    const groupedUpcomingAppointments = useMemo(() => {
        return (upcomingAppointments || []).reduce((acc, apt) => {
            const date = new Date(apt.startTime).toISOString().split('T')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(apt);
            return acc;
        }, {} as Record<string, Appointment[]>);
    }, [upcomingAppointments]);
    
    const handleSendReviewReminder = (review: { patientName: string, patientMobile: string, doctorName: string, reviewDate: string }) => {
        let phoneNumber;
        if (review.patientMobile.startsWith('+')) phoneNumber = review.patientMobile.replace(/\D/g, '');
        else { let cleaned = review.patientMobile.replace(/\D/g, ''); if (cleaned.startsWith('0')) cleaned = cleaned.substring(1); phoneNumber = `91${cleaned}`; }
        const formattedDate = new Date(review.reviewDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const message = `Hi ${review.patientName}, this is a reminder for your review with ${review.doctorName} on ${formattedDate}. Kindly confirm.\n\nThank you,\n${clinicName}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    };

    const handleScheduleReviewAppointment = (review: UpcomingReview) => {
        const today = new Date(); today.setHours(0,0,0,0); const reviewDate = new Date(review.reviewDate + 'T00:00:00Z');
        const aptDate = reviewDate >= today ? reviewDate : today;
        setAppointmentModalData({ patientId: review.patientId, doctorId: review.doctorId, date: aptDate.toISOString().split('T')[0], consultationId: review.consultationId });
    };

    const handleConfirmClearReview = () => {
        if (!clearingReview) return;
        const patientToUpdate = (patients || []).find(p => p.id === clearingReview.patientId);
        if (!patientToUpdate) return;
        const updatedConsultations = (patientToUpdate.consultations || []).map(con => con.id === clearingReview.consultationId ? { ...con, nextReviewDate: undefined } : con);
        updatePatient({ ...patientToUpdate, consultations: updatedConsultations });
        addToast('Review schedule cleared.', 'success');
        setClearingReview(null);
    };

    const patientForVitals = vitalsModalAppointment ? (patients || []).find(p => p.id === vitalsModalAppointment.patientId) : null;
    const existingVitals = patientForVitals?.consultations?.find(c => c.id === `con_vitals_${vitalsModalAppointment?.id}`)?.vitals;
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'today':
                return (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-end mb-4">
                            <label htmlFor="today-doctor-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-2 self-center">Doctor:</label>
                            <select id="today-doctor-filter" value={todayDoctorFilter} onChange={(e) => setTodayDoctorFilter(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 text-sm">
                                <option value="all">All Doctors</option>
                                {(doctors || []).map(doc => (<option key={doc.id} value={doc.id}>{doc.name}</option>))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            {(todayAppointments || []).length > 0 ? todayAppointments.map(apt => {
                                const patient = (patients || []).find(p => p.id === apt.patientId);
                                return ( <AppointmentCard key={apt.id} appointment={apt} patient={patient} onUpdateStatus={onUpdateStatus} onAddVitals={() => setVitalsModalAppointment(apt)}/>);
                            }) : <EmptyState message="No Appointments Today" subtext="The schedule for today is clear." />}
                        </div>
                    </div>
                );
            case 'upcoming':
                return (
                     <div className="p-4 sm:p-6">
                         <div className="flex justify-end mb-4">
                            <label htmlFor="upcoming-doctor-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-2 self-center">Doctor:</label>
                            <select id="upcoming-doctor-filter" value={upcomingDoctorFilter} onChange={(e) => setUpcomingDoctorFilter(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 text-sm">
                                <option value="all">All Doctors</option>
                                {(doctors || []).map(doc => (<option key={doc.id} value={doc.id}>{doc.name}</option>))}
                            </select>
                        </div>
                         <div className="space-y-3">
                            {Object.keys(groupedUpcomingAppointments).length > 0 ? (
                                Object.keys(groupedUpcomingAppointments).map(date => (
                                    <div key={date}>
                                        <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 my-3">{formatDateHeader(date)}</h4>
                                        <div className="space-y-3">
                                            {groupedUpcomingAppointments[date].map(apt => {
                                                const patient = (patients || []).find(p => p.id === apt.patientId);
                                                return ( <UpcomingAppointmentItem key={apt.id} appointment={apt} patient={patient} onUpdateStatus={onUpdateStatus}/> );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : ( <EmptyState message="No Upcoming Appointments" subtext="There are no appointments scheduled for the future." /> )}
                        </div>
                     </div>
                );
            case 'reviews':
                 return (
                    <div className="p-4 sm:p-6">
                        {Object.keys(upcomingReviews).length > 0 ? (
                            <div className="space-y-6">
                                {Object.keys(upcomingReviews).map(doctorId => {
                                    const data = upcomingReviews[doctorId];
                                    return (
                                        <div key={doctorId}>
                                            <h4 className="font-semibold text-brand-primary mb-2 border-b dark:border-slate-700 pb-1">{data.doctorName}</h4>
                                            <ul className="space-y-2 max-h-96 overflow-y-auto">
                                                {data.reviews.map(review => (
                                                    <li key={`${review.patientId}-${review.reviewDate}`} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <div className="w-full sm:w-auto">
                                                            <p className="font-medium text-slate-800 dark:text-slate-200">{review.patientName}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{review.patientMobile}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 self-end sm:self-center mt-2 sm:mt-0">
                                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date(review.reviewDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            <button onClick={() => handleScheduleReviewAppointment(review)} className="p-1.5 rounded-full text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Schedule New Appointment"><CalendarDaysIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => handleSendReviewReminder(review)} className="p-1.5 rounded-full text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors hover:bg-green-100 dark:hover:bg-green-900/50" title="Send WhatsApp Reminder"><WhatsAppIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => setClearingReview({ ...review })} title="Clear this review from the list" className="p-1.5 rounded-full text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState message="No Scheduled Reviews" subtext="Future patient reviews will be listed here." />
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Appointment Tabs">
                    <TabButton label={`Today (${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})`} count={todayAppointments.length} isActive={activeTab === 'today'} onClick={() => changeTab('today')} />
                    <TabButton label="Upcoming" count={upcomingAppointments.length} isActive={activeTab === 'upcoming'} onClick={() => changeTab('upcoming')} />
                    <TabButton label="Reviews" count={totalReviews} isActive={activeTab === 'reviews'} onClick={() => changeTab('reviews')} />
                </div>
                <div role="tabpanel" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                   <div key={activeTab} className={ animationDirection === 'right' ? 'animate-slide-in-from-right' : animationDirection === 'left' ? 'animate-slide-in-from-left' : '' }>
                        {renderTabContent()}
                    </div>
                </div>
            </div>
            {vitalsModalAppointment && <VitalsForm appointment={vitalsModalAppointment} existingVitals={existingVitals} onClose={() => setVitalsModalAppointment(null)} onSave={(vitals) => { addVitalsForAppointment(vitalsModalAppointment, vitals); setVitalsModalAppointment(null); }}/>}
            {appointmentModalData && <AppointmentForm patients={patients || []} doctors={doctors || []} initialPatientId={appointmentModalData.patientId} initialDoctorId={appointmentModalData.doctorId} initialDate={appointmentModalData.date} onClose={() => setAppointmentModalData(null)} onSave={(aptData) => { if (appointmentModalData?.consultationId) { scheduleAppointmentFromReview({ ...aptData, status: 'Scheduled' }, appointmentModalData.consultationId); setAppointmentModalData(null); setActiveView('appointments'); }}}/>}
            <ConfirmModal isOpen={!!clearingReview} onClose={() => setClearingReview(null)} onConfirm={handleConfirmClearReview} title="Clear Scheduled Review" message={`Are you sure you want to clear the review for ${clearingReview?.patientName}? This will remove the 'Next Review Date' from the consultation.`}/>
        </div>
    );
};