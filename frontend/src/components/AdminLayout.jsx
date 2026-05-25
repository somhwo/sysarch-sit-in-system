import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText,
  LogOut, CalendarCheck, CalendarClock, MessageSquare, Monitor,
  Sun, Moon, Star, Trophy
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import ccsLogo from "../images/ccs_logo.png";

const links = [
  { to: "/admin",              icon: LayoutDashboard, label: "Dashboard",        end: true },
  { to: "/admin/students",     icon: Users,           label: "Students"                    },
  { to: "/admin/reservation",  icon: CalendarCheck,   label: "Sit-in Students"             },
  { to: "/admin/reservations", icon: CalendarClock,   label: "Reservations"                },
  { to: "/admin/records",      icon: FileText,        label: "Sit-in Records"              },
  { to: "/admin/leaderboard",  icon: Trophy,          label: "Leaderboard"                 },
  { to: "/admin/feedback",     icon: MessageSquare,   label: "Feedback"                    },
  { to: "/admin/software",     icon: Monitor,         label: "Lab & Software"              },
  { to: "/admin/testimonials", icon: Star,            label: "Testimonials"                },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); toast.success("Signed out"); navigate("/login"); };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex">
      <aside className="w-60 bg-white dark:bg-zinc-800 border-r border-zinc-100 dark:border-zinc-700 flex flex-col fixed h-full z-40">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2.5">
            <img src={ccsLogo} alt="CCS Logo" className="w-8 h-8 object-contain" />
            <div className="leading-tight">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-display">CCS Sit-in</p>
              <p className="text-xs text-zinc-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 mx-3 mt-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/40">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.full_name}</p>
          <span className="badge badge-yellow text-xs mt-1">Administrator</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-700 space-y-1">
          <button
            onClick={toggleDarkMode}
            className="nav-link w-full text-zinc-500 dark:text-zinc-400"
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleLogout}
            className="nav-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8 page-enter dark:bg-zinc-900 dark:text-zinc-100">{children}</main>
    </div>
  );
}
