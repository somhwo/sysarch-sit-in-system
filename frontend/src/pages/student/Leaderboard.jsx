import { useEffect, useState } from 'react';
import { Trophy, Medal, TrendingUp, Users, Target, Star } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

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

function PodiumCard({ student, rank, isMe }) {
  const m = MEDAL_COLORS[rank - 1];
  const heights = ['h-36', 'h-24', 'h-20'];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative card border-2 ${isMe ? 'border-purple-500' : m.border} ${m.bg} w-40 flex flex-col items-center py-4 px-3 text-center`}>
        {isMe && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">YOU</div>}
        <span className="text-3xl mb-1">{m.icon}</span>
        <Avatar student={student} size="lg" />
        <p className="font-display font-bold text-zinc-900 dark:text-zinc-100 mt-2 text-sm leading-tight">{student.full_name}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{student.course}</p>
        <div className={`mt-3 text-2xl font-display font-black ${m.text}`}>{student.total_sessions}</div>
        <div className="text-xs text-zinc-400">sit-ins</div>
      </div>
      <div className={`${heights[rank - 1]} w-40 rounded-t-2xl ${rank === 1 ? 'bg-yellow-400/30' : rank === 2 ? 'bg-zinc-300/40 dark:bg-zinc-600/40' : 'bg-orange-400/20'} flex items-center justify-center`}>
        <span className={`text-4xl font-black font-display ${m.text}`}>#{rank}</span>
      </div>
    </div>
  );
}

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    api.get('/sessions/leaderboard')
      .then(r => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Failed to load leaderboard data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const myRank = data.findIndex(s => s.id_number === user?.id_number) + 1;
  const myStats = data.find(s => s.id_number === user?.id_number);
  const top3 = data.slice(0, 3);
  const totalSessions = data.reduce((a, s) => a + s.total_sessions, 0);

  return (
    <StudentLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} /> Leaderboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Top students ranked by sit-in sessions completed</p>
        </div>

        {/* My ranking highlight */}
        {myStats && (
          <div className="card border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center text-white font-display font-black text-lg">
                  #{myRank}
                </div>
                <div>
                  <p className="font-display font-bold text-zinc-900 dark:text-zinc-100">Your Ranking</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{myStats.total_sessions} sit-ins completed · {myStats.course}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-xl font-display font-bold text-purple-600 dark:text-purple-400">{myStats.total_sessions}</p>
                  <p className="text-xs text-zinc-400">Sit-ins</p>
                </div>
                <div>
                  <p className="text-xl font-display font-bold text-purple-600 dark:text-purple-400">{myStats.labs_visited}</p>
                  <p className="text-xs text-zinc-400">Labs</p>
                </div>
                <div>
                  <p className="text-xl font-display font-bold text-purple-600 dark:text-purple-400">{myStats.purposes_used}</p>
                  <p className="text-xs text-zinc-400">Purposes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-zinc-400">Loading leaderboard...</div>
        ) : error ? (
          <div className="card text-center py-20 text-red-400">
            <Trophy className="mx-auto mb-3 opacity-20" size={48} />
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1 text-zinc-400">Please try refreshing the page.</p>
          </div>
        ) : data.length === 0 ? (
          <div className="card text-center py-20 text-zinc-400">
            <Trophy className="mx-auto mb-3 opacity-20" size={48} />
            <p className="font-medium">No sit-in records yet</p>
            <p className="text-sm mt-1">Complete a sit-in session to appear on the leaderboard!</p>
          </div>
        ) : (
          <>
            {top3.length >= 1 && (
              <div className="card">
                <h2 className="font-display font-semibold text-zinc-700 dark:text-zinc-300 mb-6 text-center">🏆 Top Performers</h2>
                <div className="flex items-end justify-center gap-4">
                  {top3.length >= 2 && <PodiumCard student={top3[1]} rank={2} isMe={top3[1].id_number === user?.id_number} />}
                  <PodiumCard student={top3[0]} rank={1} isMe={top3[0].id_number === user?.id_number} />
                  {top3.length >= 3 && <PodiumCard student={top3[2]} rank={3} isMe={top3[2].id_number === user?.id_number} />}
                </div>
              </div>
            )}

            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700">
                <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Full Rankings — Top {data.length}</h2>
              </div>
              <div className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                {data.map((s, i) => {
                  const rank = i + 1;
                  const m = rank <= 3 ? MEDAL_COLORS[rank - 1] : null;
                  const isMe = s.id_number === user?.id_number;
                  return (
                    <div key={s.id} className={`flex items-center gap-4 px-5 py-3 transition-colors ${isMe ? 'bg-purple-50 dark:bg-purple-900/20' : rank <= 3 ? m.bg : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/30'}`}>
                      <div className="w-8 text-center shrink-0">
                        {rank <= 3 ? <span className="text-xl">{m.icon}</span> : <span className="text-zinc-400 font-mono text-sm font-bold">#{rank}</span>}
                      </div>
                      <Avatar student={s} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{s.full_name}</p>
                          {isMe && <span className="badge badge-purple text-[9px] py-0">YOU</span>}
                        </div>
                        <p className="text-xs text-zinc-400">{s.id_number} · {s.course} Year {s.year_level}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-display font-bold ${rank <= 3 ? m.text : 'text-zinc-700 dark:text-zinc-300'}`}>{s.total_sessions}</p>
                        <p className="text-xs text-zinc-400">sit-ins</p>
                      </div>
                      {s.top_purpose && (
                        <div className="hidden md:block w-32 text-right">
                          <span className="text-xs text-zinc-400 truncate block">{s.top_purpose}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
