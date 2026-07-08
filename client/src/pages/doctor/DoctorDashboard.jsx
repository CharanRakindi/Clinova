import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import InteractiveCalendar from '../../components/InteractiveCalendar';
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
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 p-8 shadow-lg shadow-teal-200 dark:shadow-teal-900/20 overflow-hidden text-white animate-fade-in-up">
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

      {/* Calendar View */}
      <div className="animate-fade-in-up animation-delay-300">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Your Schedule</h2>
        <InteractiveCalendar 
          events={allAppointments || []} 
          onSelectEvent={handleSelectEvent}
        />
      </div>
    </div>
  );
};

export default DoctorDashboard;
