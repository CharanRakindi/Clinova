import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { Calendar, FileText, ShieldAlert, FileCheck, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDoctorName } from '../../utils/format';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import DataValue from '../../components/ui/DataValue';
import StatusBadge from '../../components/ui/StatusBadge';

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
          emphasis
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
          title="Medical records"
          value={stats?.totalRecords || 0}
          icon={FileText}
          contextText="Your consultation history and notes"
          actionText="Open medical records"
          actionHref="/patient/records"
        />
        <StatCard
          title="Lab results"
          value={stats?.labReports ?? labReports?.length ?? 0}
          icon={FileCheck}
          contextText={
            (stats?.labReports ?? labReports?.length)
              ? 'Reports from your care team'
              : 'No lab results on file'
          }
          actionText="View activity"
          actionHref="#care-activity"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <div id="patient-health-profile" className="card space-y-4 p-5">
            <h3 className="panel-title border-b border-line-soft pb-3">Health profile</h3>
            <div className="space-y-3.5">
              <div className="meta-row">
                <span className="meta-label">Blood group</span>
                <DataValue
                  as="span"
                  className="meta-value"
                  emptyClassName="meta-value data-empty"
                  value={profile?.bloodGroup}
                  empty="Not on file"
                />
              </div>
              <div className="meta-row">
                <span className="meta-label">Emergency contact</span>
                <DataValue
                  as="span"
                  className="meta-value"
                  emptyClassName="meta-value data-empty"
                  value={
                    profile?.emergencyContact?.name
                      ? `${profile.emergencyContact.name}${
                          profile.emergencyContact.relationship
                            ? ` (${profile.emergencyContact.relationship})`
                            : ''
                        }`
                      : null
                  }
                  empty="Not on file"
                />
              </div>
              <div className="meta-row">
                <span className="meta-label">Insurance</span>
                <DataValue
                  as="span"
                  className="meta-value"
                  emptyClassName="meta-value data-empty"
                  value={profile?.insuranceProvider}
                  empty="Not on file"
                />
              </div>
              <div className="meta-row">
                <span className="meta-label">Policy ID</span>
                <DataValue
                  as="span"
                  className="meta-value font-mono text-xs"
                  emptyClassName="meta-value data-empty"
                  value={profile?.insuranceNumber}
                  empty="Not on file"
                />
              </div>
            </div>
          </div>

          <div className="card space-y-3 p-5">
            <h3 className="panel-title flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
              Medical alerts
            </h3>
            <p className="text-xs leading-relaxed tracking-[-0.01em] text-ink-muted">
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

          <div id="care-activity" className="card overflow-hidden p-4 sm:p-5">
            <Tabs
              variant="segmented"
              tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
              value={activeTab}
              onChange={setActiveTab}
              aria-label="Care summary"
            />

            <div className="mt-4">
              {activeTab === 'overview' && (
                <div className="space-y-2.5">
                  {!appointments?.length ? (
                    <EmptyState
                      compact
                      icon={Calendar}
                      title="No upcoming appointments"
                      description="Booked visits will show here once scheduled."
                    />
                  ) : (
                    appointments.map((apt) => (
                      <div key={apt._id} className="list-row">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {formatDoctorName(apt.doctor?.name)}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} · {apt.timeSlot}
                          </p>
                        </div>
                        <StatusBadge status={apt.status} className="shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-2.5">
                  {!prescriptions?.length ? (
                    <EmptyState
                      compact
                      icon={Pill}
                      title="No prescriptions on file"
                      description="Medications ordered by your clinician appear here."
                    />
                  ) : (
                    prescriptions.map((p) => (
                      <div key={p._id} className="list-row !items-start">
                        <div className="min-w-0 space-y-1">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                            <Pill className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                            <DataValue
                              value={p.medicines?.[0]?.medicineName}
                              empty="Unnamed medication"
                            />
                            {p.medicines?.length > 1 && ` +${p.medicines.length - 1} more`}
                          </p>
                          <p className="text-xs text-ink-faint">
                            {formatDoctorName(p.doctor?.name)}
                          </p>
                          {p.instructions && (
                            <p className="text-xs leading-snug text-ink-muted">
                              {p.instructions}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={p.status} className="shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-2.5">
                  {!labReports?.length ? (
                    <EmptyState
                      compact
                      icon={FileCheck}
                      title="No lab reports yet"
                      description="Completed results will list here when available."
                    />
                  ) : (
                    labReports.map((report) => (
                      <div key={report._id} className="list-row">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                            <FileCheck className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                            {report.testName}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {report.resultDate
                              ? `Completed ${format(new Date(report.resultDate), 'MMM dd, yyyy')}`
                              : 'Results not documented yet'}
                          </p>
                        </div>
                        <StatusBadge status={report.status} className="shrink-0" />
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
