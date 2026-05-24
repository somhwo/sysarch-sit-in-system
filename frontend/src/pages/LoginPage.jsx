import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Monitor, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ccsLogo from '../images/ccs_logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(identifier, password, role);
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate(role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 shadow-lg">
            <img src={ccsLogo} alt="CCS Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="font-display text-2xl font-700 text-zinc-900 dark:text-zinc-100">Sign in to CCS</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sit-in Monitoring System</p>
        </div>

        <div className="card shadow-sm">
          {/* Role toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-700 rounded-xl p-1 mb-6">
            {['student', 'admin'].map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  role === r ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                {role === 'admin' ? 'Username' : 'Email or ID Number'}
              </label>
              <input
                className="input"
                placeholder={role === 'admin' ? 'admin' : 'student@email.com or 23770000'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {role === 'student' && (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-5">
              No account?{' '}
              <Link to="/register" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                Register here
              </Link>
            </p>
          )}
        </div>
        <p className="text-center mt-4">
          <Link to="/" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
