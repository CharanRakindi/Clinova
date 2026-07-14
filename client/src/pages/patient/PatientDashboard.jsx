import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { Calendar, FileText, HeartPulse, ShieldAlert, FileCheck, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDoctorName } from '../../utils/format';
import { cn } from '../../utils/cn';

const statusBadge = (status) => {
  if (status === 'confirmed' || status === 'completed' || status === 'active') return 'badge-success';
  if (status === 'requested' || status === 'ordered' || status === 'processing') return 'badge-warning';
  if (status === 'cancelled') return 'badge-danger';
  return 'badge-neutral';
};

const PatientDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profile } = useQuery({
    queryKey: ['patientProfile', user?._id],
    queryFn: async () => {
      const res = await api.get(`/patients/${user._id}`);
      return res.data.data;
    },
    enabled: !!user?._id,
  });

  const { data: records } = useQuery({
    queryKey: ['myRecords'],
    queryFn: async () => {
      const res = await api.get(`/patients/${user._id}/medical-records`);
      return res.data.data;
    },
    enabled: !!user?._id,
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['myPrescriptions'],
    queryFn: async () => {
      const res = await api.get('/prescriptions');
      return res.data.data;
    },
  });

  const { data: labReports } = useQuery({
    queryKey: ['myLabReports'],
    queryFn: async () => {
      const res = await api.get('/lab-reports');
      return res.data.data;
    },
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['patientStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data.filter((a) => ['requested', 'confirmed'].includes(a.status));
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const vitalsChartData =
    records
      ?.filter((r) => r.vitals && (r.vitals.pulse || r.vitals.bloodPressureSystolic))
      ?.map((r) => ({
        date: format(new Date(r.visitDate), 'MMM dd'),
        pulse: r.vitals.pulse || 0,
        systolic: r.vitals.bloodPressureSystolic || 0,
        diastolic: r.vitals.bloodPressureDiastolic || 0,
      }))
      .reverse() || [];

  const tabs = [
    { id: 'overview', label: 'Appointments' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'reports', label: 'Lab reports' },
  ];

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">Your health record and scheduled consultations</p>
        </div>
        <Link to="/patient/appointments" className="btn btn-primary">
          Book consultation
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          index={0}
          title="Upcoming visits"
          value={stats?.upcomingAppointments || 0}
          icon={Calendar}
          contextText={
            appointments?.[0]
              ? `Next: ${formatDoctorName(appointments[0].doctor?.name)} on ${format(new Date(appointments[0].appointmentDate), 'MMM dd')}`
              : 'No upcoming visits scheduled'
          }
          actionText="Book consultation"
          actionHref="/patient/appointments"
        />
        <StatCard
          index={1}
          title="Medical records"
          value={stats?.totalRecords || 0}
          icon={FileText}
          contextText="Your consultation history and notes"
          actionText="Open medical records"
          actionHref="/patient/records"
        />
        <StatCard
          index={2}
          title="Health status"
          value="Stable"
          icon={HeartPulse}
          contextText="Based on recent recorded vitals"
          actionText="Review vitals trends"
          actionHref="#vitals-trend"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <div id="patient-health-profile" className="card space-y-4 p-5">
            <h3 className="panel-title border-b border-slate-100 pb-3">Health profile</h3>
            <div className="space-y-3.5">
              <div className="meta-row">
                <span className="meta-label">Blood group</span>
                <span className="meta-value">{profile?.bloodGroup || 'Not configured'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Emergency contact</span>
                <span className="meta-value">
                  {profile?.emergencyContact?.name
                    ? `${profile.emergencyContact.name}${
                        profile.emergencyContact.relationship
                          ? ` (${profile.emergencyContact.relationship})`
                          : ''
                      }`
                    : 'Not configured'}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Insurance</span>
                <span className="meta-value">
                  {profile?.insuranceProvider || 'Not configured'}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Policy ID</span>
                <span className="meta-value font-mono text-xs">
                  {profile?.insuranceNumber || 'Not configured'}
                </span>
              </div>
            </div>
          </div>

          <div className="card space-y-3 p-5">
            <h3 className="panel-title flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              Medical alerts
            </h3>
            <p className="text-xs leading-relaxed tracking-[-0.01em] text-slate-500">
              Allergy and condition alerts appear here when recorded by your care team.
            </p>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {vitalsChartData.length > 0 && (
            <div id="vitals-trend" className="card p-5">
              <h3 className="panel-title mb-1">Vitals trends</h3>
              <p className="panel-meta mb-4">From your recent consultations</p>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px -8px rgba(15,23,42,0.12)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pulse"
                      name="Pulse (bpm)"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      name="Systolic (mmHg)"
                      stroke="#64748b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="tabs-bar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn('tab-btn', activeTab === tab.id && 'tab-btn-active')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-5">
              {activeTab === 'overview' && (
                <div className="space-y-2.5">
                  {!appointments?.length ? (
                    <div className="empty-state">No upcoming appointments</div>
                  ) : (
                    appointments.map((apt) => (
                      <div key={apt._id} className="list-row">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium tracking-[-0.01em] text-slate-900">
                            {formatDoctorName(apt.doctor?.name)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} · {apt.timeSlot}
                          </p>
                        </div>
                        <span className={cn('badge shrink-0 capitalize', statusBadge(apt.status))}>
                          {apt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-2.5">
                  {!prescriptions?.length ? (
                    <div className="empty-state">No prescriptions logged</div>
                  ) : (
                    prescriptions.map((p) => (
                      <div key={p._id} className="list-row !items-start">
                        <div className="min-w-0 space-y-1">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                            <Pill className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            {p.medicines?.[0]?.medicineName}
                            {p.medicines?.length > 1 && ` +${p.medicines.length - 1} more`}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDoctorName(p.doctor?.name)}
                          </p>
                          {p.instructions && (
                            <p className="text-xs leading-snug text-slate-500">
                              {p.instructions}
                            </p>
                          )}
                        </div>
                        <span className={cn('badge shrink-0 capitalize', statusBadge(p.status))}>
                          {p.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-2.5">
                  {!labReports?.length ? (
                    <div className="empty-state">No lab reports yet</div>
                  ) : (
                    labReports.map((report) => (
                      <div key={report._id} className="list-row">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                            <FileCheck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            {report.testName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {report.resultDate
                              ? `Completed ${format(new Date(report.resultDate), 'MMM dd, yyyy')}`
                              : 'Pending results'}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'badge shrink-0 capitalize',
                            statusBadge(report.status)
                          )}
                        >
                          {String(report.status || '').replace(/_/g, ' ')}
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
