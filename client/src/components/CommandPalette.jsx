import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Calendar, FileText, Settings, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
        <Command>
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <Command.Input 
              autoFocus
              placeholder="Type a command or search..." 
              className="flex-1 h-14 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium"
            />
            <button 
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Quick Links" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 py-1">
              {user?.role === 'admin' && (
                <>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate('/admin/dashboard'))}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-700 dark:aria-selected:text-primary-300"
                  >
                    <Settings className="w-4 h-4 mr-3 text-slate-400" /> Admin Dashboard
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate('/admin/users'))}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-700 dark:aria-selected:text-primary-300"
                  >
                    <Users className="w-4 h-4 mr-3 text-slate-400" /> Manage Users
                  </Command.Item>
                </>
              )}

              {user?.role === 'doctor' && (
                <>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate('/doctor/dashboard'))}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-700 dark:aria-selected:text-primary-300"
                  >
                    <Settings className="w-4 h-4 mr-3 text-slate-400" /> My Dashboard
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate('/doctor/patients'))}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-700 dark:aria-selected:text-primary-300"
                  >
                    <Users className="w-4 h-4 mr-3 text-slate-400" /> My Patients
                  </Command.Item>
                </>
              )}

              {user?.role === 'patient' && (
                <>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate('/patient/dashboard'))}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-700 dark:aria-selected:text-primary-300"
                  >
                    <Settings className="w-4 h-4 mr-3 text-slate-400" /> My Dashboard
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate('/patient/appointments'))}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-700 dark:aria-selected:text-primary-300"
                  >
                    <Calendar className="w-4 h-4 mr-3 text-slate-400" /> Appointments
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => navigate('/patient/records'))}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-700 dark:aria-selected:text-primary-300"
                  >
                    <FileText className="w-4 h-4 mr-3 text-slate-400" /> Medical Records
                  </Command.Item>
                </>
              )}
            </Command.Group>
          </Command.List>
          
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-500">↑</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-500">↓</span>
              <span className="text-xs text-slate-400 ml-1 flex items-center">to navigate</span>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-500">Enter</span>
              <span className="text-xs text-slate-400 ml-1 flex items-center">to select</span>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-500">esc</span>
              <span className="text-xs text-slate-400 ml-1 flex items-center">to close</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
