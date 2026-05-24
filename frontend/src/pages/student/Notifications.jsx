import { useState } from 'react';
import { Megaphone, CalendarCheck, CalendarX, Bell, CheckCheck, Archive, Check } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { useAnnouncements } from '../../context/AnnouncementContext';

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const VARIANTS = {
  announcement: {
    icon: Megaphone,
    iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400',
    accent: 'border-l-purple-400', labelColor: 'text-purple-700 dark:text-purple-400',
  },
  reservation_accepted: {
    icon: CalendarCheck,
    iconBg: 'bg-green-100 dark:bg-green-900/40', iconColor: 'text-green-600 dark:text-green-400',
    accent: 'border-l-green-400', labelColor: 'text-green-700 dark:text-green-400',
  },
  reservation_declined: {
    icon: CalendarX,
    iconBg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-500 dark:text-red-400',
    accent: 'border-l-red-400', labelColor: 'text-red-600 dark:text-red-400',
  },
};

function NotificationCard({ notif, onMarkRead, onArchive }) {
  const v = VARIANTS[notif.type] ?? VARIANTS.announcement;
  const Icon = v.icon;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border border-l-4 ${v.accent} shadow-sm transition-all ${
      notif.read ? 'bg-white dark:bg-zinc-800/60 border-zinc-100 dark:border-zinc-700 opacity-75' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
    }`}>
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${v.iconBg} flex items-center justify-center`}>
        <Icon size={16} className={v.iconColor} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-xs font-semibold ${v.labelColor}`}>{notif.title}</p>
          {!notif.read && (
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" title="Unread" />
          )}
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{notif.body}</p>
        <p className="text-xs text-zinc-400 mt-1.5">{formatDate(notif.date)}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 shrink-0">
        {!notif.read && (
          <button onClick={() => onMarkRead(notif.id)}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
            title="Mark as read">
            <Check size={14} />
          </button>
        )}
        {!notif.archived && (
          <button onClick={() => onArchive(notif.id)}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="Archive">
            <Archive size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, archiveNotification, archiveAll } = useAnnouncements();
  const [tab, setTab] = useState('inbox'); // 'inbox' | 'archived'

  const inbox    = notifications.filter(n => !n.archived);
  const archived = notifications.filter(n =>  n.archived);
  const shown    = tab === 'inbox' ? inbox : archived;

  return (
    <StudentLayout>
      <div className="max-w-2xl animate-fade-in">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Notifications</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          {tab === 'inbox' && inbox.length > 0 && (
            <div className="flex gap-2 mt-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={archiveAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                <Archive size={13} /> Archive all
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'inbox',    label: `Inbox${inbox.length > 0 ? ` (${inbox.length})` : ''}` },
            { key: 'archived', label: `Archived${archived.length > 0 ? ` (${archived.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <Bell size={36} className="opacity-20 mb-3" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {tab === 'inbox' ? "You're all caught up" : 'No archived notifications'}
            </p>
            <p className="text-xs mt-1 text-zinc-400 dark:text-zinc-500">
              {tab === 'inbox' ? 'New notifications will appear here' : 'Archived items will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(n => (
              <NotificationCard
                key={`${n.type}-${n.id}`}
                notif={n}
                onMarkRead={markRead}
                onArchive={archiveNotification}
              />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
