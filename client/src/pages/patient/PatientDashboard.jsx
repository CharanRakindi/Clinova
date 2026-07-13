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
import { formatDoctorName } from '../../utils/format';

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
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            Your health record and scheduled consultations
          </p>
        </div>

        <Link to="/patient/appointments" className="btn btn-primary">
          Book consultation
        </Link>
      </div>

      {/* Grid overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard 
          index={0}
          title="Upcoming Visits" 
          value={stats?.upcomingAppointments || 0} 
          icon={Calendar} 
          contextText={appointments?.[0] ? `Next: ${formatDoctorName(appointments[0].doctor?.name)} on ${format(new Date(appointments[0].appointmentDate), 'MMM dd')}` : 'No upcoming visits scheduled'}
          actionText="Book consultation"
          actionHref="/patient/appointments"
        />
        <StatCard 
          index={1}
          title="Medical Records" 
          value={stats?.totalRecords || 0} 
          icon={FileText} 
          contextText="HIPAA-protected electronic records"
          actionText="Open medical records"
          actionHref="/patient/records"
        />
        <StatCard 
          index={2}
          title="Health Status" 
          value="Stable" 
          icon={HeartPulse} 
          contextText="All recent vitals are within normal range"
          actionText="Review vitals trends"
          actionHref="#vitals-trend"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Profile Summary & Quick list */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div id="patient-health-profile" className="card p-5 space-y-4">
            <h3 className="text-[14.5px] font-semibold text-slate-800 pb-3 border-b border-slate-100">Health Profile</h3>
            
            <div className="space-y-3.5 text-[13px] font-medium">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Blood group</span>
                <span className="font-semibold text-slate-800">
                  {profile?.bloodGroup || 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Emergency contact</span>
                <span className="text-right font-semibold text-slate-700">
                  {profile?.emergencyContact?.name
                    ? `${profile.emergencyContact.name}${
                        profile.emergencyContact.relationship
                          ? ` (${profile.emergencyContact.relationship})`
                          : ''
                      }`
                    : 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Insurance provider</span>
                <span className="font-semibold text-slate-700">
                  {profile?.insuranceProvider || 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Policy identifier</span>
                <span className="font-mono font-semibold text-slate-700">
                  {profile?.insuranceNumber || 'Not configured'}
                </span>
              </div>
            </div>
          </div>

          {/* Allergies from API when present */}
          <div className="card space-y-3 p-5">
            <h3 className="flex items-center gap-2 text-[14px] font-medium text-slate-800">
              <ShieldAlert className="h-4 w-4 text-slate-400" />
              Medical alerts
            </h3>
            <p className="text-[12.5px] font-normal text-slate-500">
              Allergy and condition alerts appear here when recorded by your care team.
              Update them with your doctor if anything is missing.
            </p>
          </div>
        </div>

        {/* Right Side: Charts & Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vitals Charts */}
          {vitalsChartData.length > 0 && (
            <div id="vitals-trend" className="card p-5">
              <h3 className="text-[14.5px] font-semibold text-slate-800 mb-4">Vitals Trends</h3>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="pulse" name="Pulse (bpm)" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="systolic" name="Systolic (mmHg)" stroke="#2563EB" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Active Lists Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-slate-100 p-1.5 gap-1 bg-slate-50/50">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`flex-1 py-1.5 px-3 text-[12px] font-semibold rounded-lg transition-all ${
                  activeTab === 'overview' ? 'bg-white shadow-sm text-slate-900 border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Appointments
              </button>
              <button 
                onClick={() => setActiveTab('prescriptions')} 
                className={`flex-1 py-1.5 px-3 text-[12px] font-semibold rounded-lg transition-all ${
                  activeTab === 'prescriptions' ? 'bg-white shadow-sm text-slate-900 border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Prescriptions
              </button>
              <button 
                onClick={() => setActiveTab('reports')} 
                className={`flex-1 py-1.5 px-3 text-[12px] font-semibold rounded-lg transition-all ${
                  activeTab === 'reports' ? 'bg-white shadow-sm text-slate-900 border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Lab Reports
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {(!appointments || appointments.length === 0) ? (
                    <div className="text-center text-slate-400 font-medium py-8 text-[12.5px]">
                      No upcoming appointments scheduled
                    </div>
                  ) : (
                    appointments.map(apt => (
                      <div key={apt._id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/60">
                        <div>
                          <p className="font-semibold text-[13px] text-slate-900">{formatDoctorName(apt.doctor?.name)}</p>
                          <p className="text-[11.5px] font-medium text-slate-400 mt-0.5">{format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} • {apt.timeSlot}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-primary-100 bg-primary-50 text-primary-700">
                          {apt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {(!prescriptions || prescriptions.length === 0) ? (
                    <div className="text-center text-slate-400 font-medium py-8 text-[12.5px]">
                      No active prescriptions logged
                    </div>
                  ) : (
                    prescriptions.map(p => (
                      <div key={p._id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/60 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-[13.5px] text-slate-900 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-primary-600" />
                              {p.medicines?.[0]?.medicineName} {p.medicines?.length > 1 && `+${p.medicines.length - 1} more`}
                            </p>
                            <p className="text-[11.5px] font-medium text-slate-400 mt-0.5">Prescribed by {formatDoctorName(p.doctor?.name)}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 leading-normal">{p.instructions}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {(!labReports || labReports.length === 0) ? (
                    <div className="text-center text-slate-400 font-medium py-8 text-[12.5px]">
                      No lab reports uploaded
                    </div>
                  ) : (
                    labReports.map(report => (
                      <div key={report._id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/60">
                        <div>
                          <p className="font-semibold text-[13.5px] text-slate-900 flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-primary-600" />
                            {report.testName}
                          </p>
                          <p className="text-[11.5px] font-medium text-slate-400 mt-0.5">Completed: {report.resultDate ? format(new Date(report.resultDate), 'MMM dd, yyyy') : 'Pending'}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                          report.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-200'
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
