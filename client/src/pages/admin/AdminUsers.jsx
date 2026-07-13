import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { Search, UserCheck, UserX, Shield, Stethoscope, User as UserIcon, ArrowUp, ArrowDown, ChevronsUpDown, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_META = {
  admin: { label: 'Admin', icon: Shield, className: 'bg-slate-900 text-white' },
  doctor: { label: 'Doctor', icon: Stethoscope, className: 'bg-primary-50 text-primary-700 border border-primary-100' },
  patient: { label: 'Patient', icon: UserIcon, className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  receptionist: { label: 'Receptionist', icon: UserIcon, className: 'bg-blue-50 text-blue-700 border border-blue-100' },
  lab_technician: { label: 'Lab Tech', icon: Shield, className: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
};

const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role] || ROLE_META.patient;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
};

const SortHeader = ({ label, sortKey, sortConfig, onSort }) => {
  const isActive = sortConfig.key === sortKey;
  const Icon = !isActive ? ChevronsUpDown : sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      className="cursor-pointer select-none whitespace-nowrap px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <Icon className={`h-3 w-3 ${isActive ? 'text-primary-600' : 'text-slate-300'}`} />
      </span>
    </th>
  );
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const itemsPerPage = 10;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'doctor',
    department: '',
    specialization: '',
    employeeId: '',
    password: '',
  });

  const { data: departments } = useQuery({
    queryKey: ['adminDepartments'],
    queryFn: async () => {
      const res = await api.get('/doctors/departments');
      return res.data.data;
    }
  });

  const createStaff = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Staff account created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        role: 'doctor',
        department: '',
        specialization: '',
        employeeId: '',
        password: '',
      });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create staff account');
    }
  });

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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...(filteredUsers || [])].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil((sortedUsers?.length || 0) / itemsPerPage);
  const paginatedUsers = sortedUsers?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) return <div className="card p-8"><SkeletonTable rows={5} /></div>;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User management</h1>
          <p className="page-subtitle">Manage platform access and roles</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add doctor / lab tech
          </button>
          <div className="badge badge-neutral gap-1.5 px-3 py-1.5 text-[12.5px]">
            <Shield className="h-3.5 w-3.5" />
            {filteredUsers?.length || 0} / {users?.length || 0} users
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col items-center gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative w-full max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-full cursor-pointer sm:w-44"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="lab_technician">Lab Technician</option>
            <option value="patient">Patient</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/60">
              <tr>
                <SortHeader label="User details" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Status" sortKey="isActive" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Joined date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                <th scope="col" className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {(!paginatedUsers || paginatedUsers.length === 0) ? (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                        <Search className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="mb-1 text-[15px] font-semibold text-slate-900">No users found</p>
                      <p className="text-[13px] font-medium text-slate-400">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <div className="flex items-center">
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-100">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt="" className="h-full w-full" />
                        </div>
                        <div className="ml-3">
                          <div className="text-[13.5px] font-semibold text-slate-900">{user.name}</div>
                          <div className="text-[12.5px] font-medium text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${user.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-[12.5px] font-medium text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <button
                        onClick={() => toggleStatus.mutate({ id: user._id, isActive: !user.isActive })}
                        disabled={toggleStatus.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 ${user.isActive
                          ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                          }`}
                      >
                        {user.isActive ? (
                          <><UserX className="h-3.5 w-3.5" /> Suspend</>
                        ) : (
                          <><UserCheck className="h-3.5 w-3.5" /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5">
            <span className="text-[12.5px] font-medium text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedUsers?.length || 0)} of {sortedUsers?.length || 0} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="btn btn-outline px-3.5 py-1.5 text-[12.5px]"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="btn btn-outline px-3.5 py-1.5 text-[12.5px]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {isCreateModalOpen && (
        <div className="modal-backdrop items-start overflow-y-auto">
          <div className="modal-panel my-8 max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-[15px] font-medium text-slate-900">
                <Plus className="h-4 w-4 text-slate-400" />
                Add hospital staff
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!createForm.name || !createForm.email || !createForm.password || !createForm.role) {
                  toast.error('All required fields must be filled');
                  return;
                }
                createStaff.mutate(createForm);
              }}
              className="space-y-4 p-6"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Sarah Jenkins"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="lab_technician">Lab technician</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Staff must use a @clinova.com email
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="name@clinova.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="555-0199"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="EMP1024"
                    value={createForm.employeeId}
                    onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    className="input"
                    placeholder="••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Department</label>
                  <select
                    className="input"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  >
                    <option value="">Select department</option>
                    {(departments || []).map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                {createForm.role === 'doctor' && (
                  <div>
                    <label className="label">Specialization</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Cardiology"
                      value={createForm.specialization}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, specialization: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[12.5px] font-normal text-slate-600">
                <span className="font-medium text-slate-800">Note:</span>
                <span>
                  New accounts must change their password on first login to Clinova.
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStaff.isPending}
                  className="btn btn-primary"
                >
                  {createStaff.isPending ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;