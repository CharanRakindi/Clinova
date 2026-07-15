import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Shield,
  Phone,
  Calendar,
  MapPin,
  Activity,
  Save,
  Loader2,
  Lock,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '../api/axios';

function formatAddress(address) {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.street, address.city, address.state, address.zipCode, address.country]
    .filter(Boolean)
    .join(', ');
}

function toDateInput(value) {
  if (!value) return '';
  try {
    return format(new Date(value), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

export default function Profile() {
  const { user, fetchUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      dateOfBirth: toDateInput(user.dateOfBirth),
      gender: user.gender || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || '',
      country: user.address?.country || '',
    });
  }, [user]);

  const isStaff = useMemo(
    () =>
      user &&
      ['doctor', 'admin', 'receptionist', 'lab_technician'].includes(user.role),
    [user]
  );

  if (!user) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    try {
      setSaving(true);
      await api.patch('/auth/profile', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || '',
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zipCode: form.zipCode.trim(),
          country: form.country.trim(),
        },
      });
      await fetchUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account profile</h1>
          <p className="page-subtitle">
            Update your personal details. Email changes require an administrator.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSave} className="space-y-6 lg:col-span-2">
          <div className="card space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-2 border-b border-line-soft pb-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="section-title">Personal details</h3>
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm self-start sm:self-auto">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-ink-faint" />
                  Full name
                </label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-ink-faint" />
                  Email address
                </label>
                <div className="relative">
                  <input
                    className="input cursor-not-allowed bg-surface-subtle pr-10 text-ink-muted"
                    value={user.email}
                    disabled
                    readOnly
                  />
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                </div>
                <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-ink-faint">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {isStaff
                    ? 'Staff email can only be changed by an administrator.'
                    : 'Contact support or an admin if you need to change your email.'}
                </p>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-ink-faint" />
                  Phone
                </label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+1 555 000 0000"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-ink-faint" />
                  Date of birth
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.dateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setField('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Gender</label>
                <select
                  className="input appearance-none"
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-ink-faint" />
                  Role
                </label>
                <input
                  className="input cursor-not-allowed bg-surface-subtle capitalize text-ink-muted"
                  value={String(user.role || '').replace(/_/g, ' ')}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="card space-y-5 p-5 sm:p-6">
            <h3 className="section-title border-b border-line-soft pb-3">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-faint" />
                Address
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Street</label>
                <input
                  className="input"
                  value={form.street}
                  onChange={(e) => setField('street', e.target.value)}
                  placeholder="Street address"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label className="label">State / region</label>
                <input
                  className="input"
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <label className="label">ZIP / postal code</label>
                <input
                  className="input"
                  value={form.zipCode}
                  onChange={(e) => setField('zipCode', e.target.value)}
                  autoComplete="postal-code"
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  className="input"
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  autoComplete="country-name"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="card flex flex-col items-center p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl font-medium text-white shadow-premium">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-md font-medium tracking-[-0.02em] text-ink">{user.name}</h3>
          <p className="mt-1 text-sm font-normal text-ink-muted">{user.email}</p>
          <span className="badge badge-neutral mt-3 uppercase tracking-wider">
            {String(user.role || '').replace(/_/g, ' ')}
          </span>

          <div className="mt-6 w-full space-y-3 border-t border-line-soft pt-5 text-left">
            <div className="meta-row">
              <span className="meta-label inline-flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Status
              </span>
              <span className="meta-value">
                {user.isActive === false ? 'Inactive' : 'Active'}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Member since</span>
              <span className="meta-value">
                {user.createdAt ? (
                  format(new Date(user.createdAt), 'MMM yyyy')
                ) : (
                  <span className="data-empty">Not on file</span>
                )}
              </span>
            </div>
            {formatAddress(user.address) && (
              <div className="meta-row">
                <span className="meta-label">Address</span>
                <span className="meta-value max-w-[60%] text-xs leading-snug">
                  {formatAddress(user.address)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
