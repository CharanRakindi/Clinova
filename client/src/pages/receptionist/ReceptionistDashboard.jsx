import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { UserPlus, Calendar, Plus, Check, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatDoctorName } from '../../utils/format';
import EmptyState from '../../components/ui/EmptyState';

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

  // Mutate: confirm appointment
  const updateAptStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Appointment status updated');
      queryClient.invalidateQueries({ queryKey: ['receptionistAppointments'] });
    }
  });

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Register and Book */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Registration */}
          <div id="receptionist-register-form" className="card space-y-4 p-5">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-slate-400" />
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
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-medium">One-time activation link (48h — share securely):</p>
                  <p className="mt-1 break-all font-mono text-xs">{lastTempPassword}</p>
                  <p className="mt-1 text-amber-800/80">
                    Patient sets their own password via this link. It is not a login password.
                  </p>
                </div>
              )}
            </form>
          </div>

          <div className="card space-y-4 p-5">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
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
                  className="input cursor-pointer"
                >
                  <option value="">Choose patient…</option>
                  {patients?.map((p) => (
                    <option key={p.user?._id} value={p.user?._id}>
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
                  className="input cursor-pointer"
                >
                  <option value="">Choose doctor…</option>
                  {doctors?.map((d) => (
                    <option key={d.user?._id} value={d.user?._id}>
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
                <tbody className="divide-y divide-slate-50 text-sm font-medium">
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
                      <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{apt.patient?.name}</span>
                            <span className="text-2xs font-medium text-slate-400">{apt.patient?.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          <span>{formatDoctorName(apt.doctor?.name)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          <div className="flex flex-col">
                            <span>{format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}</span>
                            <span className="text-2xs font-medium text-slate-400">{apt.timeSlot}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-2xs font-medium uppercase tracking-wider border ${
                            apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            apt.status === 'requested' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex gap-1 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                            {apt.status === 'requested' && (
                              <button
                                onClick={() => updateAptStatus.mutate({ id: apt._id, status: 'confirmed' })}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Confirm check-in"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => updateAptStatus.mutate({ id: apt._id, status: 'cancelled' })}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancel slot"
                            >
                              <Trash className="w-3.5 h-3.5" />
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
