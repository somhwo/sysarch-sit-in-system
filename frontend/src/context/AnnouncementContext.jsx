import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Megaphone } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const AnnouncementContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || '';

// Each notification stored in localStorage looks like:
// { id, type, title, body, date, read: false, archived: false }

function storageKey(userId) { return `notifications_${userId}`; }

function loadStored(userId) {
  try { return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]'); }
  catch { return []; }
}

function saveStored(userId, items) {
  localStorage.setItem(storageKey(userId), JSON.stringify(items));
}

export function AnnouncementProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]); // full list persisted
  const [announcements, setAnnouncements] = useState([]);  // raw list for dashboard
  const esRef = useRef(null);

  const userId = user?.id;

  // Derived counts
  const unreadAnnouncements = notifications.filter(n => !n.read && !n.archived);
  const unreadCount = unreadAnnouncements.length;

  // Persist any state change to localStorage
  const persist = useCallback((items) => {
    setNotifications(items);
    if (userId) saveStored(userId, items);
  }, [userId]);

  // Add a new notification (deduped by id+type)
  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === notif.id && n.type === notif.type);
      if (exists) return prev;
      const updated = [notif, ...prev];
      if (userId) saveStored(userId, updated);
      return updated;
    });
  }, [userId]);

  // Mark one as read
  const markRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      if (userId) saveStored(userId, updated);
      return updated;
    });
  }, [userId]);

  // Mark all as read
  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (userId) saveStored(userId, updated);
      return updated;
    });
  }, [userId]);

  // Archive one (hides from badge count but keeps in list)
  const archiveNotification = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true, archived: true } : n);
      if (userId) saveStored(userId, updated);
      return updated;
    });
  }, [userId]);

  // Archive all
  const archiveAll = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true, archived: true }));
      if (userId) saveStored(userId, updated);
      return updated;
    });
  }, [userId]);

  // Initial load: restore persisted notifications + fetch announcements
  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/announcements');
      const fetched = res.data ?? [];
      setAnnouncements(fetched);
      return fetched;
    } catch { return []; }
  }, []);

  useEffect(() => {
    if (user?.role !== 'student') {
      setNotifications([]);
      setAnnouncements([]);
      esRef.current?.close();
      esRef.current = null;
      return;
    }

    // Restore persisted notifications from localStorage
    const stored = loadStored(user.id);
    setNotifications(stored);

    // Load current announcements (for dashboard display)
    loadAnnouncements().then(fetched => {
      // Add any announcements not already in persisted list as unread notifications
      setNotifications(prev => {
        const existingIds = new Set(prev.filter(n => n.type === 'announcement').map(n => n.id));
        const brandNew = fetched.filter(a => !existingIds.has(a.id));
        if (brandNew.length === 0) return prev;
        const newNotifs = brandNew.map(a => ({
          id: a.id,
          type: 'announcement',
          title: 'A new announcement has been posted',
          body: a.content,
          date: a.created_at,
          read: false,
          archived: false,
        }));
        // Mark them as read (they existed before this session)
        // so only truly new ones (via SSE) show as unread
        const markedRead = newNotifs.map(n => ({ ...n, read: true }));
        const updated = [...markedRead, ...prev.filter(n => !existingIds.has(n.id) || n.type !== 'announcement')];
        // Merge: keep existing read/archive state if already stored
        const merged = fetched.map(a => {
          const existing = prev.find(n => n.id === a.id && n.type === 'announcement');
          if (existing) return existing;
          return { id: a.id, type: 'announcement', title: 'Announcement', body: a.content, date: a.created_at, read: true, archived: false };
        });
        // Preserve any non-announcement notifs
        const otherNotifs = prev.filter(n => n.type !== 'announcement');
        const final = [...merged, ...otherNotifs];
        saveStored(user.id, final);
        return final;
      });
    });

    // SSE for real-time new announcements
    const token = localStorage.getItem('token');
    const sseUrl = `${API_BASE}/api/announcements/stream?token=${encodeURIComponent(token)}`;

    const connect = () => {
      const es = new EventSource(sseUrl);
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;

          const newAnnouncement = data;

          // Update raw announcements list
          setAnnouncements(prev => {
            if (prev.find(a => a.id === newAnnouncement.id)) return prev;
            return [newAnnouncement, ...prev];
          });

          // Add as unread notification (persistent)
          addNotification({
            id: newAnnouncement.id,
            type: 'announcement',
            title: 'A new announcement has been posted',
            body: newAnnouncement.content,
            date: newAnnouncement.created_at,
            read: false,
            archived: false,
          });

          // Toast
          toast.custom(t => (
            <div className={`flex items-start gap-3 bg-white border border-purple-200 shadow-lg rounded-2xl px-4 py-3 max-w-sm transition-all ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Megaphone size={15} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-700 mb-0.5">A new announcement has been posted</p>
                <p className="text-sm text-zinc-700 leading-snug line-clamp-2">{newAnnouncement.content}</p>
              </div>
            </div>
          ), { duration: 6000 });
        } catch { /* malformed event */ }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        setTimeout(() => { if (user?.role === 'student') connect(); }, 5000);
      };
    };

    connect();
    return () => { esRef.current?.close(); esRef.current = null; };
  }, [user]);

  return (
    <AnnouncementContext.Provider value={{
      announcements,
      notifications,
      unreadAnnouncements,
      unreadCount,
      markRead,
      markAllRead,
      archiveNotification,
      archiveAll,
      addNotification,
    }}>
      {children}
    </AnnouncementContext.Provider>
  );
}

export const useAnnouncements = () => {
  const ctx = useContext(AnnouncementContext);
  if (!ctx) throw new Error('useAnnouncements must be used within AnnouncementProvider');
  return ctx;
};
