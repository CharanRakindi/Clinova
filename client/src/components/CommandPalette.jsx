import { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Users,
  Calendar,
  FileText,
  Settings,
  X,
  LayoutDashboard,
  User,
  Stethoscope,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { formatDoctorName } from '../utils/format';

const itemClass =
  'flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm font-normal text-ink-secondary aria-selected:bg-surface-subtle aria-selected:text-ink';

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

  const canSearchPatients = ['doctor', 'admin', 'receptionist'].includes(user?.role);
  const canSearchAppts = Boolean(user);

  const { data: patients } = useQuery({
    queryKey: ['cmdkPatients'],
    enabled: open && canSearchPatients,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 50 } });
      return res.data.data || [];
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ['cmdkAppointments'],
    enabled: open && canSearchAppts,
    staleTime: 20_000,
    queryFn: async () => {
      const res = await api.get('/appointments', { params: { limit: 40 } });
      return res.data.data || [];
    },
  });

  const patientRows = useMemo(() => {
    if (!Array.isArray(patients)) return [];
    return patients
      .map((p) => ({
        id: p.user?._id || p._id,
        name: p.user?.name || p.name || 'Patient',
        meta: p.patientId || p.user?.email || '',
      }))
      .filter((p) => p.id);
  }, [patients]);

  const aptRows = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return appointments.slice(0, 25).map((a) => ({
      id: a._id,
      label:
        user?.role === 'patient'
          ? formatDoctorName(a.doctor?.name)
          : a.patient?.name || 'Patient',
      when: `${format(new Date(a.appointmentDate), 'MMM dd')} · ${a.timeSlot || '—'}`,
      status: a.status,
      patientId: a.patient?._id,
    }));
  }, [appointments, user?.role]);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-surface-inverse/45 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
        <Command label="Command palette">
          <div className="flex items-center border-b border-line-soft px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 text-ink-faint" />
            <Command.Input
              autoFocus
              placeholder="Search pages, patients, appointments…"
              className="h-12 flex-1 bg-transparent text-base font-normal text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Command.List className="max-h-[min(60vh,22rem)] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-ink-muted">
              No results found.
            </Command.Empty>

            {canSearchPatients && patientRows.length > 0 && (
              <Command.Group
                heading="Patients"
                className="mb-1 px-2 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-ink-faint"
              >
                {patientRows.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`patient ${p.name} ${p.meta}`}
                    onSelect={() =>
                      runCommand(() => {
                        if (user?.role === 'doctor' || user?.role === 'admin') {
                          navigate(`/doctor/patients/${p.id}`);
                        } else {
                          navigate('/receptionist/dashboard');
                        }
                      })
                    }
                    className={itemClass}
                  >
                    <User className="mr-3 h-4 w-4 shrink-0 text-ink-faint" />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.meta ? (
                      <span className="ml-2 truncate text-2xs text-ink-faint">{p.meta}</span>
                    ) : null}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {aptRows.length > 0 && (
              <Command.Group
                heading="Appointments"
                className="mb-1 px-2 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-ink-faint"
              >
                {aptRows.map((a) => (
                  <Command.Item
                    key={a.id}
                    value={`appointment ${a.label} ${a.when} ${a.status}`}
                    onSelect={() =>
                      runCommand(() => {
                        if (user?.role === 'patient') {
                          navigate('/patient/appointments');
                        } else if (a.patientId && (user?.role === 'doctor' || user?.role === 'admin')) {
                          navigate(`/doctor/patients/${a.patientId}`);
                        } else if (user?.role === 'receptionist') {
                          navigate('/receptionist/dashboard');
                        } else {
                          navigate(rolePath(user?.role));
                        }
                      })
                    }
                    className={itemClass}
                  >
                    <Stethoscope className="mr-3 h-4 w-4 shrink-0 text-ink-faint" />
                    <span className="min-w-0 flex-1 truncate">{a.label}</span>
                    <span className="ml-2 shrink-0 text-2xs text-ink-faint">
                      {a.when} · {a.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Quick links"
              className="mb-1 px-2 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-ink-faint"
            >
              {user?.role === 'admin' && (
                <>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/admin/dashboard'))}
                    className={itemClass}
                  >
                    <LayoutDashboard className="mr-3 h-4 w-4 text-ink-faint" />
                    Admin dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/admin/users'))}
                    className={itemClass}
                  >
                    <Users className="mr-3 h-4 w-4 text-ink-faint" />
                    Manage users
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/admin/audit-logs'))}
                    className={itemClass}
                  >
                    <FileText className="mr-3 h-4 w-4 text-ink-faint" />
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
                    <LayoutDashboard className="mr-3 h-4 w-4 text-ink-faint" />
                    Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/doctor/patients'))}
                    className={itemClass}
                  >
                    <Users className="mr-3 h-4 w-4 text-ink-faint" />
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
                    <LayoutDashboard className="mr-3 h-4 w-4 text-ink-faint" />
                    Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/patient/appointments'))}
                    className={itemClass}
                  >
                    <Calendar className="mr-3 h-4 w-4 text-ink-faint" />
                    Appointments
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/patient/records'))}
                    className={itemClass}
                  >
                    <FileText className="mr-3 h-4 w-4 text-ink-faint" />
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
                  <LayoutDashboard className="mr-3 h-4 w-4 text-ink-faint" />
                  Dashboard
                </Command.Item>
              )}

              <Command.Item
                onSelect={() => runCommand(() => navigate('/profile'))}
                className={itemClass}
              >
                <Settings className="mr-3 h-4 w-4 text-ink-faint" />
                Profile & settings
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-line-soft px-4 py-3">
            <div className="flex items-center gap-1.5 text-2xs text-ink-faint">
              <kbd className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-ink-muted">
                ↑
              </kbd>
              <kbd className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-ink-muted">
                ↓
              </kbd>
              <span className="ml-1">navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-ink-faint">
              <kbd className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-ink-muted">
                Enter
              </kbd>
              <span className="ml-1">select</span>
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-ink-faint">
              <kbd className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-ink-muted">
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

function rolePath(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'receptionist') return '/receptionist/dashboard';
  if (role === 'lab_technician') return '/labtech/dashboard';
  return '/patient/dashboard';
}
