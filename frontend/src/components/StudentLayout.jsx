import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, User, Clock, LogOut, Bell, CalendarDays, Monitor, Star, Sun, Moon, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAnnouncements } from "../context/AnnouncementContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import ccsLogo from "../images/ccs_logo.png";

const links = [
  { to: "/student",                icon: LayoutDashboard, label: "Dashboard",       end: true },
  { to: "/student/profile",        icon: User,            label: "My Profile"                },
  { to: "/student/history",        icon: Clock,           label: "Session History"           },
  { to: "/student/reservation",    icon: CalendarDays,    label: "Reservation"               },
  { to: "/student/leaderboard",    icon: Trophy,          label: "Leaderboard"               },
  { to: "/student/software",       icon: Monitor,         label: "Lab & Software"            },
  { to: "/student/testimonials",   icon: Star,            label: "Testimonials"              },
  { to: "/student/notifications",  icon: Bell,            label: "Notifications"             },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const { unreadAnnouncements } = useAnnouncements() || { unreadAnnouncements: [] };
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const unreadCount = unreadAnnouncements?.length ?? 0;

  const handleLogout = () => { logout(); toast.success("Signed out"); navigate("/login"); };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex">
      <aside className="w-60 bg-white dark:bg-zinc-800 border-r border-zinc-100 dark:border-zinc-700 flex flex-col fixed h-full z-40">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2.5">
            <img src={ccsLogo} alt="CCS Logo" className="w-8 h-8 object-contain" />
            <div className="leading-tight">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-display">CCS Sit-in</p>
              <p className="text-xs text-zinc-400">Student Portal</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 mx-3 mt-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/40">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.full_name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.id_number} · {user?.course}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">{user?.remaining_sessions ?? 0} sessions left</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={16} />
              {label}
              {to === "/student/notifications" && unreadCount > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-purple-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-700 space-y-1">
          <button
            onClick={toggleDarkMode}
            className="nav-link w-full text-zinc-500 dark:text-zinc-400"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleLogout} className="nav-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8 page-enter dark:bg-zinc-900 dark:text-zinc-100">{children}</main>
    </div>
  );
}
