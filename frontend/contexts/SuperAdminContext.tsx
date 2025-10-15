import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useMockData } from '../hooks/useMockData';
import usePersistentState from '../hooks/usePersistentState';
import { Clinic, PharmacyInfo, Banner, BannerInterest } from '../types';
import { useToast } from '../hooks/useToast';

// Define the shape of the data for a single clinic
interface ClinicData {
    pharmacyInfo: PharmacyInfo;
    [key: string]: any; // Other clinic-specific data
}

// Define the shape of the context value
interface SuperAdminContextType {
    clinics: Clinic[];
    dataByClinicId: { [key: string]: ClinicData };
    banners: Banner[];
    bannerInterests: BannerInterest[];
    updateClinicStatus: (clinicId: string, isActive: boolean) => Promise<void>;
    addBanner: (title: string, image: string, targetCities: string[]) => Promise<void>;
    updateBannerStatus: (bannerId: string, isActive: boolean) => Promise<void>;
    deleteBanner: (bannerId: string) => Promise<void>;
}

// Create the context
const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

// Create the provider component
export const SuperAdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { clinics: mockClinics, dataByClinicId: mockData, banners: mockBanners, bannerInterests: mockBannerInterests } = useMockData();
    const { addToast } = useToast();

    // Use the persistent state hook to manage global clinic data
    const [clinics, setClinics] = usePersistentState<Clinic[]>('medzillo_clinics', mockClinics);
    const [dataByClinicId, setDataByClinicId] = usePersistentState<{ [key: string]: ClinicData }>('medzillo_dataByClinicId', mockData);
    const [banners, setBanners] = usePersistentState<Banner[]>('medzillo_banners', mockBanners);
    const [bannerInterests, setBannerInterests] = usePersistentState<BannerInterest[]>('medzillo_bannerInterests', mockBannerInterests);


    const updateClinicStatus = useCallback(async (clinicId: string, isActive: boolean) => {
        setClinics(prevClinics =>
            prevClinics.map(clinic =>
                clinic.id === clinicId ? { ...clinic, isActive } : clinic
            )
        );
        addToast(`Clinic has been ${isActive ? 'activated' : 'deactivated'}.`, 'success');
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
        clinics,
        dataByClinicId,
        updateClinicStatus,
        banners,
        bannerInterests,
        addBanner,
        updateBannerStatus,
        deleteBanner,
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