import React from 'react';
import { View, User, UserRole } from '../types';
import { DashboardIcon, MedicineIcon, BillingIcon, HistoryIcon, SupplierIcon, ReportsIcon, SettingsIcon, PatientsIcon, CalendarDaysIcon, PlusIcon, ChatBubbleLeftRightIcon, LogoIcon } from './icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  currentUser: User;
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  toBeBilledCount: number;
  unreadChatCount: number;
  todaysQueueCount: number;
}

const NavLink: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badgeCount?: number;
}> = ({ icon: Icon, label, isActive, onClick, badgeCount }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`relative flex items-center px-4 py-2.5 text-sm font-medium transition-colors duration-200 transform rounded-lg ${
        isActive
          ? 'bg-brand-primary text-white font-semibold shadow-sm'
          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="mx-4">{label}</span>
      {badgeCount && badgeCount > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-danger text-white text-xs items-center justify-center">{badgeCount}</span>
        </span>
      )}
    </a>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, currentUser, isMobileOpen, setMobileOpen, toBeBilledCount, unreadChatCount, todaysQueueCount }) => {
  
  interface NavItem { 
    id: View; 
    label: string; 
    icon: React.ElementType 
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }
  
  const communicationNavSection: NavSection = {
      title: 'Communication',
      items: [
        { id: 'chat', label: 'Staff Chat', icon: ChatBubbleLeftRightIcon },
      ]
  };
  
  const doctorNav: NavSection[] = [
    {
      title: 'Patient Consultation',
      items: [
        { id: 'doctor-dashboard', label: "Dashboard", icon: DashboardIcon },
        { id: 'todays-appointments', label: "Today's Queue", icon: HistoryIcon },
        { id: 'patients', label: 'All Patients', icon: PatientsIcon },
        { id: 'consultation-reports', label: 'Reports', icon: ReportsIcon },
      ]
    },
    communicationNavSection,
    {
      title: 'Billing',
      items: [
        { id: 'to-be-billed', label: 'To be Billed', icon: BillingIcon },
        { id: 'billing', label: 'New Bill', icon: PlusIcon },
        { id: 'billing-history', label: 'Billing History', icon: HistoryIcon },
      ]
    }
  ];

  const pharmacistNav: NavSection[] = [
    {
      title: 'Pharmacy',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'medicines', label: 'Medicines', icon: MedicineIcon },
        { id: 'to-be-billed', label: 'To be Billed', icon: BillingIcon },
        { id: 'billing', label: 'New Bill', icon: PlusIcon },
        { id: 'billing-history', label: 'Billing History', icon: HistoryIcon },
        { id: 'suppliers', label: 'Suppliers', icon: SupplierIcon },
        { id: 'reports', label: 'Reports', icon: ReportsIcon },
      ]
    },
    communicationNavSection,
    {
      title: 'Management',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
      ]
    }
  ];

  const adminNav: NavSection[] = [
    {
      title: 'Clinic',
      items: [
        { id: 'clinic-dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'patients', label: 'Patients', icon: PatientsIcon },
        { id: 'appointments', label: 'Appointments', icon: CalendarDaysIcon },
        { id: 'clinic-reports', label: 'Reports', icon: ReportsIcon },
      ]
    },
    ...pharmacistNav,
  ];
  
  const getNavForRole = (role: UserRole): NavSection[] => {
    switch (role) {
      case 'Admin': return adminNav;
      case 'Pharmacist': return pharmacistNav;
      case 'Doctor': return doctorNav;
      default: return [];
    }
  };

  const navSections = getNavForRole(currentUser.role);

  const handleLinkClick = (view: View) => {
    setActiveView(view);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between flex-1 mt-6">
      <nav className="space-y-6">
        {navSections.map((section, index) => (
          <div key={section.title} className={index > 0 ? "border-t border-slate-700 pt-6" : ""}>
            <h3 className="px-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeView === item.id}
                  onClick={() => handleLinkClick(item.id)}
                  badgeCount={
                    item.id === 'to-be-billed' ? toBeBilledCount :
                    item.id === 'chat' ? unreadChatCount : 
                    item.id === 'todays-appointments' ? todaysQueueCount : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
  
  const SidebarHeader = () => (
    <div className="flex items-center px-4 gap-3">
        <LogoIcon className="w-8 h-8 text-white"/>
        <h2 className="text-3xl font-bold text-white">Medzillo</h2>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-30 transition-opacity duration-300 md:hidden ${isMobileOpen ? 'bg-black bg-opacity-50' : 'pointer-events-none opacity-0'}`} onClick={() => setMobileOpen(false)}></div>
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen px-4 py-8 overflow-y-auto bg-brand-secondary border-r transform transition-transform duration-300 md:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarHeader />
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-brand-secondary border-r rtl:border-r-0 rtl:border-l hidden md:flex">
        <SidebarHeader />
        {sidebarContent}
      </aside>
    </>
  );
};
