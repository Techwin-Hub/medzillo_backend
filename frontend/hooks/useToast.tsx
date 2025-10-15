import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, CloseIcon } from '../components/icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [{ id, message, type }, ...prev]);
        setTimeout(() => removeToast(id), 5000);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): { addToast: (message: string, type: ToastType) => void; } => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return { addToast: context.addToast };
};

const ToastIcons: Record<ToastType, React.ElementType> = {
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    warning: ExclamationCircleIcon,
    info: InformationCircleIcon,
};

const ToastStyles: Record<ToastType, { bg: string; text: string; icon: string }> = {
    success: { bg: 'bg-green-50 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', icon: 'text-green-500 dark:text-green-400' },
    error: { bg: 'bg-red-50 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', icon: 'text-red-500 dark:text-red-400' },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', icon: 'text-yellow-500 dark:text-yellow-400' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200', icon: 'text-blue-500 dark:text-blue-400' },
};

export const Toaster: React.FC = () => {
    const context = useContext(ToastContext);
    if (!context) return null;
    const { toasts, removeToast } = context;

    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-xs sm:max-w-sm space-y-3">
            {toasts.map((toast) => {
                const Icon = ToastIcons[toast.type];
                const styles = ToastStyles[toast.type];
                return (
                    <div key={toast.id} className={`flex items-start p-4 rounded-lg shadow-lg ${styles.bg} animate-fade-in-right`}>
                        <div className="flex-shrink-0"><Icon className={`w-6 h-6 ${styles.icon}`} /></div>
                        <div className="ml-3 w-0 flex-1 pt-0.5"><p className={`text-sm font-medium ${styles.text}`}>{toast.message}</p></div>
                        <div className="ml-4 flex-shrink-0 flex"><button onClick={() => removeToast(toast.id)} className={`inline-flex rounded-md p-1.5 ${styles.text} opacity-80 hover:opacity-100`}><CloseIcon className="w-5 h-5" /></button></div>
                    </div>
                );
            })}
            <style>{`
                @keyframes fade-in-right { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                .animate-fade-in-right { animation: fade-in-right 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};
