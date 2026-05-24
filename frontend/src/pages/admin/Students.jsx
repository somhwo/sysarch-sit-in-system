import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

function Avatar({ student, size = 8 }) {
  const url = student.profile_photo
    ? (student.profile_photo.startsWith('http') ? student.profile_photo : `${API_BASE}${student.profile_photo}`)
    : null;
  const dim = `w-${size} h-${size}`;
  return (
    <div className={`${dim} rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm overflow-hidden shrink-0`}>
      {url
        ? <img src={url} alt={student.full_name} className="w-full h-full object-cover" />
        : (student.full_name?.[0]?.toUpperCase() ?? '?')
      }
    </div>
  );
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/students').then(r => setStudents(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.id_number.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try { await api.delete(`/students/${id}`); toast.success('Student deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleResetAll = async () => {
    if (!confirm('Reset ALL student sessions to 30?')) return;
    try { await api.post('/students/reset-all-sessions'); toast.success('All sessions reset to 30'); load(); }
    catch { toast.error('Reset failed'); }
  };

  const handleReset = async (id, name) => {
    try { await api.post(`/students/${id}/reset-sessions`); toast.success(`${name}'s sessions reset`); load(); }
    catch { toast.error('Reset failed'); }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Students</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">{students.length} registered students</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input className="input pl-8 w-52 py-2" placeholder="Search students..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={handleResetAll} className="btn-secondary text-sm py-2">
              <RefreshCw size={14} /> Reset All Sessions
            </button>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading students...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 dark:border-zinc-700">
                <tr>
                  {['Student', 'ID Number', 'Email', 'Year', 'Course', 'Sessions', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                {filtered.map(s => (
                  <tr key={s.id} className="table-row-hover">
                    {/* Student — photo + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar student={s} size={8} />
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.full_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">{s.id_number}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{s.email}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{s.year_level}</td>
                    <td className="px-4 py-3"><span className="badge badge-purple">{s.course}</span></td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.remaining_sessions > 20 ? 'badge-green' : s.remaining_sessions > 10 ? 'badge-yellow' : 'badge-red'}`}>
                        {s.remaining_sessions}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleReset(s.id, s.full_name)}
                          className="p-1.5 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Reset sessions">
                          <RefreshCw size={13} />
                        </button>
                        <button onClick={() => handleDelete(s.id, s.full_name)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-zinc-400">No students found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
