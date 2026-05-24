import { useEffect, useState } from 'react';
import { Users, FileText, Activity, Trash2, Megaphone, Send } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Colors match reference image: blue, pink, orange, yellow, teal
const PIE_CONFIG = [
  { purpose: 'C# Programming',      label: 'C#',      color: '#60a5fa' },
  { purpose: 'C Programming',       label: 'C',       color: '#f472b6' },
  { purpose: 'Java Programming',    label: 'Java',    color: '#fb923c' },
  { purpose: 'ASP.Net Programming', label: 'ASP.Net', color: '#facc15' },
  { purpose: 'PHP Programming',     label: 'Php',     color: '#34d399' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [posting, setPosting] = useState(false);

  const loadStats = () => api.get('/sessions/stats').then(r => setStats(r.data));
  const loadAnnouncements = () => api.get('/announcements').then(r => setAnnouncements(r.data));

  useEffect(() => { loadStats(); loadAnnouncements(); }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    setPosting(true);
    try {
      await api.post('/announcements', { content: newAnnouncement });
      toast.success('Announcement posted');
      setNewAnnouncement('');
      loadAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally { setPosting(false); }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); loadAnnouncements(); }
    catch { toast.error('Failed to delete'); }
  };

  // Build pie data using short labels, only include purposes with count > 0
  const pieData = PIE_CONFIG.map(cfg => {
    const found = stats?.purpose_stats?.find(p => p.purpose === cfg.purpose);
    return { ...cfg, value: found ? Number(found.count) : 0 };
  }).filter(d => d.value > 0);

  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">CCS Lab Sit-in Overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Students Registered', value: stats?.total_students ?? '-', icon: Users, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-500' },
            { label: 'Currently Sitting In', value: stats?.currently_sitin ?? '-', icon: Activity, color: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500' },
            { label: 'Total Sit-in Records', value: stats?.total_sitin ?? '-', icon: FileText, color: 'bg-green-50 dark:bg-green-900/30 text-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics + Announcements */}
        <div className="grid grid-cols-2 gap-6">

          {/* Statistics card */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-purple-500" />
              <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100">Statistics</h2>
            </div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1.5 mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-700">
              <p><span className="font-bold">Students Registered:</span> {stats?.total_students ?? '—'}</p>
              <p><span className="font-bold">Currently Sit-in:</span> {stats?.currently_sitin ?? '—'}</p>
              <p><span className="font-bold">Total Sit-in:</span> {stats?.total_sitin ?? '—'}</p>
            </div>

            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="55%"
                    outerRadius={95}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="top"
                    align="center"
                    formatter={(value) => (
                      <span style={{ fontSize: 12, color: 'inherit' }}>{value}</span>
                    )}
                    payload={pieData.map(d => ({
                      value: d.label,
                      type: 'square',
                      color: d.color,
                    }))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-zinc-400 text-sm">
                No sit-in data yet
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="card flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-purple-500" />
              <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100">Announcement</h2>
            </div>
            <form onSubmit={handlePostAnnouncement} className="mb-4">
              <textarea
                className="input resize-none mb-2 text-sm"
                rows={3}
                placeholder="New Announcement"
                value={newAnnouncement}
                onChange={e => setNewAnnouncement(e.target.value)}
              />
              <button type="submit" disabled={posting || !newAnnouncement.trim()}
                className="btn-primary text-sm py-2 px-4">
                <Send size={13} /> {posting ? 'Posting...' : 'Submit'}
              </button>
            </form>
            <div className="border-t border-zinc-100 dark:border-zinc-700 pt-3 flex-1 overflow-y-auto max-h-56 space-y-3">
              <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm mb-2">Posted Announcements</p>
              {announcements.length === 0 ? (
                <p className="text-sm text-zinc-400">No announcements yet.</p>
              ) : announcements.map(a => (
                <div key={a.id} className="border-b border-zinc-100 dark:border-zinc-700 pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {a.admin_name} | {formatDate(a.created_at)}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-200 mt-1 leading-relaxed">{a.content}</p>
                    </div>
                    <button onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
