import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, Droplet, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import DataValue from '../../components/ui/DataValue';

const DoctorPatients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data: patients, isLoading } = useQuery({
    queryKey: ['doctorPatients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data;
    }
  });

  const q = searchTerm.toLowerCase();
  const filteredPatients = patients?.filter(
    (p) =>
      (p.user?.name || '').toLowerCase().includes(q) ||
      (p.patientId || '').toLowerCase().includes(q)
  );

  if (isLoading) return <div className="card p-8"><SkeletonTable rows={5} /></div>;

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient directory</h1>
          <p className="page-subtitle">Clinical records under your care</p>
        </div>
        <div className="badge badge-neutral gap-1.5 px-3 py-1.5 text-xs">
          <Users className="h-3.5 w-3.5" />
          {filteredPatients?.length || 0} patients
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 border-b border-line-soft p-4">
          <div className="relative w-full max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search patients by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line-soft">
            <thead className="bg-surface-subtle/60">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-2xs font-medium uppercase tracking-wider text-ink-faint">Patient Details</th>
                <th scope="col" className="px-6 py-3.5 text-left text-2xs font-medium uppercase tracking-wider text-ink-faint">Patient ID</th>
                <th scope="col" className="px-6 py-3.5 text-left text-2xs font-medium uppercase tracking-wider text-ink-faint">Blood Group</th>
                <th scope="col" className="px-6 py-3.5 text-right text-2xs font-medium uppercase tracking-wider text-ink-faint">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft bg-surface">
              {(!filteredPatients || filteredPatients.length === 0) ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8">
                    <EmptyState
                      icon={Search}
                      title="No patients found"
                      description="Try adjusting your search query."
                    />
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="group transition-colors hover:bg-surface-subtle/70">
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <div className="flex items-center">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-medium text-ink-inverse"
                          aria-hidden
                        >
                          {(patient.user?.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-ink transition-colors group-hover:text-ink-secondary">
                            {patient.user?.name}
                          </div>
                          <div className="text-xs font-medium text-ink-faint">{patient.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className="badge badge-neutral font-mono">
                        {patient.patientId}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-2xs font-medium text-ink-secondary">
                        <Droplet className="h-3 w-3 text-ink-faint" />
                        <DataValue value={patient.bloodGroup} empty="Not documented" />
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/doctor/patients/${patient.user?._id}`)}
                        className="btn btn-outline px-3.5 py-1.5 text-xs"
                      >
                        View Records
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

export default DoctorPatients;

