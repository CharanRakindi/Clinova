import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { format } from 'date-fns';
import { Plus, X, Calendar as CalendarIcon, Clock, Stethoscope, FileText, CheckCircle, List } from 'lucide-react';
import { toast } from 'sonner';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { formatDoctorName } from '../../utils/format';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import DataValue from '../../components/ui/DataValue';
import StatusBadge from '../../components/ui/StatusBadge';
import SegmentedControl from '../../components/ui/SegmentedControl';

const PatientAppointments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
  });

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
      // Only profiles with a linked user id can be booked
      return list.filter((d) => {
        const userId = d?.user?._id ?? d?.user;
        return Boolean(userId);
      });
    },
  });

  const bookableDoctors = doctors || [];

  const doctorUserId = (doc) => String(doc?.user?._id ?? doc?.user ?? '');

  const createAppointment = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/appointments', {
        doctor: payload.doctor,
        appointmentDate: payload.appointmentDate,
        timeSlot: payload.timeSlot,
        reason: payload.reason,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      setIsModalOpen(false);
      setFormData({ doctor: '', appointmentDate: '', timeSlot: '', reason: '' });
      toast.success('Appointment requested — waiting for doctor to accept');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const cancelAppointment = useMutation({
    mutationFn: async (appointmentId) => {
      const res = await api.patch(`/appointments/${appointmentId}/status`, {
        status: 'cancelled',
        cancellationReason: 'Cancelled by patient',
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      toast.success('Appointment cancelled');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
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

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" />
            Book visit
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <InteractiveCalendar
          events={appointments || []}
          onSelectEvent={handleSelectEvent}
        />
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
                          <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-secondary"
                          >
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
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-medium text-ink-inverse"
                            aria-hidden
                          >
                            {(apt.doctor?.name || 'D').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-ink">
                              {formatDoctorName(apt.doctor?.name)}
                            </p>
                          </div>
                        </div>
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
                          <button
                            type="button"
                            onClick={() => cancelAppointment.mutate(apt._id)}
                            disabled={cancelAppointment.isPending}
                            className="btn btn-sm btn-soft-danger"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
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

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Book appointment"
        panelClassName="max-w-md"
      >
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
                No doctors are accepting appointments right now. Ask the clinic to turn
                on booking for a practitioner, then try again.
              </div>
            ) : (
              <select
                id="book-doctor"
                name="doctor"
                required
                className="select"
                value={formData.doctor}
                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              >
                <option value="">Choose a specialist…</option>
                {bookableDoctors.map((doc) => {
                  const id = doctorUserId(doc);
                  const name = doc.user?.name || 'Doctor';
                  const spec = doc.specialization || 'General';
                  return (
                    <option key={doc._id || id} value={id}>
                      {formatDoctorName(name)} — {spec}
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
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="book-time" className="label flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                Time
              </label>
              <select
                id="book-time"
                name="timeSlot"
                required
                className="select"
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              >
                <option value="">Time…</option>
                {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
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
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Briefly describe your symptoms…"
            />
          </div>

          <p className="text-center text-xs leading-snug text-ink-faint">
            Today or a future date. Your doctor will accept or decline the request.
          </p>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createAppointment.isPending ||
                doctorsLoading ||
                doctorsError ||
                bookableDoctors.length === 0
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
    </div>
  );
};

export default PatientAppointments;
