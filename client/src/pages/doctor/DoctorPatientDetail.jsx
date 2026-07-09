import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  ArrowLeft, Plus, X, FileText, Heart, Thermometer, Activity, User, Phone,
  CheckCircle, Paperclip, AlertTriangle, ShieldAlert, Stethoscope, Droplet,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import FileUpload from '../../components/FileUpload';

const TABS = ['Overview', 'Timeline', 'Lab Reports'];

const SEVERITY_STYLES = {
  Severe: 'bg-red-50 text-red-700 border-red-200',
  Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  Mild: 'bg-slate-100 text-slate-600 border-slate-200',
  Unknown: 'bg-slate-100 text-slate-600 border-slate-200',
};

const DoctorPatientDetail = () => {
  const { patientId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
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
    attachments: [],
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

  const { data: allergies } = useQuery({
    queryKey: ['patientAllergies', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/allergies`);
      return res.data.data;
    },
  });

  const { data: conditions } = useQuery({
    queryKey: ['patientConditions', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/conditions`);
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
        attachments: [],
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

  const handleUploadSuccess = (url, data) => {
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, {
        filename: data.filename,
        url: url,
        mimetype: data.mimetype
      }]
    }));
  };

  if (profileLoading || recordsLoading) {
    return (
      <div className="flex justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      </div>
    );
  }

  const severeAllergies = (allergies || []).filter(a => a.severity === 'Severe');
  const activeConditions = (conditions || []).filter(c => c.status === 'Active');
  const alertCount = severeAllergies.length + activeConditions.filter(c => c.severity === 'Severe').length;

  // Simple, transparent heuristic \u2014 not a diagnostic score. Starts from a
  // baseline and is nudged by open severe alerts and record completeness.
  const healthScore = Math.max(
    100 - severeAllergies.length * 8 - activeConditions.filter(c => c.severity === 'Severe').length * 10,
    45
  );
  const scoreTone = healthScore >= 85 ? 'emerald' : healthScore >= 65 ? 'amber' : 'red';
  const scoreStyles = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Back button + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/doctor/patients" className="group rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:bg-slate-50">
            <ArrowLeft className="h-5 w-5 text-slate-400 transition-colors group-hover:text-primary-600" />
          </Link>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Patient Profile</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 px-5 py-2.5"
        >
          <Plus className="h-4 w-4" /> Add record
        </button>
      </div>

      {/* Medical Alerts \u2014 only appears when there is something that actually needs attention */}
      {alertCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
          <span className="text-[13px] font-semibold text-red-700">Medical alerts:</span>
          {severeAllergies.map((a) => (
            <span key={a._id} className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-[12px] font-medium text-red-700">
              Severe allergy — {a.allergen}
            </span>
          ))}
          {activeConditions.filter(c => c.severity === 'Severe').map((c) => (
            <span key={c._id} className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-[12px] font-medium text-red-700">
              {c.conditionName}
            </span>
          ))}
        </div>
      )}

      {/* Patient Info Card */}
      <div className="card p-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient?.user?.name}`} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {patient?.patientId}
            </span>
          </div>

          <div className="w-full flex-1">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-[19px] font-semibold text-slate-900">{patient?.user?.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {patient?.user?.gender || 'Unknown gender'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
                    <Droplet className="h-3 w-3" /> {patient?.bloodGroup || 'Blood group N/A'}
                  </span>
                </div>
              </div>

              {/* Health Score */}
              <div className={`flex flex-col items-center rounded-xl border px-4 py-2.5 ${scoreStyles[scoreTone]}`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Health score</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-semibold leading-none">{healthScore}</span>
                  <span className="text-[11px] font-medium opacity-70">/100</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email address</p>
                <p className="text-[13.5px] font-medium text-slate-800">{patient?.user?.email}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Phone number</p>
                <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-slate-800">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {patient?.user?.phone || 'Not provided'}
                </p>
              </div>
              {patient?.emergencyContact?.name && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Emergency contact</p>
                  <p className="text-[13.5px] font-semibold text-slate-800">{patient.emergencyContact.name}</p>
                  <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                    {patient.emergencyContact.relationship} • {patient.emergencyContact.phone}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6 px-1">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`relative pb-3 text-[13.5px] font-semibold transition-colors ${activeTab === tab ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'Overview' && (
          <div className="grid animate-fade-in grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[14.5px] font-semibold text-slate-900">
                <Activity className="h-4 w-4 text-primary-600" /> Latest vitals
              </h3>
              {records && records[0]?.vitals ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Heart className="h-3.5 w-3.5" /> Pulse</p>
                    <p className="text-lg font-semibold text-slate-900">{records[0].vitals.pulse} <span className="text-[12px] font-normal text-slate-400">bpm</span></p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Thermometer className="h-3.5 w-3.5" /> Temp</p>
                    <p className="text-lg font-semibold text-slate-900">{records[0].vitals.temperature}°C</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Activity className="h-3.5 w-3.5" /> BP</p>
                    <p className="text-lg font-semibold text-slate-900">{records[0].vitals.bloodPressureSystolic}/{records[0].vitals.bloodPressureDiastolic}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">SpO₂</p>
                    <p className="text-lg font-semibold text-slate-900">{records[0].vitals.oxygenSaturation}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13.5px] font-medium text-slate-400">No vitals recorded yet.</p>
              )}
            </div>

            <div className="card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[14.5px] font-semibold text-slate-900">
                <Stethoscope className="h-4 w-4 text-primary-600" /> Recent diagnosis
              </h3>
              {records && records[0]?.diagnosis?.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {records[0].diagnosis.map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                      <span className="text-[13.5px] font-semibold text-slate-800">{d}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13.5px] font-medium text-slate-400">No recent diagnosis.</p>
              )}
            </div>

            <div className="card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[14.5px] font-semibold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-primary-600" /> Allergies
              </h3>
              {allergies && allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((a) => (
                    <span key={a._id} className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.Unknown}`}>
                      {a.allergen}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13.5px] font-medium text-slate-400">No known allergies recorded.</p>
              )}
            </div>

            <div className="card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[14.5px] font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-primary-600" /> Conditions
              </h3>
              {conditions && conditions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {conditions.map((c) => (
                    <div key={c._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                      <span className="text-[13.5px] font-semibold text-slate-800">{c.conditionName}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${c.status === 'Active' ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : c.status === 'Resolved' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13.5px] font-medium text-slate-400">No conditions recorded.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Timeline' && (
          <div className="animate-fade-in">
            {(!records || records.length === 0) ? (
              <div className="card flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <p className="mb-1 text-[15px] font-semibold text-slate-900">No medical records yet</p>
                <p className="mb-6 max-w-md text-[13.5px] font-medium text-slate-500">This patient's care journey will appear here as records are added.</p>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-outline px-5 py-2.5">
                  Add first record
                </button>
              </div>
            ) : (
              <div className="relative pl-8">
                {/* Continuous timeline spine */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />

                <div className="space-y-8">
                  {records.map((record) => (
                    <div key={record._id} className="relative">
                      {/* Timeline node */}
                      <div className="absolute -left-8 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-4 border-white bg-primary-500 shadow-sm" />

                      <div className="card p-5">
                        <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row">
                          <div>
                            <p className="text-[12px] font-semibold text-slate-400">
                              {format(new Date(record.visitDate), 'MMMM d, yyyy')}
                            </p>
                            <h3 className="mt-0.5 text-[15.5px] font-semibold text-slate-900">{record.chiefComplaint}</h3>
                            <p className="mt-0.5 text-[12.5px] font-medium text-slate-500">
                              Dr. {record.doctor?.name}
                              {record.version > 1 && (
                                <span className="ml-2 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                  Amended v{record.version}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${record.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                            }`}>
                            {record.status}
                          </span>
                        </div>

                        <div className="space-y-4 border-t border-slate-100 pt-4">
                          {(record.symptoms?.length > 0 || record.chiefComplaint) && (
                            <div>
                              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Symptoms</span>
                              <div className="flex flex-wrap gap-1.5">
                                {record.symptoms?.map((s, i) => (
                                  <span key={i} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11.5px] font-medium text-slate-600">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {record.vitals && Object.keys(record.vitals).some(k => record.vitals[k]) && (
                            <div>
                              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Vitals</span>
                              <div className="flex flex-wrap gap-2">
                                {record.vitals.pulse && <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-700">{record.vitals.pulse} bpm</span>}
                                {record.vitals.temperature && <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-700">{record.vitals.temperature}°C</span>}
                                {record.vitals.bloodPressureSystolic && <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-700">{record.vitals.bloodPressureSystolic}/{record.vitals.bloodPressureDiastolic} mmHg</span>}
                                {record.vitals.oxygenSaturation && <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-700">SpO₂ {record.vitals.oxygenSaturation}%</span>}
                              </div>
                            </div>
                          )}

                          {(record.diagnosis?.length > 0 || record.clinicalNotes) && (
                            <div>
                              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Diagnosis</span>
                              {record.diagnosis?.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                  {record.diagnosis.map((d, i) => (
                                    <span key={i} className="rounded-md bg-primary-50 px-2 py-0.5 text-[11.5px] font-semibold text-primary-700">{d}</span>
                                  ))}
                                </div>
                              )}
                              {record.clinicalNotes && <p className="text-[13px] font-medium text-slate-600">{record.clinicalNotes}</p>}
                            </div>
                          )}

                          {record.treatmentPlan && (
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Plan</span>
                              <p className="text-[13px] font-medium text-slate-700">{record.treatmentPlan}</p>
                            </div>
                          )}

                          {record.attachments && record.attachments.length > 0 && (
                            <div>
                              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attachments</span>
                              <div className="flex flex-wrap gap-2">
                                {record.attachments.map((att, idx) => (
                                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-primary-200 hover:text-primary-600">
                                    <Paperclip className="h-3.5 w-3.5" /> {att.filename}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Lab Reports' && (
          <div className="card flex animate-fade-in flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Activity className="h-8 w-8 text-slate-300" />
            </div>
            <p className="mb-1 text-[15px] font-semibold text-slate-900">No lab reports yet</p>
            <p className="max-w-md text-[13.5px] font-medium text-slate-500">Laboratory reports for this patient will appear here once finalized by a lab technician.</p>
          </div>
        )}
      </div>

      {/* Create Medical Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-[15.5px] font-semibold text-slate-900">
                <FileText className="h-4.5 w-4.5 text-primary-600" /> New medical record
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Chief complaint <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Primary reason for the visit"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Symptoms <span className="font-normal text-slate-400">(comma-separated)</span></label>
                  <input
                    type="text"
                    className="input"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="e.g., Fever, Cough"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Diagnosis <span className="font-normal text-slate-400">(comma-separated)</span></label>
                  <input
                    type="text"
                    className="input"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="e.g., Viral Pharyngitis"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Clinical notes</label>
                <textarea
                  className="input min-h-[100px] resize-none py-2.5"
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  placeholder="Detailed observations and findings..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Treatment plan</label>
                <textarea
                  className="input min-h-[80px] resize-none py-2.5"
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  placeholder="Medications, procedures, advice..."
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <label className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                  <Activity className="h-4 w-4 text-primary-600" /> Patient vitals
                </label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { key: 'pulse', label: 'Pulse (bpm)', placeholder: '72' },
                    { key: 'temperature', label: 'Temp (°C)', placeholder: '37.0' },
                    { key: 'bloodPressureSystolic', label: 'BP sys', placeholder: '120' },
                    { key: 'bloodPressureDiastolic', label: 'BP dia', placeholder: '80' },
                    { key: 'oxygenSaturation', label: 'SpO₂ (%)', placeholder: '98' },
                    { key: 'height', label: 'Height (cm)', placeholder: '170' },
                    { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">{label}</label>
                      <input
                        type="number"
                        step="any"
                        className="input bg-slate-50 focus:bg-white"
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
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Follow-up date (optional)</label>
                <input
                  type="date"
                  className="input w-auto"
                  value={formData.followUpDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <FileUpload onUploadSuccess={handleUploadSuccess} label="Attach documents (lab results, X-rays)" />
                {formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Uploaded files</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-1.5 text-[12.5px] font-medium text-primary-700">
                          <Paperclip className="h-4 w-4" />
                          {att.filename}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline px-5 py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={createRecord.isPending} className="btn btn-primary gap-2 px-6 py-2.5">
                  {createRecord.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {createRecord.isPending ? 'Saving...' : 'Save record'}
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