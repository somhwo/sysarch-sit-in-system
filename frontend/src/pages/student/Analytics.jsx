import { useEffect, useState } from 'react';
import { BarChart2, Clock, Activity, TrendingUp, Award } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import api from '../../lib/api';

function calcMins(timeIn, timeOut) {
  try {
    const [ih, im] = timeIn.split(':').map(Number);
    const [oh, om] = timeOut.split(':').map(Number);
    const m = (oh * 60 + om) - (ih * 60 + im);
    return m > 0 ? m : 0;
  } catch { return 0; }
}

function fmtMins(mins) {
  if (!mins || mins <= 0) return '0m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' });
}

function KpiCard({ icon: Icon, label, value, sub, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
    green:  'bg-green-100  dark:bg-green-900/40  text-green-600  dark:text-green-400  border-green-200  dark:border-green-800/40',
    blue:   'bg-blue-100   dark:bg-blue-900/40   text-blue-600   dark:text-blue-400   border-blue-200   dark:border-blue-800/40',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StudentAnalytics() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    api.get('/sessions/my').then(r => setHistory(r.data)).finally(() => setLoading(false));
  }, []);

  const durations = history.map(r => calcMins(r.time_in, r.time_out));
  const totalMins = durations.reduce((a, b) => a + b, 0);
  const avgMins   = history.length > 0 ? Math.round(totalMins / history.length) : 0;
  const maxMins   = durations.length > 0 ? Math.max(...durations) : 0;
  const maxRecord = history[durations.indexOf(maxMins)];

  const totalPages = Math.ceil(history.length / PER_PAGE);
  const paginated  = history.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const purposeCounts = history.reduce((acc, r) => {
    acc[r.purpose] = (acc[r.purpose] || 0) + 1; return acc;
  }, {});

  return (
    <StudentLayout>
      <div className="max-w-5xl animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Your sit-in performance overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={Clock}     label="Total Hours"    value={fmtMins(totalMins)} sub="cumulative"       color="purple" />
          <KpiCard icon={Activity}  label="Total Sessions" value={history.length}     sub="completed"        color="blue"   />
          <KpiCard icon={TrendingUp}label="Avg Duration"   value={fmtMins(avgMins)}   sub="per session"      color="green"  />
          <KpiCard icon={Award}     label="Longest Session"value={fmtMins(maxMins)}   sub={maxRecord ? fmtDate(maxRecord.date) : '—'} color="yellow" />
        </div>

        {/* Purpose Breakdown */}
        {Object.keys(purposeCounts).length > 0 && (
          <div className="card">
            <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Sessions by Purpose</h2>
            <div className="space-y-3">
              {Object.entries(purposeCounts).sort((a,b)=>b[1]-a[1]).map(([purpose, count]) => {
                const pct = Math.round((count / history.length) * 100);
                return (
                  <div key={purpose}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{purpose}</span>
                      <span className="text-zinc-400 dark:text-zinc-500 dark:text-zinc-400">{count} session{count!==1?'s':''} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Session History Table */}
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Session History</h2>
          {loading ? (
            <div className="card text-center py-12 text-zinc-400">Loading...</div>
          ) : history.length === 0 ? (
            <div className="card text-center py-16 text-zinc-400">
              <Clock className="mx-auto mb-2 opacity-30" size={36} />
              <p>No sessions yet</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 dark:border-zinc-700">
                  <tr>
                    {['Date','Time-in','Time-out','Duration','PC No.','Purpose','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                  {paginated.map(r => {
                    const mins = calcMins(r.time_in, r.time_out);
                    return (
                      <tr key={r.id} className="table-row-hover">
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{fmtDate(r.date)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{fmtTime(r.time_in)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{fmtTime(r.time_out)}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs">{fmtMins(mins)}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.pc_number || '—'}</td>
                        <td className="px-4 py-3"><span className="badge badge-purple">{r.purpose}</span></td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            r.status === 'Completed' ? 'badge-green' :
                            r.status === 'Terminated' ? 'badge-red' : 'badge-yellow'
                          }`}>{r.status || 'Completed'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,history.length)} of {history.length}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                      className="px-3 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40">← Prev</button>
                    {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded-lg text-xs border transition-colors ${p===page?'bg-purple-500 text-white border-purple-500':'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                      className="px-3 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
