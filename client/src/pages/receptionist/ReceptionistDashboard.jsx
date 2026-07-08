import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { UserPlus, Calendar, Plus, Search, Check, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ReceptionistDashboard() {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  
  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: '', email: '', password: 'password123', role: 'patient', phone: '', gender: 'male'
  });

  // Appointment form state
  const [aptData, setAptData] = useState({
    patientId: '', doctorId: '', appointmentDate: '', timeSlot: '09:00 AM', reason: ''
  });

  // Load doctors for appointments dropdown
  const { data: doctors } = useQuery({
    queryKey: ['receptionistDoctors'],
    queryFn: async () => {
      const res = await api.get('/doctors');
      return res.data.data;
    }
  });

  // Load patients for selection
  const { data: patients } = useQuery({
    queryKey: ['receptionistPatients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data;
    }
  });

  // Load all appointments
  const { data: appointments } = useQuery({
    queryKey: ['receptionistAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data;
    }
  });

  // Mutate: register new patient
  const registerPatient = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/auth/register', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success(`Patient ${data.name} registered successfully`);
      setRegisterData({ name: '', email: '', password: 'password123', role: 'patient', phone: '', gender: 'male' });
      queryClient.invalidateQueries({ queryKey: ['receptionistPatients'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    }
  });

  // Mutate: book new appointment
  const bookAppointment = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/appointments', data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Appointment scheduled successfully');
      setAptData({ patientId: '', doctorId: '', appointmentDate: '', timeSlot: '09:00 AM', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['receptionistAppointments'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule appointment');
    }
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

  const filteredPatients = patients?.filter(p => 
    p.user?.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.user?.email.toLowerCase().includes(patientSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Receptionist Portal</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Register new patients, manage appointment check-ins, and schedule consultations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Register and Book */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Registration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary-500" />
              Register Patient
            </h3>
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="text"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="555-0101"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                  <select
                    value={registerData.gender}
                    onChange={(e) => setRegisterData({...registerData, gender: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={registerPatient.isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Register Patient
              </button>
            </form>
          </div>

          {/* Book Appointment */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Schedule Appointment
            </h3>
            <form onSubmit={handleAptSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Patient</label>
                <select
                  value={aptData.patientId}
                  onChange={(e) => setAptData({...aptData, patientId: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Choose Patient...</option>
                  {patients?.map(p => (
                    <option key={p.user?._id} value={p.user?._id}>{p.user?.name} ({p.patientId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Doctor</label>
                <select
                  value={aptData.doctorId}
                  onChange={(e) => setAptData({...aptData, doctorId: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Choose Doctor...</option>
                  {doctors?.map(d => (
                    <option key={d.user?._id} value={d.user?._id}>{d.user?.name} - {d.specialization}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={aptData.appointmentDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAptData({...aptData, appointmentDate: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={aptData.timeSlot}
                    onChange={(e) => setAptData({...aptData, timeSlot: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    placeholder="10:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</label>
                <input
                  type="text"
                  value={aptData.reason}
                  onChange={(e) => setAptData({...aptData, reason: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  placeholder="Routine Health Check"
                />
              </div>

              <button
                type="submit"
                disabled={bookAppointment.isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Book Appointment
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Appointment Queue / List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Care Queue</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                  {!appointments || appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No appointments currently scheduled
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span>{apt.patient?.name}</span>
                            <span className="text-xs font-medium text-slate-400">{apt.patient?.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span>{apt.doctor?.name}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span>{format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}</span>
                            <span className="text-xs font-medium text-slate-400">{apt.timeSlot}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                            apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            apt.status === 'requested' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            {apt.status === 'requested' && (
                              <button
                                onClick={() => updateAptStatus.mutate({ id: apt._id, status: 'confirmed' })}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Confirm appointment"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => updateAptStatus.mutate({ id: apt._id, status: 'cancelled' })}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Cancel appointment"
                            >
                              <Trash className="w-4 h-4" />
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
