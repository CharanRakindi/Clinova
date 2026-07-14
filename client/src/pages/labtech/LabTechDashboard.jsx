import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import FileUpload from '../../components/FileUpload';
import { CheckCircle, ArrowRight, X, Paperclip, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { cn } from '../../utils/cn';

export default function LabTechDashboard() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [resultSummary, setResultSummary] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [attachments, setAttachments] = useState([]);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['labReports'],
    queryFn: async () => {
      const res = await api.get('/lab-reports');
      return res.data.data;
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
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['labReports'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const handleUploadSuccess = (url, fileInfo) => {
    setAttachments((prev) => [
      ...prev,
      { filename: fileInfo.filename, url, mimetype: fileInfo.mimetype },
    ]);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!resultSummary) {
      toast.error('Result summary is required');
      return;
    }
    completeTest.mutate({
      id: selectedReport._id,
      data: { resultSummary, referenceRange, attachments },
    });
  };

  const advanceStatus = (report) => {
    const sequence = ['ordered', 'sample_collected', 'processing'];
    const idx = sequence.indexOf(report.status);
    if (idx >= 0 && idx < sequence.length - 1) {
      updateStatus.mutate({ id: report._id, status: sequence[idx + 1] });
    } else if (report.status === 'processing') {
      setSelectedReport(report);
      setResultSummary(report.resultSummary || '');
      setReferenceRange(report.referenceRange || '');
      setAttachments(report.attachments || []);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'ordered':
        return 'badge-warning';
      case 'sample_collected':
        return 'badge-info';
      case 'processing':
        return 'badge-info';
      case 'completed':
      case 'reviewed':
        return 'badge-success';
      default:
        return 'badge-neutral';
    }
  };

  const columns = [
    { id: 'ordered', title: 'Ordered' },
    { id: 'sample_collected', title: 'Sample collected' },
    { id: 'processing', title: 'Processing' },
  ];

  if (isLoading) {
    return (
      <div className="card p-8">
        <SkeletonTable rows={5} />
      </div>
    );
  }

  const completed = (reports || []).filter(
    (r) => r.status === 'completed' || r.status === 'reviewed'
  );

  return (
    <div className="workspace flex h-[calc(100vh-6rem)] flex-col">
      <div className="page-header shrink-0">
        <div>
          <h1 className="page-title">Laboratory workspace</h1>
          <p className="page-subtitle">
            Move tests from order through results · {reports?.length || 0} total
          </p>
        </div>
      </div>

      <div id="lab-kanban-board" className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max gap-4 pb-4">
          {columns.map((col) => {
            const colReports = (reports || []).filter((r) => r.status === col.id);
            return (
              <div
                key={col.id}
                className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-premium"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-surface-muted/80 px-4 py-3.5">
                  <h3 className="text-2xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    {col.title}
                  </h3>
                  <span className="badge badge-neutral">{colReports.length}</span>
                </div>

                <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto p-3">
                  {colReports.length === 0 ? (
                    <p className="empty-state py-8">No items</p>
                  ) : (
                    colReports.map((report) => (
                      <div
                        key={report._id}
                        className="rounded-xl border border-slate-200/70 bg-white p-4 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-premium"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium tracking-[-0.01em] text-slate-900">
                            {report.testName}
                          </h4>
                          <span className={cn('badge shrink-0 capitalize', statusBadge(report.status))}>
                            {report.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="mb-3 flex items-center gap-1.5 text-2xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {format(new Date(report.orderedDate), 'MMM dd, HH:mm')}
                        </p>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <p className="truncate text-xs text-slate-600">
                            <span className="text-slate-400">Patient · </span>
                            <span className="font-medium text-slate-800">
                              {report.patient?.name}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => advanceStatus(report)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-surface-muted text-slate-700 transition-colors hover:bg-slate-900 hover:text-white"
                            title={col.id === 'processing' ? 'Complete result' : 'Advance stage'}
                          >
                            {col.id === 'processing' ? (
                              <CheckCircle className="h-3.5 w-3.5" />
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

          <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-premium">
            <div className="flex items-center justify-between border-b border-slate-100 bg-surface-muted/80 px-4 py-3.5">
              <h3 className="text-2xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Completed
              </h3>
              <span className="badge badge-success">{completed.length}</span>
            </div>
            <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto p-3">
              {completed.length === 0 ? (
                <p className="empty-state py-8">No completed tests</p>
              ) : (
                completed.map((report) => (
                  <div
                    key={report._id}
                    className="rounded-xl border border-slate-200/70 bg-surface-muted/40 p-4"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-slate-900">
                        {report.testName}
                      </h4>
                      <span className={cn('badge capitalize', statusBadge(report.status))}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {report.patient?.name}
                    </p>
                    {report.resultSummary && (
                      <p className="mt-2 line-clamp-2 text-2xs text-slate-400">
                        {report.resultSummary}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedReport && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-md font-medium tracking-[-0.015em] text-slate-900">
                <CheckCircle className="h-4 w-4 text-slate-400" />
                Finalize lab results
              </h2>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 p-6">
              <div>
                <p className="text-2xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  Test details
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedReport.testName} · {selectedReport.patient?.name}
                </p>
              </div>

              <div>
                <label className="label">
                  Result summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  className="input min-h-[100px] resize-none py-2.5"
                  placeholder="Enter findings…"
                />
              </div>

              <div>
                <label className="label">Reference range</label>
                <input
                  type="text"
                  value={referenceRange}
                  onChange={(e) => setReferenceRange(e.target.value)}
                  className="input"
                  placeholder="e.g. LDL < 100 mg/dL"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-surface-muted/50 p-4">
                <FileUpload
                  onUploadSuccess={handleUploadSuccess}
                  label="Attach result PDF or image"
                />
                {attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="badge badge-neutral gap-1.5">
                        <Paperclip className="h-3.5 w-3.5" />
                        {att.filename}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completeTest.isPending}
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
          </div>
        </div>
      )}
    </div>
  );
}
