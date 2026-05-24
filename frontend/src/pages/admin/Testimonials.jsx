import { useEffect, useState } from 'react';
import { Star, Trash2, Filter, UserX } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-zinc-600'} />
      ))}
    </div>
  );
}

function StarSummary({ labRatings }) {
  const withReviews = labRatings.filter(l => parseInt(l.total_reviews) > 0);
  const totalReviews = labRatings.reduce((s, l) => s + parseInt(l.total_reviews), 0);
  const overallAvg = withReviews.length
    ? (withReviews.reduce((s, l) => s + parseFloat(l.avg_rating), 0) / withReviews.length).toFixed(1)
    : null;

  return (
    <div className="card space-y-4">
      {/* Overall */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-700">
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Overall Rating</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{overallAvg ?? '—'}</span>
            <div>
              <StarDisplay rating={Math.round(parseFloat(overallAvg) || 0)} size={16} />
              <p className="text-xs text-zinc-400 mt-0.5">{totalReviews} review{totalReviews !== 1 ? 's' : ''} total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-lab grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
        {labRatings.map(lab => {
          const avg = parseFloat(lab.avg_rating) || 0;
          const count = parseInt(lab.total_reviews);
          return (
            <div key={lab.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {lab.name}
                    <span className="text-zinc-400 font-normal ml-1">· Rm {lab.room_number}</span>
                  </span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 ml-2 shrink-0">
                    {avg > 0 ? avg.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-1.5">
                    <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0">{count} review{count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [labRatings, setLabRatings]     = useState([]);
  const [labs, setLabs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterLab, setFilterLab]       = useState('');

  const loadReviews = (labId = '') => {
    setLoading(true);
    const params = labId ? `?lab_id=${labId}` : '';
    api.get(`/testimonials${params}`)
      .then(r => setTestimonials(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/testimonials'),
      api.get('/testimonials/lab-ratings'),
      api.get('/labs'),
    ]).then(([t, r, l]) => {
      setTestimonials(t.data);
      setLabRatings(r.data);
      setLabs(l.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (labId) => {
    setFilterLab(labId);
    loadReviews(labId);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/testimonials/${id}`);
      toast.success('Deleted');
      loadReviews(filterLab);
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Student Testimonials</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">All student reviews and lab ratings</p>
        </div>

        {/* Star ratings summary */}
        {labRatings.length > 0 && <StarSummary labRatings={labRatings} />}

        {/* Reviews list */}
        <div className="card p-0 overflow-hidden">
          {/* Header with filter */}
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700/50 flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {testimonials.length} review{testimonials.length !== 1 ? 's' : ''}
              {filterLab && ' in selected lab'}
            </p>
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-zinc-400" />
              <select
                value={filterLab}
                onChange={e => handleFilterChange(e.target.value)}
                className="text-xs bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg px-2 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">All Labs</option>
                {labs.map(l => (
                  <option key={l.id} value={l.id}>{l.name} (Rm {l.room_number})</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-zinc-400">Loading...</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <Star className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-sm">{filterLab ? 'No reviews for this lab yet.' : 'No reviews yet.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
              {testimonials.map(t => (
                <div key={t.id} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{t.full_name}</span>
                        {t.course && <span className="badge badge-purple text-xs">{t.course}</span>}
                        <span className="badge badge-blue text-xs">
                          {t.lab_name
                            ? `${t.lab_name}${t.lab_room_number ? ` · Rm ${t.lab_room_number}` : ''}`
                            : 'General'}
                        </span>
                        {t.is_anonymous == 1 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
                            <UserX size={10} /> Anonymous
                          </span>
                        )}
                      </div>
                      <StarDisplay rating={t.rating} />
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">{t.content}</p>
                      <p className="text-xs text-zinc-400 mt-2">
                        {new Date(t.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })}
                        {t.id_number && <span className="ml-2">· {t.id_number}</span>}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
