import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { format } from 'date-fns';
import { Plus, X, Calendar as CalendarIcon, Clock, Stethoscope, FileText, CheckCircle, List } from 'lucide-react';
import { toast } from 'sonner';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { formatDoctorName } from '../../utils/format';
import { cn } from '../../utils/cn';

const statusClass = (status) => {
  if (status === 'confirmed') return 'badge-success';
  if (status === 'requested') return 'badge-warning';
  if (status === 'cancelled') return 'badge-danger';
  if (status === 'completed') return 'badge-info';
  return 'badge-neutral';
};

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

  const { data: doctors } = useQuery({
    queryKey: ['doctorsAccepting'],
    queryFn: async () => {
      const res = await api.get('/doctors?accepting=true');
      return res.data.data;
    },
  });

  const createAppointment = useMutation({
    mutationFn: async (newApt) => {
      const res = await api.post('/appointments', newApt);
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
    if (!formData.doctor || !formData.appointmentDate || !formData.timeSlot || !formData.reason) {
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
    createAppointment.mutate(formData);
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
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-full p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'rounded-full p-2 transition-colors',
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              )}
              title="Calendar view"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </div>

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
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                          <CalendarIcon className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-md font-medium text-slate-900">No appointments yet</p>
                        <p className="mt-1 text-sm text-slate-500">
                          You don&apos;t have any visits scheduled.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          className="btn btn-secondary mt-4"
                        >
                          Book your first appointment
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="table-cell whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="ml-5 mt-1 flex items-center gap-2 text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {apt.timeSlot}
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${formatDoctorName(apt.doctor?.name)}`}
                              alt=""
                              className="h-full w-full"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {formatDoctorName(apt.doctor?.name)}
                            </p>
                            <p className="text-xs text-slate-400">General</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="line-clamp-2 max-w-xs text-slate-600">{apt.reason}</p>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <span className={cn('badge uppercase tracking-wider', statusClass(apt.status))}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="table-cell whitespace-nowrap text-right">
                        {['requested', 'confirmed'].includes(apt.status) && (
                          <button
                            type="button"
                            onClick={() => cancelAppointment.mutate(apt._id)}
                            disabled={cancelAppointment.isPending}
                            className="btn btn-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
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

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-md font-medium text-slate-900">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                Book appointment
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="label flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                  Select doctor
                </label>
                <select
                  className="input appearance-none"
                  value={formData.doctor}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                >
                  <option value="" disabled>
                    Choose a specialist
                  </option>
                  {doctors?.map((doc) => (
                    <option key={doc._id} value={doc.user?._id}>
                      Dr. {doc.user?.name} — {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                    Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={formData.appointmentDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, appointmentDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Time
                  </label>
                  <select
                    className="input appearance-none"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  >
                    <option value="" disabled>
                      Time
                    </option>
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
                <label className="label flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Reason for visit
                </label>
                <textarea
                  className="input min-h-[88px] resize-none py-2.5"
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Briefly describe your symptoms…"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAppointment.isPending}
                  className="btn btn-primary"
                >
                  {createAppointment.isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  {createAppointment.isPending ? 'Requesting…' : 'Request appointment'}
                </button>
              </div>
              <p className="text-center text-xs leading-snug text-slate-400">
                You can book today or a future date. Your doctor will accept or decline the request.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
