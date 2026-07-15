import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { Search, UserCheck, UserX, Shield, Stethoscope, User as UserIcon, ArrowUp, ArrowDown, ChevronsUpDown, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const ROLE_META = {
  admin: { label: 'Admin', icon: Shield, className: 'badge badge-neutral bg-ink text-ink-inverse' },
  doctor: { label: 'Doctor', icon: Stethoscope, className: 'badge badge-info' },
  patient: { label: 'Patient', icon: UserIcon, className: 'badge badge-neutral' },
  receptionist: { label: 'Receptionist', icon: UserIcon, className: 'badge badge-warning' },
  lab_technician: { label: 'Lab Tech', icon: Shield, className: 'badge badge-success' },
};

const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role] || ROLE_META.patient;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 ${meta.className}`}>
      <Icon className="h-3 w-3" aria-hidden />
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
      className="cursor-pointer select-none whitespace-nowrap px-6 py-3.5 text-left text-2xs font-medium uppercase tracking-wider text-ink-faint transition-colors hover:text-ink-muted"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <Icon className={`h-3 w-3 ${isActive ? 'text-ink' : 'text-ink-faint'}`} />
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

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

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

  const updateUser = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.patch(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setEditUser(null);
      toast.success(data.message || 'User updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  };

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
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">User management</h1>
          <p className="page-subtitle">
            Add doctors & lab staff · manage access and roles
          </p>
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
          <div className="badge badge-neutral gap-1.5 px-3 py-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" />
            {filteredUsers?.length || 0} / {users?.length || 0} users
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col items-center gap-3 border-b border-line-soft p-4 sm:flex-row">
          <div className="relative w-full max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
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
            <thead className="bg-surface-subtle/60">
              <tr>
                <SortHeader label="User details" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Status" sortKey="isActive" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Joined date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                <th scope="col" className="px-6 py-3.5 text-right text-2xs font-medium uppercase tracking-wider text-ink-faint">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {(!paginatedUsers || paginatedUsers.length === 0) ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8">
                    <EmptyState
                      icon={Search}
                      title="No users match"
                      description="Try adjusting your search or filters."
                    />
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="group transition-colors hover:bg-surface-subtle/70">
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <div className="flex items-center">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-medium text-ink-inverse"
                          aria-hidden
                        >
                          {(user.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-ink">{user.name}</div>
                          <div className="text-xs font-medium text-ink-faint">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span
                        className={`badge inline-flex items-center gap-1.5 ${
                          user.isActive ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? 'bg-success' : 'bg-danger'
                          }`}
                          aria-hidden
                        />
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-xs font-medium text-ink-muted">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="btn btn-secondary btn-sm"
                          title="Edit name, email, phone"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus.mutate({ id: user._id, isActive: !user.isActive })
                          }
                          disabled={toggleStatus.isPending}
                          className={`btn btn-sm ${
                            user.isActive ? 'btn-soft-danger' : 'btn-soft-success'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-3.5 w-3.5" /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" /> Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line-soft px-6 py-3.5">
            <span className="text-xs font-medium text-ink-faint">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedUsers?.length || 0)} of {sortedUsers?.length || 0} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="btn btn-outline px-3.5 py-1.5 text-xs"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="btn btn-outline px-3.5 py-1.5 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add hospital staff"
        scrollable
        panelClassName="max-w-lg"
      >
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
                  <p className="mt-1 text-2xs text-ink-faint">
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

              <div className="flex gap-2 rounded-xl border border-line bg-surface-subtle p-3.5 text-xs font-normal text-ink-muted">
                <span className="font-medium text-ink-secondary">Note:</span>
                <span>
                  New accounts must change their password on first login to Clinova.
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
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
      </Modal>

      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit user"
        panelClassName="max-w-md"
      >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editForm.name.trim() || !editForm.email.trim()) {
                  toast.error('Name and email are required');
                  return;
                }
                updateUser.mutate({
                  id: editUser._id,
                  payload: {
                    name: editForm.name.trim(),
                    email: editForm.email.trim(),
                    phone: editForm.phone.trim(),
                  },
                });
              }}
              className="space-y-4 p-6"
            >
              <div>
                <label className="label">Full name</label>
                <input
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Email (admin only)</label>
                <input
                  type="email"
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
                <p className="mt-1.5 text-xs text-ink-faint">
                  Only admins can change user emails. Staff cannot change their own.
                </p>
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setEditUser(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={updateUser.isPending} className="btn btn-primary">
                  {updateUser.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;