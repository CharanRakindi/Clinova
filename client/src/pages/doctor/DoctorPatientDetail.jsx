import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  ArrowLeft, Plus, FileText, Heart, Thermometer, Activity,
  CheckCircle, Paperclip, AlertTriangle, Stethoscope, Droplet,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import FileUpload from '../../components/FileUpload';
import { formatDoctorName } from '../../utils/format';
import Tabs from '../../components/ui/Tabs';
import DataValue from '../../components/ui/DataValue';
import EmptyState from '../../components/ui/EmptyState';
import AlertBanner from '../../components/ui/AlertBanner';
import Modal from '../../components/ui/Modal';

const TABS = ['Overview', 'Timeline', 'Lab Reports', 'Prescriptions'];

const SEVERITY_STYLES = {
  Severe: 'badge-danger',
  Moderate: 'badge-warning',
  Mild: 'badge-neutral',
  Unknown: 'badge-neutral',
};

function VitalCell({ label, icon: Icon, value, unit }) {
  const missing = value == null || value === '';
  return (
    <div className="soft-panel">
      <p className="ui-label mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-ink-faint" aria-hidden />}
        {label}
      </p>
      {missing ? (
        <p className="data-empty">Not recorded</p>
      ) : (
        <p className="text-lg font-medium text-ink">
          {value}
          {unit ? <span className="ml-1 text-2xs font-normal text-ink-faint">{unit}</span> : null}
        </p>
      )}
    </div>
  );
}

