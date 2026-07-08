import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { Calendar, FileText, Clock, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['patientStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    }
  });

  const { data: appointments } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data.filter(a => ['requested', 'confirmed'].includes(a.status));
    }
  });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 p-8 shadow-lg shadow-blue-200 overflow-hidden text-white animate-fade-in-up">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute right-32 bottom-0 -mb-16 w-48 h-48 rounded-full bg-indigo-400 opacity-20 blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Hello, {user?.name.split(' ')[0]} ☀️
          </h1>
          <p className="text-indigo-100 font-medium max-w-xl">
            Welcome to your personal health portal. You have {stats?.upcomingAppointments || 0} upcoming appointments scheduled.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          index={0}
          title="Upcoming Appointments" 
          value={stats?.upcomingAppointments || 0} 
          icon={Calendar} 
          className="border-t-4 border-t-indigo-500"
          description="Scheduled visits"
        />
        <StatCard 
          index={1}
          title="Medical Records" 
          value={stats?.totalRecords || 0} 
          icon={FileText} 
          className="border-t-4 border-t-emerald-500"
          description="Total active records"
        />
        <div className="glass-card p-6 flex flex-col justify-between animate-fade-in-up animation-delay-300 border-t-4 border-t-pink-500 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Health Status</h3>
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-100 transition-colors duration-300 shadow-sm border border-pink-100">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6 relative z-10">
            <p className="text-2xl font-extrabold text-slate-800 tracking-tight">Good</p>
            <p className="mt-2 text-sm text-slate-500 font-medium">Keep up the healthy habits!</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden animate-fade-in-up animation-delay-400">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <h2 className="text-lg font-extrabold text-slate-900">Upcoming Appointments</h2>
          <Link to="/patient/appointments" className="text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
            Book New
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {(!appointments || appointments.length === 0) ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-900 font-bold text-lg mb-1">No upcoming appointments</p>
              <p className="text-slate-500 text-sm font-medium">You're all caught up. Need to see a doctor?</p>
            </div>
          ) : (
            appointments.map(apt => (
              <div key={apt._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-primary-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-inner ring-1 ring-white">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=Dr ${apt.doctor?.name}`} alt="Doctor" className="w-full h-full rounded-2xl" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Dr. {apt.doctor?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-500">
                        {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} • <span className="text-slate-700 font-semibold">{apt.timeSlot}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                    ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {apt.status}
                  </span>
                  <p className="text-sm font-medium text-slate-500 mt-2 line-clamp-1 max-w-[200px] text-right" title={apt.reason}>
                    {apt.reason}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
