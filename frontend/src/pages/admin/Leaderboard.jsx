import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Target, Calendar, Star } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

const MEDAL_COLORS = [
  { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700', icon: '🥇' },
  { bg: 'bg-zinc-100 dark:bg-zinc-700/40',     text: 'text-zinc-500 dark:text-zinc-400',     border: 'border-zinc-300 dark:border-zinc-600',    icon: '🥈' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700', icon: '🥉' },
];

function Avatar({ student, size = 'md' }) {
  const url = student.profile_photo
    ? (student.profile_photo.startsWith('http') ? student.profile_photo : `${API_BASE}${student.profile_photo}`)
    : null;
  const sz = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  return (
    <div className={`${sz} rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 overflow-hidden shrink-0`}>
      {url ? <img src={url} alt={student.full_name} className="w-full h-full object-cover" /> : student.full_name?.[0]?.toUpperCase()}
    </div>
  );
}

function PodiumCard({ student, rank }) {
  const m = MEDAL_COLORS[rank - 1];
  const heights = ['h-36', 'h-24', 'h-20'];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative card border-2 ${m.border} ${m.bg} w-44 flex flex-col items-center py-4 px-3 text-center`}>
        <span className="text-3xl mb-1">{m.icon}</span>
        <Avatar student={student} size="lg" />
        <p className="font-display font-bold text-zinc-900 dark:text-zinc-100 mt-2 text-sm leading-tight">{student.full_name}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{student.id_number}</p>
        <p className={`text-xs font-semibold mt-1 ${m.text}`}>{student.course}</p>
        <div className={`mt-3 text-2xl font-display font-black ${m.text}`}>{student.total_sessions}</div>
        <div className="text-xs text-zinc-400">sit-ins</div>
      </div>
      <div className={`${heights[rank - 1]} w-44 rounded-t-2xl ${rank === 1 ? 'bg-yellow-400/30' : rank === 2 ? 'bg-zinc-300/40 dark:bg-zinc-600/40' : 'bg-orange-400/20'} flex items-center justify-center`}>
        <span className={`text-4xl font-black font-display ${m.text}`}>#{rank}</span>
      </div>
    </div>
  );
}

export default function AdminLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions/leaderboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  const totalSessions = data.reduce((a, s) => a + s.total_sessions, 0);

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} /> Sit-in Leaderboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Rankings based on total completed sit-in sessions</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: 'Ranked Students', value: data.length, color: 'text-purple-500' },
            { icon: TrendingUp, label: 'Total Sit-ins', value: totalSessions, color: 'text-blue-500' },
            { icon: Target, label: 'Avg per Student', value: data.length ? Math.round(totalSessions / data.length) : 0, color: 'text-green-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
                <p className="text-xs text-zinc-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-400">Loading leaderboard...</div>
        ) : data.length === 0 ? (
          <div className="card text-center py-20 text-zinc-400">
            <Trophy className="mx-auto mb-3 opacity-20" size={48} />
            <p className="font-medium">No sit-in records yet</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 1 && (
              <div className="mb-8">
                <h2 className="font-display font-semibold text-zinc-700 dark:text-zinc-300 mb-6 text-center">🏆 Top Performers</h2>
                <div className="flex items-end justify-center gap-4">
                  {top3.length >= 2 && <PodiumCard student={top3[1]} rank={2} />}
                  <PodiumCard student={top3[0]} rank={1} />
                  {top3.length >= 3 && <PodiumCard student={top3[2]} rank={3} />}
                </div>
              </div>
            )}

            {/* Full rankings table */}
            {data.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700">
                  <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Full Rankings</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                    <tr>
                      {['Rank', 'Student', 'Course', 'Sit-ins', 'Labs Used', 'Purposes', 'Last Session', 'Top Purpose'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                    {data.map((s, i) => {
                      const rank = i + 1;
                      const m = rank <= 3 ? MEDAL_COLORS[rank - 1] : null;
                      return (
                        <tr key={s.id} className={`table-row-hover ${rank <= 3 ? m.bg : ''}`}>
                          <td className="px-4 py-3">
                            {rank <= 3
                              ? <span className="text-xl">{m.icon}</span>
                              : <span className="text-zinc-400 font-mono text-sm font-semibold">#{rank}</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar student={s} size="sm" />
                              <div>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{s.full_name}</p>
                                <p className="text-xs text-zinc-400 font-mono">{s.id_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="badge badge-purple">{s.course} Y{s.year_level}</span></td>
                          <td className="px-4 py-3">
                            <span className={`text-lg font-display font-bold ${rank <= 3 ? m.text : 'text-zinc-700 dark:text-zinc-300'}`}>{s.total_sessions}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{s.labs_visited}</td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{s.purposes_used}</td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
                            {s.last_session ? new Date(s.last_session).toLocaleDateString('en-PH', { month:'short', day:'numeric', timeZone:'UTC' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 max-w-[120px] truncate">{s.top_purpose || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
