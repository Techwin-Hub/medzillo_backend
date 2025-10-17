import React, { createContext, useContext, useCallback, ReactNode, useState, useEffect } from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { Clinic, PharmacyInfo, Banner, BannerInterest } from '../types';
import { useToast } from '../hooks/useToast';
import * as api from '../api/apiService';
import { dbDelete } from '../utils/db';

// Define the shape of the data for a single clinic
interface ClinicData {
    pharmacyInfo: PharmacyInfo;
    [key: string]: any; // Other clinic-specific data
}

// Define the shape of the context value
interface SuperAdminContextType {
    superAdmin: any;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clinics: Clinic[];
    dataByClinicId: { [key: string]: any };
    banners: Banner[];
    bannerInterests: BannerInterest[];
    updateClinicStatus: (clinicId: string, isActive: boolean) => Promise<void>;
    addBanner: (title: string, image: string, targetCities: string[]) => Promise<void>;
    updateBannerStatus: (bannerId: string, isActive: boolean) => Promise<void>;
    deleteBanner: (bannerId: string) => Promise<void>;
    isLoading: boolean;
}

// Create the context
const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

// Create the provider component
export const SuperAdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [superAdmin, setSuperAdmin] = usePersistentState<any | null>('medzillo_superAdmin', null);

    // Use the persistent state hook to manage global clinic data
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [dataByClinicId, setDataByClinicId] = useState<{ [key: string]: any }>({});
    const [banners, setBanners] = usePersistentState<Banner[]>('medzillo_banners', []);
    const [bannerInterests, setBannerInterests] = usePersistentState<BannerInterest[]>('medzillo_bannerInterests', []);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.fetchSuperAdminDashboardStats();
            setClinics(data);

            // The new endpoint returns a simple list of clinics with aggregated data,
            // so we need to transform it for the existing components.
            const transformedData = data.reduce((acc: any, clinic: any) => {
                acc[clinic.id] = {
                    patients: { length: clinic.patientCount }, // Mocking patient list structure
                    bills: clinic.totalSales > 0 ? [{ totalAmount: clinic.totalSales }] : [], // Mocking bills structure
                    pharmacyInfo: { city: clinic.city || 'N/A' } // Assuming city is returned
                };
                return acc;
            }, {});
            setDataByClinicId(transformedData);

        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (superAdmin) {
            fetchDashboardData();
        } else {
            setIsLoading(false);
        }
    }, [superAdmin, fetchDashboardData]);

    const login = async (email: string, password: string) => {
        try {
            const { user } = await api.superAdminLogin(email, password);
            setSuperAdmin(user);
            return true;
        } catch (error) {
            addToast((error as Error).message, 'error');
            return false;
        }
    };

    const logout = async () => {
        setSuperAdmin(null);
        await dbDelete('medzillo_superAdminToken');
    };


    const updateClinicStatus = useCallback(async (clinicId: string, isActive: boolean) => {
        try {
            await api.updateClinicStatus(clinicId, isActive);
            setClinics(prevClinics =>
                prevClinics.map(clinic =>
                    clinic.id === clinicId ? { ...clinic, isActive } : clinic
                )
            );
            addToast(`Clinic has been ${isActive ? 'activated' : 'deactivated'}.`, 'success');
        } catch (error) {
            addToast((error as Error).message, 'error');
        }
    }, [setClinics, addToast]);

    const addBanner = useCallback(async (title: string, image: string, targetCities: string[]) => {
        const newBanner: Banner = {
            id: `banner_${Date.now()}`,
            title,
            image,
            isActive: true,
            createdAt: new Date().toISOString(),
            targetCities,
        };
        setBanners(prev => [newBanner, ...prev]);
        addToast('New banner added successfully.', 'success');
    }, [setBanners, addToast]);

    const updateBannerStatus = useCallback(async (bannerId: string, isActive: boolean) => {
        setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, isActive } : b));
        addToast(`Banner status updated.`, 'info');
    }, [setBanners, addToast]);

    const deleteBanner = useCallback(async (bannerId: string) => {
        setBanners(prev => prev.filter(b => b.id !== bannerId));
        setBannerInterests(prev => prev.filter(i => i.bannerId !== bannerId));
        addToast('Banner and its responses deleted successfully.', 'success');
    }, [setBanners, setBannerInterests, addToast]);


    const value = {
        superAdmin,
        login,
        logout,
        clinics,
        dataByClinicId,
        updateClinicStatus,
        banners,
        bannerInterests,
        addBanner,
        updateBannerStatus,
        deleteBanner,
        isLoading,
    };

    return (
        <SuperAdminContext.Provider value={value}>
            {children}
        </SuperAdminContext.Provider>
    );
};

// Create a custom hook for easy context consumption
export const useSuperAdminData = (): SuperAdminContextType => {
    const context = useContext(SuperAdminContext);
    if (context === undefined) {
        throw new Error('useSuperAdminData must be used within a SuperAdminProvider');
    }
    return context;
};