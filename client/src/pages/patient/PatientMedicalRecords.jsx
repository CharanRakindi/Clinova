import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Heart, Thermometer, Activity, Calendar, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonTable } from '../../components/SkeletonLoader';

const PatientMedicalRecords = () => {
  const { user } = useAuth();

  const { data: records, isLoading } = useQuery({
    queryKey: ['myMedicalRecords'],
    queryFn: async () => {
      const res = await api.get(`/patients/${user._id}/medical-records`);
      return res.data.data;
    },
    enabled: !!user?._id,
  });

  if (isLoading) return <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100"><SkeletonTable rows={5} /></div>;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Medical Records</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review your consultation history and notes</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100">
          <FileText className="w-4 h-4" />
          {records?.length || 0} Records
        </div>
      </div>

      {(!records || records.length === 0) ? (
        <div className="glass-card p-16 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
            <FileText className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">No records yet</h2>
          <p className="text-sm font-medium text-slate-500 max-w-sm">Your medical records and doctor's notes will appear here automatically after your consultations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {records.map((record) => (
            <div key={record._id} className="glass-card relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-primary-400 to-indigo-500"></div>
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-white/50 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="pl-2">
                  <h3 className="text-xl font-extrabold text-slate-900">{record.chiefComplaint}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      {format(new Date(record.visitDate), 'MMMM dd, yyyy')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm font-bold text-slate-700">Dr. {record.doctor?.name}</span>
                    {record.version > 1 && <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">Amended v{record.version}</span>}
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border flex-shrink-0 ${
                  record.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {record.status}
                </span>
              </div>

              <div className="p-6 pl-8 space-y-6">
                {/* Diagnosis + Symptoms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {record.diagnosis?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diagnosis</p>
                      <div className="flex flex-wrap gap-2">
                        {record.diagnosis.map((d, i) => (
                          <span key={i} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {record.symptoms?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symptoms</p>
                      <div className="flex flex-wrap gap-2">
                        {record.symptoms.map((s, i) => (
                          <span key={i} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-100">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vitals */}
                {record.vitals && Object.keys(record.vitals).some(k => record.vitals[k]) && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vitals</p>
                    <div className="flex flex-wrap gap-3">
                      {record.vitals.pulse && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">
                          <Heart className="w-3.5 h-3.5 text-rose-500" /> {record.vitals.pulse} bpm
                        </div>
                      )}
                      {record.vitals.temperature && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">
                          <Thermometer className="w-3.5 h-3.5 text-orange-500" /> {record.vitals.temperature}°C
                        </div>
                      )}
                      {record.vitals.bloodPressureSystolic && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">
                          <Activity className="w-3.5 h-3.5 text-blue-500" /> {record.vitals.bloodPressureSystolic}/{record.vitals.bloodPressureDiastolic} mmHg
                        </div>
                      )}
                      {record.vitals.oxygenSaturation && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">
                          <span className="text-teal-500 font-extrabold">O₂</span> {record.vitals.oxygenSaturation}%
                        </div>
                      )}
                      {record.vitals.height && (
                        <div className="text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">
                          Height: {record.vitals.height} cm
                        </div>
                      )}
                      {record.vitals.weight && (
                        <div className="text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">
                          Weight: {record.vitals.weight} kg
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clinical Notes */}
                {record.clinicalNotes && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clinical Notes</p>
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{record.clinicalNotes}</p>
                  </div>
                )}

                {/* Treatment Plan */}
                {record.treatmentPlan && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Treatment Plan</p>
                    <p className="text-sm font-medium text-emerald-900">{record.treatmentPlan}</p>
                  </div>
                )}

                {/* Attachments Section */}
                {record.attachments && record.attachments.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {record.attachments.map((att, idx) => (
                        <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 border border-primary-100 transition-colors">
                          <Paperclip className="w-4 h-4" /> {att.filename}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up */}
                {record.followUpDate && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-indigo-900">
                      <span className="font-bold">Follow-up:</span>{' '}
                      {format(new Date(record.followUpDate), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientMedicalRecords;
