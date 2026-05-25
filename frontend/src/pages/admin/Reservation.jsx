import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Activity, StopCircle, RefreshCw, Users2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const PURPOSES = [
  'C# Programming', 'C Programming', 'Java Programming',
  'ASP.Net Programming', 'PHP Programming', 'Python Programming',
  'Database Management', 'Web Development', 'Other',
];

const LAB_ROOMS = ['524', '526', '528', '530'];

function StudentAvatar({ student }) {
  if (!student) return null;
  const url = student.profile_photo
    ? (student.profile_photo.startsWith('http') ? student.profile_photo : `${API_BASE}${student.profile_photo}`)
    : null;
  return (
    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/40">
      <div className="w-12 h-12 rounded-xl bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-lg overflow-hidden shrink-0">
        {url
          ? <img src={url} alt={student.full_name} className="w-full h-full object-cover" />
          : (student.full_name?.[0]?.toUpperCase() ?? '?')
        }
      </div>
      <div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{student.full_name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{student.id_number} · {student.course} Year {student.year_level}</p>
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">{student.remaining_sessions} sessions left</p>
      </div>
    </div>
  );
}

export default function AdminReservation() {
  const [idInput, setIdInput]   = useState('');
  const [student, setStudent]   = useState(null);
  const [purpose, setPurpose]   = useState(PURPOSES[0]);
  const [labRoom, setLabRoom]   = useState('524');
  const [pcNumber, setPcNumber] = useState('');
  const [looking, setLooking]   = useState(false);
  const [starting, setStarting] = useState(false);

  // Active sessions
  const [sessions, setSessions]   = useState([]);
  const [loadingSess, setLoadingSess] = useState(true);
  const [ending, setEnding]       = useState(null);

  const loadSessions = () => {
    setLoadingSess(true);
    api.get('/sessions/active').then(r => setSessions(r.data)).finally(() => setLoadingSess(false));
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const lookupStudent = async () => {
    if (!idInput.trim()) return;
    setLooking(true); setStudent(null);
    try {
      const res = await api.get(`/students/search?q=${encodeURIComponent(idInput.trim())}`);
      const exact = res.data.find(s => s.id_number === idInput.trim()) || res.data[0];
      if (exact) setStudent(exact);
      else toast.error('No student found with that ID');
    } catch { toast.error('Lookup failed'); }
    finally { setLooking(false); }
  };

  const handleSitIn = async () => {
    if (!student) return;
    setStarting(true);
    try {
      await api.post('/sessions/start', {
        student_id: student.id, purpose, lab_room: labRoom,
        pc_number: pcNumber || null,
      });
      toast.success(`Sit-in started for ${student.full_name}`);
      handleClose();
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start sit-in');
    } finally { setStarting(false); }
  };

  const handleEnd = async (id, name) => {
    if (!confirm(`End sit-in session for ${name}?`)) return;
    setEnding(id);
    try {
      const res = await api.post(`/sessions/${id}/end`);
      toast.success(`Session ended. ${name} has ${res.data.remaining_sessions} sessions left.`);
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end session');
    } finally { setEnding(null); }
  };

  const handleClose = () => {
    setIdInput(''); setStudent(null);
    setPurpose(PURPOSES[0]); setLabRoom('524'); setPcNumber('');
  };

  const elapsed = (startedAt) => {
    const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    return diff < 60 ? `${diff}m` : `${Math.floor(diff/60)}h ${diff%60}m`;
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-8">
        {/* Sit In Form */}
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sit-in Students</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Enter a student ID to start their sit-in session</p>

          <div className="card max-w-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-700">
              <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sit In Form</h2>
              <button onClick={handleClose}
                className="w-7 h-7 border border-zinc-300 dark:border-zinc-600 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-mono text-sm">
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <label className="w-44 text-sm text-zinc-600 dark:text-zinc-400 text-right shrink-0">ID Number:</label>
                <input className="input flex-1" placeholder="Enter student ID number..."
                  value={idInput}
                  onChange={e => { setIdInput(e.target.value); setStudent(null); }}
                  onBlur={lookupStudent}
                  onKeyDown={e => e.key === 'Enter' && lookupStudent()} />
              </div>

              {(looking || student) && (
                <div className="flex items-start gap-4">
                  <div className="w-44 text-sm text-zinc-600 dark:text-zinc-400 text-right shrink-0 pt-1">Student:</div>
                  <div className="flex-1">
                    {looking
                      ? <div className="text-sm text-zinc-400 py-2">Looking up...</div>
                      : <StudentAvatar student={student} />
                    }
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="w-44 text-sm text-zinc-600 dark:text-zinc-400 text-right shrink-0">Purpose:</label>
                <select className="input flex-1" value={purpose} onChange={e => setPurpose(e.target.value)}>
                  {PURPOSES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-44 text-sm text-zinc-600 dark:text-zinc-400 text-right shrink-0">Lab Room:</label>
                <select className="input flex-1" value={labRoom} onChange={e => setLabRoom(e.target.value)}>
                  {LAB_ROOMS.map(r => <option key={r} value={r}>Lab {r}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-44 text-sm text-zinc-600 dark:text-zinc-400 text-right shrink-0">PC Number:</label>
                <input className="input flex-1" placeholder="e.g. PC-12 (optional)" value={pcNumber}
                  onChange={e => setPcNumber(e.target.value)} />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-44 text-sm text-zinc-600 dark:text-zinc-400 text-right shrink-0">Remaining Sessions:</label>
                <input className="input flex-1 bg-zinc-50 dark:bg-zinc-700" value={student?.remaining_sessions ?? ''} placeholder="—" readOnly />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-zinc-100 dark:border-zinc-700">
              <button onClick={handleClose} className="btn-secondary px-7">Close</button>
              <button onClick={handleSitIn} disabled={starting || !student} className="btn-primary px-7">
                {starting ? 'Starting...' : 'Sit In'}
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity size={20} className="text-green-500" />
              Current Sit-ins
              {sessions.length > 0 && <span className="badge badge-green text-xs">{sessions.length} active</span>}
            </h2>
            <button onClick={loadSessions} className="btn-secondary text-sm py-2">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingSess ? (
            <div className="text-center py-10 text-zinc-400">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="card text-center py-12 text-zinc-400">
              <Users2 className="mx-auto mb-3 opacity-30" size={36} />
              <p className="font-medium">No active sit-in sessions</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700">
                  <tr>
                    {['ID Number', 'Student', 'Purpose', 'Lab', 'PC No.', 'Started', 'Elapsed', 'Sessions Left', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                  {sessions.map(s => (
                    <tr key={s.id} className="table-row-hover">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{s.id_number}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.full_name}</td>
                      <td className="px-4 py-3"><span className="badge badge-purple">{s.purpose}</span></td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">Lab {s.lab_room}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{s.pc_number || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs">{elapsed(s.started_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${s.remaining_sessions > 10 ? 'badge-green' : 'badge-red'}`}>
                          {s.remaining_sessions}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEnd(s.id, s.full_name)}
                          disabled={ending === s.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
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
      </div>
    </AdminLayout>
  );
}
