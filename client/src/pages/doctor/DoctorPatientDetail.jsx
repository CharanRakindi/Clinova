import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { ArrowLeft, Plus, X, FileText, Heart, Thermometer, Activity, User, Phone, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DoctorPatientDetail = () => {
  const { patientId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    symptoms: '',
    diagnosis: '',
    clinicalNotes: '',
    treatmentPlan: '',
    followUpDate: '',
    vitals: {
      height: '',
      weight: '',
      temperature: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      pulse: '',
      oxygenSaturation: '',
    },
  });

  const { data: patient, isLoading: profileLoading } = useQuery({
    queryKey: ['patientProfile', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}`);
      return res.data.data;
    },
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['patientRecords', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/medical-records`);
      return res.data.data;
    },
  });

  const createRecord = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/patients/${patientId}/medical-records`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientRecords', patientId] });
      setIsModalOpen(false);
      setFormData({
        chiefComplaint: '', symptoms: '', diagnosis: '', clinicalNotes: '',
        treatmentPlan: '', followUpDate: '',
        vitals: { height: '', weight: '', temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', pulse: '', oxygenSaturation: '' },
      });
      toast.success('Medical record created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create record');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.chiefComplaint) {
      toast.error('Chief complaint is required');
      return;
    }
    const payload = {
      ...formData,
      symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : [],
      diagnosis: formData.diagnosis ? formData.diagnosis.split(',').map(d => d.trim()) : [],
      vitals: Object.fromEntries(
        Object.entries(formData.vitals).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])
      ),
    };
    if (!formData.followUpDate) delete payload.followUpDate;
    createRecord.mutate(payload);
  };

  if (profileLoading || recordsLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Back button + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/doctor/patients" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary-600 transition-colors" />
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Profile</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Add Record
        </button>
      </div>

      {/* Patient Info Card */}
      <div className="glass-card relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-600 p-1 shadow-lg">
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient?.user?.name}`} alt="Patient" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="mt-3 px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                {patient?.patientId}
              </span>
            </div>
            
            <div className="flex-1 w-full">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{patient?.user?.name}</h2>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-6">
                <User className="w-4 h-4" /> {patient?.user?.gender || 'Unknown Gender'} • 
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-100">{patient?.bloodGroup || 'Blood Group N/A'}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                  <p className="text-sm font-semibold text-slate-800">{patient?.user?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {patient?.user?.phone || 'Not provided'}
                  </p>
                </div>
                {patient?.emergencyContact?.name && (
                  <div className="sm:col-span-2 lg:col-span-1 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Emergency Contact</p>
                    <p className="text-sm font-bold text-slate-800">{patient.emergencyContact.name}</p>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {patient.emergencyContact.relationship} • {patient.emergencyContact.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Records Timeline */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4 px-2">Medical History</h2>
        
        {(!records || records.length === 0) ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-900 font-bold text-lg mb-1">No medical records</p>
            <p className="text-slate-500 text-sm font-medium mb-6 max-w-md">This patient does not have any recorded medical history yet. Add a record to get started.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-bold text-primary-600 bg-primary-50 px-5 py-2.5 rounded-xl hover:bg-primary-100 transition-colors shadow-sm"
            >
              Add First Record
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record._id} className="glass-card p-6 relative group overflow-hidden hover:shadow-md transition-shadow">
                <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-primary-400 to-indigo-500"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5 pl-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{record.chiefComplaint}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {format(new Date(record.visitDate), 'MMMM dd, yyyy')} • Dr. {record.doctor?.name}
                      {record.version > 1 && <span className="ml-2 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-xs border border-amber-100">Amended v{record.version}</span>}
                    </p>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border ${
                    record.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {record.status}
                  </span>
                </div>

                <div className="pl-2 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {record.diagnosis?.length > 0 && (
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Diagnosis</span>
                        <div className="flex flex-wrap gap-2">
                          {record.diagnosis.map((d, i) => (
                            <span key={i} className="inline-flex px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.symptoms?.length > 0 && (
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Symptoms</span>
                        <div className="flex flex-wrap gap-2">
                          {record.symptoms.map((s, i) => (
                            <span key={i} className="inline-flex px-2.5 py-1 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-100">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {record.clinicalNotes && (
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Clinical Notes</span>
                      <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{record.clinicalNotes}</p>
                    </div>
                  )}

                  {record.vitals && Object.keys(record.vitals).some(k => record.vitals[k]) && (
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Vitals Recorded</span>
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
                      </div>
                    </div>
                  )}

                  {record.treatmentPlan && (
                    <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Treatment Plan</p>
                      <p className="text-sm font-medium text-emerald-900">{record.treatmentPlan}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Medical Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl overflow-hidden transform animate-scale-in">
            <div className="bg-gradient-to-r from-primary-600 to-indigo-700 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <FileText className="w-5 h-5" /> New Medical Record
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-slate-50/30">
              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Chief Complaint <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Primary reason for the visit"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Symptoms <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="e.g., Fever, Cough"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Diagnosis <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="e.g., Viral Pharyngitis"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Clinical Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none min-h-[100px] resize-none"
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  placeholder="Detailed observations and findings..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Treatment Plan</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none min-h-[80px] resize-none"
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  placeholder="Medications, procedures, advice..."
                />
              </div>

              {/* Vitals */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" /> Patient Vitals
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { key: 'pulse', label: 'Pulse (bpm)', placeholder: '72' },
                    { key: 'temperature', label: 'Temp (°C)', placeholder: '37.0' },
                    { key: 'bloodPressureSystolic', label: 'BP Sys', placeholder: '120' },
                    { key: 'bloodPressureDiastolic', label: 'BP Dia', placeholder: '80' },
                    { key: 'oxygenSaturation', label: 'SpO₂ (%)', placeholder: '98' },
                    { key: 'height', label: 'Height (cm)', placeholder: '170' },
                    { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                        placeholder={placeholder}
                        value={formData.vitals[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, [key]: e.target.value },
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Follow-up Date (Optional)</label>
                <input
                  type="date"
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  value={formData.followUpDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRecord.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {createRecord.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {createRecord.isPending ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientDetail;
