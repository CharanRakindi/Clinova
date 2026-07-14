import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { Calendar, Users, CheckCircle, Clock, ChevronRight, PenTool, Check, ToggleLeft, ToggleRight, FlaskConical, Plus, X, RotateCcw, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDoctorName } from '../../utils/format';
import { cn } from '../../utils/cn';

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
    mutationFn: async ({ id, status, cancellationReason }) => {
      const res = await api.patch(`/appointments/${id}/status`, {
        status,
        ...(cancellationReason ? { cancellationReason } : {}),
      });
      return res.data.data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctorStats'] });
      const labels = {
        confirmed: 'Appointment accepted',
        cancelled: 'Appointment declined',
        completed: 'Consultation completed',
      };
      toast.success(labels[status] || `Appointment marked as ${status}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

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
            {todayAppointments.length} today · {pendingRequests.length} pending request
            {pendingRequests.length === 1 ? '' : 's'} · {upcomingConfirmed.length} upcoming
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLabModalOpen(true)}
            className="btn btn-primary"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Request lab report
          </button>

          <button
            type="button"
            disabled={toggleAvailability.isPending || !myDoctorProfile}
            onClick={() => toggleAvailability.mutate(!isAvailable)}
            className="btn btn-secondary"
            title="Controls whether patients can request appointments with you"
          >
            <span className={cn(
              "w-2 h-2 rounded-full",
              isAvailable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-400"
            )} />
            <span>Accepting: {isAvailable ? 'Yes' : 'No'}</span>
            {isAvailable ? <ToggleRight className="w-5 h-5 text-slate-400 ml-1" /> : <ToggleLeft className="w-5 h-5 text-slate-300 ml-1" />}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          index={0}
          title="Today's schedule"
          value={todayAppointments.length}
          icon={Calendar}
          trend={`${todayAppointments.filter((a) => a.status !== 'completed').length} pending`}
          trendType="neutral"
          contextText={
            todayAppointments.length > 0
              ? `Next: ${todayAppointments.find((a) => a.status !== 'completed')?.timeSlot || '—'}`
              : 'No appointments scheduled'
          }
          actionText="View calendar"
          actionHref="#calendar-view"
        />
        <StatCard
          index={1}
          title="Patients"
          value={stats?.totalAssignedPatients || 0}
          icon={Users}
          contextText="Under your care"
          actionText="Open directory"
          actionHref="/doctor/patients"
        />
        <StatCard
          index={2}
          title="Completed today"
          value={todayAppointments.filter((a) => a.status === 'completed').length}
          icon={CheckCircle}
          contextText={`${stats?.completedConsultations || 0} all-time sign-offs`}
          actionText="Review cases"
          actionHref="/doctor/patients"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          {/* Pending accept/decline (includes future dates) */}
          <div id="pending-requests" className="card space-y-4 p-5">
            <div>
              <h3 className="panel-title flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                Pending requests
              </h3>
              <p className="panel-meta">Accept or decline patient bookings (today &amp; future)</p>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {pendingRequests.length === 0 ? (
                <div className="empty-state py-6">No open requests</div>
              ) : (
                pendingRequests.map((apt) => (
                  <div key={apt._id} className="list-row flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-slate-800">
                        {apt.patient?.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-slate-400">
                        {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} · {apt.timeSlot}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-500">{apt.reason}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateStatus.mutate({ id: apt._id, status: 'confirmed' })}
                        disabled={updateStatus.isPending}
                        className="btn btn-sm border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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
                        className="btn btn-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
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

          <div id="consultations-queue" className="card space-y-4 p-5">
            <div>
              <h3 className="panel-title flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                Today&apos;s queue
              </h3>
              <p className="panel-meta">Prioritized by time slot</p>
            </div>
            
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {todayAppointments.length === 0 ? (
                  <div className="empty-state py-8">No appointments today</div>
                ) : (
                  todayAppointments.map((apt) => (
                    <motion.div
                      key={apt._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        'list-row',
                        apt.status === 'completed' && 'opacity-60'
                      )}
                    >
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'truncate text-[13px] font-medium tracking-[-0.01em] text-slate-800',
                            apt.status === 'completed' && 'line-through text-slate-400'
                          )}
                        >
                          {apt.patient?.name}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-slate-400">
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
                            className="rounded-lg p-1.5 text-sky-600 transition-colors hover:bg-sky-50"
                            title="Accept request"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {['requested', 'confirmed'].includes(apt.status) && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus.mutate({ id: apt._id, status: 'completed' })
                            }
                            className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                            title="Complete consultation"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <Link
                          to={`/doctor/patients/${apt.patient?._id}`}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
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

          {upcomingConfirmed.length > 0 && (
            <div className="card space-y-4 p-5">
              <div>
                <h3 className="panel-title flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                  Upcoming confirmed
                </h3>
                <p className="panel-meta">Future visits you have accepted</p>
              </div>
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {upcomingConfirmed.slice(0, 12).map((apt) => (
                  <div key={apt._id} className="list-row">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-slate-800">
                        {apt.patient?.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-slate-400">
                        {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} · {apt.timeSlot}
                      </p>
                    </div>
                    <span className="badge badge-success shrink-0 uppercase tracking-wider">
                      confirmed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Notes Pad */}
          <div className="card space-y-4 p-5">
            <div>
              <h3 className="panel-title flex items-center gap-2">
                <PenTool className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                Quick clinical notes
              </h3>
              <p className="panel-meta">Jot down quick updates. Saved locally.</p>
            </div>
            <textarea
              rows={4}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-slate-700 placeholder:text-slate-400 transition-all font-sans resize-none"
              placeholder="Start typing reminders, code shortcuts, or clinical notes..."
            />
          </div>

          {/* Recent lab orders + re-order */}
          <div className="card space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="panel-title flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-slate-400" />
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
                <p className="py-6 text-center text-[12.5px] text-slate-400">
                  No lab orders yet
                </p>
              ) : (
                labReports.slice(0, 8).map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-800">
                        {report.testName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {report.patient?.name || 'Patient'} ·{' '}
                        {format(new Date(report.orderedDate || report.createdAt), 'MMM dd')} ·{' '}
                        <span className="capitalize">{String(report.status || '').replace(/_/g, ' ')}</span>
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
            <h3 className="text-[14.5px] font-semibold text-slate-800">Interactive Clinical Calendar</h3>
            <p className="text-[11.5px] font-medium text-slate-400 mt-0.5">Manage schedules, consultations, and drag/drop adjustments.</p>
          </div>
          <InteractiveCalendar 
            events={allAppointments || []} 
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </div>
      {isLabModalOpen && (
        <div className="modal-backdrop items-start overflow-y-auto">
          <div className="modal-panel my-8 max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-[15px] font-medium text-slate-900">
                <FlaskConical className="h-4 w-4 text-slate-400" />
                Request lab report
              </h2>
              <button
                type="button"
                onClick={() => setIsLabModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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
                  Appointment <span className="font-normal text-slate-400">(optional)</span>
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
                      className="flex cursor-pointer items-center gap-2 text-[13px] font-normal text-slate-700"
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={labForm.priority === p}
                        onChange={() => setLabForm({ ...labForm, priority: p })}
                        className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-400"
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

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
