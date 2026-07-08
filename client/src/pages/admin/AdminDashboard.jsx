import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import SkeletonLoader, { SkeletonCard } from '../../components/SkeletonLoader';
import { Users, UserPlus, Stethoscope, Calendar, TrendingUp, ShieldAlert, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays } from 'date-fns';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    }
  });

  const { data: appointments } = useQuery({
    queryKey: ['adminAppointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data;
    }
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['adminDashboardLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', { params: { limit: 5 } });
      return res.data.data;
    }
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  // Process appointment chart data dynamically (past 7 days)
  const getWeeklyTrendData = () => {
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), 'EEE');
      trendMap[dateStr] = 0;
    }

    appointments?.forEach(apt => {
      const dayName = format(new Date(apt.appointmentDate), 'EEE');
      if (trendMap[dayName] !== undefined) {
        trendMap[dayName] += 1;
      }
    });

    return Object.keys(trendMap).map(day => ({
      name: day,
      appointments: trendMap[day]
    }));
  };

  const chartData = getWeeklyTrendData();

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-700 p-8 shadow-lg shadow-indigo-200 overflow-hidden text-white animate-fade-in-up">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute right-32 bottom-0 -mb-16 w-48 h-48 rounded-full bg-indigo-400 opacity-20 blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-primary-100 font-medium max-w-xl">
            Here's what's happening across your hospital network today. You have {stats?.totalAppointments || 0} active appointments in the system.
          </p>
        </div>
      </div>
      
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          index={0}
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          className="border-t-4 border-t-indigo-500"
          description="Registered system-wide"
        />
        <StatCard 
          index={1}
          title="Total Patients" 
          value={stats?.totalPatients || 0} 
          icon={UserPlus} 
          className="border-t-4 border-t-emerald-500"
          description="Active patient records"
        />
        <StatCard 
          index={2}
          title="Total Doctors" 
          value={stats?.totalDoctors || 0} 
          icon={Stethoscope} 
          className="border-t-4 border-t-blue-500"
          description="Specialists & general"
        />
        <StatCard 
          index={3}
          title="Total Appointments" 
          value={stats?.totalAppointments || 0} 
          icon={Calendar} 
          className="border-t-4 border-t-orange-500"
          description="Across all departments"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly Appointments Trend</h2>
              <p className="text-sm text-slate-500 font-medium">Consultations over the last 7 days</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0'}} 
                />
                <Bar dataKey="appointments" fill="url(#colorUv)" radius={[6, 6, 0, 0]} barSize={40} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Log Overview Widget */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-primary-500" />
              Recent Actions
            </h2>
            <div className="space-y-4">
              {auditLogs?.map((log) => (
                <div key={log._id} className="flex gap-3 text-xs font-semibold">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400 self-start shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-slate-850">
                      {log.actor?.name || 'System'} performed <span className="text-primary-650">{log.action}</span>
                    </p>
                    <p className="text-slate-400 mt-0.5 font-medium">
                      {log.resourceType} • {format(new Date(log.timestamp), 'MMM dd, hh:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => window.location.href = '/admin/audit-logs'}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              View Full Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
