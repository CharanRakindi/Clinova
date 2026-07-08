import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { format } from 'date-fns';
import { Plus, X, Calendar as CalendarIcon, Clock, Stethoscope, FileText, CheckCircle, List } from 'lucide-react';
import { toast } from 'sonner';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { SkeletonTable } from '../../components/SkeletonLoader';

const PatientAppointments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    timeSlot: '',
    reason: ''
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data;
    }
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/doctors');
      return res.data.data;
    }
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
      toast.success('Appointment booked successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    }
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
    createAppointment.mutate(formData);
  };

  const handleSelectEvent = (event) => {
    const apt = event.resource;
    toast(`Appointment with Dr. ${apt.doctor?.name}`, {
      description: `${format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at ${apt.timeSlot}`,
    });
  };

  if (isLoading) return <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100"><SkeletonTable rows={5} /></div>;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your upcoming and past visits</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Book New Visit
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <InteractiveCalendar 
          events={appointments || []} 
          onSelectEvent={handleSelectEvent}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {(!appointments || appointments.length === 0) ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <CalendarIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-900 font-bold text-lg mb-1">No appointments yet</p>
                        <p className="text-slate-500 text-sm font-medium mb-4">You don't have any medical visits scheduled.</p>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="text-sm font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          Book your first appointment
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                          <div className="text-sm font-bold text-slate-900">{format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}</div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-6">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <div className="text-sm font-medium text-slate-500">{apt.timeSlot}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-primary-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm shadow-inner ring-1 ring-white">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=Dr ${apt.doctor?.name}`} alt="Doctor" className="w-full h-full rounded-xl" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Dr. {apt.doctor?.name}</p>
                            <p className="text-xs font-medium text-slate-500">General</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-600 line-clamp-2 max-w-xs">{apt.reason}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border
                          ${apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            apt.status === 'requested' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            apt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            apt.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {['requested', 'confirmed'].includes(apt.status) && (
                          <button
                            onClick={() => cancelAppointment.mutate(apt._id)}
                            disabled={cancelAppointment.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 shadow-sm disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-700 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" /> Book Appointment
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50/50">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                    <Stethoscope className="w-4 h-4 text-primary-500" /> Select Doctor
                  </label>
                  <select 
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none appearance-none"
                    value={formData.doctor}
                    onChange={(e) => setFormData({...formData, doctor: e.target.value})}
                  >
                    <option value="" disabled>Choose a specialist</option>
                    {doctors?.map(doc => (
                      <option key={doc._id} value={doc.user?._id}>
                        Dr. {doc.user?.name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                      <CalendarIcon className="w-4 h-4 text-primary-500" /> Date
                    </label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                      value={formData.appointmentDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                      <Clock className="w-4 h-4 text-primary-500" /> Time
                    </label>
                    <select 
                      className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none appearance-none"
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                    >
                      <option value="" disabled>Time</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                    <FileText className="w-4 h-4 text-primary-500" /> Reason for Visit
                  </label>
                  <textarea 
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                    rows="3"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Briefly describe your symptoms..."
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createAppointment.isPending}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {createAppointment.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {createAppointment.isPending ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
