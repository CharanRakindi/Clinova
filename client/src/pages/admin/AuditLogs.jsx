import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import SkeletonLoader from '../../components/SkeletonLoader';
import { FileText, Search, ArrowLeft, ArrowRight, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import DataValue from '../../components/ui/DataValue';

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
      log.actor?.email || '',
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
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit logs</h1>
          <p className="page-subtitle">
            System activity, login events, and record access audits
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isLoading || !data?.data?.length}
          className="btn btn-secondary"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-ink-faint" />
          <input
            type="text"
            placeholder="Search action, IP address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-ink-faint" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="input cursor-pointer w-full md:w-44"
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
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-subtle/60">
              <tr className="text-2xs font-medium text-ink-faint uppercase tracking-wider border-b border-line-soft">
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Resource</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft bg-surface text-sm font-medium">
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
                  <td colSpan={7} className="px-6 py-8">
                    <EmptyState
                      icon={FileText}
                      title="No audit records match"
                      description="Try a different search or clear the action filter."
                    />
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-2xs font-mono text-ink-faint">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-ink-secondary">
                          {log.actor?.name || 'System'}
                        </span>
                        <DataValue
                          as="span"
                          className="text-2xs font-medium"
                          emptyClassName="text-2xs data-empty"
                          value={log.actor?.email}
                          empty="No email on file"
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className="badge badge-neutral uppercase">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <StatusBadge status={log.action} preserveCase />
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-ink-muted">
                      {log.resourceType}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-2xs text-ink-faint">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-3.5 max-w-xs truncate text-2xs text-ink-faint" title={JSON.stringify(log.metadata)}>
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
          <div className="px-6 py-3.5 border-t border-line-soft flex items-center justify-between">
            <span className="text-xs font-medium text-ink-faint">
              Showing page {page} of {data.pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="btn btn-outline p-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.pagination.pages}
                onClick={() => setPage(prev => prev + 1)}
                className="btn btn-outline p-1.5"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

