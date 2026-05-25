import { useEffect, useState } from 'react';
import { MessageSquare, Star, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-zinc-600'}
        />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/testimonials?type=session')
      .then(r => setReviews(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.id_number?.includes(q) ||
      r.purpose?.toLowerCase().includes(q) ||
      r.lab_room?.toLowerCase().includes(q) ||
      r.pc_number?.toLowerCase().includes(q) ||
      r.content?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Feedback</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Session reviews submitted by students</p>
          </div>
          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              className="input pl-9 w-60"
              placeholder="Search name, lab, PC, purpose..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-zinc-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-20 text-zinc-400">
            <MessageSquare className="mx-auto mb-3 opacity-25" size={40} />
            <p className="font-medium text-zinc-500 dark:text-zinc-400">
              {search ? 'No results found' : 'No reviews yet'}
            </p>
            {!search && (
              <p className="text-sm mt-1">Students can leave a review from their session history</p>
            )}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700/50 text-xs text-zinc-500 dark:text-zinc-400">
              {filtered.length} review{filtered.length !== 1 ? 's' : ''}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700">
                <tr>
                  {['Student', 'PC No.', 'Lab', 'Purpose', 'Time', 'Rating', 'Review', 'Submitted'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                {filtered.map(r => (
                  <tr key={r.id} className="table-row-hover align-top">

                    {/* Student */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.is_anonymous ? <span className="italic text-zinc-400">Anonymous</span> : r.full_name}
                      </p>
                      {!r.is_anonymous && (
                        <>
                          <p className="text-xs text-zinc-400 mt-0.5">{r.id_number}</p>
                          <p className="text-xs text-zinc-400">{r.course} · Year {r.year_level}</p>
                        </>
                      )}
                    </td>

                    {/* PC No. */}
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {r.pc_number || '—'}
                    </td>

                    {/* Lab */}
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {r.lab_room || '—'}
                    </td>

                    {/* Purpose */}
                    <td className="px-4 py-3">
                      <span className="badge badge-purple">{r.purpose || '—'}</span>
                    </td>

                    {/* Time in – out */}
                    <td className="px-4 py-3 text-xs font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {fmtTime(r.time_in)}<br />{fmtTime(r.time_out)}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StarDisplay rating={r.rating} />
                      <p className="text-xs text-zinc-400 mt-0.5">{r.rating}/5</p>
                    </td>

                    {/* Review content */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">{r.content}</p>
                    </td>

                    {/* Submitted at */}
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {fmtDateTime(r.created_at)}
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
