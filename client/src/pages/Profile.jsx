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
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '../api/axios';
import DataValue from '../components/ui/DataValue';
import StatusBadge from '../components/ui/StatusBadge';

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
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const isPatient = user?.role === 'patient';
  const isStaff = useMemo(
    () =>
      user &&
      ['doctor', 'admin', 'receptionist', 'lab_technician'].includes(user.role),
    [user]
  );
  const [exporting, setExporting] = useState(false);

  const exportMyData = async () => {
    try {
      setExporting(true);
      const res = await api.get('/export/me', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinova-export-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      email: user.email || '',
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

  if (!user) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    if (isPatient) {
      const email = form.email.trim().toLowerCase();
      if (!email) {
        toast.error('Email is required');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Enter a valid email address');
        return;
      }
      if (email.endsWith('@clinova.com')) {
        toast.error('Use a personal email — @clinova.com is reserved for staff');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
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
      };
      if (isPatient) {
        payload.email = form.email.trim().toLowerCase();
      }

      await api.patch('/auth/profile', payload);
      await fetchUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addressLine = formatAddress({
    street: form.street,
    city: form.city,
    state: form.state,
    zipCode: form.zipCode,
    country: form.country,
  });

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account profile</h1>
          <p className="page-subtitle">
            {isPatient
              ? 'Update your personal details and contact email.'
              : 'Update your personal details. Staff email is managed by an administrator.'}
          </p>
        </div>
        {isPatient && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={exporting}
            onClick={exportMyData}
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Exporting…' : 'Export my data'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Primary: editable form */}
        <form onSubmit={handleSave} className="space-y-6 lg:col-span-2">
          <div className="card space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-2 border-b border-line-soft pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title">Personal details</h2>
                <p className="section-subtitle">Shown to your care team where relevant</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-sm self-start sm:self-auto"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden />
                )}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="profile-name" className="label flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                  Full name
                </label>
                <input
                  id="profile-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="profile-email" className="label flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                  Email address
                </label>
                {isPatient ? (
                  <>
                    <input
                      id="profile-email"
                      type="email"
                      className="input"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      required
                      autoComplete="email"
                      inputMode="email"
                      spellCheck={false}
                    />
                    <p className="mt-1.5 text-xs leading-snug text-ink-faint">
                      Used for login and appointment notices. Choose an address you check regularly.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        id="profile-email"
                        type="email"
                        className="input cursor-not-allowed bg-surface-subtle pr-10 text-ink-muted"
                        value={user.email}
                        disabled
                        readOnly
                        autoComplete="email"
                      />
                      <Lock
                        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-ink-faint">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {isStaff
                        ? 'Staff email can only be changed by an administrator.'
                        : 'Email cannot be changed from this screen.'}
                    </p>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="profile-phone" className="label flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                  Phone
                </label>
                <input
                  id="profile-phone"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+1 555 000 0000"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="profile-dob" className="label flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                  Date of birth
                </label>
                <input
                  id="profile-dob"
                  type="date"
                  className="input"
                  value={form.dateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setField('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="profile-gender" className="label">
                  Gender
                </label>
                <select
                  id="profile-gender"
                  className="select"
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
                <label htmlFor="profile-role" className="label flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                  Role
                </label>
                <input
                  id="profile-role"
                  className="input cursor-not-allowed bg-surface-subtle capitalize text-ink-muted"
                  value={String(user.role || '').replace(/_/g, ' ')}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="card space-y-5 p-5 sm:p-6">
            <h2 className="section-title border-b border-line-soft pb-3">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-faint" aria-hidden />
                Address
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="profile-street" className="label">
                  Street
                </label>
                <input
                  id="profile-street"
                  className="input"
                  value={form.street}
                  onChange={(e) => setField('street', e.target.value)}
                  placeholder="Street address"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label htmlFor="profile-city" className="label">
                  City
                </label>
                <input
                  id="profile-city"
                  className="input"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label htmlFor="profile-state" className="label">
                  State / region
                </label>
                <input
                  id="profile-state"
                  className="input"
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <label htmlFor="profile-zip" className="label">
                  ZIP / postal code
                </label>
                <input
                  id="profile-zip"
                  className="input"
                  value={form.zipCode}
                  onChange={(e) => setField('zipCode', e.target.value)}
                  autoComplete="postal-code"
                />
              </div>
              <div>
                <label htmlFor="profile-country" className="label">
                  Country
                </label>
                <input
                  id="profile-country"
                  className="input"
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  autoComplete="country-name"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Secondary: identity summary — quieter, not competing with the form */}
        <aside className="card flex flex-col items-center p-6 text-center lg:sticky lg:top-20 lg:self-start">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl font-medium text-ink-inverse shadow-sm"
            aria-hidden
          >
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h2 className="text-md font-medium text-ink">{user.name}</h2>
          <DataValue
            as="p"
            className="mt-1 text-sm font-normal"
            emptyClassName="mt-1 data-empty"
            value={isPatient ? form.email : user.email}
            empty="No email on file"
          />
          <span className="badge badge-neutral mt-3 capitalize">
            {String(user.role || '').replace(/_/g, ' ')}
          </span>

          <div className="mt-6 w-full space-y-3 border-t border-line-soft pt-5 text-left">
            <div className="meta-row">
              <span className="meta-label inline-flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" aria-hidden /> Status
              </span>
              <StatusBadge
                status={user.isActive === false ? 'cancelled' : 'active'}
                className="shrink-0"
              >
                {user.isActive === false ? 'Inactive' : 'Active'}
              </StatusBadge>
            </div>
            <div className="meta-row">
              <span className="meta-label">Member since</span>
              <DataValue
                as="span"
                className="meta-value"
                emptyClassName="meta-value data-empty"
                value={
                  user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : null
                }
                empty="Not on file"
              />
            </div>
            <div className="meta-row">
              <span className="meta-label">Address</span>
              <DataValue
                as="span"
                className="meta-value max-w-[60%] text-xs leading-snug"
                emptyClassName="meta-value data-empty max-w-[60%] text-xs"
                value={addressLine || null}
                empty="Not on file"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
