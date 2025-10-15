import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PharmacyInfo, User } from '../types';
import { 
    BuildingOfficeIcon, 
    MapPinIcon, 
    DevicePhoneMobileIcon, 
    IdentificationIcon, 
    CheckCircleIcon,
    EditIcon,
    DocumentTextIcon,
    UsersIcon,
    PlusIcon,
    DeleteIcon,
    ReceiptPercentIcon as TaxIcon,
    ArchiveBoxIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    ExclamationTriangleIcon,
    SpinnerIcon,
    InformationCircleIcon,
    EnvelopeIcon
} from './icons';
import { UserForm } from './UserForm';
import { useToast } from '../hooks/useToast';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { useClinicData } from '../contexts/ClinicDataContext';

interface SettingsProps {}

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-4">
        <Icon className="w-6 h-6 text-brand-primary mr-4 mt-1"/>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{label}</p>
            <p className="text-md text-slate-900 dark:text-slate-200">{value}</p>
        </div>
    </div>
);

interface InputFieldProps {
    label: string;
    name: keyof Omit<PharmacyInfo, 'clinicId' | 'organizationType' | 'isGstEnabled'>;
    value: string;
    icon: React.ElementType;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, icon: Icon, onChange, required = false }) => (
    <div>
        <label htmlFor={name as string} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon className="w-5 h-5 text-slate-400" />
            </span>
            <input
                type="text"
                name={name as string}
                id={name as string}
                value={value}
                onChange={onChange}
                required={required}
                className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary pl-10 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
        </div>
    </div>
);

const generateAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
    ];
    return colors[Math.abs(hash % colors.length)];
};


