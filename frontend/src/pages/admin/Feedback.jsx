import { useEffect, useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

const fmtDate = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' });
};
const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-PH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
};
const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
};

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.get('/feedback')
      .then(r => setFeedback(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = feedback.filter(f =>
    f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.id_number?.includes(search) ||
    f.purpose?.toLowerCase().includes(search.toLowerCase()) ||
    f.lab_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Feedback</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Student feedback submitted for completed sessions</p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input className="input pl-9 w-60" placeholder="Search name, lab, purpose..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-zinc-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-20 text-zinc-400">
            <MessageSquare className="mx-auto mb-3 opacity-25" size={40} />
            <p className="font-medium text-zinc-500 dark:text-zinc-400">No feedback yet</p>
            <p className="text-sm mt-1">Feedback submitted by students will appear here</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700/50 text-xs text-zinc-500 dark:text-zinc-400">
              {filtered.length} feedback entr{filtered.length !== 1 ? 'ies' : 'y'}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700">
                <tr>
                  {['Student', 'Session Info', 'Date', 'Submitted', 'Feedback'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                {filtered.map(f => (
                  <tr key={f.id} className="table-row-hover align-top">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{f.full_name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{f.id_number}</p>
                      <p className="text-xs text-zinc-400">{f.course} · Year {f.year_level}</p>
                    </td>

                    {/* Session info */}
                    <td className="px-4 py-3">
                      <span className="badge badge-purple text-xs">{f.purpose}</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium mt-1">
                        {f.lab_name ? `${f.lab_name}` : `Lab ${f.lab_room}`}
                        <span className="text-zinc-400 font-normal ml-1">· Rm {f.lab_room_number || f.lab_room}</span>
                      </p>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        {fmtTime(f.time_in)} – {fmtTime(f.time_out)}
                      </p>
                    </td>

                    {/* Session date */}
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 whitespace-nowrap text-xs">
                      {fmtDate(f.session_date)}
                    </td>

                    {/* Submitted at */}
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {fmtDateTime(f.submitted_at)}
                    </td>

                    {/* Feedback content */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">{f.content}</p>
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
