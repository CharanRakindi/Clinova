import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import FileUpload from '../../components/FileUpload';
import { FlaskConical, CheckCircle, ArrowRight, X, Paperclip, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SkeletonTable } from '../../components/SkeletonLoader';

export default function LabTechDashboard() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [resultSummary, setResultSummary] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [attachments, setAttachments] = useState([]);

  // Load all reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['labReports'],
    queryFn: async () => {
      const res = await api.get('/lab-reports');
      return res.data.data;
    }
  });

  // Mutate: complete lab test
  const completeTest = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.patch(`/lab-reports/${id}/results`, data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Lab report updated and finalized successfully');
      setSelectedReport(null);
      setResultSummary('');
      setReferenceRange('');
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['labReports'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update lab report');
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/lab-reports/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['labReports'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  const handleUploadSuccess = (url, fileInfo) => {
    setAttachments(prev => [...prev, {
      filename: fileInfo.filename,
      url: url,
      mimetype: fileInfo.mimetype
    }]);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!resultSummary) {
      toast.error('Result summary is required');
      return;
    }
    completeTest.mutate({
      id: selectedReport._id,
      data: { resultSummary, referenceRange, attachments }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ordered': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'sample_collected': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'processing': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const columns = [
    { id: 'ordered', title: 'Ordered' },
    { id: 'sample_collected', title: 'Sample Collected' },
    { id: 'processing', title: 'Processing' }
  ];

  if (isLoading) return <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 m-4"><SkeletonTable rows={5} /></div>;

  return (
    <div className="space-y-6 pb-8 animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-primary-500" />
          Laboratory Workflow
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage lab reports pipeline from ordered to completion</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {columns.map(col => {
            const colReports = (reports || []).filter(r => r.status === col.id);
            return (
              <div key={col.id} className="w-80 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-200 bg-slate-100/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-700 uppercase tracking-wider text-xs">{col.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{colReports.length}</span>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {colReports.map(report => (
                    <div key={report._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-extrabold text-slate-900">{report.testName}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mb-4 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Ordered: {format(new Date(report.orderedDate), 'MMM dd, HH:mm')}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="text-xs font-medium text-slate-600">
                          <span className="text-slate-400">Patient:</span> <span className="font-bold">{report.patient?.name}</span>
                        </div>
                        <button
                          onClick={() => advanceStatus(report)}
                          className="flex items-center justify-center p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors tooltip-trigger"
                          title={col.id === 'processing' ? 'Complete Result' : 'Advance Stage'}
                        >
                          {col.id === 'processing' ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Completed Column */}
          <div className="w-80 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-200 bg-slate-100/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-700 uppercase tracking-wider text-xs">Completed / Reviewed</h3>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {(reports || []).filter(r => r.status === 'completed' || r.status === 'reviewed').map(report => (
                <div key={report._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-extrabold text-slate-900">{report.testName}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Patient: <span className="font-bold">{report.patient?.name}</span>
                  </p>
                  <p className="text-xs text-slate-400 truncate">{report.resultSummary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform animate-scale-in">
            <div className="bg-primary-600 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Finalize Lab Results
              </h2>
              <button onClick={() => setSelectedReport(null)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-5 bg-slate-50/30">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Details</p>
                <p className="text-sm font-bold text-slate-800">{selectedReport.testName} for {selectedReport.patient?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Result Summary <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                  placeholder="Enter comprehensive findings..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Reference Range</label>
                <input
                  type="text"
                  value={referenceRange}
                  onChange={(e) => setReferenceRange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  placeholder="e.g. LDL < 100 mg/dL"
                />
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <FileUpload onUploadSuccess={handleUploadSuccess} label="Attach outcome PDF or Image report" />
                
                {attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Uploaded Files</p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg border border-primary-100 text-sm font-medium">
                          <Paperclip className="w-4 h-4" />
                          {att.filename}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completeTest.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {completeTest.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {completeTest.isPending ? 'Saving...' : 'Finalize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
