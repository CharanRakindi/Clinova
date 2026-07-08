import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { Users, UserPlus, Stethoscope, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  if (isError) return <div className="p-8 text-red-500 bg-red-50 rounded-xl">Error loading dashboard statistics. Please try again.</div>;

  const mockChartData = [
    { name: 'Mon', appointments: 4 },
    { name: 'Tue', appointments: 3 },
    { name: 'Wed', appointments: 2 },
    { name: 'Thu', appointments: 6 },
    { name: 'Fri', appointments: 8 },
    { name: 'Sat', appointments: 9 },
    { name: 'Sun', appointments: 0 },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-700 p-8 shadow-lg shadow-indigo-200 overflow-hidden text-white animate-fade-in-up">
        {/* Decorative elements */}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-500">
        <div className="lg:col-span-2 glass-card p-6">
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
              <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
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

        {/* Quick Actions / System Health */}
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">System Health</h2>
          
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Database Storage</span>
                <span className="font-bold text-primary-600">45%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-primary-500 h-2 rounded-full w-[45%]"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Server CPU</span>
                <span className="font-bold text-emerald-600">12%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full w-[12%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Active Connections</span>
                <span className="font-bold text-amber-600">89%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full w-[89%]"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <h3 className="font-semibold text-primary-900 text-sm mb-1">Need help?</h3>
            <p className="text-xs text-primary-700 mb-3">Check the documentation for admin features.</p>
            <button className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg w-full transition-colors">
              View Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
