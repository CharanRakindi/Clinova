import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { Calendar, Users, CheckCircle, Clock, ChevronRight, PenTool, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [quickNote, setQuickNote] = useState(() => localStorage.getItem(`clinova_note_${user?._id}`) || '');

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
      toast.success(`Appointment marked as ${status}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

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
      <div className="relative rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 p-8 shadow-sm overflow-hidden text-white animate-fade-in-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Good morning, Dr. {user?.name.split(' ')[0]} 🩺
          </h1>
          <p className="text-primary-50 font-medium max-w-xl">
            You have {todayAppointments.length} appointments scheduled for today. Make it a great day!
          </p>
        </div>

        {/* Availability Toggle */}
        <button 
          onClick={() => {
            setIsAvailable(!isAvailable);
            toast.info(`Availability updated: ${!isAvailable ? 'Active' : 'Offline'}`);
          }}
          className="relative z-10 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <span>Availability: {isAvailable ? "Active" : "Offline"}</span>
          {isAvailable ? <ToggleRight className="w-5 h-5 text-green-300" /> : <ToggleLeft className="w-5 h-5 text-slate-300" />}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          index={0}
          title="Today's Appointments" 
          value={todayAppointments.length} 
          icon={Calendar} 
          className="border-t-4 border-t-primary-500"
          description="Scheduled for today"
        />
        <StatCard 
          index={1}
          title="My Patients" 
          value={stats?.totalAssignedPatients || 0} 
          icon={Users} 
          className="border-t-4 border-t-primary-500"
          description="Assigned to you"
        />
        <StatCard 
          index={2}
          title="Completed Consultations" 
          value={stats?.completedConsultations || 0} 
          icon={CheckCircle} 
          className="border-t-4 border-t-primary-500"
          description="Total all time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue & Notes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Queue */}
          <div className="glass-card p-5 space-y-4 border-slate-100/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              Patient Queue
            </h3>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {todayAppointments.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-semibold text-slate-500 py-6 text-center"
                  >
                    No appointments scheduled today
                  </motion.div>
                ) : (
                  todayAppointments.map((apt, index) => (
                    <motion.div 
                      key={apt._id}
                      initial={{ opacity: 0, height: 0, y: 10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, x: -30 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-primary-200 transition-colors overflow-hidden"
                    >
                      <div>
                        <p className="font-extrabold text-sm text-slate-900">{apt.patient?.name}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{apt.timeSlot} • {apt.reason}</p>
                      </div>
                      <div className="flex gap-1">
                        {apt.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: apt._id, status: 'completed' })}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Complete consultation"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <Link 
                          to={`/doctor/patients/${apt.patient?._id}`}
                          className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <ChevronRight className="w-4.5 h-4.5" />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Notes Pad */}
          <div className="glass-card p-5 space-y-4 border-slate-100/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary-500" />
              Quick Notes Pad
            </h3>
            <textarea
              rows={4}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700 placeholder:text-slate-400 transition-all"
              placeholder="Jot down quick reminders or follow-ups. Saved locally..."
            />
          </div>
        </div>

        {/* Schedule Calendar */}
        <div id="calendar-view" className="lg:col-span-2 glass-card p-5 border-slate-100/50 relative z-0">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Interactive Schedule</h3>
          <InteractiveCalendar 
            events={allAppointments || []} 
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
