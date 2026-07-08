import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      const res = await api.get('/appointments');
      return res.data.data;
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctorStats'] });
      toast.success(`Appointment ${status}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const todayAppointments = allAppointments?.filter(a => {
    const aptDate = format(new Date(a.appointmentDate), 'yyyy-MM-dd');
    return aptDate === todayStr;
  }) || [];

  const upcomingAppointments = allAppointments?.filter(a => {
    const aptDate = format(new Date(a.appointmentDate), 'yyyy-MM-dd');
    return aptDate > todayStr && ['requested', 'confirmed'].includes(a.status);
  }) || [];

  const renderAppointmentRow = (apt) => (
    <div key={apt._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-5">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-primary-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-inner ring-1 ring-white">
          {apt.patient?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{apt.patient?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">
              {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} • <span className="text-slate-700 font-semibold">{apt.timeSlot}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
            ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 
              apt.status === 'requested' ? 'bg-amber-100 text-amber-800' : 
              apt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-slate-100 text-slate-800'}`}>
            {apt.status}
          </span>
          <p className="text-sm font-medium text-slate-500 mt-2 line-clamp-1 max-w-[200px] text-right" title={apt.reason}>
            {apt.reason}
          </p>
        </div>
        {/* Action buttons */}
        {!['completed', 'cancelled'].includes(apt.status) && (
          <div className="flex gap-2 ml-4">
            {apt.status === 'requested' && (
              <button
                onClick={() => updateStatus.mutate({ id: apt._id, status: 'confirmed' })}
                disabled={updateStatus.isPending}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg transition-all hover:shadow-sm disabled:opacity-50"
              >
                Confirm
              </button>
            )}
            <button
              onClick={() => updateStatus.mutate({ id: apt._id, status: 'completed' })}
              disabled={updateStatus.isPending}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg transition-all hover:shadow-sm disabled:opacity-50"
            >
              Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 p-8 shadow-lg shadow-teal-200 overflow-hidden text-white animate-fade-in-up">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Good morning, Dr. {user?.name.split(' ')[0]} 🩺
          </h1>
          <p className="text-teal-50 font-medium max-w-xl">
            You have {todayAppointments.length} appointments scheduled for today. Make it a great day!
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          index={0}
          title="Today's Appointments" 
          value={todayAppointments.length} 
          icon={Calendar} 
          className="border-t-4 border-t-blue-500"
          description="Scheduled for today"
        />
        <StatCard 
          index={1}
          title="My Patients" 
          value={stats?.totalAssignedPatients || 0} 
          icon={Users} 
          className="border-t-4 border-t-emerald-500"
          description="Assigned to you"
        />
        <StatCard 
          index={2}
          title="Completed Consultations" 
          value={stats?.completedConsultations || 0} 
          icon={CheckCircle} 
          className="border-t-4 border-t-purple-500"
          description="Total all time"
        />
      </div>

      {/* Today's Appointments */}
      <div className="glass-card overflow-hidden animate-fade-in-up animation-delay-300">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <h2 className="text-lg font-extrabold text-slate-900">Today's Schedule</h2>
          <Link to="/doctor/patients" className="text-sm text-primary-600 hover:text-primary-700 font-bold px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">View All Patients</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {todayAppointments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-slate-900 font-bold text-lg mb-1">All clear!</p>
              <p className="text-slate-500 text-sm font-medium">No appointments scheduled for today.</p>
            </div>
          ) : (
            todayAppointments.map(renderAppointmentRow)
          )}
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-in-up animation-delay-400 mt-6">
          <div className="px-6 py-5 border-b border-slate-100 bg-white/50">
            <h2 className="text-lg font-extrabold text-slate-900">Upcoming Appointments</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingAppointments.map(renderAppointmentRow)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
