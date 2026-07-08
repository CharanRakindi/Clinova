import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, UserCheck, UserX, Shield, Stethoscope, User as UserIcon, Filter } from 'lucide-react';
import { toast } from 'sonner';

const roleBadge = (role) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    doctor: 'bg-blue-100 text-blue-800 border-blue-200',
    patient: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  const icons = {
    admin: Shield,
    doctor: Stethoscope,
    patient: UserIcon,
  };
  const Icon = icons[role] || UserIcon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${styles[role] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
      <Icon className="w-3.5 h-3.5" />
      {role}
    </span>
  );
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const res = await api.patch(`/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(data.message || 'User status updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage platform access and roles</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl text-sm font-bold border border-primary-100">
          <Shield className="w-4 h-4" />
          {filteredUsers?.length || 0} / {users?.length || 0} Users
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 bg-white/50 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none appearance-none cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {(!filteredUsers || filteredUsers.length === 0) ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-bold text-lg mb-1">No users found</p>
                      <p className="text-slate-500 text-sm font-medium">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 flex items-center justify-center font-extrabold text-sm shadow-inner ring-1 ring-white">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt="Avatar" className="w-full h-full rounded-xl" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{user.name}</div>
                          <div className="text-sm font-medium text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {roleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                        user.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => toggleStatus.mutate({ id: user._id, isActive: !user.isActive })}
                        disabled={toggleStatus.isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border disabled:opacity-50 shadow-sm ${
                          user.isActive
                            ? 'text-rose-700 bg-white border-rose-200 hover:bg-rose-50 hover:border-rose-300'
                            : 'text-emerald-700 bg-white border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        {user.isActive ? (
                          <><UserX className="w-3.5 h-3.5" /> Suspend</>
                        ) : (
                          <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
