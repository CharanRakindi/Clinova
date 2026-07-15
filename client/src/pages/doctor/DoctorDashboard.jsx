import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { Calendar, Users, CheckCircle, Clock, ChevronRight, PenTool, Check, FlaskConical, Plus, X, RotateCcw, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDoctorName } from '../../utils/format';
import { cn } from '../../utils/cn';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import ActivityFeed from '../../components/ui/ActivityFeed';

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [quickNote, setQuickNote] = useState(() => localStorage.getItem(`clinova_note_${user?._id}`) || '');
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labForm, setLabForm] = useState({
    patientId: '',
    appointmentId: '',
    testName: '',
    priority: 'Normal',
    notes: '',
  });

  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(`clinova_note_${user._id}`, quickNote);
    }
  }, [quickNote, user?._id]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['doctorStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    }
  });

  const { data: allAppointments } = useQuery({
    queryKey: ['doctorAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments?limit=100');
      return res.data.data;
    }
  });

  const { data: myDoctorProfile } = useQuery({
    queryKey: ['myDoctorProfile', user?._id],
    enabled: !!user?._id,
    queryFn: async () => {
      const res = await api.get(`/doctors/${user._id}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (myDoctorProfile && !availabilityLoaded) {
      setIsAvailable(myDoctorProfile.isAcceptingPatients !== false);
      setAvailabilityLoaded(true);
    }
  }, [myDoctorProfile, availabilityLoaded]);

  const toggleAvailability = useMutation({
    mutationFn: async (next) => {
      const res = await api.post(`/doctors/${user._id}`, {
        isAcceptingPatients: next,
        specialization: myDoctorProfile?.specialization,
        department: myDoctorProfile?.department?._id || myDoctorProfile?.department,
        licenseNumber: myDoctorProfile?.licenseNumber,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setIsAvailable(data.isAcceptingPatients !== false);
      queryClient.invalidateQueries({ queryKey: ['myDoctorProfile', user?._id] });
      // Patient booking list filters on accepting=true
      queryClient.invalidateQueries({ queryKey: ['doctorsAccepting'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success(
        data.isAcceptingPatients !== false
          ? 'You are now accepting appointment requests'
          : 'You are not accepting new appointment requests'
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['doctorPatients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data;
    }
  });

  const { data: labReports } = useQuery({
    queryKey: ['doctorLabReports'],
    queryFn: async () => {
      const res = await api.get('/lab-reports');
      return res.data.data;
    },
  });

  const orderLab = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/lab-reports', data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Laboratory report requested successfully');
      setIsLabModalOpen(false);
      setLabForm({ patientId: '', appointmentId: '', testName: '', priority: 'Normal', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['doctorStats'] });
      queryClient.invalidateQueries({ queryKey: ['doctorLabReports'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to request laboratory test');
    }
  });

  const reorderLab = useMutation({
    mutationFn: async (report) => {
      const patientId = report.patient?._id || report.patient;
      const res = await api.post('/lab-reports', {
        patientId,
        testName: report.testName,
        testType: report.testType || 'Diagnostic',
        priority: report.priority || 'Normal',
        notes: report.notes
          ? `Re-order of previous request. ${report.notes}`
          : 'Re-ordered laboratory test',
        appointmentId: report.appointment || undefined,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Lab test re-ordered successfully');
      queryClient.invalidateQueries({ queryKey: ['doctorLabReports'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to re-order lab test');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, cancellationReason, visitSummary }) => {
      const res = await api.patch(`/appointments/${id}/status`, {
        status,
        ...(cancellationReason ? { cancellationReason } : {}),
        ...(visitSummary ? { visitSummary } : {}),
      });
      return res.data.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['doctorAppointments'] });
      const prev = queryClient.getQueryData(['doctorAppointments']);
      queryClient.setQueryData(['doctorAppointments'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((a) => (a._id === id ? { ...a, status } : a));
      });
      return { prev };
    },
    onSuccess: (data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctorStats'] });
      queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
      const labels = {
        confirmed: 'Appointment accepted',
        cancelled: 'Appointment declined',
        completed: 'Consultation completed',
      };
      toast.success(labels[status] || `Appointment marked as ${status}`, {
        description:
          status === 'completed' && data?.visitSummary
            ? data.visitSummary.slice(0, 100)
            : undefined,
      });
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctorAppointments'], ctx.prev);
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  if (isLoading) {
    return (
      <div className="workspace">
        <div className="page-header">
          <div className="space-y-2">
            <div className="h-7 w-52 animate-pulse rounded-md bg-surface-subtle" />
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

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayAppointments = allAppointments?.filter(a => {
    const aptDate = format(new Date(a.appointmentDate), 'yyyy-MM-dd');
    return aptDate === todayStr;
  }) || [];

  // Patient requests waiting for doctor accept (today or future)
  const pendingRequests =
    allAppointments
      ?.filter((a) => {
        if (a.status !== 'requested') return false;
        const d = new Date(a.appointmentDate);
        d.setHours(0, 0, 0, 0);
        return d >= startOfToday;
      })
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)) || [];

  // Confirmed future visits (after today)
  const upcomingConfirmed =
    allAppointments
      ?.filter((a) => {
        if (a.status !== 'confirmed') return false;
        const aptDate = format(new Date(a.appointmentDate), 'yyyy-MM-dd');
        return aptDate > todayStr;
      })
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)) || [];

  const handleSelectEvent = (event) => {
    const apt = event.resource;
    toast(`Appointment with ${apt.patient?.name}`, {
      description: `${format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at ${apt.timeSlot} - ${apt.reason}`,
      action: {
        label: 'View Patient',
        onClick: () => window.location.href = `/doctor/patients/${apt.patient._id}`
      },
    });
  };

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">{formatDoctorName(user?.name)}</h1>
          <p className="page-subtitle">
            {todayAppointments.length} today
            {pendingRequests.length > 0 && (
              <>
                {' · '}
                <span className="text-warning font-medium">
                  {pendingRequests.length} pending
                </span>
              </>
            )}
            {upcomingConfirmed.length > 0 && (
              <> · {upcomingConfirmed.length} upcoming</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Availability — quiet secondary control */}
          <button
            type="button"
            disabled={toggleAvailability.isPending || !myDoctorProfile}
            onClick={() => toggleAvailability.mutate(!isAvailable)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              isAvailable
                ? 'border-success-border bg-success-soft text-success'
                : 'border-line bg-surface-subtle text-ink-muted'
            )}
            title="Controls whether patients can request appointments with you"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isAvailable ? 'bg-success' : 'bg-ink-faint'
              )}
              aria-hidden
            />
            {isAvailable ? 'Accepting patients' : 'Not accepting'}
          </button>

          <button
            type="button"
            onClick={() => setIsLabModalOpen(true)}
            className="btn btn-primary"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Request lab
          </button>
        </div>
      </div>

      {/* Focal metric first; supporting metrics quieter */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          emphasis
          title="Today's schedule"
          value={todayAppointments.length}
          icon={Calendar}
          trend={`${todayAppointments.filter((a) => a.status !== 'completed').length} pending`}
          trendType="neutral"
          contextText={
            todayAppointments.length > 0
              ? `Next: ${
                  todayAppointments.find((a) => a.status !== 'completed')?.timeSlot ||
                  'time not set'
                }`
              : 'No appointments scheduled'
          }
          actionText="View calendar"
          actionHref="#calendar-view"
        />
        <StatCard
          title="Patients"
          value={stats?.totalAssignedPatients || 0}
          icon={Users}
          contextText="Under your care"
          actionText="Open directory"
          actionHref="/doctor/patients"
        />
        <StatCard
          title="Completed today"
          value={todayAppointments.filter((a) => a.status === 'completed').length}
          icon={CheckCircle}
          contextText={`${stats?.completedConsultations || 0} all-time sign-offs`}
          actionText="Review cases"
          actionHref="/doctor/patients"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Primary focus: today's queue (wide column) */}
        <div className="space-y-5 lg:col-span-2 lg:order-1">
          <div
            id="consultations-queue"
            className="card space-y-4 border-brand/20 p-5 shadow-md ring-1 ring-brand/10 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="panel-title flex items-center gap-2 text-ink">
                  <Clock className="h-4 w-4 text-brand" strokeWidth={1.75} />
                  Today&apos;s queue
                </h2>
                <p className="panel-meta">
                  {todayAppointments.length} visit
                  {todayAppointments.length === 1 ? '' : 's'} scheduled · open charts or mark complete
                </p>
              </div>
              {pendingRequests.length > 0 && (
                <a
                  href="#pending-requests"
                  className="badge badge-warning"
                >
                  {pendingRequests.length} pending
                </a>
              )}
            </div>

            <div className="max-h-[min(520px,60vh)] space-y-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {todayAppointments.length === 0 ? (
                  <EmptyState
                    compact
                    title="Nothing scheduled today"
                    description="Confirmed and requested visits for today appear here first."
                  />
                ) : (
                  todayAppointments.map((apt, idx) => (
                    <motion.div
                      key={apt._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        'list-row',
                        idx === 0 &&
                          apt.status !== 'completed' &&
                          'border-sky-200/80 bg-sky-50/40',
                        apt.status === 'completed' && 'opacity-60'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              'truncate text-sm font-medium tracking-[-0.01em] text-ink',
                              apt.status === 'completed' && 'line-through text-ink-faint'
                            )}
                          >
                            {apt.patient?.name}
                          </p>
                          {idx === 0 && apt.status !== 'completed' && (
                            <span className="badge badge-info">Up next</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-2xs text-ink-faint">
                          {apt.timeSlot} · <span className="capitalize">{apt.status}</span>
                          {apt.reason ? ` · ${apt.reason}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {apt.status === 'requested' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus.mutate({ id: apt._id, status: 'confirmed' })
                            }
                            className="btn-icon btn-icon-success"
                            title="Accept request"
                            aria-label="Accept request"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {['requested', 'confirmed'].includes(apt.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              const summary = window.prompt(
                                'Optional visit summary for the patient (leave blank for default):',
                                `Completed visit for: ${apt.reason || 'consultation'}`
                              );
                              if (summary === null) return;
                              updateStatus.mutate({
                                id: apt._id,
                                status: 'completed',
                                visitSummary: summary.trim() || undefined,
                              });
                            }}
                            className="btn-icon btn-icon-success"
                            title="Complete consultation"
                            aria-label="Complete consultation"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <Link
                          to={`/doctor/patients/${apt.patient?._id}`}
                          className="btn-icon"
                          aria-label={`Open chart for ${apt.patient?.name || 'patient'}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-1 lg:order-2">
          {/* Pending accept/decline (includes future dates) */}
          <div id="pending-requests" className="card space-y-4 p-5">
            <div>
              <h3 className="panel-title flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
                Pending requests
              </h3>
              <p className="panel-meta">Accept or decline (today &amp; future)</p>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {pendingRequests.length === 0 ? (
                <EmptyState compact title="No open requests" description="Patient booking requests will appear here." />
              ) : (
                pendingRequests.map((apt) => (
                  <div key={apt._id} className="list-row flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tracking-[-0.01em] text-ink-secondary">
                        {apt.patient?.name}
                      </p>
                      <p className="mt-0.5 text-2xs text-ink-faint">
                        {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} · {apt.timeSlot}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-2xs text-ink-muted">{apt.reason}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateStatus.mutate({ id: apt._id, status: 'confirmed' })}
                        disabled={updateStatus.isPending}
                        className="btn btn-sm btn-soft-success"
                        title="Accept appointment"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus.mutate({
                            id: apt._id,
                            status: 'cancelled',
                            cancellationReason: 'Declined by doctor',
                          })
                        }
                        disabled={updateStatus.isPending}
                        className="btn btn-sm btn-soft-danger"
                        title="Decline appointment"
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {upcomingConfirmed.length > 0 && (
            <div className="card space-y-4 p-5">
              <div>
                <h3 className="panel-title flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
                  Upcoming confirmed
                </h3>
                <p className="panel-meta">Future visits you have accepted</p>
              </div>
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {upcomingConfirmed.slice(0, 12).map((apt) => (
                  <div key={apt._id} className="list-row">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tracking-[-0.01em] text-ink-secondary">
                        {apt.patient?.name}
                      </p>
                      <p className="mt-0.5 text-2xs text-ink-faint">
                        {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} · {apt.timeSlot}
                      </p>
                    </div>
                    <StatusBadge status="confirmed" className="shrink-0 uppercase tracking-wider" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card space-y-3 p-5">
            <ActivityFeed limit={5} />
          </div>

          {/* Quick Notes Pad */}
          <div className="card space-y-4 p-5">
            <div>
              <h3 className="panel-title flex items-center gap-2">
                <PenTool className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
                Quick clinical notes
              </h3>
              <p className="panel-meta">Jot down quick updates. Saved locally.</p>
            </div>
            <textarea
              rows={4}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="input min-h-[6rem] resize-none py-2.5"
              placeholder="Start typing reminders, code shortcuts, or clinical notes..."
            />
          </div>

          {/* Recent lab orders + re-order */}
          <div className="card space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="panel-title flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-ink-faint" />
                  Lab orders
                </h3>
                <p className="panel-meta">
                  Recent requests — re-order if needed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLabModalOpen(true)}
                className="btn btn-secondary btn-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {(!labReports || labReports.length === 0) ? (
                <EmptyState compact title="No lab orders yet" description="Orders you place will appear here." />
              ) : (
                labReports.slice(0, 8).map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-secondary">
                        {report.testName}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 truncate text-2xs text-ink-faint">
                        <span>{report.patient?.name || 'Patient not linked'}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {format(new Date(report.orderedDate || report.createdAt), 'MMM dd')}
                        </span>
                        <StatusBadge status={report.status} />
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => reorderLab.mutate(report)}
                      disabled={reorderLab.isPending}
                      className="btn btn-secondary btn-sm shrink-0"
                      title="Re-order this lab test"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Re-do
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Schedule Calendar */}
        <div id="calendar-view" className="lg:col-span-2 card p-5 relative z-0">
          <div className="mb-4">
            <h3 className="text-base font-medium text-ink-secondary">Interactive Clinical Calendar</h3>
            <p className="text-2xs font-medium text-ink-faint mt-0.5">Manage schedules, consultations, and drag/drop adjustments.</p>
          </div>
          <InteractiveCalendar 
            events={allAppointments || []} 
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </div>
      <Modal
        open={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        title="Request lab report"
        scrollable
        panelClassName="max-w-lg"
      >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!labForm.patientId || !labForm.testName) {
                  toast.error('Patient and test name are required');
                  return;
                }
                orderLab.mutate(labForm);
              }}
              className="space-y-4 p-6"
            >
              <div>
                <label className="label">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={labForm.patientId}
                  onChange={(e) => setLabForm({ ...labForm, patientId: e.target.value })}
                  required
                >
                  <option value="">Select patient</option>
                  {(patients || []).map((p) => (
                    <option key={p._id} value={p.user?._id || p.user}>
                      {p.user?.name || p.name} {p.patientId ? `(${p.patientId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Appointment <span className="font-normal text-ink-faint">(optional)</span>
                </label>
                <select
                  className="input"
                  value={labForm.appointmentId}
                  onChange={(e) => setLabForm({ ...labForm, appointmentId: e.target.value })}
                >
                  <option value="">Select appointment</option>
                  {(allAppointments || [])
                    .filter((a) => {
                      const pid = a.patient?._id || a.patient;
                      return String(pid) === String(labForm.patientId);
                    })
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {format(new Date(a.appointmentDate), 'MMM dd, yyyy')} at {a.timeSlot} (
                        {a.reason})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Laboratory test <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={labForm.testName}
                  onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })}
                  required
                >
                  <option value="">Select test type</option>
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                  <option value="Basic Metabolic Panel (BMP)">Basic Metabolic Panel (BMP)</option>
                  <option value="Lipid Panel (Cholesterol)">Lipid Panel (Cholesterol)</option>
                  <option value="Liver Function Tests (LFT)">Liver Function Tests (LFT)</option>
                  <option value="Thyroid Stimulating Hormone (TSH)">
                    Thyroid Stimulating Hormone (TSH)
                  </option>
                  <option value="Urinalysis">Urinalysis</option>
                  <option value="Hemoglobin A1c (HbA1c)">Hemoglobin A1c (HbA1c)</option>
                  <option value="Electrocardiogram (ECG)">Electrocardiogram (ECG)</option>
                  <option value="X-Ray Chest">X-Ray Chest</option>
                </select>
              </div>

              <div>
                <label className="label">Priority</label>
                <div className="flex gap-4">
                  {['Normal', 'Urgent'].map((p) => (
                    <label
                      key={p}
                      className="flex cursor-pointer items-center gap-2 text-sm font-normal text-ink-secondary"
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={labForm.priority === p}
                        onChange={() => setLabForm({ ...labForm, priority: p })}
                        className="h-4 w-4 border-line-strong text-ink focus:ring-slate-400"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Clinical notes</label>
                <textarea
                  rows={3}
                  value={labForm.notes}
                  onChange={(e) => setLabForm({ ...labForm, notes: e.target.value })}
                  className="input min-h-[88px] resize-none py-2.5"
                  placeholder="e.g. Fasting lipid values, prioritize stat delivery…"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
                <button
                  type="button"
                  onClick={() => setIsLabModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderLab.isPending}
                  className="btn btn-primary"
                >
                  {orderLab.isPending ? 'Submitting…' : 'Request test'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
