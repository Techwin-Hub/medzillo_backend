// components/ClinicDashboard.tsx (Corrected Version)

import React, { useMemo, useState } from 'react';
import { Patient, Appointment, View, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { QuickActions } from './QuickActions';
import { UserPlusIcon, CalendarDaysIcon, BillingIcon } from './icons';
import { useClinicData } from '../contexts/ClinicDataContext';

interface ClinicDashboardProps {
    patients: Patient[];
    appointments: Appointment[];
    theme: 'light' | 'dark';
    setActiveView: (view: View) => void;
}

const MetricCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-slate-200 dark:border-slate-700">
    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);

const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ patients, appointments, theme, setActiveView }) => {
    const totalPatients = patients.length;

    const today = new Date();
    today.setHours(0,0,0,0);

    const todaysAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        aptDate.setHours(0,0,0,0);
        return aptDate.getTime() === today.getTime() && apt.status === 'Scheduled';
    });
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const consultationsThisMonth = patients.reduce((acc, patient) => {
        // THIS IS THE CORRECTED LINE
        const count = (patient.consultations || []).filter(con => {
            const conDate = new Date(con.date);
            return conDate.getMonth() === currentMonth && conDate.getFullYear() === currentYear;
        }).length;
        return acc + count;
    }, 0);

    const getWeeklyConsultationData = () => {
        const last7Days = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        }).reverse();

        const data = last7Days.map(day => {
            const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
            let count = 0;
            patients.forEach(p => {
                (p.consultations || []).forEach(c => {
                    if (new Date(c.date).toDateString() === day.toDateString()) {
                        count++;
                    }
                });
            });
            return { name: dayStr, consultations: count };
        });
        return data;
    }
    const weeklyConsultationData = getWeeklyConsultationData();
    
    const isDarkMode = theme === 'dark';
    const textColor = isDarkMode ? '#e2e8f0' : '#334155';
    const labelColor = isDarkMode ? '#f1f5f9' : '#0f172a';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

    const adminActions = [
      { label: 'New Patient', view: 'patients' as View, icon: UserPlusIcon, color: 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800' },
      { label: 'Appointments', view: 'appointments' as View, icon: CalendarDaysIcon, color: 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800' },
      { label: 'New Bill', view: 'billing' as View, icon: BillingIcon, color: 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800' },
    ];

    return (
        <div>
            <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 mb-6">Clinic Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard title="Total Patients" value={totalPatients.toString()} color="text-brand-primary" />
                <MetricCard title="Today's Appointments" value={todaysAppointments.length.toString()} color="text-success" />
                <MetricCard title="Consultations This Month" value={consultationsThisMonth.toString()} color="text-indigo-500" />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Weekly Consultation Trend</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                           <BarChart data={weeklyConsultationData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="name" stroke={textColor} fontSize={12} />
                                <YAxis allowDecimals={false} stroke={textColor} fontSize={12}/>
                                <Tooltip 
                                    wrapperClassName="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:bg-slate-900 dark:border-slate-700"
                                    labelStyle={{ color: labelColor, fontWeight: 'bold' }}
                                    itemStyle={{ color: textColor }}
                                    cursor={{ fill: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(203, 213, 225, 0.5)' }}
                                />
                                <Bar dataKey="consultations" fill="#60a5fa" name="Consultations" radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <QuickActions title="Quick Actions" actions={adminActions} setActiveView={setActiveView} />
                </div>
            </div>
        </div>
    );
};

export default ClinicDashboard;