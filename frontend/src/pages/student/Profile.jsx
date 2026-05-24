import { useState, useEffect } from 'react';
import { Save, Camera } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const COURSES = ['BSIT', 'BSCS', 'BSIS', 'ACT'];

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    full_name: '', email: '', year_level: '1', course: 'BSIT',
    address: '', current_password: '', new_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        full_name: user.full_name || '',
        email: user.email || '',
        year_level: String(user.year_level || 1),
        course: user.course || 'BSIT',
        address: user.address || '',
      }));
    }
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/students/${user.id}`, form);
      await refreshUser();
      toast.success('Profile updated!');
      setForm(f => ({ ...f, current_password: '', new_password: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setPhotoLoading(true);
    try {
      await api.post(`/students/${user.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
      toast.success('Photo updated!');
    } catch { toast.error('Photo upload failed'); }
    finally { setPhotoLoading(false); }
  };

  return (
    <StudentLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Profile</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Update your personal information</p>
        </div>

        {/* Avatar */}
        <div className="card mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-500 text-2xl font-display font-bold overflow-hidden">
              {user?.profile_photo
                ? <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                : user?.full_name?.[0]
              }
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors">
              <Camera size={11} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoLoading} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user?.full_name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.id_number} · {user?.course} Year {user?.year_level}</p>
            <span className="badge badge-purple mt-1">{user?.remaining_sessions} sessions remaining</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 pb-3">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Year Level</label>
              <select className="input" value={form.year_level} onChange={e => set('year_level', e.target.value)}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Course</label>
              <select className="input" value={form.course} onChange={e => set('course', e.target.value)}>
                {COURSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="e.g. Looc, Lapu-Lapu City"
              value={form.address} onChange={e => set('address', e.target.value)} />
          </div>

          <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 pb-3 pt-2">
            Change Password <span className="text-zinc-400 font-normal text-sm">(optional)</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Current Password</label>
              <input className="input" type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input className="input" type="password" value={form.new_password} onChange={e => set('new_password', e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            <Save size={15} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </StudentLayout>
  );
}
