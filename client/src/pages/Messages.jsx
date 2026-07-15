import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import { formatDoctorName } from '../utils/format';
import { cn } from '../utils/cn';

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [peerId, setPeerId] = useState('');
  const [body, setBody] = useState('');

  const { data: conversations = [], isLoading: loadingConvos } = useQuery({
    queryKey: ['messageConversations'],
    queryFn: async () => {
      const res = await api.get('/messages/conversations');
      return res.data.data || [];
    },
  });

  // Doctors can pick assigned patients; patients pick doctors from care history via appointments
  const { data: peers = [] } = useQuery({
    queryKey: ['messagePeers', user?.role],
    queryFn: async () => {
      if (user?.role === 'doctor' || user?.role === 'admin') {
        const res = await api.get('/patients', { params: { limit: 50 } });
        return (res.data.data || [])
          .map((p) => ({
            id: p.user?._id,
            name: p.user?.name,
            role: 'patient',
          }))
          .filter((p) => p.id);
      }
      if (user?.role === 'patient') {
        const res = await api.get('/appointments', { params: { limit: 50 } });
        const map = new Map();
        for (const a of res.data.data || []) {
          if (!a.doctor?._id) continue;
          if (!['confirmed', 'completed'].includes(a.status)) continue;
          map.set(a.doctor._id, {
            id: a.doctor._id,
            name: a.doctor.name,
            role: 'doctor',
          });
        }
        return [...map.values()];
      }
      return [];
    },
    enabled: !!user,
  });

  const { data: thread, isLoading: loadingThread } = useQuery({
    queryKey: ['messageThread', peerId],
    enabled: !!peerId,
    queryFn: async () => {
      const res = await api.get(`/messages/with/${peerId}`);
      return res.data.data;
    },
    refetchInterval: peerId ? 15000 : false,
  });

  const send = useMutation({
    mutationFn: async () => {
      const res = await api.post('/messages', { to: peerId, body: body.trim() });
      return res.data.data;
    },
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['messageThread', peerId] });
      queryClient.invalidateQueries({ queryKey: ['messageConversations'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not send message');
    },
  });

  const peerOptions = useMemo(() => {
    const map = new Map();
    for (const p of peers) map.set(String(p.id), p);
    for (const c of conversations) {
      if (c.peer?._id) {
        map.set(String(c.peer._id), {
          id: c.peer._id,
          name: c.peer.name,
          role: c.peer.role,
        });
      }
    }
    return [...map.values()];
  }, [peers, conversations]);

  const displayName = (p) =>
    p?.role === 'doctor' ? formatDoctorName(p.name) : p?.name || 'Contact';

  return (
    <div className="workspace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            Secure care messaging after a confirmed relationship (not for emergencies)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card flex max-h-[min(70vh,560px)] flex-col overflow-hidden lg:col-span-1">
          <div className="border-b border-line-soft px-4 py-3">
            <p className="ui-label">Conversations</p>
            <select
              className="select mt-2"
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
            >
              <option value="">Start or open a thread…</option>
              {peerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {displayName(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loadingConvos ? (
              <p className="p-3 text-sm text-ink-faint">Loading…</p>
            ) : conversations.length === 0 ? (
              <EmptyState
                compact
                icon={MessageSquare}
                title="No threads yet"
                description="Choose a care partner above to send a secure note."
              />
            ) : (
              conversations.map((c) => (
                <button
                  key={c.peer._id}
                  type="button"
                  onClick={() => setPeerId(c.peer._id)}
                  className={cn(
                    'mb-1 flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors',
                    peerId === c.peer._id
                      ? 'bg-sky-50 ring-1 ring-sky-200/80'
                      : 'hover:bg-surface-subtle'
                  )}
                >
                  <span className="text-sm font-medium text-ink">
                    {displayName(c.peer)}
                  </span>
                  <span className="line-clamp-1 text-2xs text-ink-faint">
                    {c.lastMessage?.fromMe ? 'You: ' : ''}
                    {c.lastMessage?.body}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card flex max-h-[min(70vh,560px)] flex-col overflow-hidden lg:col-span-2">
          {!peerId ? (
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Messages are only available with doctors or patients linked by confirmed care."
            />
          ) : (
            <>
              <div className="border-b border-line-soft px-4 py-3">
                <p className="text-sm font-medium text-ink">
                  {displayName(thread?.peer || peerOptions.find((p) => String(p.id) === peerId))}
                </p>
                <p className="text-2xs text-ink-faint">Encrypted in transit · care context only</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {loadingThread ? (
                  <p className="text-sm text-ink-faint">Loading thread…</p>
                ) : (
                  (thread?.messages || []).map((m) => {
                    const mine = m.from?._id === user?._id || m.from === user?._id;
                    return (
                      <div
                        key={m._id}
                        className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm',
                            mine
                              ? 'bg-surface-inverse text-white'
                              : 'bg-surface-subtle text-ink'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p
                            className={cn(
                              'mt-1 text-2xs',
                              mine ? 'text-white/50' : 'text-ink-faint'
                            )}
                          >
                            {format(new Date(m.createdAt), 'MMM d · HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                className="flex gap-2 border-t border-line-soft p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!body.trim()) return;
                  send.mutate();
                }}
              >
                <input
                  className="input flex-1"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a secure note…"
                  maxLength={4000}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={send.isPending || !body.trim()}
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
