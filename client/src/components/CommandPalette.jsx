import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Calendar, FileText, Settings, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const itemClass =
  'flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm font-normal text-slate-700 aria-selected:bg-slate-50 aria-selected:text-slate-900';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
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
    <div className="fixed inset-0 z-[100] flex animate-fade-in items-start justify-center px-4 pt-[15vh]">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-premium-lg">
        <Command>
          <div className="flex items-center border-b border-slate-100 px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
            <Command.Input
              autoFocus
              placeholder="Search pages and actions…"
              className="h-12 flex-1 bg-transparent text-base font-normal text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Quick links"
              className="mb-1 px-2 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-slate-400"
            >
              {user?.role === 'admin' && (
                <>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/admin/dashboard'))}
                    className={itemClass}
                  >
                    <LayoutDashboard className="mr-3 h-4 w-4 text-slate-400" />
                    Admin dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/admin/users'))}
                    className={itemClass}
                  >
                    <Users className="mr-3 h-4 w-4 text-slate-400" />
                    Manage users
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/admin/audit-logs'))}
                    className={itemClass}
                  >
                    <FileText className="mr-3 h-4 w-4 text-slate-400" />
                    Audit logs
                  </Command.Item>
                </>
              )}

              {user?.role === 'doctor' && (
                <>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/doctor/dashboard'))}
                    className={itemClass}
                  >
                    <LayoutDashboard className="mr-3 h-4 w-4 text-slate-400" />
                    Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/doctor/patients'))}
                    className={itemClass}
                  >
                    <Users className="mr-3 h-4 w-4 text-slate-400" />
                    Patients
                  </Command.Item>
                </>
              )}

              {user?.role === 'patient' && (
                <>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/patient/dashboard'))}
                    className={itemClass}
                  >
                    <LayoutDashboard className="mr-3 h-4 w-4 text-slate-400" />
                    Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/patient/appointments'))}
                    className={itemClass}
                  >
                    <Calendar className="mr-3 h-4 w-4 text-slate-400" />
                    Appointments
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/patient/records'))}
                    className={itemClass}
                  >
                    <FileText className="mr-3 h-4 w-4 text-slate-400" />
                    Medical records
                  </Command.Item>
                </>
              )}

              {(user?.role === 'receptionist' || user?.role === 'lab_technician') && (
                <Command.Item
                  onSelect={() =>
                    runCommand(() =>
                      navigate(
                        user.role === 'receptionist'
                          ? '/receptionist/dashboard'
                          : '/labtech/dashboard'
                      )
                    )
                  }
                  className={itemClass}
                >
                  <LayoutDashboard className="mr-3 h-4 w-4 text-slate-400" />
                  Dashboard
                </Command.Item>
              )}

              <Command.Item
                onSelect={() => runCommand(() => navigate('/profile'))}
                className={itemClass}
              >
                <Settings className="mr-3 h-4 w-4 text-slate-400" />
                Profile & settings
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-1.5 text-2xs text-slate-400">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-500">
                ↑
              </kbd>
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-500">
                ↓
              </kbd>
              <span className="ml-1">navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-slate-400">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-500">
                Enter
              </kbd>
              <span className="ml-1">select</span>
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-slate-400">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-500">
                esc
              </kbd>
              <span className="ml-1">close</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
