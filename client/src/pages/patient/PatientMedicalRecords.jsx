import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Heart, Thermometer, Activity, Calendar, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { formatDoctorName } from '../../utils/format';
import { cn } from '../../utils/cn';
import EmptyState from '../../components/ui/EmptyState';

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

  if (isLoading) {
    return (
      <div className="card p-8">
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">My medical records</h1>
          <p className="page-subtitle">Consultation history, notes, and vitals</p>
        </div>
        <div className="badge badge-neutral gap-1.5 px-3 py-1.5 text-xs">
          <FileText className="h-3.5 w-3.5" />
          {records?.length || 0} records
        </div>
      </div>

      {!records || records.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No records on file"
            description="Consultation notes and vitals appear here after visits with your care team."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {records.map((record) => (
            <div
              key={record._id}
              className="card relative overflow-hidden transition-all duration-product hover:shadow-premium-lg"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />

              <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
                <div className="pl-2">
                  <h3 className="text-lg font-medium text-slate-900">
                    {record.chiefComplaint}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {format(new Date(record.visitDate), 'MMMM dd, yyyy')}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-medium text-slate-700">
                      {formatDoctorName(record.doctor?.name)}
                    </span>
                    {record.version > 1 && (
                      <span className="badge badge-warning">Amended v{record.version}</span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'badge uppercase tracking-wider shrink-0',
                    record.status === 'active' ? 'badge-success' : 'badge-neutral'
                  )}
                >
                  {record.status}
                </span>
              </div>

              <div className="space-y-5 px-6 py-5 pl-8">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {record.diagnosis?.length > 0 && (
                    <div>
                      <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-slate-400">
                        Diagnosis
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {record.diagnosis.map((d, i) => (
                          <span key={i} className="badge badge-info">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {record.symptoms?.length > 0 && (
                    <div>
                      <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-slate-400">
                        Symptoms
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {record.symptoms.map((s, i) => (
                          <span key={i} className="badge badge-warning">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {record.vitals &&
                  Object.keys(record.vitals).some((k) => record.vitals[k]) && (
                    <div>
                      <p className="mb-2.5 text-2xs font-medium uppercase tracking-wider text-slate-400">
                        Vitals
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.vitals.pulse && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                            {record.vitals.pulse} bpm
                          </div>
                        )}
                        {record.vitals.temperature && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                            <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                            {record.vitals.temperature}°C
                          </div>
                        )}
                        {record.vitals.bloodPressureSystolic && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                            <Activity className="h-3.5 w-3.5 text-blue-500" />
                            {record.vitals.bloodPressureSystolic}/
                            {record.vitals.bloodPressureDiastolic} mmHg
                          </div>
                        )}
                        {record.vitals.oxygenSaturation && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                            <span className="font-medium text-teal-600">O₂</span>
                            {record.vitals.oxygenSaturation}%
                          </div>
                        )}
                        {record.vitals.height && (
                          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                            Height: {record.vitals.height} cm
                          </div>
                        )}
                        {record.vitals.weight && (
                          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                            Weight: {record.vitals.weight} kg
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {record.clinicalNotes && (
                  <div>
                    <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-slate-400">
                      Clinical notes
                    </p>
                    <p className="soft-panel text-sm font-normal text-slate-700">
                      {record.clinicalNotes}
                    </p>
                  </div>
                )}

                {record.treatmentPlan && (
                  <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="absolute left-0 top-0 h-full w-1 bg-emerald-400" />
                    <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-emerald-800">
                      Treatment plan
                    </p>
                    <p className="pl-1 text-sm font-normal text-emerald-900">
                      {record.treatmentPlan}
                    </p>
                  </div>
                )}

                {record.attachments?.length > 0 && (
                  <div>
                    <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-slate-400">
                      Attachments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {record.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {att.filename}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {record.followUpDate && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-normal text-slate-700">
                      <span className="font-medium">Follow-up:</span>{' '}
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