const Settings: React.FC<SettingsProps> = () => {
    const {
        currentUser,
        admin: {
            pharmacyInfo, users, hsnCodes,
            setPharmacyInfo, addUser, updateUser, deleteUser, handleSetGstEnabled,
            addHsnCode, deleteHsnCode, handleBackup, handleRestore
        }
    } = useClinicData();

    if (!currentUser) return null;
    const isGstEnabled = pharmacyInfo.isGstEnabled ?? true;
    const hsnMaster = hsnCodes || {};

    const [formData, setFormData] = useState<PharmacyInfo>(pharmacyInfo);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [newHsnCode, setNewHsnCode] = useState('');
    const [newGstRate, setNewGstRate] = useState('');
    const [hsnSearch, setHsnSearch] = useState('');
    const [deletingHsnCode, setDeletingHsnCode] = useState<string | null>(null);
    
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [userPage, setUserPage] = useState(1);
    const [userItemsPerPage, setUserItemsPerPage] = useState(5);
    const [hsnPage, setHsnPage] = useState(1);
    const [hsnItemsPerPage, setHsnItemsPerPage] = useState(10);

    const { addToast } = useToast();

    useEffect(() => {
        setFormData(pharmacyInfo);
    }, [pharmacyInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name as keyof PharmacyInfo]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const success = await setPharmacyInfo(formData);
        if (success) {
            setIsEditing(false);
        }
        setIsSaving(false);
    };
    
    const handleCancel = () => {
        setFormData(pharmacyInfo);
        setIsEditing(false);
    };

    const handleAddNewUser = () => {
        setEditingUser(null);
        setIsUserFormOpen(true);
    };
    
    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsUserFormOpen(true);
    };
    
    const handleDeleteUserClick = (userId: string) => {
        setDeletingUserId(userId);
        setIsConfirmDeleteOpen(true);
    };
    
    const confirmDeleteUser = async () => {
        if (deletingUserId) {
            setIsDeleting(true);
            await deleteUser(deletingUserId);
            setIsDeleting(false);
        }
        setIsConfirmDeleteOpen(false);
        setDeletingUserId(null);
    };
    
    const handleSaveUser = async (user: User | Omit<User, 'id' | 'clinicId'>) => {
        let success = false;
        if ('id' in user) {
            success = await updateUser(user);
        } else {
            success = await addUser(user);
        }
        
        if (success) {
            setIsUserFormOpen(false);
        }
        return success; // Return success status for form to handle its loading state
    };

    const handleAddHsnCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const rate = parseFloat(newGstRate);
        if (newHsnCode.trim() && !isNaN(rate)) {
            const success = await addHsnCode(newHsnCode.trim(), rate);
            if (success) {
                setNewHsnCode('');
                setNewGstRate('');
            }
        } else {
            addToast('Please enter a valid HSN code and GST rate.', 'warning');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            addToast('Invalid file type. Please select a .json backup file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setRestoreFileContent(content);
            setIsRestoreConfirmOpen(true);
        };
        reader.onerror = () => {
            addToast('Failed to read the backup file.', 'error');
        };
        reader.readAsText(file);

        if (event.target) {
            event.target.value = '';
        }
    };

    const confirmRestore = () => {
        if (restoreFileContent) {
            handleRestore(restoreFileContent);
        }
        setIsRestoreConfirmOpen(false);
        setRestoreFileContent(null);
    };
    
    const filteredHsnCodes = useMemo(() => Object.entries(hsnMaster).filter(([code]) => 
        code.includes(hsnSearch)
    ).sort((a,b) => a[0].localeCompare(b[0])), [hsnMaster, hsnSearch]);
    
    const paginatedUsers = useMemo(() => {
        const startIndex = (userPage - 1) * userItemsPerPage;
        return users.slice(startIndex, startIndex + userItemsPerPage);
    }, [users, userPage, userItemsPerPage]);

    const paginatedHsnCodes = useMemo(() => {
        const startIndex = (hsnPage - 1) * hsnItemsPerPage;
        return filteredHsnCodes.slice(startIndex, startIndex + hsnItemsPerPage);
    }, [filteredHsnCodes, hsnPage, hsnItemsPerPage]);

    useEffect(() => { setUserPage(1); }, [userItemsPerPage, users.length]);
    useEffect(() => { setHsnPage(1); }, [hsnItemsPerPage, filteredHsnCodes.length]);


    const primaryAdminId = users[0]?.id;
    const isPrimaryAdmin = currentUser.id === primaryAdminId;

    return (
        <div>
            <h2 className="text-3xl font-bold text-brand-secondary dark:text-slate-100 mb-6">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center">
                               <BuildingOfficeIcon className="w-6 h-6 text-brand-secondary mr-3"/>
                               Clinic Profile
                            </h3>
                            {!isEditing && (
                                 <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover shadow-sm transition-colors">
                                    <EditIcon className="w-4 h-4 mr-2"/>
                                    Edit
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSave}>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label htmlFor="organizationType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization Type</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <BuildingOfficeIcon className="w-5 h-5 text-slate-400" />
                                            </span>
                                            <select
                                                name="organizationType"
                                                id="organizationType"
                                                value={formData.organizationType}
                                                onChange={handleChange}
                                                required
                                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-brand-primary focus:ring-brand-primary pl-10 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            >
                                                <option>Pharmacy</option>
                                                <option>Clinic</option>
                                                <option>Small Scale Hospital</option>
                                            </select>
                                        </div>
                                    </div>
                                    <InputField label="Clinic Name" name="name" value={formData.name} icon={BuildingOfficeIcon} onChange={handleChange} required />
                                    <InputField label="Address" name="address" value={formData.address} icon={MapPinIcon} onChange={handleChange} required />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="City" name="city" value={formData.city} icon={MapPinIcon} onChange={handleChange} required />
                                        <InputField label="Pin Code" name="pincode" value={formData.pincode} icon={MapPinIcon} onChange={handleChange} required />
                                    </div>
                                    <InputField label="Phone Number" name="phone" value={formData.phone} icon={DevicePhoneMobileIcon} onChange={handleChange} required />
                                    <InputField label="GSTIN" name="gstin" value={formData.gstin} icon={IdentificationIcon} onChange={handleChange} required />
                                    <InputField label="Drug License No." name="drugLicense" value={formData.drugLicense} icon={DocumentTextIcon} onChange={handleChange} required />
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                                    <button type="button" onClick={handleCancel} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover w-36 flex justify-center items-center disabled:bg-brand-primary/50">
                                        {isSaving ? <SpinnerIcon className="animate-spin w-5 h-5" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                             <div className="p-6 divide-y divide-slate-200 dark:divide-slate-700">
                                <InfoRow icon={BuildingOfficeIcon} label="Organization Type" value={pharmacyInfo.organizationType} />
                                <InfoRow icon={BuildingOfficeIcon} label="Clinic Name" value={pharmacyInfo.name} />
                                <InfoRow icon={MapPinIcon} label="Address" value={pharmacyInfo.address} />
                                <InfoRow icon={MapPinIcon} label="City" value={pharmacyInfo.city} />
                                <InfoRow icon={MapPinIcon} label="Pin Code" value={pharmacyInfo.pincode} />
                                <InfoRow icon={DevicePhoneMobileIcon} label="Phone Number" value={pharmacyInfo.phone} />
                                <InfoRow icon={IdentificationIcon} label="GSTIN" value={pharmacyInfo.gstin} />
                                <InfoRow icon={DocumentTextIcon} label="Drug License No." value={pharmacyInfo.drugLicense} />
                            </div>
                        )}
                    </div>

                    {(currentUser.role === 'Admin') && (
                        <>
                            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                <div className="px-6 py-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center">
                                        <UsersIcon className="w-6 h-6 text-brand-secondary mr-3"/>
                                        User Management
                                    </h3>
                                    {isPrimaryAdmin && (
                                        <button onClick={handleAddNewUser} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover shadow-sm transition-colors">
                                            <PlusIcon className="w-4 h-4 mr-2"/>
                                            Add User
                                        </button>
                                    )}
                                </div>
                                <div className="p-4 space-y-3">
                                    {paginatedUsers.map(user => {
                                        const canEdit = isPrimaryAdmin || currentUser.id === user.id;
                                        const canDelete = isPrimaryAdmin && user.id !== primaryAdminId;
                                        const avatarColor = generateAvatarColor(user.name);

                                        return (
                                            <div key={user.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${avatarColor}`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                            {user.name}
                                                            {user.id === primaryAdminId && (
                                                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full">Primary</span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full hidden sm:block">{user.role}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <button 
                                                            onClick={() => handleEditUser(user)}
                                                            disabled={!canEdit}
                                                            title={canEdit ? "Edit User" : "You can only edit your own profile"}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                                                        >
                                                            <EditIcon className="w-5 h-5"/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUserClick(user.id)} 
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-red-600"
                                                            disabled={!canDelete}
                                                            title={!canDelete ? "Only the primary admin can delete users" : "Delete User"}
                                                        >
                                                            <DeleteIcon className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Pagination
                                    currentPage={userPage}
                                    totalItems={users.length}
                                    itemsPerPage={userItemsPerPage}
                                    onPageChange={setUserPage}
                                    onItemsPerPageChange={setUserItemsPerPage}
                                />
                            </div>
                            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center">
                                       <InformationCircleIcon className="w-6 h-6 text-brand-secondary mr-3"/>
                                       Support
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        For any assistance or queries, please reach out to our support team.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <EnvelopeIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mail</p>
                                            <a href="mailto:contactus@medzillo.com" className="font-semibold text-brand-primary hover:underline">contactus@medzillo.com</a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <DevicePhoneMobileIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone</p>
                                            <a href="tel:9710079100" className="font-semibold text-brand-primary hover:underline">97100 79100</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="md:col-span-1 space-y-8">
                     <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                           <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center">
                               <TaxIcon className="w-6 h-6 text-brand-secondary mr-3"/>
                               Tax Settings
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">Enable GST Calculations</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Enable or disable GST for all billing.</p>
                                </div>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="gst-toggle" id="global-gst-toggle" checked={isGstEnabled} onChange={() => handleSetGstEnabled(!isGstEnabled)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                    <label htmlFor="global-gst-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer"></label>
                                </div>
                            </div>
                            <div className="border-t pt-4 dark:border-slate-700">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Clinic HSN Codes</h4>
                                <form onSubmit={handleAddHsnCode} className="flex flex-col sm:flex-row gap-2 my-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md border dark:border-slate-700">
                                    <input type="text" value={newHsnCode} onChange={e => setNewHsnCode(e.target.value)} placeholder="New HSN Code" className="flex-grow text-sm p-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                    <input type="number" value={newGstRate} onChange={e => setNewGstRate(e.target.value)} onWheel={(e) => (e.target as HTMLElement).blur()} placeholder="GST %" className="sm:w-28 text-sm p-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                    <button type="submit" className="bg-brand-primary text-white p-2 rounded hover:bg-brand-primary-hover flex-shrink-0"><PlusIcon className="w-5 h-5" /></button>
                                </form>
                                <input type="text" placeholder="Search HSN codes..." value={hsnSearch} onChange={e => setHsnSearch(e.target.value)} className="w-full text-sm p-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                <div className="mt-2 border dark:border-slate-700 rounded-md">
                                    {/* Desktop Table */}
                                    <div className="overflow-x-auto hidden sm:block">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="p-2 text-left font-medium">HSN</th><th className="p-2 text-left font-medium">Rate</th><th className="p-2 text-left font-medium">Action</th></tr></thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {paginatedHsnCodes.map(([code, rate]) => (
                                                    <tr key={code} className="even:bg-slate-50 dark:even:bg-slate-800/50">
                                                        <td className="p-2">{code}</td>
                                                        <td className="p-2">{rate}%</td>
                                                        <td className="p-2"><button onClick={() => setDeletingHsnCode(code)} className="text-red-500 hover:text-red-700"><DeleteIcon className="w-4 h-4" /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Mobile List */}
                                    <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-700">
                                        {paginatedHsnCodes.map(([code, rate]) => (
                                            <div key={code} className="p-3 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{code}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">GST Rate: {rate}%</p>
                                                </div>
                                                <button onClick={() => setDeletingHsnCode(code)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                                    <DeleteIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination
                                        currentPage={hsnPage}
                                        totalItems={filteredHsnCodes.length}
                                        itemsPerPage={hsnItemsPerPage}
                                        onPageChange={setHsnPage}
                                        onItemsPerPageChange={setHsnItemsPerPage}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {currentUser.role === 'Admin' && (
                        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center">
                                    <ArchiveBoxIcon className="w-6 h-6 text-brand-secondary mr-3"/>
                                    Backup & Restore
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Create Backup</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Export all your clinic data into a single JSON file. Keep this file in a safe and secure location.</p>
                                    <button onClick={handleBackup} className="mt-3 flex items-center justify-center w-full sm:w-auto text-sm font-semibold bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
                                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                        Export Data File
                                    </button>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700"></div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Restore from Backup</h4>
                                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700/50 rounded-lg">
                                        <div className="flex items-start">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 shrink-0"/>
                                            <div>
                                                <h5 className="font-bold text-red-800 dark:text-red-200">Warning</h5>
                                                <p className="text-sm text-red-700 dark:text-red-300">Restoring from a backup will completely overwrite all current data in the application. This action cannot be undone.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden"/>
                                    <button onClick={() => fileInputRef.current?.click()} className="mt-3 flex items-center justify-center w-full sm:w-auto text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors">
                                        <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                                        Import Data File...
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isUserFormOpen && (
                <UserForm 
                    user={editingUser}
                    onClose={() => setIsUserFormOpen(false)}
                    onSave={handleSaveUser}
                />
            )}
            <ConfirmModal
                isOpen={!!deletingHsnCode}
                onClose={() => setDeletingHsnCode(null)}
                onConfirm={async () => {
                    if (deletingHsnCode) await deleteHsnCode(deletingHsnCode);
                    setDeletingHsnCode(null);
                }}
                title="Delete HSN Code"
                message={`Are you sure you want to delete HSN code ${deletingHsnCode}? This cannot be undone.`}
            />
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                isLoading={isDeleting}
                onClose={() => {
                    setIsConfirmDeleteOpen(false);
                    setDeletingUserId(null);
                }}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to permanently delete this user account? This action cannot be undone.`}
            />
            <ConfirmModal
                isOpen={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={confirmRestore}
                title="Confirm Data Restore"
                message="Are you sure you want to restore data from this backup file? All existing clinic data will be permanently overwritten. This action cannot be undone."
            />
             <style>{`.toggle-checkbox:checked { right: 0; border-color: #2563eb; } .toggle-checkbox:checked + .toggle-label { background-color: #2563eb; }`}</style>
        </div>
    );
};

export default Settings;