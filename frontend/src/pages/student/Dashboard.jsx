import { useEffect } from 'react';
import { AlertCircle, Megaphone, User, GraduationCap, CalendarDays, Mail, MapPin, Clock, FileText } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../context/AnnouncementContext';

const RULES = [
  'Maintain silence, proper decorum, and discipline inside the laboratory. Mobile phones, walkmans and other personal pieces of equipment must be switched off.',
  'Games are not allowed inside the lab. This includes computer-related games, card games and other games that may disturb the operation of the lab.',
  'Surfing the Internet is allowed only with the permission of the instructor. Downloading and installing of software are strictly prohibited.',
  'Deleting computer files or changing computer settings is not allowed. Report any problems to the laboratory custodian or instructor.',
  'Computer peripherals and consumables brought by the student for personal use must be returned home after use.',
  'Observe computer operations with care. Do not abuse or misuse the computer hardware and other equipment in the laboratory.',
  'Keep the laboratory clean and orderly. Do not bring food, drinks, or cigarettes inside the laboratory. The lab should be cleaned after use.',
];

export default function StudentDashboard() {
  const { user, refreshUser } = useAuth();
  const { announcements } = useAnnouncements();

  useEffect(() => {
    refreshUser();
  }, []);

  const sessionsLeft = user?.remaining_sessions ?? 0;
  const sessionPct = Math.round((sessionsLeft / 30) * 100);
  const sessionColor = sessionsLeft > 20 ? 'text-green-600' : sessionsLeft > 10 ? 'text-yellow-600' : 'text-red-500';
  const barColor = sessionsLeft > 20 ? 'bg-purple-500' : sessionsLeft > 10 ? 'bg-yellow-400' : 'bg-red-400';

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
    });
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl animate-fade-in">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Hello, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Welcome to your dashboard</p>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-3 gap-5 items-start">

          {/* ── Column 1: Student Information ── */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-purple-500 px-5 py-3 flex items-center gap-2">
              <User size={14} className="text-white opacity-80" />
              <p className="text-white text-sm font-semibold">Student Information</p>
            </div>
            <div className="p-5 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-purple-100 border-4 border-purple-50 shadow flex items-center justify-center text-purple-500 text-3xl font-display font-bold overflow-hidden mb-4">
                {user?.profile_photo
                  ? <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  : (user?.full_name?.[0] ?? '?')
                }
              </div>
              <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 text-center mb-1">{user?.full_name}</p>
              <span className="badge badge-purple text-xs mb-4">{user?.course} · Year {user?.year_level}</span>
              <div className="w-full space-y-2.5 border-t border-zinc-100 dark:border-zinc-700 pt-4">
                {[
                  { icon: GraduationCap, label: 'Course', value: user?.course },
                  { icon: CalendarDays,  label: 'Year',   value: user?.year_level },
                  { icon: Mail,          label: 'Email',  value: user?.email },
                  { icon: MapPin,        label: 'Address',value: user?.address || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5 text-sm">
                    <Icon size={14} className="text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-zinc-700 dark:text-zinc-300 leading-snug">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">{label}:</span>{' '}
                      <span className="break-all">{value ?? '—'}</span>
                    </p>
                  </div>
                ))}
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock size={14} className="text-purple-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">Session:</span>{' '}
                      <span className={`font-bold ${sessionColor}`}>{sessionsLeft}</span>
                      <span className="text-zinc-400 text-xs"> / 30</span>
                    </p>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${barColor}`}
                        style={{ width: `${sessionPct}%` }} />
                    </div>
                    {sessionsLeft === 0 && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> No sessions left — contact admin
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 2: Announcements ── */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-purple-500 px-5 py-3 flex items-center gap-2">
              <Megaphone size={14} className="text-white opacity-80" />
              <p className="text-white text-sm font-semibold">Announcement</p>
            </div>
            <div className="p-5">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <Megaphone className="mx-auto mb-2 opacity-30" size={28} />
                  <p className="text-sm">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {announcements.map(a => (
                    <div key={a.id} className="border-b border-zinc-100 dark:border-zinc-700 pb-4 last:border-0 last:pb-0">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        {a.admin_name}
                        <span className="text-zinc-400 font-normal ml-1">| {formatDate(a.created_at)}</span>
                      </p>
                      <div className="bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-100 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                        <p className="text-sm text-zinc-600 dark:text-zinc-200 leading-relaxed">{a.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Column 3: Rules and Regulations ── */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-purple-500 px-5 py-3 flex items-center gap-2">
              <FileText size={14} className="text-white opacity-80" />
              <p className="text-white text-sm font-semibold">Rules and Regulations</p>
            </div>
            <div className="p-5 max-h-[520px] overflow-y-auto">
              <div className="text-center mb-4">
                <p className="font-display font-bold text-zinc-900 dark:text-zinc-100 text-sm">University of Cebu</p>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wide mt-0.5">
                  College of Information &amp; Computer Studies
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-100 dark:border-zinc-600 rounded-xl p-4 mb-3">
                <p className="font-bold text-zinc-800 dark:text-zinc-100 text-xs uppercase tracking-wide mb-2">
                  Laboratory Rules and Regulations
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-300 leading-relaxed">
                  To avoid embarrassment and maintain camaraderie with your friends and superiors
                  at our laboratories, please observe the following:
                </p>
              </div>
              <ol className="space-y-3">
                {RULES.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}
