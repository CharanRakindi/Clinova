import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Calendar, FileText, FlaskConical, Pill } from 'lucide-react';
import api from '../../api/axios';
import EmptyState from './EmptyState';

const ICONS = {
  appointment: Calendar,
  lab: FlaskConical,
  prescription: Pill,
  visit_summary: FileText,
};

export default function ActivityFeed({ className = '', limit = 8 }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['activityFeed'],
    queryFn: async () => {
      const res = await api.get('/dashboard/activity');
      return res.data.data || [];
    },
  });

  const list = (items || []).slice(0, limit);

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-sky-500" strokeWidth={1.75} />
        <h3 className="panel-title">Recent activity</h3>
      </div>
      {isLoading ? (
        <p className="text-sm text-ink-faint">Loading activity…</p>
      ) : list.length === 0 ? (
        <EmptyState
          compact
          title="No recent activity"
          description="Appointments, labs, and notes will show up here."
        />
      ) : (
        <ul className="space-y-2">
          {list.map((item) => {
            const Icon = ICONS[item.type] || Activity;
            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-line-soft bg-surface-muted/40 px-3 py-2.5"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                  {item.detail && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{item.detail}</p>
                  )}
                  <p className="mt-1 text-2xs text-ink-faint">
                    {item.at
                      ? formatDistanceToNow(new Date(item.at), { addSuffix: true })
                      : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
