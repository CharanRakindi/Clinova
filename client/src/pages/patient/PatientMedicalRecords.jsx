import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Heart, Thermometer, Activity, Calendar, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { formatDoctorName } from '../../utils/format';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';

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
              <div className="absolute left-0 top-0 h-full w-1 bg-ink" aria-hidden />

              <div className="flex flex-col items-start justify-between gap-4 border-b border-line-soft px-6 py-5 sm:flex-row sm:items-center">
                <div className="pl-2">
                  <h3 className="text-lg font-medium text-ink">
                    {record.chiefComplaint}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-sm text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                      {format(new Date(record.visitDate), 'MMMM dd, yyyy')}
                    </span>
                    <span className="text-ink-faint" aria-hidden>
                      ·
                    </span>
                    <span className="font-medium text-ink-secondary">
                      {formatDoctorName(record.doctor?.name)}
                    </span>
                    {record.version > 1 && (
                      <span className="badge badge-warning">Amended v{record.version}</span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  status={record.status}
                  className="shrink-0 uppercase tracking-wider"
                />
              </div>

              <div className="space-y-5 px-6 py-5 pl-8">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {record.diagnosis?.length > 0 && (
                    <div>
                      <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-ink-faint">
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
                      <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-ink-faint">
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
                      <p className="mb-2.5 text-2xs font-medium uppercase tracking-wider text-ink-faint">
                        Vitals
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.vitals.pulse && (
                          <div className="chip">
                            <Heart className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                            {record.vitals.pulse} bpm
                          </div>
                        )}
                        {record.vitals.temperature && (
                          <div className="chip">
                            <Thermometer className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                            {record.vitals.temperature}°C
                          </div>
                        )}
                        {record.vitals.bloodPressureSystolic && (
                          <div className="chip">
                            <Activity className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                            {record.vitals.bloodPressureSystolic}/
                            {record.vitals.bloodPressureDiastolic} mmHg
                          </div>
                        )}
                        {record.vitals.oxygenSaturation && (
                          <div className="chip">
                            SpO₂ {record.vitals.oxygenSaturation}%
                          </div>
                        )}
                        {record.vitals.height && (
                          <div className="chip">Height: {record.vitals.height} cm</div>
                        )}
                        {record.vitals.weight && (
                          <div className="chip">Weight: {record.vitals.weight} kg</div>
                        )}
                      </div>
                    </div>
                  )}

                {record.clinicalNotes && (
                  <div>
                    <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-ink-faint">
                      Clinical notes
                    </p>
                    <p className="soft-panel text-sm font-normal text-ink-secondary">
                      {record.clinicalNotes}
                    </p>
                  </div>
                )}

                {record.treatmentPlan && (
                  <div className="soft-panel border-success-border bg-success-soft">
                    <p className="ui-label mb-1.5 text-success">Treatment plan</p>
                    <p className="text-sm font-normal text-ink-secondary">
                      {record.treatmentPlan}
                    </p>
                  </div>
                )}

                {record.attachments?.length > 0 && (
                  <div>
                    <p className="ui-label mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {record.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chip transition-colors duration-product hover:bg-surface"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                          {att.filename}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {record.followUpDate && (
                  <div className="chip">
                    <Calendar className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                    <span>
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
