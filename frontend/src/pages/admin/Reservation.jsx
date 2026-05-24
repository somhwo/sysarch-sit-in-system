import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

const PURPOSES = [
  'C# Programming', 'C Programming', 'Java Programming',
  'ASP.Net Programming', 'PHP Programming', 'Python Programming',
  'Database Management', 'Web Development', 'Other',
];

function StudentAvatar({ student }) {
  if (!student) return null;
  const url = student.profile_photo
    ? (student.profile_photo.startsWith('http') ? student.profile_photo : `${API_BASE}${student.profile_photo}`)
    : null;
  return (
    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
      <div className="w-12 h-12 rounded-xl bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-lg overflow-hidden shrink-0">
        {url
          ? <img src={url} alt={student.full_name} className="w-full h-full object-cover" />
          : (student.full_name?.[0]?.toUpperCase() ?? '?')
        }
      </div>
      <div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{student.full_name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{student.id_number} · {student.course} Year {student.year_level}</p>
        <p className="text-xs text-purple-600 font-medium mt-0.5">{student.remaining_sessions} sessions left</p>
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

  const lookupStudent = async () => {
    if (!idInput.trim()) return;
    setLooking(true);
    setStudent(null);
    try {
      const res = await api.get(`/students/search?q=${encodeURIComponent(idInput.trim())}`);
      const exact = res.data.find(s => s.id_number === idInput.trim()) || res.data[0];
      if (exact) { setStudent(exact); }
      else { toast.error('No student found with that ID'); }
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start sit-in');
    } finally { setStarting(false); }
  };

  const handleClose = () => {
    setIdInput(''); setStudent(null);
    setPurpose(PURPOSES[0]); setLabRoom('524'); setPcNumber('');
  };

  return (
    <AdminLayout>
      <div className="max-w-xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Sit-in Students</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Enter a student ID to start their sit-in session</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-700">
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sit In Form</h2>
            <button onClick={handleClose}
              className="w-7 h-7 border border-zinc-300 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-100 font-mono text-sm">
              ×
            </button>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <label className="w-44 text-sm text-zinc-600 text-right shrink-0">ID Number:</label>
              <input className="input flex-1" placeholder="Enter student ID number..."
                value={idInput}
                onChange={e => { setIdInput(e.target.value); setStudent(null); }}
                onBlur={lookupStudent}
                onKeyDown={e => e.key === 'Enter' && lookupStudent()} />
            </div>

            {/* Student card with photo */}
            {(looking || student) && (
              <div className="flex items-start gap-4">
                <div className="w-44 text-sm text-zinc-600 text-right shrink-0 pt-1">Student:</div>
                <div className="flex-1">
                  {looking
                    ? <div className="text-sm text-zinc-400 py-2">Looking up...</div>
                    : <StudentAvatar student={student} />
                  }
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="w-44 text-sm text-zinc-600 text-right shrink-0">Purpose:</label>
              <select className="input flex-1" value={purpose} onChange={e => setPurpose(e.target.value)}>
                {PURPOSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-44 text-sm text-zinc-600 text-right shrink-0">Lab:</label>
              <input className="input flex-1" value={labRoom} onChange={e => setLabRoom(e.target.value)} />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-44 text-sm text-zinc-600 text-right shrink-0">PC Number:</label>
              <input className="input flex-1" placeholder="e.g. PC-12 (optional)" value={pcNumber}
                onChange={e => setPcNumber(e.target.value)} />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-44 text-sm text-zinc-600 text-right shrink-0">Remaining Session:</label>
              <input className="input flex-1 bg-zinc-50" value={student?.remaining_sessions ?? ''} placeholder="—" readOnly />
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
    </AdminLayout>
  );
}
