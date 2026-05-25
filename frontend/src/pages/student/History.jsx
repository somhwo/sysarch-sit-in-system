import { useEffect, useState } from 'react';
import { Clock, Star, CheckCircle, X, BarChart2, Activity, TrendingUp, Award } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' });
}
function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}
function calcMins(ti, to) {
  try {
    const [ih,im] = ti.split(':').map(Number);
    const [oh,om] = to.split(':').map(Number);
    const mins = (oh*60+om)-(ih*60+im);
    return mins > 0 ? mins : 0;
  } catch { return 0; }
}
function fmtMins(mins) {
  if (!mins || mins <= 0) return '0m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}
function calcDuration(ti, to) {
  const m = calcMins(ti, to);
  return m > 0 ? fmtMins(m) : '—';
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

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none transition-transform hover:scale-110">
          <Star size={28}
            className={(hover || value) >= i
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-zinc-300 dark:text-zinc-600'} />
        </button>
      ))}
      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
        {['','Poor','Fair','Good','Great','Excellent'][hover || value] || 'Select rating'}
      </span>
    </div>
  );
}

function ReviewModal({ record, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a star rating'); return; }
    if (!content.trim()) { toast.error('Please write your review'); return; }
    setSubmitting(true);
    try {
      await api.post('/testimonials', { content, rating, lab_id: null, session_record_id: record.id, is_anonymous: isAnonymous });
      toast.success('Review submitted!');
      onSubmitted(record.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-purple-500 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Write a Review</p>
            <p className="text-purple-200 text-xs mt-0.5">{record.purpose} · Lab {record.lab_room} · {fmtDate(record.date)}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Your Rating *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Your Review *</label>
            <textarea className="input resize-none text-sm w-full" rows={4}
              placeholder="Share your experience with this session..."
              value={content} onChange={e => setContent(e.target.value)} autoFocus />
            <p className="text-xs text-zinc-400 mt-1">{content.length}/500 characters</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              <div className={`w-10 h-5 rounded-full transition-colors ${isAnonymous ? 'bg-purple-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Post anonymously</p>
              <p className="text-xs text-zinc-400">Your name won't be shown publicly</p>
            </div>
          </label>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !rating || !content.trim()} className="btn-primary px-5">
            <Star size={14} /> {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentHistory() {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [reviewRecord, setReviewRecord] = useState(null);
  const [page, setPage]             = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    api.get('/sessions/my').then(r => setHistory(r.data)).finally(() => setLoading(false));
  }, []);

  const handleReviewSubmitted = (recordId) => {
    setHistory(prev => prev.map(r => r.id === recordId ? { ...r, review_submitted: 1 } : r));
  };

  // Analytics derived values
  const durations  = history.map(r => calcMins(r.time_in, r.time_out));
  const totalMins  = durations.reduce((a, b) => a + b, 0);
  const avgMins    = history.length > 0 ? Math.round(totalMins / history.length) : 0;
  const maxMins    = durations.length > 0 ? Math.max(...durations) : 0;
  const maxRecord  = history[durations.indexOf(maxMins)];
  const purposeCounts = history.reduce((acc, r) => {
    acc[r.purpose] = (acc[r.purpose] || 0) + 1; return acc;
  }, {});

  const filtered   = history.filter(r =>
    r.purpose?.toLowerCase().includes(search.toLowerCase()) ||
    r.lab_room?.toLowerCase().includes(search.toLowerCase()) ||
    r.date?.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  return (
    <StudentLayout>
      <div className="max-w-5xl space-y-6">

        {/* Page header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Session History</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Your sit-in performance and completed sessions</p>
        </div>

        {/* ── My Analytics section ── */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart2 size={18} className="text-purple-500" /> My Analytics
          </h2>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={Clock}      label="Total Hours"     value={fmtMins(totalMins)} sub="cumulative"    color="purple" />
            <KpiCard icon={Activity}   label="Total Sessions"  value={history.length}     sub="completed"     color="blue"   />
            <KpiCard icon={TrendingUp} label="Avg Duration"    value={fmtMins(avgMins)}   sub="per session"   color="green"  />
            <KpiCard icon={Award}      label="Longest Session" value={fmtMins(maxMins)}   sub={maxRecord ? fmtDate(maxRecord.date) : '—'} color="yellow" />
          </div>

          {/* Purpose breakdown */}
          {Object.keys(purposeCounts).length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Sessions by Purpose</h3>
              <div className="space-y-3">
                {Object.entries(purposeCounts).sort((a,b) => b[1]-a[1]).map(([purpose, count]) => {
                  const pct = Math.round((count / history.length) * 100);
                  return (
                    <div key={purpose}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{purpose}</span>
                        <span className="text-zinc-400">{count} session{count!==1?'s':''} ({pct}%)</span>
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
        </div>

        {/* ── Session History table ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100">All Sessions</h2>
            <input className="input w-56" placeholder="Search by date, purpose..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16 text-zinc-400">
              <Clock className="mx-auto mb-3 opacity-30" size={40} />
              <p className="font-medium">No sessions found</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
                {filtered.length} record{filtered.length!==1?'s':''} found
              </div>
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700">
                  <tr>
                    {['Date','Time-in','Time-out','Duration','PC No.','Lab','Purpose','Status','Review'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                  {paginated.map(r => (
                    <tr key={r.id} className="table-row-hover">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{fmtTime(r.time_in)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{fmtTime(r.time_out)}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{calcDuration(r.time_in,r.time_out)}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.pc_number||'—'}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.lab_room}</td>
                      <td className="px-4 py-3"><span className="badge badge-purple">{r.purpose}</span></td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          r.status==='Completed'?'badge-green':
                          r.status==='Terminated'?'badge-red':'badge-yellow'
                        }`}>{r.status||'Completed'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.review_submitted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle size={13} /> Reviewed
                          </span>
                        ) : r.status === 'Completed' || !r.status ? (
                          <button onClick={() => setReviewRecord(r)}
                            className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline">
                            <Star size={13} /> Write a Review
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                      className="px-3 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40">← Prev</button>
                    {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded-lg text-xs border transition-colors ${p===page?'bg-purple-500 text-white border-purple-500':'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                      className="px-3 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {reviewRecord && (
        <ReviewModal record={reviewRecord} onClose={() => setReviewRecord(null)} onSubmitted={handleReviewSubmitted} />
      )}
    </StudentLayout>
  );
}
