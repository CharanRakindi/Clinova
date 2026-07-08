import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import SkeletonLoader from '../../components/SkeletonLoader';
import { FileText, Search, ShieldAlert, ArrowLeft, ArrowRight, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, search, actionFilter],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: { page, limit: 15, search, action: actionFilter }
      });
      return res.data;
    }
  });

  const handleExportCSV = () => {
    if (!data?.data || data.data.length === 0) return;
    
    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Role', 'Action', 'Resource Type', 'IP Address', 'User Agent'];
    const rows = data.data.map(log => [
      new Date(log.timestamp).toISOString(),
      log.actor?.name || 'System',
      log.actor?.email || 'N/A',
      log.actorRole,
      log.action,
      log.resourceType,
      log.ipAddress,
      log.userAgent
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clinova_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary-500" />
            Security Audit Logs
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review system activities, login events, and medical record access audits</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={isLoading || !data?.data?.length}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, IP address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none w-full md:w-44"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="REGISTER">Register</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-semibold">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><SkeletonLoader className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-4 w-40" /></td>
                  </tr>
                ))
              ) : !data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    No audit records match your query
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{log.actor?.name || 'System'}</span>
                        <span className="text-xs font-medium text-slate-400">{log.actor?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs uppercase font-bold text-slate-400">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600' :
                        log.action === 'LOGIN' ? 'bg-indigo-50 text-indigo-600' :
                        log.action === 'UPDATE' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {log.resourceType}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-400" title={JSON.stringify(log.metadata)}>
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Showing page {page} of {data.pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                disabled={page >= data.pagination.pages}
                onClick={() => setPage(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
