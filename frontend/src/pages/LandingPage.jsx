import { Link } from 'react-router-dom';
import { Users, BarChart2, Monitor, ArrowRight, Clock, Sun, Moon } from 'lucide-react';
import ccsLogo from '../images/ccs_logo.png';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex flex-col transition-colors duration-200">
      {/* Navbar */}
      <nav className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2.5">
          <img src={ccsLogo} alt="CCS Logo" className="w-8 h-8 object-contain" />
          <span className="font-display font-700 text-zinc-900 dark:text-zinc-100 text-sm leading-tight">
            College of Computer Studies<br />
            <span className="text-purple-500">Sit-in Monitoring System</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">Register</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 animate-fade-in overflow-visible">
        <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-purple-100 dark:border-purple-800/40">
          <Clock size={12} />
          Real-time session tracking
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-800 text-zinc-900 dark:text-zinc-50 max-w-3xl leading-normal mb-6">
          Manage Lab Sit-ins{' '}
          <span className="text-purple-500">Smarter</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mb-10 leading-relaxed">
          A streamlined system for the College of Computer Studies to track, manage,
          and record student sit-in sessions with ease.
        </p>
        <div className="flex items-center gap-3">
          <Link to="/register" className="btn-yellow text-base px-6 py-3">
            Get Started <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-secondary text-base px-6 py-3">
            Sign In
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-3xl w-full text-left">
          {[
            { icon: Users, title: 'Student Management', desc: 'Register, search, and manage student profiles and session counts.' },
            { icon: Monitor, title: 'Live Sit-in Tracking', desc: 'Start and end sessions in real-time. Auto-deducts from remaining quota.' },
            { icon: BarChart2, title: 'Records & Reports', desc: 'Permanent history of all sit-ins with purpose and time tracking.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-md transition-all">
              <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-3">
                <Icon size={18} className="text-purple-500" />
              </div>
              <h3 className="font-display font-600 text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
        © {new Date().getFullYear()} College of Computer Studies Sit-In Monitoring System
      </footer>
    </div>
  );
}
