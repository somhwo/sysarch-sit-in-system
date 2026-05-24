import { useEffect, useState } from 'react';
import { StopCircle, RefreshCw, Activity } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/sessions/active').then(r => setSessions(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30s
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEnd = async (id, name) => {
    if (!confirm(`End sit-in session for ${name}?`)) return;
    setEnding(id);
    try {
      const res = await api.post(`/sessions/${id}/end`);
      toast.success(`Session ended. ${name} has ${res.data.remaining_sessions} sessions left.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end session');
    } finally { setEnding(null); }
  };

  const elapsed = (startedAt) => {
    const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    return diff < 60 ? `${diff}m` : `${Math.floor(diff/60)}h ${diff%60}m`;
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Current Sit-ins</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={load} className="btn-secondary text-sm py-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-16 text-zinc-400">
            <Activity className="mx-auto mb-3 opacity-30" size={40} />
            <p className="font-medium">No active sit-in sessions</p>
            <p className="text-sm mt-1">Start a new session with 'Sit-in Students'</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 dark:border-zinc-700">
                <tr>
                  {['ID Number', 'Student', 'Purpose', 'Lab', 'Started', 'Elapsed', 'Sessions Left', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                {sessions.map(s => (
                  <tr key={s.id} className="table-row-hover">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{s.id_number}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.full_name}</td>
                    <td className="px-4 py-3"><span className="badge badge-purple">{s.purpose}</span></td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{s.lab_room}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{elapsed(s.started_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.remaining_sessions > 10 ? 'badge-green' : 'badge-red'}`}>
                        {s.remaining_sessions}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEnd(s.id, s.full_name)}
                        disabled={ending === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                        <StopCircle size={12} />
                        {ending === s.id ? 'Ending...' : 'End Session'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
