import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, UserPlus, Droplet, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const filteredPatients = patients?.filter(p => 
    p.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">View and manage assigned patients</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
          <Users className="w-4 h-4" />
          {filteredPatients?.length || 0} Patients Found
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-white/50">
          <div className="relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
              placeholder="Search patients by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Group</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {(!filteredPatients || filteredPatients.length === 0) ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-bold text-lg mb-1">No patients found</p>
                      <p className="text-slate-500 text-sm font-medium">Try adjusting your search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center font-extrabold text-sm shadow-inner ring-1 ring-white">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.user?.name}`} alt="Avatar" className="w-full h-full rounded-xl" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{patient.user?.name}</div>
                          <div className="text-sm font-medium text-slate-500">{patient.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {patient.patientId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                        <Droplet className="w-3.5 h-3.5" />
                        {patient.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/doctor/patients/${patient.user?._id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 hover:border-primary-300 shadow-sm"
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
