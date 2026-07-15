import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Menu,
  Search,
  User,
  FlaskConical,
  Clock,
  Lock,
  X,
  MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import CommandPalette from '../components/CommandPalette';
import NotificationCenter from '../components/NotificationCenter';
import OfflineBanner from '../components/OfflineBanner';
import OnboardingTour from '../components/OnboardingTour';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import ErrorBoundary from '../components/ErrorBoundary';
import BrandMark from '../components/BrandMark';
import { motion, AnimatePresence } from 'framer-motion';

const RootLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setUpdating(true);
      await api.patch('/auth/update-password', {
        oldPassword: tempPassword,
        newPassword,
      });
      toast.success('Password changed successfully. Workspace unlocked.');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(clockInterval);
    };
  }, []);

  const navigation = {
    patient: [
      { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard, mobile: true },
      { name: 'Appointments', href: '/patient/appointments', icon: Calendar, mobile: true },
      { name: 'Records', href: '/patient/records', icon: FileText, mobile: true },
      { name: 'Messages', href: '/messages', icon: MessageSquare, mobile: true },
      { name: 'Profile', href: '/profile', icon: User, mobile: true },
    ],
    doctor: [
      { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
      { name: 'Patients', href: '/doctor/patients', icon: Users },
      { name: 'Messages', href: '/messages', icon: MessageSquare },
      { name: 'Profile & Settings', href: '/profile', icon: User },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
      { name: 'Messages', href: '/messages', icon: MessageSquare },
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

  if (user && user.mustChangePassword) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface-muted p-4">
        <div className="card w-full max-w-md space-y-6 p-8 animate-scale-in">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface-subtle text-ink-secondary">
              <Lock className="h-4.5 w-4.5" aria-hidden />
            </div>
            <h1 className="text-lg font-medium tracking-tight text-ink">
              Reset your password
            </h1>
            <p className="mt-1.5 text-sm font-normal text-ink-muted">
              This is your first login. Set a new password to secure your account.
            </p>
          </div>

          <form onSubmit={handleForcePasswordChange} className="space-y-4">
            <div>
              <label className="label">Temporary password</label>
              <input
                type="password"
                required
                className="input"
                placeholder="Initial password from admin"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                required
                className="input"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                required
                className="input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="btn btn-primary w-full py-2.5 mt-1"
            >
              {updating ? 'Updating…' : 'Update & unlock workspace'}
            </button>
          </form>

          <button
            type="button"
            onClick={logout}
            className="btn btn-ghost w-full py-2 text-ink-muted"
          >
            Cancel & log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted font-sans text-ink">
      <CommandPalette />
      <OfflineBanner />
      <OnboardingTour />
      <KeyboardShortcutsHelp />

      {/* Top bar — light, uncluttered workspace chrome */}
      <header
        className={cn(
          'sticky top-0 z-30 border-b transition-[background-color,box-shadow,border-color] duration-product',
          scrolled
            ? 'border-line bg-surface/90 shadow-xs backdrop-blur-xl'
            : 'border-line-soft bg-surface-muted/80 backdrop-blur-md'
        )}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="tap-target -ml-1 inline-flex items-center justify-center rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 max-w-[12.5rem] lg:hidden">
              <BrandMark size="sm" tone="dark" asLink />
            </div>

            <div className="hidden items-center gap-2 text-xs text-ink-faint lg:flex">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span className="tabular-nums">
                {currentTime.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-line-strong" aria-hidden>
                ·
              </span>
              <span className="font-mono tabular-nums">
                {currentTime.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              id="search-trigger"
              type="button"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true })
                )
              }
              className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-faint shadow-xs transition-colors hover:border-line-strong hover:text-ink-muted sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-2xs text-ink-faint">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink-secondary sm:hidden"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true })
                )
              }
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <NotificationCenter />

            <div className="mx-1 hidden h-4 w-px bg-line sm:block" aria-hidden />

            <div className="flex items-center gap-2.5 pl-0.5">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-medium leading-none tracking-[-0.01em] text-ink">
                  {user?.name}
                </span>
                <span className="mt-1 text-2xs font-medium capitalize tracking-wide text-ink-faint">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-medium text-white shadow-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-ink-faint transition-colors duration-product hover:bg-danger-soft hover:text-danger"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-surface-inverse/50 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'bg-about-dark fixed inset-y-0 left-0 z-50 flex w-64 flex-col shadow-premium-lg transition-transform duration-product ease-out lg:static lg:translate-x-0 lg:shadow-none',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="hidden h-14 items-center justify-between border-b border-white/[0.06] px-5 lg:flex">
            <BrandMark size="sm" tone="light" asLink />
          </div>

          {/* Mobile drawer header */}
          <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5 lg:hidden">
            <BrandMark size="sm" tone="light" asLink />
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
            <p className="mb-3 px-3 text-2xs font-medium uppercase tracking-[0.16em] text-white/30">
              Workspace
            </p>
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href + '/'));
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.25, ease: 'easeOut' }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      'group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors duration-product',
                      isActive
                        ? 'bg-white/[0.1] text-white ring-1 ring-sky-400/20'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] transition-colors',
                          isActive
                            ? 'text-sky-300'
                            : 'text-white/35 group-hover:text-white/65'
                        )}
                        strokeWidth={1.75}
                      />
                      <span className="text-sm font-normal tracking-[-0.01em]">
                        {item.name}
                      </span>
                    </div>
                    {isActive && <span className="dot-live" aria-hidden />}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="border-t border-white/[0.06] p-4">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="dot-live animate-pulse" aria-hidden />
                <span className="text-2xs font-normal tracking-[-0.01em] text-white/50">
                  System online
                </span>
              </div>
              <button
                type="button"
                className="text-2xs font-medium text-white/35 transition-colors hover:text-white"
                onClick={() =>
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
                }
              >
                Shortcuts
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-mesh">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'mx-auto max-w-content p-3 sm:p-6 lg:p-8',
                user?.role === 'patient'
                  ? 'pb-[max(5.5rem,env(safe-area-inset-bottom))] lg:pb-8'
                  : 'pb-[max(1rem,env(safe-area-inset-bottom))]'
              )}
            >
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Patient mobile bottom nav */}
      {user?.role === 'patient' && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          aria-label="Patient primary"
        >
          <div className="mx-auto flex max-w-content items-stretch justify-around px-1 pt-1">
            {navItems
              .filter((i) => i.mobile)
              .map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-2xs font-medium',
                      active ? 'text-sky-600' : 'text-ink-faint'
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default RootLayout;
