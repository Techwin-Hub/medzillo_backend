import React, { useState } from 'react';
import { LogoIcon, EnvelopeIcon, LockClosedIcon, SpinnerIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from './icons';

interface SuperAdminLoginPageProps {
    onLogin: (email: string, password: string) => Promise<boolean>;
    navigateToClinic: () => void;
}

export const SuperAdminLoginPage: React.FC<SuperAdminLoginPageProps> = ({ onLogin, navigateToClinic }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        setIsLoading(true);
        const success = await onLogin(email, password);
        if (!success) {
            setError('Invalid credentials for Super Admin.');
        }
        setIsLoading(false);
    };
    
    const inputClass = (hasError: boolean) => `block w-full rounded-md border-0 py-3 pl-10 pr-3 bg-white text-slate-900 ring-1 ring-inset ${hasError ? 'ring-red-500' : 'ring-slate-300'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition-all duration-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 ${hasError ? 'dark:ring-red-500' : 'dark:ring-slate-700'} dark:focus:ring-brand-accent`;
    const passwordInputClass = (hasError: boolean) => `${inputClass(hasError)} pr-10`;

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-brand-secondary text-white p-12 text-center">
                 <LogoIcon className="w-20 h-20 text-brand-accent" />
                 <h1 className="text-5xl font-bold mt-4">Medzillo</h1>
                 <p className="mt-4 text-lg text-slate-300">System Administrator Portal</p>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
                <div className="w-full max-w-sm">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-center mb-6">
                             <LogoIcon className="w-12 h-12 mx-auto text-brand-primary mb-2" />
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Administrator Login</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">Access the system-wide dashboard.</p>
                        </div>

                        {error && (
                            <div className="flex items-center p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-300" role="alert">
                                <ExclamationCircleIcon className="w-5 h-5 mr-2"/>
                                <span className="font-medium">{error}</span>
                            </div>
                        )}
                        
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="w-5 h-5 text-slate-400" /></span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className={inputClass(!!error)}/></div>
                            </div>
                            <div>
                                <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span><input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className={passwordInputClass(!!error)}/><button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"><span className="sr-only">{isPasswordVisible ? 'Hide password' : 'Show password'}</span>{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button></div>
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="group flex justify-center items-center w-full px-4 py-3 text-sm font-semibold text-white border border-transparent rounded-md shadow-sm bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-all duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                                    {isLoading ? <SpinnerIcon className="animate-spin w-5 h-5 text-white" /> : 'Sign In'}
                                </button>
                            </div>
                        </form>
                    </div>
                     <div className="mt-4 text-center">
                        <button onClick={navigateToClinic} className="text-xs text-slate-500 hover:text-brand-primary hover:underline">
                            Return to Clinic Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
