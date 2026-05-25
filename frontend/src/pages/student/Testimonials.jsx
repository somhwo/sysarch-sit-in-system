import { useEffect, useState } from 'react';
import { Star, Filter, X, Send } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

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

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none transition-transform hover:scale-110">
          <Star size={26} className={(hover || value) >= i
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-zinc-300 dark:text-zinc-600'} />
        </button>
      ))}
      <span className="ml-2 text-sm text-zinc-400 font-medium">
        {['','Poor','Fair','Good','Great','Excellent'][hover || value] || ''}
      </span>
    </div>
  );
}

function WriteModal({ labs, onClose, onSubmitted }) {
  const [labId, setLabId]           = useState('');
  const [rating, setRating]         = useState(0);
  const [content, setContent]       = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!labId)        return toast.error('Please select a lab');
    if (!rating)       return toast.error('Please select a star rating');
    if (!content.trim()) return toast.error('Please write your testimonial');
    setSubmitting(true);
    try {
      await api.post('/testimonials', {
        content, rating,
        lab_id: labId,
        session_record_id: null,
        is_anonymous: isAnonymous,
      });
      toast.success('Testimonial submitted!');
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-purple-500 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Write a Testimonial</p>
            <p className="text-purple-200 text-xs mt-0.5">Share your experience with a laboratory</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Laboratory *</label>
            <select value={labId} onChange={e => setLabId(e.target.value)}
              className="input w-full">
              <option value="">Select a lab...</option>
              {labs.map(l => (
                <option key={l.id} value={l.id}>{l.name} (Rm {l.room_number})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Rating *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Your Testimonial *</label>
            <textarea className="input resize-none text-sm w-full" rows={4}
              placeholder="Share your experience with this laboratory..."
              value={content} onChange={e => setContent(e.target.value)} autoFocus />
            <p className="text-xs text-zinc-400 mt-1">{content.length}/500 characters</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only"
                checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              <div className={`w-10 h-5 rounded-full transition-colors ${isAnonymous ? 'bg-purple-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Post anonymously</p>
              <p className="text-xs text-zinc-400">Your name won't be shown publicly</p>
            </div>
          </label>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !labId || !rating || !content.trim()}
            className="btn-primary px-5">
            <Send size={14} /> {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentTestimonials() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [labs, setLabs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterLab, setFilterLab]       = useState('');
  const [showModal, setShowModal]       = useState(false);

  const loadReviews = (labId = '') => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'lab' });
    if (labId) params.set('lab_id', labId);
    api.get(`/testimonials?${params}`)
      .then(r => setTestimonials(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/testimonials?type=lab'),
      api.get('/labs'),
    ]).then(([t, l]) => {
      setTestimonials(t.data);
      setLabs(l.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (labId) => {
    setFilterLab(labId);
    loadReviews(labId);
  };

  const handleSubmitted = () => loadReviews(filterLab);

  return (
    <StudentLayout>
      <div className="max-w-4xl animate-fade-in space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Testimonials</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Student reviews and ratings for each laboratory</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Star size={15} /> Write a Testimonial
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100">
              All Testimonials
              {testimonials.length > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-400">({testimonials.length})</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-zinc-400" />
              <select value={filterLab} onChange={e => handleFilterChange(e.target.value)}
                className="text-sm bg-zinc-100 dark:bg-zinc-700 border-0 rounded-xl px-3 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer">
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
              <p className="font-medium text-zinc-500 dark:text-zinc-400">No testimonials yet</p>
              <p className="text-sm mt-1 text-zinc-400 dark:text-zinc-500">
                {filterLab ? 'No testimonials for this lab yet.' : 'Be the first to share your experience!'}
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

      {showModal && (
        <WriteModal labs={labs} onClose={() => setShowModal(false)} onSubmitted={handleSubmitted} />
      )}
    </StudentLayout>
  );
}
