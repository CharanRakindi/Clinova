import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Phone, Calendar, MapPin, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review your personal information and access authorization role settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authorized Role</p>
                  <span className="inline-block mt-0.5 text-xs font-extrabold uppercase text-primary-600 tracking-wider bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.phone || 'Not configured'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {user.dateOfBirth ? format(new Date(user.dateOfBirth), 'MMMM dd, yyyy') : 'Not configured'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">{user.gender || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-lg mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{user.name}</h2>
            <p className="text-sm font-semibold text-slate-400 mt-0.5 capitalize">{user.role.replace('_', ' ')}</p>

            <div className="w-full border-t border-slate-100 my-5 pt-5 space-y-4 text-left">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">STATUS</span>
                <span className="text-emerald-500 uppercase">ACTIVE</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">SECURITY METHOD</span>
                <span className="text-slate-800">JWT HTTPONLY</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">OFFLINE SYNC</span>
                <span className="text-slate-800">PWA CAPABLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
