import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, SunIcon, MoonIcon, BellIcon, ComputerDesktopIcon } from './icons';
import { User, Notification } from '../types';
import { NotificationPanel } from './NotificationPanel';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  activeView: string;
  user: User | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  onMarkNotificationsAsRead: () => void;
  onClearNotifications: () => void;
  installPromptEvent: any | null;
  onInstallClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeView, user, onLogout, onToggleSidebar, theme, toggleTheme, 
  notifications, onMarkNotificationsAsRead, onClearNotifications, 
  installPromptEvent, onInstallClick
}) => {
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const getTitle = () => {
    if (!activeView) return "Dashboard";
    const title = activeView.replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleNotifications = () => {
    if (!isNotificationsOpen) {
      onMarkNotificationsAsRead();
    }
    setNotificationsOpen(prev => !prev);
  };
  
  const handleConfirmLogout = () => {
      onLogout();
      setIsLogoutConfirmOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="flex items-center justify-between w-full h-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center">
          <button onClick={onToggleSidebar} className="md:hidden mr-4 text-slate-600 dark:text-slate-400 hover:text-brand-primary">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 truncate">{getTitle()}</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {installPromptEvent && (
            <button 
              onClick={onInstallClick} 
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              title="Install App"
            >
              <ComputerDesktopIcon className="w-5 h-5"/>
          </button>
          )}
          <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
            {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
          </button>

          <div ref={notificationRef} className="relative">
            <button onClick={handleToggleNotifications} className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
              <BellIcon className="w-5 h-5"/>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-danger text-white text-xs items-center justify-center">{unreadCount}</span>
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <NotificationPanel
                notifications={notifications}
                onClearAll={onClearNotifications}
              />
            )}
          </div>
          
          <div ref={userMenuRef} className="relative">
            <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline text-slate-700 dark:text-slate-300 font-medium">{user?.name || 'Admin'}</span>
            </button>
            {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        <p className="text-xs mt-2 font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full inline-block">{user?.role}</p>
                    </div>
                    <div className="p-2">
                         <button onClick={() => { setIsLogoutConfirmOpen(true); setUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-medium text-danger hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md">
                            Logout
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </header>
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
    </>
  );
};