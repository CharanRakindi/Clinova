import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Activity, LayoutDashboard, Users, Stethoscope, Calendar, FileText, Menu, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

const RootLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = {
    patient: [
      { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
      { name: 'Appointments', href: '/patient/appointments', icon: Calendar },
      { name: 'Medical Records', href: '/patient/records', icon: FileText },
    ],
    doctor: [
      { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
      { name: 'Patients', href: '/doctor/patients', icon: Users },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Users', href: '/admin/users', icon: Users },
    ],
  };

  const navItems = user ? navigation[user.role] || [] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 transition-all duration-300 border-b",
        scrolled ? "bg-white/80 backdrop-blur-lg border-slate-200 shadow-sm" : "bg-white border-transparent"
      )}>
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 mr-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                MediVault
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700 leading-none">{user?.name}</span>
                <span className="text-[11px] font-medium text-primary-600 uppercase tracking-wider mt-1">
                  {user?.role}
                </span>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 font-bold shadow-inner ring-2 ring-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive 
                      ? "bg-white/10 text-white shadow-inner" 
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
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
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gradient-mesh">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
