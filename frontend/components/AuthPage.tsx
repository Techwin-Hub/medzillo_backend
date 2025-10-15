// components/AuthPage.tsx (FINAL LIVE VERSION)

import React, { useState, useCallback } from 'react';
import { LogoIcon, UserIcon, EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon, BuildingOfficeIcon, EyeIcon, EyeSlashIcon, SpinnerIcon, LockOpenIcon } from './icons';
import { Modal } from './Modal';
import { TermsModal } from './TermsModal';
import { useClinicData } from '../contexts/ClinicDataContext';

interface AuthPageProps {
    navigateToSuperAdmin: () => void;
}

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const AuthPage: React.FC<AuthPageProps> = ({ navigateToSuperAdmin }) => {
    const { handleLogin, handleSendOtp, handleVerifyOtpAndRegister, resetPassword, verifyPasswordResetOtp } = useClinicData();

    const [isLoginView, setIsLoginView] = useState(true);
    const [viewData, setViewData] = useState({ clinicName: '', name: '', email: '', password: '' });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    
    const [registrationStep, setRegistrationStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(true);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [fpStep, setFpStep] = useState(1);
    const [fpEmail, setFpEmail] = useState('');
    const [fpNewPassword, setFpNewPassword] = useState('');
    const [fpConfirmPassword, setFpConfirmPassword] = useState('');
    const [fpErrors, setFpErrors] = useState<{ [key: string]: string }>({});

    const resetForms = () => {
        setErrors({}); setIsLoading(false); setViewData({ clinicName: '', name: '', email: '', password: '' });
        setRegistrationStep(1); setOtp(''); setTermsAccepted(true);
    };
    
    const resetFPForm = useCallback(() => {
        setIsForgotPasswordOpen(false); setFpStep(1); setFpEmail(''); setFpNewPassword(''); 
        setFpConfirmPassword(''); setFpErrors({}); setOtp('');
    }, []);

    const toggleView = () => { setIsLoginView(!isLoginView); resetForms(); };
    
    const handleViewDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setViewData(prev => ({...prev, [name]: value}));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = (isLogin: boolean) => {
        const newErrors: { [key: string]: string } = {};
        if (!viewData.email || !validateEmail(viewData.email)) newErrors.email = 'Please enter a valid email.';
        if (!viewData.password) newErrors.password = 'Password is required.';
        if (!isLogin) {
            if (!viewData.clinicName.trim()) newErrors.clinicName = 'Clinic name is required.';
            if (!viewData.name.trim()) newErrors.name = 'Your name is required.';
            if (viewData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(true)) return;
        setIsLoading(true);
        await handleLogin(viewData.email, viewData.password);
        // The context now handles the error toast, so we just stop loading
        setIsLoading(false);
    };
    
    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(false)) return;
        if (!termsAccepted) { setErrors(prev => ({ ...prev, terms: 'You must accept the terms.' })); return; }
        setIsLoading(true);
        const result = await handleSendOtp(viewData, 'register');
        if (result.success) {
            setRegistrationStep(2);
        } else {
            setErrors({ form: result.message });
        }
        setIsLoading(false);
    };

    const handleOtpFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) { setErrors({ otp: 'OTP is required.' }); return; }
        setIsLoading(true);
        await handleVerifyOtpAndRegister(viewData.email, otp, viewData);
        setIsLoading(false);
    };

    const handleFPSendOtp = async () => {
        setFpErrors({});
        if (!fpEmail || !validateEmail(fpEmail)) { setFpErrors({ email: 'Please enter a valid email.'}); return; }
        setIsLoading(true);
        const result = await handleSendOtp({ email: fpEmail }, 'reset');
        if (result.success) {
            setFpStep(2);
        } else {
            setFpErrors({ form: result.message });
        }
        setIsLoading(false);
    };

    const handleFPVerifyOtp = async () => {
        setFpErrors({});
        if (!otp.trim()) { setFpErrors({ otp: 'OTP is required.'}); return; }
        setIsLoading(true);
        const success = await verifyPasswordResetOtp(fpEmail, otp);
        if (success) {
            setFpStep(3);
        }
        setIsLoading(false);
    };

    const handleFPResetPassword = async () => {
        setFpErrors({});
        if (fpNewPassword.length < 6) { setFpErrors({ newPassword: 'Password must be at least 6 characters.' }); return; }
        if (fpNewPassword !== fpConfirmPassword) { setFpErrors({ confirmPassword: 'Passwords do not match.' }); return; }
        setIsLoading(true);
        const success = await resetPassword(fpEmail, fpNewPassword);
        if (success) resetFPForm();
        setIsLoading(false);
    };
    
    const ErrorMessage = ({ message }: { message?: string }) => message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null;
    const inputClass = (hasError: boolean) => `block w-full rounded-md border-0 py-3 pl-10 pr-3 bg-white text-slate-900 ring-1 ring-inset ${hasError ? 'ring-red-500' : 'ring-slate-300'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition-all duration-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 ${hasError ? 'dark:ring-red-500' : 'dark:ring-slate-700'} dark:focus:ring-brand-accent`;
    const passwordInputClass = (hasError: boolean) => `${inputClass(hasError)} pr-10`;

    const renderForgotPasswordModal = () => (
        <Modal isOpen={isForgotPasswordOpen} onClose={resetFPForm} title="Reset Password">
             {fpErrors.form && <div className="flex items-center p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-300"><ExclamationCircleIcon className="w-5 h-5 mr-2"/><span className="font-medium">{fpErrors.form}</span></div>}
            {fpStep === 1 && (<div className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-400">Enter the email of the primary clinic admin to receive an OTP.</p><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="w-5 h-5 text-slate-400" /></span><input id="fp-email" type="email" placeholder="Email address" value={fpEmail} onChange={(e) => { setFpEmail(e.target.value); if(fpErrors.email) setFpErrors({}); }} className={inputClass(!!fpErrors.email)}/></div><ErrorMessage message={fpErrors.email} /></div><button onClick={handleFPSendOtp} disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-400">{isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Send OTP'}</button></div>)}
            {fpStep === 2 && (<div className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-400">An OTP has been sent. Enter it below.</p><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockOpenIcon className="w-5 h-5 text-slate-400" /></span><input id="fp-otp" type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className={inputClass(!!fpErrors.otp)}/></div><ErrorMessage message={fpErrors.otp} /></div><button onClick={handleFPVerifyOtp} disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-400">{isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Verify OTP'}</button></div>)}
            {fpStep === 3 && (<div className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-400">Enter and confirm your new password.</p><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span><input id="fp-new-pass" type="password" placeholder="New Password" value={fpNewPassword} onChange={(e) => { setFpNewPassword(e.target.value); if(fpErrors.newPassword) setFpErrors({}); }} className={inputClass(!!fpErrors.newPassword)} autoComplete="new-password" /></div><ErrorMessage message={fpErrors.newPassword} /></div><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span><input id="fp-confirm-pass" type="password" placeholder="Confirm New Password" value={fpConfirmPassword} onChange={(e) => { setFpConfirmPassword(e.target.value); if(fpErrors.confirmPassword) setFpErrors({}); }} className={inputClass(!!fpErrors.confirmPassword)} autoComplete="new-password" /></div><ErrorMessage message={fpErrors.confirmPassword} /></div><button onClick={handleFPResetPassword} disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-400">{isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Reset Password'}</button></div>)}
        </Modal>
    );

    const mainForm = (
        <form className="space-y-4" onSubmit={isLoginView ? handleLoginSubmit : (registrationStep === 1 ? handleRegistrationSubmit : handleOtpFormSubmit)} noValidate>
            {registrationStep === 1 && (<div className="space-y-4">{!isLoginView && (<><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><BuildingOfficeIcon className="w-5 h-5 text-slate-400" /></span><input id="clinicName" name="clinicName" type="text" required value={viewData.clinicName} onChange={handleViewDataChange} placeholder="Clinic Name" autoComplete="organization" className={inputClass(!!errors.clinicName)}/></div><ErrorMessage message={errors.clinicName} /></div><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon className="w-5 h-5 text-slate-400" /></span><input id="name" name="name" type="text" required value={viewData.name} onChange={handleViewDataChange} placeholder="Your Full Name" autoComplete="name" className={inputClass(!!errors.name)}/></div><ErrorMessage message={errors.name} /></div></>)}<div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="w-5 h-5 text-slate-400" /></span><input id="email" name="email" type="email" required value={viewData.email} onChange={handleViewDataChange} placeholder="Email address" autoComplete="email" className={inputClass(!!errors.email)}/></div><ErrorMessage message={errors.email} /></div><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span><input id="password" name="password" type={isPasswordVisible ? 'text' : 'password'} required value={viewData.password} onChange={handleViewDataChange} placeholder="Password" autoComplete={isLoginView ? "current-password" : "new-password"} className={passwordInputClass(!!errors.password)}/><button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"><span className="sr-only">{isPasswordVisible ? 'Hide password' : 'Show password'}</span>{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button></div><ErrorMessage message={errors.password} /></div></div>)}
            {registrationStep === 2 && !isLoginView && (<div className="space-y-4"><p className="text-sm text-center text-slate-600 dark:text-slate-400">Enter the OTP sent to your email to verify.</p><div><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockOpenIcon className="w-5 h-5 text-slate-400" /></span><input id="otp" name="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" className={inputClass(!!errors.otp)}/></div><ErrorMessage message={errors.otp} /></div></div>)}
            {isLoginView && (<div className="text-right text-sm"><button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="font-medium text-brand-primary hover:text-brand-accent">Forgot password?</button></div>)}
            {!isLoginView && registrationStep === 1 && (<div className="space-y-1"><div className="flex items-center"><input id="terms" name="terms" type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));}} className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-slate-100 dark:bg-slate-900"/><label htmlFor="terms" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">I agree to the{' '}<button type="button" onClick={() => setIsTermsModalOpen(true)} className="font-medium text-brand-primary hover:underline">Terms and Conditions</button></label></div><ErrorMessage message={errors.terms} /></div>)}
            <div><button type="submit" disabled={isLoading || (!isLoginView && registrationStep === 1 && !termsAccepted)} className="group flex justify-center items-center w-full px-4 py-3 text-sm font-semibold text-white border border-transparent rounded-md shadow-sm bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-all duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">{isLoading ? <SpinnerIcon className="animate-spin w-5 h-5 text-white" /> : isLoginView ? 'Sign in' : registrationStep === 1 ? 'Continue' : 'Verify & Create Clinic'}</button></div>
        </form>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">{isTermsModalOpen && <TermsModal onClose={() => setIsTermsModalOpen(false)} />} {renderForgotPasswordModal()} <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-brand-secondary text-white p-12 text-center"><LogoIcon className="w-20 h-20 text-brand-accent" /><h1 className="text-5xl font-bold mt-4">Medzillo</h1><p className="mt-4 text-lg text-slate-300">Integrated Pharmacy & Clinic Management</p></div><div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12"><div className="w-full max-w-sm"><div className="md:hidden text-center mb-8"><div className="flex justify-center items-center gap-3"><LogoIcon className="w-10 h-10 text-brand-primary" /><h1 className="text-4xl font-bold text-brand-secondary dark:text-slate-100">Medzillo</h1></div></div><div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"><div className="text-center mb-6"><LogoIcon className="w-12 h-12 mx-auto text-brand-primary mb-2" /><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{isLoginView ? 'Welcome Back' : (registrationStep === 1 ? 'Register New Clinic' : 'Verify Your Email')}</h2><p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{isLoginView ? 'Sign in to access your dashboard.' : (registrationStep === 1 ? 'Create a new clinic and admin account.' : `We've sent a code to ${viewData.email}`)}</p></div>{errors.form && (<div className="flex items-center p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-300" role="alert"><ExclamationCircleIcon className="w-5 h-5 mr-2"/><span className="font-medium">{errors.form}</span></div>)}{mainForm}<div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">{isLoginView ? "Need to set up a new clinic?" : "Already have a clinic account?"}<button type="button" onClick={toggleView} className="ml-1 font-medium text-brand-primary hover:text-brand-accent focus:outline-none focus:underline">{isLoginView ? 'Register here' : 'Sign in'}</button></div></div><div className="mt-4 text-center"><button onClick={navigateToSuperAdmin} className="text-xs text-slate-500 hover:text-brand-primary hover:underline">System Administrator Portal</button></div></div></div></div>
    );
};