import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Activity, LayoutDashboard, Users, Calendar, FileText, Menu, ChevronRight, Search, Sun, Moon, User, HelpCircle, Shield, FlaskConical, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import CommandPalette from '../components/CommandPalette';
import NotificationCenter from '../components/NotificationCenter';
import OfflineBanner from '../components/OfflineBanner';
import OnboardingTour from '../components/OnboardingTour';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import ErrorBoundary from '../components/ErrorBoundary';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

const RootLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    // Live clock update
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(clockInterval);
    };
  }, []);

  const navigation = {
    patient: [
      { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
      { name: 'Appointments', href: '/patient/appointments', icon: Calendar },
      { name: 'Medical Records', href: '/patient/records', icon: FileText },
      { name: 'Profile & Settings', href: '/profile', icon: User },
    ],
    doctor: [
      { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
      { name: 'Patients', href: '/doctor/patients', icon: Users },
      { name: 'Profile & Settings', href: '/profile', icon: User },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
      { name: 'Profile & Settings', href: '/profile', icon: User },
    ],
    receptionist: [
      { name: 'Queue Dashboard', href: '/receptionist/dashboard', icon: LayoutDashboard },
      { name: 'Profile & Settings', href: '/profile', icon: User },
    ],
    lab_technician: [
      { name: 'Lab Dashboard', href: '/labtech/dashboard', icon: FlaskConical },
      { name: 'Profile & Settings', href: '/profile', icon: User },
    ],
  };

  const navItems = user ? navigation[user.role] || [] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      <CommandPalette />
      <OfflineBanner />
      <OnboardingTour />
      <KeyboardShortcutsHelp />
      
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 transition-all duration-300 border-b",
        scrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800 shadow-sm" : "bg-white dark:bg-slate-900 border-transparent dark:border-transparent"
      )}>
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 mr-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                MediVault
              </span>
            </div>

            {/* Breadcrumb / Current Date for Large screens */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              <span>{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">
                {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search Trigger */}
            <button
              id="search-trigger"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 rounded shadow-sm border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300">⌘K</kbd>
            </button>

            {/* Mobile Search Icon */}
            <button 
              className="sm:hidden p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            >
              <Search className="w-5 h-5" />
            </button>

            <NotificationCenter />

            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">{user?.name}</span>
                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-1 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded border border-primary-100 dark:border-primary-900/50">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold shadow-inner ring-2 ring-white dark:ring-slate-800">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Dark Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-sidebar flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:translate-x-0 lg:static",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Sidebar Header (Logo) */}
          <div className="h-16 flex items-center px-6 border-b border-white/10 hidden lg:flex">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-1.5 rounded-lg shadow-lg shadow-primary-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                MediVault
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
              Menu
            </div>
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-white/10 text-white shadow-inner" 
                        : "text-slate-350 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        "w-5 h-5 transition-colors duration-200", 
                        isActive ? "text-primary-400" : "text-slate-400 group-hover:text-primary-400"
                      )} />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                <span className="text-xs font-medium text-slate-300">System Online</span>
              </div>
              <span className="text-[10px] font-bold text-slate-450 hover:text-white cursor-pointer transition-colors" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}>
                Shortcuts (?)
              </span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gradient-mesh dark:bg-[#030712]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
            >
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
