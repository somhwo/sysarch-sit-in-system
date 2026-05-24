import { useEffect, useState } from 'react';
import { Star, Filter } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import api from '../../lib/api';

function StarDisplay({ rating, size = 13 }) {
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
              <p className="text-xs text-zinc-400 mt-0.5">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-lab */}
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
                  <span className="text-[10px] text-zinc-400 shrink-0">{count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentTestimonials() {
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
      .catch(() => {})
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
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (labId) => {
    setFilterLab(labId);
    loadReviews(labId);
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Testimonials</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Student reviews and ratings for each laboratory</p>
        </div>

        {/* Star ratings summary */}
        {labRatings.length > 0 && <StarSummary labRatings={labRatings} />}

        {/* Filter + Reviews */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100">
              Reviews
              {testimonials.length > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-400">({testimonials.length})</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-zinc-400" />
              <select
                value={filterLab}
                onChange={e => handleFilterChange(e.target.value)}
                className="text-sm bg-zinc-100 dark:bg-zinc-700 border-0 rounded-xl px-3 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
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
            <div className="card text-center py-16">
              <Star className="mx-auto mb-3 opacity-30 text-zinc-400" size={40} />
              <p className="font-medium text-zinc-500 dark:text-zinc-400">No reviews yet</p>
              <p className="text-sm mt-1 text-zinc-400 dark:text-zinc-500">
                {filterLab ? 'No reviews for this lab yet.' : 'Reviews from completed sessions will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map(t => (
                <div key={t.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t.full_name}</span>
                        {t.course && <span className="badge badge-purple text-xs">{t.course}</span>}
                        <span className="badge badge-blue text-xs">
                          {t.lab_name
                            ? `${t.lab_name}${t.lab_room_number ? ` · Rm ${t.lab_room_number}` : ''}`
                            : 'General'}
                        </span>
                        {t.is_anonymous == 1 && (
                          <span className="text-[10px] text-zinc-400 italic">anonymous</span>
                        )}
                      </div>
                      <StarDisplay rating={t.rating} />
                    </div>
                    <p className="text-xs text-zinc-400 shrink-0">
                      {new Date(t.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mt-3">{t.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
