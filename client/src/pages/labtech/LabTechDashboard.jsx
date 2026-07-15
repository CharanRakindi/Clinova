import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import FileUpload from '../../components/FileUpload';
import {
  CheckCircle,
  ArrowRight,
  Paperclip,
  Clock,
  FlaskConical,
  AlertTriangle,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { toast } from 'sonner';
import { SkeletonCard } from '../../components/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { cn } from '../../utils/cn';

function formatOrderedDate(value) {
  if (!value) return 'Date not set';
  const d = value instanceof Date ? value : new Date(value);
  if (!isValid(d)) return 'Date not set';
  return format(d, 'MMM dd, HH:mm');
}

export default function LabTechDashboard() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [resultSummary, setResultSummary] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [attachments, setAttachments] = useState([]);

  const {
    data: reports,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['labReports', 'board'],
    queryFn: async () => {
      // Higher limit so open queue + recent completed fit on the board
      const res = await api.get('/lab-reports', { params: { limit: 100 } });
      return res.data.data || [];
    },
  });

  const completeTest = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.patch(`/lab-reports/${id}/results`, data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Lab report finalized');
      setSelectedReport(null);
      setResultSummary('');
      setReferenceRange('');
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['labReports'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update lab report');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/lab-reports/${id}/status`, { status });
      return res.data.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['labReports', 'board'] });
      const prev = queryClient.getQueryData(['labReports', 'board']);
      queryClient.setQueryData(['labReports', 'board'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((r) => (r._id === id ? { ...r, status } : r));
      });
      return { prev };
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['labReports'] });
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['labReports', 'board'], ctx.prev);
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const handleUploadSuccess = (url, fileInfo) => {
    setAttachments((prev) => [
      ...prev,
      {
        filename: fileInfo.filename || fileInfo.originalName || 'attachment',
        url,
        mimetype: fileInfo.mimetype,
      },
    ]);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!selectedReport?._id) return;
    if (!resultSummary.trim()) {
      toast.error('Result summary is required');
      return;
    }
    completeTest.mutate({
      id: selectedReport._id,
      data: {
        resultSummary: resultSummary.trim(),
        referenceRange: referenceRange.trim() || undefined,
        attachments: attachments.length ? attachments : undefined,
      },
    });
  };

  const openFinalize = (report) => {
    setSelectedReport(report);
    setResultSummary(report.resultSummary || '');
    setReferenceRange(report.referenceRange || '');
    setAttachments(report.attachments || []);
  };

  const advanceStatus = (report) => {
    const sequence = ['ordered', 'sample_collected', 'processing'];
    const idx = sequence.indexOf(report.status);
    if (idx >= 0 && idx < sequence.length - 1) {
      updateStatus.mutate({ id: report._id, status: sequence[idx + 1] });
    } else if (report.status === 'processing') {
      openFinalize(report);
    }
  };

  const columns = [
    { id: 'ordered', title: 'Ordered', hint: 'New orders from clinicians' },
    { id: 'sample_collected', title: 'Sample collected', hint: 'Ready for processing' },
    { id: 'processing', title: 'Processing', hint: 'Enter results when ready' },
  ];

  if (isLoading) {
    return (
      <div className="workspace">
        <div className="page-header">
          <div className="space-y-2">
            <div className="h-7 w-52 animate-pulse rounded-md bg-surface-subtle" />
            <div className="h-4 w-72 animate-pulse rounded-md bg-surface-subtle" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="workspace">
        <div className="page-header">
          <div>
            <h1 className="page-title">Laboratory workspace</h1>
            <p className="page-subtitle">Could not load the lab queue</p>
          </div>
        </div>
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-warning" strokeWidth={1.5} />
          <p className="text-sm text-ink-muted">
            {error?.response?.data?.message || error?.message || 'Failed to load lab reports'}
          </p>
          <button type="button" onClick={() => refetch()} className="btn btn-primary">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const list = reports || [];
  const completed = list.filter(
    (r) => r.status === 'completed' || r.status === 'reviewed'
  );
  const openCount = list.filter((r) =>
    ['ordered', 'sample_collected', 'processing'].includes(r.status)
  ).length;
  const urgentOpen = list.filter(
    (r) =>
      r.priority === 'Urgent' &&
      ['ordered', 'sample_collected', 'processing'].includes(r.status)
  ).length;

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laboratory workspace</h1>
          <p className="page-subtitle">
            {openCount} open in queue
            {urgentOpen > 0 && (
              <>
                {' · '}
                <span className="font-medium text-warning">{urgentOpen} urgent</span>
              </>
            )}
            {completed.length > 0 && <> · {completed.length} recently completed</>}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-faint">
          <FlaskConical className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
        </div>
      </div>

      {/* Kanban — horizontal scroll on small screens */}
      <div
        id="lab-kanban-board"
        className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:overflow-visible sm:px-0"
      >
        <div className="flex min-w-max gap-3 pb-2 sm:min-w-0 sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {columns.map((col) => {
            const colReports = list.filter((r) => r.status === col.id);
            return (
              <div
                key={col.id}
                className="flex w-[min(18rem,85vw)] shrink-0 flex-col rounded-xl border border-line-soft bg-surface shadow-sm sm:w-auto"
              >
                <div className="border-b border-line-soft px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium text-ink">{col.title}</h2>
                    <span className="badge badge-neutral tabular-nums">{colReports.length}</span>
                  </div>
                  <p className="mt-0.5 text-2xs text-ink-faint">{col.hint}</p>
                </div>

                <div className="custom-scrollbar max-h-[min(28rem,55vh)] space-y-2.5 overflow-y-auto p-3 sm:max-h-[min(36rem,62vh)]">
                  {colReports.length === 0 ? (
                    <EmptyState
                      compact
                      title="Queue clear"
                      description={`No tests in “${col.title}”.`}
                    />
                  ) : (
                    colReports.map((report) => (
                      <div
                        key={report._id}
                        className={cn(
                          'rounded-lg border border-line-soft bg-surface-muted/40 p-3.5',
                          report.priority === 'Urgent' && 'border-warning-border/80 bg-warning-soft/40'
                        )}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="min-w-0 text-sm font-medium leading-snug text-ink">
                            {report.testName}
                          </h3>
                          {report.priority === 'Urgent' ? (
                            <span className="badge badge-warning shrink-0">Urgent</span>
                          ) : (
                            <StatusBadge status={report.status} className="shrink-0" />
                          )}
                        </div>
                        <p className="mb-1 flex items-center gap-1.5 text-2xs text-ink-faint">
                          <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                          {formatOrderedDate(report.orderedDate || report.createdAt)}
                        </p>
                        {report.doctor?.name && (
                          <p className="mb-2 truncate text-2xs text-ink-faint">
                            Ordered by {report.doctor.name}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                          <p className="min-w-0 truncate text-xs text-ink-muted">
                            <span className="text-ink-faint">Patient · </span>
                            <span className="font-medium text-ink-secondary">
                              {report.patient?.name || 'Unknown'}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => advanceStatus(report)}
                            disabled={updateStatus.isPending}
                            className="btn-icon shrink-0 border border-line bg-surface"
                            title={
                              col.id === 'processing'
                                ? 'Finalize results'
                                : 'Advance to next stage'
                            }
                            aria-label={
                              col.id === 'processing'
                                ? `Finalize ${report.testName}`
                                : `Advance ${report.testName}`
                            }
                          >
                            {col.id === 'processing' ? (
                              <CheckCircle className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Completed */}
          <div className="flex w-[min(18rem,85vw)] shrink-0 flex-col rounded-xl border border-line-soft bg-surface shadow-sm sm:w-auto">
            <div className="border-b border-line-soft px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-ink">Completed</h2>
                <span className="badge badge-success tabular-nums">{completed.length}</span>
              </div>
              <p className="mt-0.5 text-2xs text-ink-faint">Last 30 days</p>
            </div>
            <div className="custom-scrollbar max-h-[min(28rem,55vh)] space-y-2.5 overflow-y-auto p-3 sm:max-h-[min(36rem,62vh)]">
              {completed.length === 0 ? (
                <EmptyState
                  compact
                  title="No completed tests"
                  description="Finished reports from the last 30 days appear here."
                />
              ) : (
                completed.map((report) => (
                  <div
                    key={report._id}
                    className="rounded-lg border border-line-soft bg-surface-muted/30 p-3.5"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <h3 className="min-w-0 text-sm font-medium text-ink">{report.testName}</h3>
                      <StatusBadge status={report.status} className="shrink-0" />
                    </div>
                    <p className="text-xs text-ink-muted">
                      {report.patient?.name || (
                        <span className="data-empty">Patient not linked</span>
                      )}
                    </p>
                    {report.resultDate && isValid(new Date(report.resultDate)) && (
                      <p className="mt-1 text-2xs text-ink-faint">
                        Done {format(new Date(report.resultDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                    {report.resultSummary ? (
                      <p className="mt-2 line-clamp-2 text-2xs leading-snug text-ink-faint">
                        {report.resultSummary}
                      </p>
                    ) : (
                      <p className="data-empty mt-2 text-2xs">No result documented</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={!!selectedReport}
        onClose={() => {
          if (completeTest.isPending) return;
          setSelectedReport(null);
        }}
        title="Finalize lab results"
        panelClassName="max-w-lg"
        scrollable
      >
        {selectedReport && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4 p-6">
            <div className="rounded-lg border border-line-soft bg-surface-muted/50 px-3.5 py-3">
              <p className="ui-label">Test details</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {selectedReport.testName}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Patient · {selectedReport.patient?.name || 'Unknown'}
                {selectedReport.doctor?.name
                  ? ` · Ordered by ${selectedReport.doctor.name}`
                  : ''}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="lab-result-summary">
                Result summary <span className="text-danger">*</span>
              </label>
              <textarea
                id="lab-result-summary"
                rows={4}
                value={resultSummary}
                onChange={(e) => setResultSummary(e.target.value)}
                className="input min-h-[100px] resize-none py-2.5"
                placeholder="Enter findings…"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="lab-reference-range">
                Reference range
              </label>
              <input
                id="lab-reference-range"
                type="text"
                value={referenceRange}
                onChange={(e) => setReferenceRange(e.target.value)}
                className="input"
                placeholder="e.g. LDL < 100 mg/dL"
              />
            </div>

            <div className="rounded-xl border border-line bg-surface-muted/50 p-4">
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                label="Attach result PDF or image"
                patientId={selectedReport.patient?._id || selectedReport.patient}
                resourceType="lab_report"
              />
              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div key={`${att.filename}-${idx}`} className="badge badge-neutral gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" />
                      {att.filename}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                disabled={completeTest.isPending}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completeTest.isPending || !resultSummary.trim()}
                className="btn btn-primary"
              >
                {completeTest.isPending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                {completeTest.isPending ? 'Finalizing…' : 'Finalize result'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
