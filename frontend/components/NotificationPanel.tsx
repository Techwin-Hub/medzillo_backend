import React from 'react';
import { Notification } from '../types';
import { BellIcon, ExclamationCircleIcon, HistoryIcon as ClockIcon } from './icons';

interface NotificationPanelProps {
    notifications: Notification[];
    onClearAll: () => void;
}

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'expiry':
            return <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full"><ClockIcon className="w-5 h-5 text-orange-500" /></div>;
        case 'low-stock':
            return <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full"><ExclamationCircleIcon className="w-5 h-5 text-yellow-500" /></div>;
        case 'out-of-stock':
            return <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full"><ExclamationCircleIcon className="w-5 h-5 text-danger" /></div>;
        default:
            return <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"><BellIcon className="w-5 h-5 text-slate-500" /></div>;
    }
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClearAll }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20">
            <div className="p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
                <button 
                    onClick={onClearAll} 
                    className="text-xs font-medium text-brand-primary hover:underline"
                    disabled={notifications.length === 0}
                >
                    Clear All
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div key={notification.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                            <NotificationIcon type={notification.type} />
                            <div className="flex-1">
                                <p className="text-sm text-slate-700 dark:text-slate-300">{notification.message}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatTimeAgo(notification.timestamp)}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center">
                        <BellIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">All caught up!</p>
                        <p className="text-xs text-slate-500">You have no new notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
