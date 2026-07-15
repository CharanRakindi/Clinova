import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { Calendar, FileText, ShieldAlert, FileCheck, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDoctorName } from '../../utils/format';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import DataValue from '../../components/ui/DataValue';
import StatusBadge from '../../components/ui/StatusBadge';
import ActivityFeed from '../../components/ui/ActivityFeed';

const CHART = {
  grid: '#F1F5F9',
  tick: '#94A3B8',
  pulse: '#0EA5E9', // brand sky-500
  systolic: '#059669', // success emerald
  tooltipBorder: '#E2E8F0',
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

  const { data: allergies } = useQuery({
    queryKey: ['myAllergies', user?._id],
    queryFn: async () => {
      const res = await api.get(`/patients/${user._id}/allergies`);
      return res.data.data;
    },
    enabled: !!user?._id,
  });

  const { data: conditions } = useQuery({
    queryKey: ['myConditions', user?._id],
    queryFn: async () => {
      const res = await api.get(`/patients/${user._id}/conditions`);
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
      <div className="workspace">
        <div className="page-header">
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-md bg-surface-subtle" />
            <div className="h-4 w-72 animate-pulse rounded-md bg-surface-subtle" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
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

  const severeAllergies = (allergies || []).filter((a) => a.severity === 'Severe');
  const otherAllergies = (allergies || []).filter((a) => a.severity !== 'Severe');
  const activeConditions = (conditions || []).filter((c) => c.status === 'Active');
  const hasAlerts =
    (allergies?.length || 0) > 0 || (activeConditions?.length || 0) > 0;

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
        {/* Primary column: care activity */}
        <div className="space-y-5 lg:col-span-2 lg:order-1">
          {vitalsChartData.length > 0 && (
            <div id="vitals-trend" className="card p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="panel-title">Vitals trends</h2>
                  <p className="panel-meta">From your recent consultations</p>
                </div>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: CHART.tick, fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: CHART.tick, fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: `1px solid ${CHART.tooltipBorder}`,
                        fontSize: '12px',
                        boxShadow: '0 8px 24px -8px rgba(15,23,42,0.12)',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Line
                      type="monotone"
                      dataKey="pulse"
                      name="Pulse (bpm)"
                      stroke={CHART.pulse}
                      strokeWidth={2.25}
                      dot={false}
                      activeDot={{ r: 4, fill: CHART.pulse }}
                    />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      name="Systolic (mmHg)"
                      stroke={CHART.systolic}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: CHART.systolic }}
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

        {/* Sidebar: profile + alerts + activity */}
        <div className="space-y-5 lg:col-span-1 lg:order-2">
          <div
            className={
              hasAlerts
                ? 'card space-y-3 border-danger-border/60 p-5 ring-1 ring-danger/10'
                : 'card space-y-3 p-5'
            }
          >
            <h3 className="panel-title flex items-center gap-2">
              <ShieldAlert
                className={`h-4 w-4 ${hasAlerts ? 'text-danger' : 'text-ink-faint'}`}
                strokeWidth={1.75}
              />
              Medical alerts
            </h3>
            {!hasAlerts ? (
              <p className="text-xs leading-relaxed text-ink-muted">
                No allergies or active conditions on file. Your care team will record alerts here.
              </p>
            ) : (
              <div className="space-y-2">
                {severeAllergies.map((a) => (
                  <div
                    key={a._id}
                    className="rounded-lg border border-danger-border bg-danger-soft px-3 py-2"
                  >
                    <p className="text-xs font-medium text-danger">
                      Allergy · {a.allergen}
                    </p>
                    {a.reaction && (
                      <p className="mt-0.5 text-2xs text-danger/80">{a.reaction}</p>
                    )}
                  </div>
                ))}
                {otherAllergies.map((a) => (
                  <div
                    key={a._id}
                    className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2"
                  >
                    <p className="text-xs font-medium text-warning">
                      Allergy · {a.allergen}
                      {a.severity ? ` (${a.severity})` : ''}
                    </p>
                  </div>
                ))}
                {activeConditions.map((c) => (
                  <div
                    key={c._id}
                    className="rounded-lg border border-line bg-surface-subtle px-3 py-2"
                  >
                    <p className="text-xs font-medium text-ink-secondary">
                      Condition · {c.conditionName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
            <ActivityFeed limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
