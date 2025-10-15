// components/DoctorDashboard.tsx (Corrected Version)

import React, { useState, useMemo, useEffect } from 'react';
import { Patient, Appointment, View, User, TodoItem } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QuickActions } from './QuickActions';
import { PatientsIcon, CalendarDaysIcon, ReportsIcon, PlusIcon, DeleteIcon, ArrowRightIcon, HandThumbUpIcon, CheckCircleIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { useClinicData } from '../contexts/ClinicDataContext';

interface DoctorDashboardProps {
    theme: 'light' | 'dark';
    currentUser: User;
    patients: Patient[];
    appointments: Appointment[];
    todos: TodoItem[];
    addTodo: (task: string, dueDate: string | null) => void;
    updateTodoStatus: (todoId: string, isCompleted: boolean) => void;
    deleteTodo: (todoId: string) => void;
    setActiveView: (view: View) => void;
}

const MetricCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
);

const TodoList: React.FC<{ 
    todos: TodoItem[]; 
    addTodo: (task: string, dueDate: string | null) => void; 
    updateTodoStatus: (todoId: string, isCompleted: boolean) => void;
    deleteTodo: (todoId: string) => void;
}> = ({ todos, addTodo, updateTodoStatus, deleteTodo }) => {
    const [newTask, setNewTask] = useState('');
    const [dueDate, setDueDate] = useState('');
    const { addToast } = useToast();

    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim()) {
            addTodo(newTask.trim(), dueDate || null);
            setNewTask('');
            setDueDate('');
        } else {
            addToast('Task cannot be empty.', 'warning');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">My To-Do List</h3>
            <form onSubmit={handleAddTodo} className="space-y-2 mb-4">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newTask} 
                        onChange={e => setNewTask(e.target.value)} 
                        placeholder="Add a new task..." 
                        className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                    />
                    <button type="submit" className="flex-shrink-0 bg-brand-primary text-white p-2 rounded-md hover:bg-brand-primary-hover flex items-center justify-center">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                    min={new Date().toISOString().split("T")[0]}
                />
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {todos.length > 0 ? todos.map(todo => (
                    <div key={todo.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                checked={todo.isCompleted} 
                                onChange={(e) => updateTodoStatus(todo.id, e.target.checked)}
                                className="h-5 w-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <div>
                                <span className={`text-slate-800 dark:text-slate-200 ${todo.isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                                    {todo.task}
                                </span>
                                {todo.dueDate && !todo.isCompleted && <p className="text-xs text-slate-500 dark:text-slate-400">Due: {new Date(todo.dueDate).toLocaleDateString()}</p>}
                            </div>
                        </div>
                        <button onClick={() => deleteTodo(todo.id)} className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100"><DeleteIcon className="w-4 h-4"/></button>
                    </div>
                )) : <p className="text-center text-slate-500 dark:text-slate-400 py-4">No tasks yet. Add one above!</p>}
            </div>
        </div>
    );
};


const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ theme, currentUser, patients, appointments, todos, addTodo, updateTodoStatus, deleteTodo, setActiveView }) => {
    const { admin: { banners, bannerInterests, addBannerInterest, pharmacyInfo } } = useClinicData();
    const [isCarouselHovered, setIsCarouselHovered] = useState(false);
    
    const clinicCity = pharmacyInfo.city;

    const activeBanners = useMemo(() => {
        if (!banners) {
            return [];
        }
    
        const normalizedClinicCity = clinicCity?.trim().toLowerCase();

        const filteredBanners = banners.filter(banner => {
            if (!banner.isActive) return false;
            const isTargeted = Array.isArray(banner.targetCities) && banner.targetCities.length > 0;
            if (!isTargeted) return true;
            if (!normalizedClinicCity) return false;
            return banner.targetCities.some(target => target.trim().toLowerCase() === normalizedClinicCity);
        });
    
        return filteredBanners.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    }, [banners, clinicCity]);

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (activeBanners.length > 1 && !isCarouselHovered) {
            const timer = setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, activeBanners.length, isCarouselHovered]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + activeBanners.length) % activeBanners.length);
    };

    const BannerCarousel = () => {
        if (activeBanners.length === 0) {
            return null;
        }
        
        const currentBanner = activeBanners[currentIndex];
        const hasShownInterest = bannerInterests.some(i => i.bannerId === currentBanner.id && i.doctorId === currentUser.id);

        return (
            <div 
                className="relative w-full max-w-full mx-auto mb-6 group"
                onMouseEnter={() => setIsCarouselHovered(true)}
                onMouseLeave={() => setIsCarouselHovered(false)}
            >
                <div className="relative w-full pt-[33.33%] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
                    {activeBanners.map((banner, index) => (
                        <div 
                            key={banner.id} 
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0'}`}
                        >
                            <img 
                                src={banner.image} 
                                alt={banner.title} 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ))}
                     <div className="absolute bottom-4 right-4 z-20">
                        {hasShownInterest ? (
                             <span className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-sm font-semibold text-green-800 bg-green-100/80 dark:bg-green-900/80 dark:text-green-200 rounded-full sm:rounded-lg backdrop-blur-sm">
                                <CheckCircleIcon className="w-5 h-5"/>
                                <span className="hidden sm:inline sm:ml-2">Interest Submitted</span>
                            </span>
                        ) : (
                            <button
                                onClick={() => addBannerInterest(currentBanner.id)}
                                className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-sm font-semibold text-white bg-brand-primary/80 rounded-full sm:rounded-lg backdrop-blur-sm hover:bg-brand-primary transition-all duration-200 shadow-md"
                            >
                                <HandThumbUpIcon className="w-5 h-5"/>
                                <span className="hidden sm:inline sm:ml-2">I'm Interested</span>
                            </button>
                        )}
                    </div>
                </div>
                {activeBanners.length > 1 && (
                    <>
                        <button onClick={prevSlide} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <ArrowRightIcon className="w-6 h-6 transform rotate-180" />
                        </button>
                        <button onClick={nextSlide} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <ArrowRightIcon className="w-6 h-6" />
                        </button>
                    </>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {activeBanners.map((_, index) => (
                        <button 
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
        );
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysAppointments = (appointments || []).filter(apt => {
        const aptDate = new Date(apt.startTime);
        aptDate.setHours(0, 0, 0, 0);
        return apt.doctorId === currentUser.id && aptDate.getTime() === today.getTime() && (apt.status === 'Scheduled' || apt.status === 'Ready for Billing');
    });

    // THIS IS THE FIRST CORRECTED LINE
    const upcomingReviews = (patients || []).reduce((count, patient) => {
        const hasReview = (patient.consultations || []).some(con => 
            con.doctorId === currentUser.id && con.nextReviewDate && new Date(con.nextReviewDate) >= today
        );
        return hasReview ? count + 1 : count;
    }, 0);

    const consultationsThisWeek = (patients || []).reduce((acc, p) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return acc + (p.consultations || []).filter(c => c.doctorId === currentUser.id && new Date(c.date) >= sevenDaysAgo).length;
    }, 0);

    const doctorTodos = (todos || []).filter(t => t.doctorId === currentUser.id).sort((a,b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const getWeeklyConsultationData = () => {
        const last7Days = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        }).reverse();

        return last7Days.map(day => {
            const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
            let count = 0;
            (patients || []).forEach(p => {
                // THIS IS THE SECOND CORRECTED LINE
                (p.consultations || []).forEach(c => {
                    if (c.doctorId === currentUser.id && new Date(c.date).toDateString() === day.toDateString()) {
                        count++;
                    }
                });
            });
            return { name: dayStr, consultations: count };
        });
    };

    const isDarkMode = theme === 'dark';
    const textColor = isDarkMode ? '#e2e8f0' : '#334155';
    const labelColor = isDarkMode ? '#f1f5f9' : '#0f172a';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

    const doctorActions = [
      { label: "Today's Queue", view: 'todays-appointments' as View, icon: CalendarDaysIcon, color: 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800' },
      { label: 'All Patients', view: 'patients' as View, icon: PatientsIcon, color: 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800' },
      { label: 'Reports', view: 'consultation-reports' as View, icon: ReportsIcon, color: 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800' },
    ];
    
    return (
        <div>
            <BannerCarousel />
            <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 mb-6">Doctor's Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard title="Today's Appointments" value={todaysAppointments.length} color="text-brand-primary" />
                <MetricCard title="Consultations (Last 7 Days)" value={consultationsThisWeek} color="text-success" />
                <MetricCard title="Upcoming Patient Reviews" value={upcomingReviews} color="text-warning" />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Your Consultation Trend</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                           <LineChart data={getWeeklyConsultationData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="name" stroke={textColor} fontSize={12} />
                                <YAxis allowDecimals={false} stroke={textColor} fontSize={12}/>
                                <Tooltip 
                                    wrapperClassName="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:bg-slate-900 dark:border-slate-700"
                                    labelStyle={{ color: labelColor, fontWeight: 'bold' }}
                                    itemStyle={{ color: textColor }}
                                />
                                <Line type="monotone" dataKey="consultations" stroke="#8884d8" strokeWidth={2} name="Consultations" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <QuickActions title="Quick Actions" actions={doctorActions} setActiveView={setActiveView} />
                    <TodoList todos={doctorTodos} addTodo={addTodo} updateTodoStatus={updateTodoStatus} deleteTodo={deleteTodo} />
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;