const DoctorPatientDetail = () => {
  const { patientId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRxOpen, setIsRxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [rxForm, setRxForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
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

  const { data: labReports, isLoading: labReportsLoading } = useQuery({
    queryKey: ['patientLabReports', patientId],
    queryFn: async () => {
      const res = await api.get(`/lab-reports?patientId=${patientId}&limit=50`);
      return res.data.data;
    },
  });

  const { data: prescriptions, isLoading: rxLoading } = useQuery({
    queryKey: ['patientPrescriptions', patientId],
    queryFn: async () => {
      const res = await api.get(`/prescriptions?patientId=${patientId}&limit=50`);
      return res.data.data;
    },
  });

  const createPrescription = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/prescriptions', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientPrescriptions', patientId] });
      setIsRxOpen(false);
      setRxForm({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
      toast.success('Prescription created');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create prescription');
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

  const reorderLab = useMutation({
    mutationFn: async (report) => {
      const res = await api.post('/lab-reports', {
        patientId,
        testName: report.testName,
        testType: report.testType || 'Diagnostic',
        priority: report.priority || 'Normal',
        notes: report.notes
          ? `Re-order of previous request. ${report.notes}`
          : 'Re-ordered laboratory test',
        appointmentId: report.appointment || undefined,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientLabReports', patientId] });
      queryClient.invalidateQueries({ queryKey: ['doctorLabReports'] });
      toast.success('Lab test re-ordered successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to re-order lab test');
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

  if (profileLoading || recordsLoading || labReportsLoading || rxLoading) {
    return (
      <div className="flex justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      </div>
    );
  }

  const severeAllergies = (allergies || []).filter(a => a.severity === 'Severe');
  const activeConditions = (conditions || []).filter(c => c.status === 'Active');
  const alertCount = severeAllergies.length + activeConditions.filter(c => c.severity === 'Severe').length;

  return (
    <div className="workspace">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            to="/doctor/patients"
            className="btn btn-secondary h-9 w-9 rounded-full p-0"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="page-title">
              {patient?.user?.name || 'Patient file'}
            </h1>
            <p className="page-subtitle">
              {patient?.patientId ? `${patient.patientId} · ` : ''}
              Clinical details and history
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsRxOpen(true)}
            className="btn btn-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            Prescribe
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add clinical note
          </button>
        </div>
      </div>

      {alertCount > 0 && (
        <AlertBanner title="Critical medical alerts" severity="critical">
          <div className="flex flex-wrap gap-1.5">
            {severeAllergies.map((a) => (
              <span key={a._id} className="badge badge-danger">
                Allergy: {a.allergen}
              </span>
            ))}
            {activeConditions
              .filter((c) => c.severity === 'Severe')
              .map((c) => (
                <span key={c._id} className="badge badge-danger">
                  Condition: {c.conditionName}
                </span>
              ))}
          </div>
        </AlertBanner>
      )}

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex shrink-0 flex-col items-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-lg font-medium text-ink-inverse"
              aria-hidden
            >
              {(patient?.user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <span className="badge badge-neutral mt-2 font-mono">
              {patient?.patientId || 'No MRN'}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium text-ink">{patient?.user?.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
              <DataValue value={patient?.user?.gender} empty="Gender not documented" className="capitalize" />
              <span className="text-line-strong" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Droplet className="h-3 w-3 text-ink-faint" aria-hidden />
                <DataValue value={patient?.bloodGroup} empty="Blood group not documented" />
              </span>
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="ui-label mb-0.5">Email</p>
                <DataValue value={patient?.user?.email} />
              </div>
              <div>
                <p className="ui-label mb-0.5">Phone</p>
                <DataValue value={patient?.user?.phone} empty="Not documented" />
              </div>
              <div>
                <p className="ui-label mb-0.5">Emergency contact</p>
                {patient?.emergencyContact?.name ? (
                  <div>
                    <p className="data-value">{patient.emergencyContact.name}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {[patient.emergencyContact.relationship, patient.emergencyContact.phone]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                ) : (
                  <p className="data-empty">Not documented</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'Overview' && (
          <div className="grid animate-fade-in grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Vitals Overview */}
            <div className="card p-5">
              <h3 className="panel-title mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-ink-faint" aria-hidden />
                Latest vitals
              </h3>
              {records?.[0]?.vitals ? (
                <div className="grid grid-cols-2 gap-3">
                  <VitalCell label="Pulse" icon={Heart} value={records[0].vitals.pulse} unit="bpm" />
                  <VitalCell label="Temp" icon={Thermometer} value={records[0].vitals.temperature} unit="°C" />
                  <VitalCell
                    label="Blood pressure"
                    icon={Activity}
                    value={
                      records[0].vitals.bloodPressureSystolic && records[0].vitals.bloodPressureDiastolic
                        ? `${records[0].vitals.bloodPressureSystolic}/${records[0].vitals.bloodPressureDiastolic}`
                        : null
                    }
                  />
                  <VitalCell label="SpO₂" value={records[0].vitals.oxygenSaturation} unit="%" />
                </div>
              ) : (
                <EmptyState compact title="No vitals on file" description="Vitals appear here after a clinical note is recorded." />
              )}
            </div>

            {/* Diagnosis Overview */}
            <div className="card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-medium text-slate-800">
                <Stethoscope className="h-4 w-4 text-primary-500" />
                Recent Diagnoses
              </h3>
              {records && records[0]?.diagnosis?.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {records[0].diagnosis.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                      <span className="text-sm font-medium text-slate-800">{d}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact title="No diagnoses on file" description="Documented diagnoses appear after clinical notes." />
              )}
            </div>

            {/* Allergies Overview */}
            <div className="card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-medium text-slate-800">
                <AlertTriangle className="h-4 w-4 text-primary-500" />
                Allergies Log
              </h3>
              {allergies && allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((a) => (
                    <span key={a._id} className={`badge ${SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.Unknown}`}>
                      {a.allergen}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState compact title="No allergies on file" description="Documented allergies will list here." />
              )}
            </div>

            {/* Conditions Overview */}
            <div className="card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-medium text-slate-800">
                <FileText className="h-4 w-4 text-primary-500" />
                Clinical Conditions
              </h3>
              {conditions && conditions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {conditions.map((c) => (
                    <div key={c._id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-2.5">
                      <span className="text-sm font-medium text-slate-800">{c.conditionName}</span>
                      <span className={`rounded px-1.5 py-0.5 text-2xs font-medium ${
                        c.status === 'Active' ? 'border border-amber-100 bg-amber-50 text-amber-700' :
                        c.status === 'Resolved' ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' :
                        'border border-slate-200 bg-white text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact title="No conditions on file" description="Active conditions appear when documented." />
              )}
            </div>
          </div>
        )}

        {activeTab === 'Timeline' && (
          <div className="animate-fade-in">
            {(!records || records.length === 0) ? (
              <div className="card">
                <EmptyState
                  icon={FileText}
                  title="No clinical notes on file"
                  description="This patient's care history updates as notes are signed off."
                  action={
                    <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-secondary">
                      Add clinical note
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="relative pl-8">
                {/* Timeline center line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200/80" />

                <div className="space-y-6">
                  {records.map((record) => (
                    <div key={record._id} className="relative">
                      {/* Timeline point */}
                      <div className="absolute -left-8 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-4 border-white bg-slate-900 shadow-sm" />

                      <div className="card p-5">
                        <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row">
                          <div>
                            <p className="text-2xs font-medium text-slate-400 font-mono">
                              {format(new Date(record.visitDate), 'MMMM dd, yyyy')}
                            </p>
                            <h3 className="mt-0.5 text-md font-medium text-slate-800">{record.chiefComplaint}</h3>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              Practitioner: {formatDoctorName(record.doctor?.name)}
                              {record.version > 1 && (
                                <span className="ml-2 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-2xs font-medium text-amber-700">
                                  Amended v{record.version}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className={`rounded border px-2 py-0.5 text-2xs font-medium uppercase tracking-wider ${
                            record.status === 'active' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                            'border-slate-200 bg-slate-50 text-slate-400'
                          }`}>
                            {record.status}
                          </span>
                        </div>

                        <div className="space-y-4 border-t border-slate-100 pt-4">
                          {(record.symptoms?.length > 0 || record.chiefComplaint) && (
                            <div>
                              <span className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-slate-400">Symptoms</span>
                              <div className="flex flex-wrap gap-1">
                                {record.symptoms?.map((s, i) => (
                                  <span key={i} className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-2xs font-medium text-slate-600">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {record.vitals && Object.keys(record.vitals).some(k => record.vitals[k]) && (
                            <div>
                              <span className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-slate-400">Signed Vitals</span>
                              <div className="flex flex-wrap gap-2">
                                {record.vitals.pulse && <span className="rounded border border-slate-200/80 bg-white px-2.5 py-1 text-2xs font-medium text-slate-600">{record.vitals.pulse} bpm</span>}
                                {record.vitals.temperature && <span className="rounded border border-slate-200/80 bg-white px-2.5 py-1 text-2xs font-medium text-slate-600">{record.vitals.temperature}°C</span>}
                                {record.vitals.bloodPressureSystolic && <span className="rounded border border-slate-200/80 bg-white px-2.5 py-1 text-2xs font-medium text-slate-600">{record.vitals.bloodPressureSystolic}/{record.vitals.bloodPressureDiastolic} mmHg</span>}
                                {record.vitals.oxygenSaturation && <span className="rounded border border-slate-200/80 bg-white px-2.5 py-1 text-2xs font-medium text-slate-600">SpO₂ {record.vitals.oxygenSaturation}%</span>}
                              </div>
                            </div>
                          )}

                          {(record.diagnosis?.length > 0 || record.clinicalNotes) && (
                            <div>
                              <span className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-slate-400">Clinical Diagnoses</span>
                              {record.diagnosis?.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1">
                                  {record.diagnosis.map((d, i) => (
                                    <span key={i} className="rounded bg-primary-50 text-primary-700 px-2 py-0.5 text-2xs font-medium">{d}</span>
                                  ))}
                                </div>
                              )}
                              {record.clinicalNotes && <p className="text-sm font-medium text-slate-600">{record.clinicalNotes}</p>}
                            </div>
                          )}

                          {record.treatmentPlan && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3.5">
                              <span className="mb-1 block text-2xs font-medium uppercase tracking-wider text-slate-400">Treatment Plan</span>
                              <p className="text-sm font-medium text-slate-700">{record.treatmentPlan}</p>
                            </div>
                          )}

                          {record.attachments && record.attachments.length > 0 && (
                            <div>
                              <span className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-slate-400">Attachments</span>
                              <div className="flex flex-wrap gap-2">
                                {record.attachments.map((att, idx) => (
                                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800">
                                    <Paperclip className="h-3.5 w-3.5 text-slate-400" /> {att.filename}
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
          <div className="space-y-4 animate-fade-in">
            {(!labReports || labReports.length === 0) ? (
              <div className="card">
                <EmptyState
                  icon={Activity}
                  title="No lab reports on file"
                  description="Orders and results appear here when lab work is placed or completed."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {labReports.map((report) => (
                  <div key={report._id} className="card p-5 bg-white border border-slate-200/60 hover:border-slate-300 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-medium text-base text-slate-900">{report.testName}</h4>
                        <p className="text-2xs font-medium text-slate-400 mt-0.5">
                          Ordered: {format(new Date(report.orderedDate), 'MMM dd, yyyy')} • Practitioner: {formatDoctorName(report.doctor?.name)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 text-2xs font-medium uppercase tracking-wider rounded-md border ${
                          report.status === 'ordered' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          report.status === 'sample_collected' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          report.status === 'processing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          report.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          report.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => reorderLab.mutate(report)}
                          disabled={reorderLab.isPending}
                          className="btn btn-secondary btn-sm"
                          title="Submit a new order for the same test"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Re-order
                        </button>
                      </div>
                    </div>

                    <div className="pt-3.5 space-y-3 text-sm">
                      {report.notes && (
                        <div>
                          <span className="text-2xs font-medium uppercase tracking-wider text-slate-500 block">Doctor Notes</span>
                          <p className="text-slate-600 font-medium mt-0.5">{report.notes}</p>
                        </div>
                      )}
                      
                      {(report.status === 'completed' || report.status === 'reviewed') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-200/40">
                          <div>
                            <span className="text-2xs font-medium uppercase tracking-wider text-slate-500 block">Result Summary</span>
                            <p className="text-slate-800 font-medium mt-0.5">
                              {report.resultSummary?.trim()
                                ? report.resultSummary
                                : 'No result documented'}
                            </p>
                          </div>
                          {report.referenceRange && (
                            <div>
                              <span className="text-2xs font-medium uppercase tracking-wider text-slate-500 block">Reference Range</span>
                              <p className="text-slate-800 font-medium mt-0.5">{report.referenceRange}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {report.attachments?.length > 0 && (
                        <div>
                          <span className="text-2xs font-medium uppercase tracking-wider text-slate-500 block mb-1">Attachments</span>
                          <div className="flex flex-wrap gap-2">
                            {report.attachments.map((file, idx) => (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-primary-600 hover:border-primary-300 transition-colors shadow-sm"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[150px]">{file.filename}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Prescriptions' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex justify-end">
              <button type="button" onClick={() => setIsRxOpen(true)} className="btn btn-primary btn-sm">
                <Plus className="h-3.5 w-3.5" />
                New prescription
              </button>
            </div>
            {(!prescriptions || prescriptions.length === 0) ? (
              <div className="card">
                <EmptyState
                  icon={FileText}
                  title="No prescriptions on file"
                  description="Medications you prescribe for this patient will list here."
                  action={
                    <button type="button" onClick={() => setIsRxOpen(true)} className="btn btn-secondary">
                      Prescribe medication
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx._id} className="card p-5">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-2xs font-medium uppercase tracking-wider text-slate-400">
                          {format(new Date(rx.createdAt || rx.startDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          By {formatDoctorName(rx.doctor?.name)}
                        </p>
                      </div>
                      <span className="badge badge-neutral uppercase tracking-wider">{rx.status || 'active'}</span>
                    </div>
                    <ul className="space-y-2">
                      {(rx.medicines || []).map((med, i) => (
                        <li key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 text-sm">
                          <span className="font-medium text-slate-900">{med.medicineName || med.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ') || '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {rx.instructions && (
                      <p className="mt-3 text-xs text-slate-600">{rx.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={isRxOpen} onClose={() => setIsRxOpen(false)} title="New prescription" panelClassName="max-w-md">
            <form
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!rxForm.name.trim() || !rxForm.dosage.trim() || !rxForm.frequency.trim() || !rxForm.duration.trim()) {
                  toast.error('Medicine name, dosage, frequency, and duration are required');
                  return;
                }
                createPrescription.mutate({
                  patientId,
                  medicines: [
                    {
                      medicineName: rxForm.name.trim(),
                      dosage: rxForm.dosage.trim(),
                      frequency: rxForm.frequency.trim(),
                      duration: rxForm.duration.trim(),
                    },
                  ],
                  instructions: rxForm.instructions.trim(),
                });
              }}
            >
              <div>
                <label className="label">Medicine name</label>
                <input className="input" value={rxForm.name} onChange={(e) => setRxForm({ ...rxForm, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label">Dosage</label>
                  <input className="input" placeholder="10mg" value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Frequency</label>
                  <input className="input" placeholder="BID" value={rxForm.frequency} onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input className="input" placeholder="7 days" value={rxForm.duration} onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Instructions</label>
                <textarea className="input min-h-[72px] resize-none py-2.5" value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRxOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createPrescription.isPending}>
                  {createPrescription.isPending ? 'Saving…' : 'Save prescription'}
                </button>
              </div>
            </form>
      </Modal>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New clinical note"
        wide
        scrollable
      >
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="label">
                  Chief complaint <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Primary reason for consultation"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="label">
                    Symptoms <span className="font-normal text-slate-400">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="e.g. Fever, Cough, Fatigue"
                  />
                </div>
                <div>
                  <label className="label">
                    Diagnosis <span className="font-normal text-slate-400">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="e.g. Acute Rhinitis"
                  />
                </div>
              </div>

              <div>
                <label className="label">Clinical notes</label>
                <textarea
                  className="input min-h-[100px] resize-none py-2.5"
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  placeholder="Detailed findings and observations…"
                />
              </div>

              <div>
                <label className="label">Treatment plan</label>
                <textarea
                  className="input min-h-[80px] resize-none py-2.5"
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  placeholder="Medications, dosage, clinical advice…"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
                <label className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Activity className="h-4 w-4 text-slate-400" /> Patient vitals
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                      <label className="mb-1 block text-2xs font-medium text-slate-400">
                        {label}
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="input"
                        placeholder={placeholder}
                        value={formData.vitals[key]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitals: { ...formData.vitals, [key]: e.target.value },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Follow-up date</label>
                <input
                  type="date"
                  className="input w-auto max-w-xs cursor-pointer"
                  value={formData.followUpDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
                <FileUpload
                  onUploadSuccess={handleUploadSuccess}
                  label="Attach report (PDF or image)"
                />
                {formData.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-slate-400">
                      Attachments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.attachments.map((att, idx) => (
                        <div key={idx} className="badge badge-neutral gap-1.5">
                          <Paperclip className="h-3.5 w-3.5" />
                          {att.filename}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRecord.isPending}
                  className="btn btn-primary"
                >
                  {createRecord.isPending ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  {createRecord.isPending ? 'Saving…' : 'Sign off & save'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
};

export default DoctorPatientDetail;