import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, Droplet, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonTable } from '../../components/SkeletonLoader';

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
        <div className="badge badge-neutral gap-1.5 px-3 py-1.5 text-[12px]">
          <Users className="h-3.5 w-3.5" />
          {filteredPatients?.length || 0} patients
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative w-full max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/60">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Patient Details</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Patient ID</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Blood Group</th>
                <th scope="col" className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {(!filteredPatients || filteredPatients.length === 0) ? (
                <tr>
                  <td colSpan="4" className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                        <Search className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="mb-1 text-[15px] font-semibold text-slate-900">No patients found</p>
                      <p className="text-[13px] font-medium text-slate-500">Try adjusting your search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <div className="flex items-center">
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-100">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.user?.name}`} alt="" className="h-full w-full" />
                        </div>
                        <div className="ml-3">
                          <div className="text-[13.5px] font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{patient.user?.name}</div>
                          <div className="text-[12.5px] font-medium text-slate-400">{patient.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 font-mono">
                        {patient.patientId}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                        <Droplet className="w-3 h-3 text-rose-600" />
                        {patient.bloodGroup}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/doctor/patients/${patient.user?._id}`)}
                        className="btn btn-outline px-3.5 py-1.5 text-[12.5px]"
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

