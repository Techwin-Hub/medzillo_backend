import React, { useState, useMemo } from 'react';
import { Clinic, Banner, BannerInterest } from '../types';
import { LogoIcon, BuildingOfficeIcon, UserIcon, BillingIcon, EyeIcon, PhotoIcon, PlusIcon, DeleteIcon, ArrowDownTrayIcon, XCircleIcon } from './icons';
import { useSuperAdminData } from '../contexts/SuperAdminContext';
import { ConfirmModal } from './ConfirmModal';
import { Modal } from './Modal';
import { useDebounce } from '../hooks/useDebounce';


interface SuperAdminDashboardProps {
    onViewClinic: (clinicId: string) => void;
    onLogout: () => void;
    adminName: string;
}

const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start gap-4">
      <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white"/>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
      </div>
  </div>
);

const BannerFormModal: React.FC<{
    onClose: () => void;
    onSave: (title: string, image: string, targetCities: string[]) => void;
    allCities: string[];
}> = ({ onClose, onSave, allCities }) => {
    const [title, setTitle] = useState('');
    const [image, setImage] = useState('');
    const [preview, setPreview] = useState('');
    const [targetCities, setTargetCities] = useState<string[]>([]);
    const [cityInput, setCityInput] = useState('');
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Image size should be less than 2MB.');
                return;
            }
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file.');
                return;
            }
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImage(base64String);
                setPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const filteredCities = useMemo(() => {
        if (!cityInput) return [];
        const lowercasedInput = cityInput.toLowerCase();
        return allCities.filter(city =>
            city.toLowerCase().includes(lowercasedInput) &&
            !targetCities.map(c => c.toLowerCase()).includes(city.toLowerCase())
        );
    }, [cityInput, allCities, targetCities]);

    const handleAddCity = (city: string) => {
        const newCity = city.trim();
        if (newCity && !targetCities.map(c => c.toLowerCase()).includes(newCity.toLowerCase())) {
            setTargetCities([...targetCities, newCity]);
        }
        setCityInput('');
        setIsCityDropdownOpen(false);
    };

    const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddCity(cityInput);
        }
    };

    const removeCity = (cityToRemove: string) => {
        setTargetCities(targetCities.filter(city => city !== cityToRemove));
    };


    const handleSave = () => {
        if (!title.trim()) {
            setError('Banner title is required.');
            return;
        }
        if (!image) {
            setError('Banner image is required.');
            return;
        }
        onSave(title, image, targetCities);
    };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
            <button type="button" onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover">Save Banner</button>
        </>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title="Add New Banner" footer={footer}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="banner-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Banner Title</label>
                    <input
                        type="text"
                        id="banner-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:border-slate-600"
                        placeholder="e.g., Summer Discount Camp"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target Cities</label>
                    <div className="relative">
                        <div className="mt-1 flex flex-wrap items-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md">
                            {targetCities.map(city => (
                                <span key={city} className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-medium px-2 py-1 rounded-full">
                                    {city}
                                    <button onClick={() => removeCity(city)} className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100">
                                        <XCircleIcon className="w-4 h-4" />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={cityInput}
                                onChange={(e) => {
                                    setCityInput(e.target.value);
                                    setIsCityDropdownOpen(true);
                                }}
                                onKeyDown={handleCityKeyDown}
                                onBlur={() => setTimeout(() => setIsCityDropdownOpen(false), 150)}
                                placeholder="Type a city..."
                                className="flex-1 bg-transparent focus:outline-none min-w-[150px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                        </div>
                        {isCityDropdownOpen && filteredCities.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {filteredCities.map(city => (
                                    <div
                                        key={city}
                                        onMouseDown={() => handleAddCity(city)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-900 dark:text-slate-200"
                                    >
                                        {city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Leave empty to target all doctors nationwide.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Banner Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {preview ? (
                                <img src={preview} alt="Banner preview" className="mx-auto h-32 w-auto object-contain rounded-md" />
                            ) : (
                                <PhotoIcon className="mx-auto h-12 w-12 text-slate-400" />
                            )}
                            <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-brand-primary hover:text-brand-primary-hover focus-within:outline-none">
                                    <span>{preview ? 'Change image' : 'Upload an image'}</span>
                                    <input id="file-upload" name="file-upload" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, SVG up to 2MB. Recommended aspect ratio: 3:1.</p>
                        </div>
                    </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        </Modal>
    );
};

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onViewClinic, onLogout, adminName }) => {
    const { clinics, dataByClinicId, updateClinicStatus, banners, addBanner, updateBannerStatus, deleteBanner, bannerInterests, isLoading } = useSuperAdminData();
    const [confirmingStatusChange, setConfirmingStatusChange] = useState<{ clinicId: string, newStatus: boolean } | null>(null);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    const filteredClinics = useMemo(() => {
        if (!debouncedSearchTerm) return clinics;
        return clinics.filter(clinic =>
            clinic.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [clinics, debouncedSearchTerm]);

    const allCities = useMemo(() => {
        const citySet = new Set<string>();
        clinics.forEach(clinic => {
            const info = dataByClinicId[clinic.id]?.pharmacyInfo;
            if (info && info.city) {
                citySet.add(info.city.trim());
            }
        });
        return Array.from(citySet).sort();
    }, [clinics, dataByClinicId]);


    const totalClinics = clinics.length;
    const totalPatients = Object.values(dataByClinicId).reduce((sum, data) => sum + data.patients.length, 0);
    const totalSales = Object.values(dataByClinicId).reduce((sum, data) => 
        sum + data.bills.reduce((billSum, bill) => billSum + bill.totalAmount, 0), 0
    ).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
    
    const interestsByBanner = useMemo(() => {
        return bannerInterests.reduce((acc, interest) => {
            if (!acc[interest.bannerId]) {
                acc[interest.bannerId] = [];
            }
            acc[interest.bannerId].push(interest);
            return acc;
        }, {} as Record<string, BannerInterest[]>);
    }, [bannerInterests]);

    const handleStatusToggle = (clinicId: string, currentStatus: boolean) => {
        setConfirmingStatusChange({ clinicId, newStatus: !currentStatus });
    };

    const handleConfirmStatusChange = async () => {
        if (confirmingStatusChange) {
            await updateClinicStatus(confirmingStatusChange.clinicId, confirmingStatusChange.newStatus);
            setConfirmingStatusChange(null);
        }
    };
    
    const handleOpenAddBannerModal = () => setIsBannerModalOpen(true);
    const handleCloseAddBannerModal = () => setIsBannerModalOpen(false);

    const handleSaveBanner = (title: string, image: string, targetCities: string[]) => {
        addBanner(title, image, targetCities);
        handleCloseAddBannerModal();
    };

    const handleDeleteBannerClick = (bannerId: string) => {
        setDeletingBannerId(bannerId);
    };

    const handleConfirmDeleteBanner = () => {
        if (deletingBannerId) {
            deleteBanner(deletingBannerId);
            setDeletingBannerId(null);
        }
    };

    const handleConfirmLogout = () => {
        onLogout();
        setIsLogoutConfirmOpen(false);
    };

    const handleExportCSV = (banner: Banner, interests: BannerInterest[]) => {
        if (interests.length === 0) return;
        const data = interests.map(i => {
            const clinicInfo = dataByClinicId[i.clinicId]?.pharmacyInfo;
            const address = clinicInfo ? `${clinicInfo.address}, ${clinicInfo.city} - ${clinicInfo.pincode}`.trim() : 'N/A';
            return {
                'Doctor Name': i.doctorName,
                'Clinic Name': i.clinicName,
                'Clinic Address': address,
                'Date': new Date(i.timestamp).toLocaleString('en-GB'),
            };
        });
        const headers = Object.keys(data[0]);
        const csvContent = [headers.join(','), ...data.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `${banner.title.replace(/\s/g, '_')}_responses.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center border-b dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <LogoIcon className="w-8 h-8 text-brand-primary"/>
                    <h1 className="text-2xl font-bold text-brand-secondary dark:text-slate-100">System Administrator</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm">Welcome, <span className="font-semibold">{adminName}</span></span>
                    <button onClick={() => setIsLogoutConfirmOpen(true)} className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm">Logout</button>
                </div>
            </header>
            
            <main className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <MetricCard title="Total Clinics" value={totalClinics} icon={BuildingOfficeIcon} color="bg-blue-500" />
                    <MetricCard title="Total Patients" value={totalPatients} icon={UserIcon} color="bg-green-500" />
                    <MetricCard title="Total Sales" value={totalSales} icon={BillingIcon} color="bg-indigo-500" />
                </div>

                <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-5 border-b dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Registered Clinics</h2>
                        <div className="mt-4 relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by clinic name..."
                                className="w-full p-3 pl-10 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Clinic Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Patients</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Sales</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div><div className="h-6 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div></td>
                                        </tr>
                                    ))
                                ) : filteredClinics.length > 0 ? (
                                    filteredClinics.map(clinic => {
                                        const clinicData = dataByClinicId[clinic.id];
                                        const sales = clinicData.bills.reduce((sum, bill) => sum + bill.totalAmount, 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                                        return (
                                            <tr key={clinic.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="px-6 py-4 font-semibold">{clinic.name}</td>
                                                <td className="px-6 py-4">{clinicData.patients.length}</td>
                                                <td className="px-6 py-4">{sales}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${clinic.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                        {clinic.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => onViewClinic(clinic.id)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold text-sm" title="View Clinic Data"><EyeIcon className="w-4 h-4" /> View</button>
                                                        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                                            <input type="checkbox" checked={clinic.isActive} onChange={() => handleStatusToggle(clinic.id, clinic.isActive)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer"></label>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400">
                                            {searchTerm ? `No clinics found matching "${searchTerm}".` : 'No clinics found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-5 flex justify-between items-center border-b dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <PhotoIcon className="w-6 h-6 text-indigo-500" />
                            Banner Management
                        </h2>
                        <button onClick={handleOpenAddBannerModal} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover shadow-sm transition-colors">
                            <PlusIcon className="w-5 h-5"/> Add New Banner
                        </button>
                    </div>
                     <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {banners.length > 0 ? (
                            banners.map(banner => (
                                <div key={banner.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <img src={banner.image} alt={banner.title} className="w-32 h-16 object-cover rounded-md bg-slate-200 dark:bg-slate-700" />
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{banner.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(banner.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative inline-block w-10 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                checked={banner.isActive}
                                                onChange={() => updateBannerStatus(banner.id, !banner.isActive)}
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                id={`banner-toggle-${banner.id}`}
                                            />
                                            <label htmlFor={`banner-toggle-${banner.id}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer"></label>
                                        </div>
                                        <button onClick={() => handleDeleteBannerClick(banner.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete Banner">
                                            <DeleteIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="p-8 text-center text-slate-500 dark:text-slate-400">No banners created yet. Click "Add New Banner" to get started.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-5 border-b dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-green-500" />
                            Banner Responses
                        </h2>
                    </div>
                     <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {banners.map(banner => {
                            const interests = interestsByBanner[banner.id] || [];
                            return (
                                <div key={`response-${banner.id}`} className="p-4 space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                        <div className="flex items-center gap-4">
                                            <img src={banner.image} alt={banner.title} className="w-24 h-12 object-cover rounded-md bg-slate-200 dark:bg-slate-700" />
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{banner.title}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{interests.length} Doctor(s) interested</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleExportCSV(banner, interests)} disabled={interests.length === 0} className="flex self-start sm:self-center items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <ArrowDownTrayIcon className="w-4 h-4"/> Export CSV
                                        </button>
                                    </div>
                                    {interests.length > 0 && (
                                        <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                                            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {interests.map(interest => (
                                                    <li key={interest.id} className="p-2 flex justify-between items-center text-sm">
                                                        <div>
                                                            <p className="font-medium text-slate-800 dark:text-slate-200">{interest.doctorName}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{interest.clinicName}</p>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(interest.timestamp).toLocaleDateString()}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                         {banners.length === 0 && (
                            <p className="p-8 text-center text-slate-500 dark:text-slate-400">No banners available to show responses for.</p>
                         )}
                    </div>
                </div>
            </main>

            {isBannerModalOpen && <BannerFormModal onClose={handleCloseAddBannerModal} onSave={handleSaveBanner} allCities={allCities} />}
            <ConfirmModal
                isOpen={!!deletingBannerId}
                onClose={() => setDeletingBannerId(null)}
                onConfirm={handleConfirmDeleteBanner}
                title="Delete Banner"
                message="Are you sure you want to delete this banner and all its responses? This action cannot be undone."
            />
            {confirmingStatusChange && (
                <ConfirmModal
                    isOpen={!!confirmingStatusChange}
                    onClose={() => setConfirmingStatusChange(null)}
                    onConfirm={handleConfirmStatusChange}
                    title={`${confirmingStatusChange.newStatus ? 'Activate' : 'Deactivate'} Clinic`}
                    message={`Are you sure you want to ${confirmingStatusChange.newStatus ? 'activate' : 'deactivate'} this clinic? ${!confirmingStatusChange.newStatus ? 'Users will not be able to log in.' : ''}`}
                />
            )}
             <ConfirmModal
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                onConfirm={handleConfirmLogout}
                title="Confirm Logout"
                message="Are you sure you want to log out from the Super Admin dashboard?"
            />
             <style>{`.toggle-checkbox:checked { right: 0; border-color: #2563eb; } .toggle-checkbox:checked + .toggle-label { background-color: #2563eb; }`}</style>
        </div>
    );
};