import React from 'react';
import { View } from '../types';

interface QuickAction {
    label: string;
    view: View;
    icon: React.ElementType;
    color: string;
}

interface QuickActionsProps {
    title: string;
    actions: QuickAction[];
    setActiveView: (view: View) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ title, actions, setActiveView }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">{title}</h3>
            <div className="flex flex-wrap justify-center gap-4">
                {actions.map(({ label, view, icon: Icon, color }) => (
                    <button
                        key={view}
                        onClick={() => setActiveView(view)}
                        className={`flex flex-col items-center justify-center text-center p-4 rounded-lg transition-colors duration-200 ${color} w-24`}
                    >
                        <Icon className="w-8 h-8 mb-2" />
                        <span className="text-sm font-semibold">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
