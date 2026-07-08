import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { Calendar, FileText, Clock, HeartPulse, ShieldAlert, Heart, Activity, FileCheck, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch Patient Profile
  const { data: profile } = useQuery({
    queryKey: ['patientProfile', user?._id],
    queryFn: async () => {
      const res = await api.get(`/patients/${user._id}`);
      return res.data.data;
    },
    enabled: !!user?._id
  });

  // Fetch Medical Records (for vitals trend chart)
  const { data: records } = useQuery({
    queryKey: ['myRecords'],
    queryFn: async () => {
      const res = await api.get(`/patients/${user._id}/medical-records`);
      return res.data.data;
    },
    enabled: !!user?._id
  });

  // Fetch Prescriptions
  const { data: prescriptions } = useQuery({
    queryKey: ['myPrescriptions'],
    queryFn: async () => {
      const res = await api.get('/prescriptions');
      return res.data.data;
    }
  });

  // Fetch Lab Reports
  const { data: labReports } = useQuery({
    queryKey: ['myLabReports'],
    queryFn: async () => {
      const res = await api.get('/lab-reports');
      return res.data.data;
    }
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['patientStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    }
  });

  const { data: appointments } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data.filter(a => ['requested', 'confirmed'].includes(a.status));
    }
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  // Extract vitals data for chart
  const vitalsChartData = records
    ?.filter(r => r.vitals && (r.vitals.pulse || r.vitals.bloodPressureSystolic))
    ?.map(r => ({
      date: format(new Date(r.visitDate), 'MMM dd'),
      pulse: r.vitals.pulse || 0,
      systolic: r.vitals.bloodPressureSystolic || 0,
      diastolic: r.vitals.bloodPressureDiastolic || 0
    }))
    .reverse() || [];

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-700 p-8 shadow-lg shadow-blue-200 overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute right-32 bottom-0 -mb-16 w-48 h-48 rounded-full bg-indigo-400 opacity-20 blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 animate-fade-in-up">
            Hello, {user?.name.split(' ')[0]} ☀️
          </h1>
          <p className="text-indigo-100 font-medium max-w-xl">
            Welcome to your personal health portal. You have {stats?.upcomingAppointments || 0} upcoming appointments scheduled.
          </p>
        </div>

        <Link to="/patient/appointments" className="relative z-10 bg-white hover:bg-slate-50 text-indigo-700 px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm">
          Book Appointment
        </Link>
      </div>

      {/* Grid overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          index={0}
          title="Upcoming Appointments" 
          value={stats?.upcomingAppointments || 0} 
          icon={Calendar} 
          className="border-t-4 border-t-indigo-500"
          description="Scheduled visits"
        />
        <StatCard 
          index={1}
          title="Medical Records" 
          value={stats?.totalRecords || 0} 
          icon={FileText} 
          className="border-t-4 border-t-emerald-500"
          description="Total active records"
        />
        <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-pink-500 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Health Status</h3>
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-2xl font-extrabold text-slate-800 tracking-tight">Good</p>
            <p className="mt-2 text-sm text-slate-500 font-medium">Keep up the healthy habits!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Profile Summary & Quick list */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">Health Profile</h3>
            
            <div className="space-y-3.5 text-sm font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Blood Group</span>
                <span className="text-rose-500">{profile?.bloodGroup || 'O+'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency contact</span>
                <span className="text-slate-700">{profile?.emergencyContact?.name || 'Mary Doe'} ({profile?.emergencyContact?.relationship || 'Spouse'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Insurance provider</span>
                <span className="text-slate-700">{profile?.insuranceProvider || 'MetLife Health'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Insurance number</span>
                <span className="text-slate-700">{profile?.insuranceNumber || 'MET-8932'}</span>
              </div>
            </div>
          </div>

          {/* Active Medical Alerts */}
          <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 space-y-4">
            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Medical Alerts
            </h3>
            <div className="text-sm font-medium text-rose-800">
              <ul className="list-disc pl-5 space-y-1.5 font-bold">
                <li>Allergy: Penicillin (Severe Reaction)</li>
                <li>Allergy: Peanuts (Moderate Reaction)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Charts & Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vitals Charts */}
          {vitalsChartData.length > 0 && (
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Vitals Trends</h3>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0'}} />
                    <Line type="monotone" dataKey="pulse" name="Pulse (bpm)" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="systolic" name="Systolic (mmHg)" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Active Lists Tabs */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 p-2 gap-1 bg-slate-50/50">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'overview' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Appointments
              </button>
              <button 
                onClick={() => setActiveTab('prescriptions')} 
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'prescriptions' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Prescriptions
              </button>
              <button 
                onClick={() => setActiveTab('reports')} 
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'reports' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Lab Reports
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {(!appointments || appointments.length === 0) ? (
                    <div className="text-center text-slate-400 font-semibold py-8">
                      No upcoming appointments scheduled
                    </div>
                  ) : (
                    appointments.map(apt => (
                      <div key={apt._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">Dr. {apt.doctor?.name}</p>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">{format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} • {apt.timeSlot}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-100 bg-emerald-50 text-emerald-700">
                          {apt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  {(!prescriptions || prescriptions.length === 0) ? (
                    <div className="text-center text-slate-400 font-semibold py-8">
                      No active prescriptions logged
                    </div>
                  ) : (
                    prescriptions.map(p => (
                      <div key={p._id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1">
                              <Pill className="w-4 h-4 text-primary-500" />
                              {p.medicines?.[0]?.medicineName} {p.medicines?.length > 1 && `+${p.medicines.length - 1} more`}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">Prescribed by Dr. {p.doctor?.name}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 text-primary-600 border border-primary-100">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{p.instructions}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {(!labReports || labReports.length === 0) ? (
                    <div className="text-center text-slate-400 font-semibold py-8">
                      No lab reports uploaded
                    </div>
                  ) : (
                    labReports.map(report => (
                      <div key={report._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                        <div>
                          <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1">
                            <FileCheck className="w-4 h-4 text-emerald-500" />
                            {report.testName}
                          </p>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">Completed: {report.resultDate ? format(new Date(report.resultDate), 'MMM dd, yyyy') : 'Pending'}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          report.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
