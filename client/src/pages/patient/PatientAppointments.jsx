import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { format } from 'date-fns';
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  FileText,
  CheckCircle,
  List,
  CalendarClock,
} from 'lucide-react';
import { toast } from 'sonner';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { formatDoctorName } from '../../utils/format';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import DataValue from '../../components/ui/DataValue';
import StatusBadge from '../../components/ui/StatusBadge';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { CLINIC_TIME_SLOTS } from '../../utils/timeSlots';

const emptyForm = {
  doctor: '',
  appointmentDate: '',
  timeSlot: '',
  reason: '',
};

const PatientAppointments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [formData, setFormData] = useState(emptyForm);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: '',
    timeSlot: '',
  });

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData(emptyForm);
  }, []);
  const openModal = useCallback(() => setIsModalOpen(true), []);

  const setField = useCallback((key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'doctor' || key === 'appointmentDate') next.timeSlot = '';
      return next;
    });
  }, []);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data;
    },
  });

  const {
    data: doctors,
    isLoading: doctorsLoading,
    isError: doctorsError,
    refetch: refetchDoctors,
  } = useQuery({
    queryKey: ['doctorsAccepting'],
    queryFn: async () => {
      const res = await api.get('/doctors?accepting=true');
      const list = res.data?.data;
      if (!Array.isArray(list)) return [];
      return list.filter((d) => Boolean(d?.user?._id ?? d?.user));
    },
  });

  const bookableDoctors = doctors || [];
  const doctorUserId = (doc) => String(doc?.user?._id ?? doc?.user ?? '');

  const slotsDoctorId = formData.doctor || (rescheduleTarget?.doctor?._id ?? rescheduleTarget?.doctor);
  const slotsDate = formData.appointmentDate || rescheduleForm.appointmentDate;
  const slotsEnabled = Boolean(slotsDoctorId && slotsDate);

  const { data: slotsData, isFetching: slotsLoading } = useQuery({
    queryKey: ['appointmentSlots', slotsDoctorId, slotsDate],
    enabled: slotsEnabled,
    queryFn: async () => {
      const res = await api.get('/appointments/slots', {
        params: { doctorId: slotsDoctorId, date: slotsDate },
      });
      return res.data.data;
    },
  });

  const availableSlots = useMemo(() => {
    if (!slotsData?.slots) return CLINIC_TIME_SLOTS;
    return slotsData.slots.filter((s) => s.available).map((s) => s.slot);
  }, [slotsData]);

  const rescheduleAvailableSlots = useMemo(() => {
    if (!rescheduleTarget || !slotsData?.slots) return CLINIC_TIME_SLOTS;
    const current = rescheduleTarget.timeSlot;
    return slotsData.slots
      .filter((s) => s.available || s.slot === current)
      .map((s) => s.slot);
  }, [slotsData, rescheduleTarget]);

  const createAppointment = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/appointments', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentSlots'] });
      closeModal();
      toast.success('Appointment requested — waiting for doctor to accept');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const cancelAppointment = useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await api.patch(`/appointments/${id}/status`, {
        status: 'cancelled',
        cancellationReason: reason || 'Cancelled by patient',
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentSlots'] });
      setCancelTarget(null);
      setCancelReason('');
      toast.success('Appointment cancelled');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    },
  });

  const rescheduleAppointment = useMutation({
    mutationFn: async ({ id, appointmentDate, timeSlot }) => {
      const res = await api.patch(`/appointments/${id}/reschedule`, {
        appointmentDate,
        timeSlot,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentSlots'] });
      setRescheduleTarget(null);
      toast.success('Appointment rescheduled — doctor will reconfirm if needed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reschedule');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.doctor) {
      toast.error('Please select a doctor');
      return;
    }
    if (!formData.appointmentDate || !formData.timeSlot || !formData.reason?.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    const day = new Date(formData.appointmentDate);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    day.setHours(0, 0, 0, 0);
    if (day < start) {
      toast.error('Please choose today or a future date');
      return;
    }
    createAppointment.mutate({
      doctor: formData.doctor,
      appointmentDate: formData.appointmentDate,
      timeSlot: formData.timeSlot,
      reason: formData.reason.trim(),
    });
  };

  const openReschedule = (apt) => {
    setRescheduleTarget(apt);
    setRescheduleForm({
      appointmentDate: format(new Date(apt.appointmentDate), 'yyyy-MM-dd'),
      timeSlot: apt.timeSlot || '',
    });
  };

  const handleSelectEvent = (event) => {
    const apt = event.resource;
    toast(`Appointment with ${formatDoctorName(apt.doctor?.name)}`, {
      description: `${format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at ${apt.timeSlot}`,
    });
  };

  if (isLoading) {
    return (
      <div className="card p-8">
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">My appointments</h1>
          <p className="page-subtitle">Manage your upcoming and past visits</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <SegmentedControl
            aria-label="Appointment view"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { id: 'list', label: 'List view', icon: List },
              { id: 'calendar', label: 'Calendar view', icon: CalendarIcon },
            ]}
          />
          <button type="button" onClick={openModal} className="btn btn-primary flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            Book visit
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <InteractiveCalendar events={appointments || []} onSelectEvent={handleSelectEvent} />
      ) : (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-head">Date & time</th>
                  <th className="table-head">Doctor</th>
                  <th className="table-head">Reason</th>
                  <th className="table-head">Status</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!appointments || appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8">
                      <EmptyState
                        icon={CalendarIcon}
                        title="No appointments on file"
                        description="You don't have any visits scheduled yet."
                        action={
                          <button type="button" onClick={openModal} className="btn btn-secondary">
                            Book appointment
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="transition-colors hover:bg-surface-subtle/70">
                      <td className="table-cell whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3.5 w-3.5 text-ink-faint" />
                          <span className="font-medium text-ink">
                            {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="ml-5 mt-1 flex items-center gap-2 text-ink-muted">
                          <Clock className="h-3 w-3 text-ink-faint" />
                          {apt.timeSlot}
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <p className="font-medium text-ink">
                          {formatDoctorName(apt.doctor?.name)}
                        </p>
                      </td>
                      <td className="table-cell">
                        <p className="line-clamp-2 max-w-xs">
                          <DataValue value={apt.reason} empty="No reason documented" />
                        </p>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <StatusBadge status={apt.status} className="uppercase tracking-wider" />
                      </td>
                      <td className="table-cell whitespace-nowrap text-right">
                        {['requested', 'confirmed'].includes(apt.status) && (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openReschedule(apt)}
                              className="btn btn-sm btn-secondary"
                            >
                              <CalendarClock className="h-3.5 w-3.5" />
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCancelTarget(apt);
                                setCancelReason('');
                              }}
                              className="btn btn-sm btn-soft-danger"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book modal */}
      <Modal open={isModalOpen} onClose={closeModal} title="Book appointment" panelClassName="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label htmlFor="book-doctor" className="label flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
              Select doctor
            </label>
            {doctorsLoading ? (
              <p className="text-sm text-ink-faint" role="status">
                Loading available doctors…
              </p>
            ) : doctorsError ? (
              <div className="rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-sm text-danger">
                <p>Could not load doctors.</p>
                <button
                  type="button"
                  className="mt-1.5 text-xs font-medium underline underline-offset-2"
                  onClick={() => refetchDoctors()}
                >
                  Try again
                </button>
              </div>
            ) : bookableDoctors.length === 0 ? (
              <div
                className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2.5 text-sm text-warning"
                role="status"
              >
                No doctors are accepting appointments right now.
              </div>
            ) : (
              <select
                id="book-doctor"
                required
                className="select"
                value={formData.doctor}
                onChange={(e) => setField('doctor', e.target.value)}
              >
                <option value="">Choose a specialist…</option>
                {bookableDoctors.map((doc) => {
                  const id = doctorUserId(doc);
                  return (
                    <option key={doc._id || id} value={id}>
                      {formatDoctorName(doc.user?.name || 'Doctor')} —{' '}
                      {doc.specialization || 'General'}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="book-date" className="label flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                Date
              </label>
              <input
                id="book-date"
                type="date"
                required
                className="input"
                value={formData.appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setField('appointmentDate', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="book-time" className="label flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                Time
              </label>
              <select
                id="book-time"
                required
                className="select"
                value={formData.timeSlot}
                disabled={!formData.doctor || !formData.appointmentDate || slotsLoading}
                onChange={(e) => setField('timeSlot', e.target.value)}
              >
                <option value="">
                  {!formData.doctor || !formData.appointmentDate
                    ? 'Pick doctor & date'
                    : slotsLoading
                      ? 'Loading…'
                      : availableSlots.length
                        ? 'Time…'
                        : 'No open slots'}
                </option>
                {availableSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="book-reason" className="label flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
              Reason for visit
            </label>
            <textarea
              id="book-reason"
              required
              className="input min-h-[88px] resize-none py-2.5"
              rows={3}
              value={formData.reason}
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="Briefly describe your symptoms…"
              autoComplete="off"
            />
          </div>

          <p className="text-center text-xs leading-snug text-ink-faint">
            Only open slots are shown. Your doctor will accept or decline the request.
          </p>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createAppointment.isPending ||
                doctorsLoading ||
                doctorsError ||
                bookableDoctors.length === 0 ||
                (formData.doctor && formData.appointmentDate && availableSlots.length === 0)
              }
              className="btn btn-primary"
            >
              {createAppointment.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" aria-hidden />
              )}
              {createAppointment.isPending ? 'Requesting…' : 'Request appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel with reason */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel appointment"
        panelClassName="max-w-md"
      >
        <div className="space-y-4 p-6">
          <p className="text-sm text-ink-muted">
            Cancel visit with {formatDoctorName(cancelTarget?.doctor?.name)} on{' '}
            {cancelTarget
              ? format(new Date(cancelTarget.appointmentDate), 'MMM dd, yyyy')
              : ''}{' '}
            at {cancelTarget?.timeSlot}?
          </p>
          <div>
            <label htmlFor="cancel-reason" className="label">
              Reason (optional)
            </label>
            <textarea
              id="cancel-reason"
              className="input min-h-[72px] resize-none py-2.5"
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCancelTarget(null)}
            >
              Keep visit
            </button>
            <button
              type="button"
              className="btn btn-soft-danger"
              disabled={cancelAppointment.isPending}
              onClick={() =>
                cancelAppointment.mutate({
                  id: cancelTarget._id,
                  reason: cancelReason.trim() || 'Cancelled by patient',
                })
              }
            >
              Confirm cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Reschedule */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule appointment"
        panelClassName="max-w-md"
      >
        <form
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rescheduleForm.appointmentDate || !rescheduleForm.timeSlot) {
              toast.error('Pick a date and open time slot');
              return;
            }
            rescheduleAppointment.mutate({
              id: rescheduleTarget._id,
              appointmentDate: rescheduleForm.appointmentDate,
              timeSlot: rescheduleForm.timeSlot,
            });
          }}
        >
          <p className="text-sm text-ink-muted">
            {formatDoctorName(rescheduleTarget?.doctor?.name)} · current{' '}
            {rescheduleTarget
              ? format(new Date(rescheduleTarget.appointmentDate), 'MMM dd')
              : ''}{' '}
            at {rescheduleTarget?.timeSlot}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rs-date">
                New date
              </label>
              <input
                id="rs-date"
                type="date"
                required
                className="input"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleForm.appointmentDate}
                onChange={(e) =>
                  setRescheduleForm((p) => ({
                    ...p,
                    appointmentDate: e.target.value,
                    timeSlot: '',
                  }))
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="rs-time">
                New time
              </label>
              <select
                id="rs-time"
                required
                className="select"
                value={rescheduleForm.timeSlot}
                disabled={!rescheduleForm.appointmentDate || slotsLoading}
                onChange={(e) =>
                  setRescheduleForm((p) => ({ ...p, timeSlot: e.target.value }))
                }
              >
                <option value="">
                  {slotsLoading ? 'Loading…' : rescheduleAvailableSlots.length ? 'Time…' : 'No slots'}
                </option>
                {rescheduleAvailableSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-ink-faint">
            Confirmed visits return to “requested” so your doctor can reconfirm the new time.
          </p>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRescheduleTarget(null)}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={rescheduleAppointment.isPending || rescheduleAvailableSlots.length === 0}
            >
              Save new time
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientAppointments;
