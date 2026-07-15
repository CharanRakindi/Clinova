import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { UserPlus, Calendar, Plus, Check, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatDoctorName } from '../../utils/format';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ReceptionistDashboard() {
  const queryClient = useQueryClient();

  // Registration form state (no hardcoded password — server generates temp)
  const [registerData, setRegisterData] = useState({
    name: '', email: '', phone: '', gender: 'male',
  });
  const [lastTempPassword, setLastTempPassword] = useState(null);

  // Appointment form state
  const [aptData, setAptData] = useState({
    patientId: '', doctorId: '', appointmentDate: '', timeSlot: '09:00 AM', reason: '',
  });

  // Load doctors for appointments dropdown
  const { data: doctors } = useQuery({
    queryKey: ['receptionistDoctors'],
    queryFn: async () => {
      const res = await api.get('/doctors');
      return res.data.data;
    },
  });

  // Load patients for selection (staff endpoint — does not use public register)
  const { data: patients } = useQuery({
    queryKey: ['receptionistPatients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data;
    },
  });

  // Load all appointments
  const { data: appointments } = useQuery({
    queryKey: ['receptionistAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data;
    },
  });

  // Mutate: register new patient without hijacking staff session
  const registerPatient = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/patients', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setLastTempPassword(data.activationUrl || data.inviteToken || null);
      toast.success(
        data.activationUrl
          ? `Patient ${data.name} registered. Share activation link (48h): ${data.activationUrl}`
          : `Patient ${data.name} registered successfully`
      );
      setRegisterData({ name: '', email: '', phone: '', gender: 'male' });
      queryClient.invalidateQueries({ queryKey: ['receptionistPatients'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    },
  });

  // Mutate: book new appointment (server expects patient / doctor)
  const bookAppointment = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/appointments', {
        patient: data.patientId,
        doctor: data.doctorId,
        appointmentDate: data.appointmentDate,
        timeSlot: data.timeSlot,
        reason: data.reason || 'Consultation',
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Appointment scheduled successfully');
      setAptData({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        timeSlot: '09:00 AM',
        reason: '',
      });
      queryClient.invalidateQueries({ queryKey: ['receptionistAppointments'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule appointment');
    },
  });

  // Mutate: confirm appointment / queue status
  const updateAptStatus = useMutation({
    mutationFn: async ({ id, status, queueStatus }) => {
      const res = await api.patch(`/appointments/${id}/status`, {
        ...(status ? { status } : {}),
        ...(queueStatus ? { queueStatus } : {}),
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Queue updated');
      queryClient.invalidateQueries({ queryKey: ['receptionistAppointments'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayApts =
    appointments?.filter((a) => {
      if (!['confirmed', 'requested'].includes(a.status)) return false;
      return format(new Date(a.appointmentDate), 'yyyy-MM-dd') === todayStr;
    }) || [];
  const queueCols = [
    { id: 'not_arrived', title: 'Not arrived' },
    { id: 'waiting', title: 'Waiting' },
    { id: 'in_room', title: 'In room' },
    { id: 'done', title: 'Done' },
  ];

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email) {
      toast.error('Name and email are required');
      return;
    }
    setLastTempPassword(null);
    registerPatient.mutate(registerData);
  };

  const handleAptSubmit = (e) => {
    e.preventDefault();
    if (!aptData.patientId || !aptData.doctorId || !aptData.appointmentDate) {
      toast.error('Please choose patient, doctor, and date');
      return;
    }
    bookAppointment.mutate(aptData);
  };

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reception workspace</h1>
          <p className="page-subtitle">
            Register patients, schedule visits, and manage the check-in queue
          </p>
        </div>
        <div className="badge badge-neutral px-3 py-1.5 text-xs">
          {appointments?.length || 0} appointments
        </div>
      </div>

      {/* Check-in board — today's confirmed/requested */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-line-soft px-5 py-3.5">
          <h2 className="panel-title">Today&apos;s check-in board</h2>
          <p className="panel-meta">Move patients waiting → in room → done</p>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {queueCols.map((col) => {
            const colItems = todayApts.filter(
              (a) => (a.queueStatus || 'not_arrived') === col.id
            );
            return (
              <div
                key={col.id}
                className="min-h-[140px] border-b border-line-soft p-3 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="ui-label">{col.title}</p>
                  <span className="badge badge-neutral">{colItems.length}</span>
                </div>
                <div className="space-y-2">
                  {colItems.length === 0 ? (
                    <p className="text-2xs text-ink-faint">Empty</p>
                  ) : (
                    colItems.map((apt) => (
                      <div
                        key={apt._id}
                        className="rounded-lg border border-line bg-surface-muted/50 p-2.5"
                      >
                        <p className="text-xs font-medium text-ink">{apt.patient?.name}</p>
                        <p className="text-2xs text-ink-faint">
                          {apt.timeSlot} · {formatDoctorName(apt.doctor?.name)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {queueCols
                            .filter((c) => c.id !== col.id)
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="rounded-full border border-line bg-surface px-2 py-0.5 text-2xs text-ink-muted hover:border-sky-200 hover:text-sky-700"
                                onClick={() =>
                                  updateAptStatus.mutate({
                                    id: apt._id,
                                    queueStatus: c.id,
                                  })
                                }
                              >
                                → {c.title}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Register and Book */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Registration */}
          <div id="receptionist-register-form" className="card space-y-4 p-5">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-ink-faint" />
                Register new patient
              </h3>
              <p className="section-subtitle">Create a standard EHR record</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="input"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="text"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  className="input"
                  placeholder="555-0101"
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  value={registerData.gender}
                  onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                  className="input cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={registerPatient.isPending}
                className="btn btn-primary w-full"
              >
                <Plus className="h-3.5 w-3.5" />
                Register patient
              </button>
              {lastTempPassword && (
                <div
                  role="status"
                  className="rounded-lg border border-warning-border bg-warning-soft p-3 text-xs text-warning"
                >
                  <p className="font-medium">One-time activation link (48h — share securely):</p>
                  <p className="mt-1 break-all font-mono text-xs text-ink-secondary">
                    {lastTempPassword}
                  </p>
                  <p className="mt-1 text-warning/80">
                    Patient sets their own password via this link. It is not a login password.
                  </p>
                </div>
              )}
            </form>
          </div>

          <div className="card space-y-4 p-5">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ink-faint" />
                Schedule consultation
              </h3>
              <p className="section-subtitle">Assign patients to practitioner slots</p>
            </div>

            <form onSubmit={handleAptSubmit} className="space-y-3.5">
              <div>
                <label className="label">Patient</label>
                <select
                  value={aptData.patientId}
                  onChange={(e) => setAptData({ ...aptData, patientId: e.target.value })}
                  className="select"
                >
                  <option value="">Choose patient…</option>
                  {(patients || [])
                    .filter((p) => p.user?._id)
                    .map((p) => (
                      <option key={p.user._id} value={String(p.user._id)}>
                        {p.user?.name} ({p.patientId})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label">Doctor</label>
                <select
                  value={aptData.doctorId}
                  onChange={(e) => setAptData({ ...aptData, doctorId: e.target.value })}
                  className="select"
                >
                  <option value="">Choose doctor…</option>
                  {(doctors || [])
                    .filter((d) => d.user?._id)
                    .map((d) => (
                      <option key={d.user._id} value={String(d.user._id)}>
                        {d.user?.name} — {d.specialization}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={aptData.appointmentDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAptData({ ...aptData, appointmentDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Time slot</label>
                  <input
                    type="text"
                    value={aptData.timeSlot}
                    onChange={(e) => setAptData({ ...aptData, timeSlot: e.target.value })}
                    className="input"
                    placeholder="10:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="label">Reason</label>
                <input
                  type="text"
                  value={aptData.reason}
                  onChange={(e) => setAptData({ ...aptData, reason: e.target.value })}
                  className="input"
                  placeholder="Routine health check"
                />
              </div>

              <button
                type="submit"
                disabled={bookAppointment.isPending}
                className="btn btn-primary w-full"
              >
                <Plus className="h-3.5 w-3.5" />
                Book appointment
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4">
              <h3 className="section-title">Care check-in queue</h3>
              <p className="section-subtitle">Confirm status of clinic arrivals</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="table-head">Patient</th>
                    <th className="table-head">Doctor</th>
                    <th className="table-head">Date / time</th>
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft text-sm font-medium">
                  {!appointments || appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8">
                        <EmptyState
                          icon={Calendar}
                          title="No appointments scheduled"
                          description="Booked visits will appear in the check-in queue."
                        />
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt._id} className="hover:bg-surface-subtle/50 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-ink-secondary">{apt.patient?.name}</span>
                            <span className="text-2xs font-medium text-ink-faint">{apt.patient?.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted font-medium">
                          <span>{formatDoctorName(apt.doctor?.name)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted">
                          <div className="flex flex-col">
                            <span>{format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}</span>
                            <span className="text-2xs font-medium text-ink-faint">{apt.timeSlot}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={apt.status} className="uppercase tracking-wider" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-1 opacity-80 transition-opacity duration-product group-hover:opacity-100">
                            {apt.status === 'requested' && (
                              <button
                                type="button"
                                onClick={() => updateAptStatus.mutate({ id: apt._id, status: 'confirmed' })}
                                className="btn-icon btn-icon-success"
                                title="Confirm check-in"
                                aria-label="Confirm check-in"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => updateAptStatus.mutate({ id: apt._id, status: 'cancelled' })}
                              className="btn-icon btn-icon-danger"
                              title="Cancel slot"
                              aria-label="Cancel slot"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
