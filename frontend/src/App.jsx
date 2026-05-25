import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';

import StudentDashboard     from './pages/student/Dashboard';
import StudentProfile       from './pages/student/Profile';
import StudentHistory       from './pages/student/History';
import StudentReservation   from './pages/student/Reservation';
import StudentNotifications from './pages/student/Notifications';
import StudentSoftware      from './pages/student/Software';
import StudentTestimonials  from './pages/student/Testimonials';
import StudentLeaderboard   from './pages/student/Leaderboard';

import AdminDashboard        from './pages/admin/Dashboard';
import AdminStudents         from './pages/admin/Students';
import AdminReservation      from './pages/admin/Reservation';
import AdminViewReservations from './pages/admin/ViewReservations';
import AdminRecords          from './pages/admin/Records';
import AdminFeedback         from './pages/admin/Feedback';
import AdminSoftware         from './pages/admin/Software';
import AdminTestimonials     from './pages/admin/Testimonials';
import AdminLeaderboard      from './pages/admin/Leaderboard';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Spinner() {
  return <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={user ? <Navigate to={user.role==='admin'?'/admin':'/student'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/student" replace /> : <RegisterPage />} />

      <Route path="/student"               element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/profile"       element={<PrivateRoute role="student"><StudentProfile /></PrivateRoute>} />
      <Route path="/student/history"       element={<PrivateRoute role="student"><StudentHistory /></PrivateRoute>} />
      <Route path="/student/reservation"   element={<PrivateRoute role="student"><StudentReservation /></PrivateRoute>} />
      <Route path="/student/analytics"     element={<PrivateRoute role="student"><Navigate to="/student/history" replace /></PrivateRoute>} />
      <Route path="/student/notifications" element={<PrivateRoute role="student"><StudentNotifications /></PrivateRoute>} />
      <Route path="/student/software"      element={<PrivateRoute role="student"><StudentSoftware /></PrivateRoute>} />
      <Route path="/student/testimonials"  element={<PrivateRoute role="student"><StudentTestimonials /></PrivateRoute>} />
      <Route path="/student/leaderboard"   element={<PrivateRoute role="student"><StudentLeaderboard /></PrivateRoute>} />

      <Route path="/admin"               element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/students"      element={<PrivateRoute role="admin"><AdminStudents /></PrivateRoute>} />
      <Route path="/admin/sessions"      element={<PrivateRoute role="admin"><Navigate to="/admin/reservation" replace /></PrivateRoute>} />
      <Route path="/admin/reservation"   element={<PrivateRoute role="admin"><AdminReservation /></PrivateRoute>} />
      <Route path="/admin/reservations"  element={<PrivateRoute role="admin"><AdminViewReservations /></PrivateRoute>} />
      <Route path="/admin/records"       element={<PrivateRoute role="admin"><AdminRecords /></PrivateRoute>} />
      <Route path="/admin/feedback"      element={<PrivateRoute role="admin"><AdminFeedback /></PrivateRoute>} />
      <Route path="/admin/software"      element={<PrivateRoute role="admin"><AdminSoftware /></PrivateRoute>} />
      <Route path="/admin/testimonials"  element={<PrivateRoute role="admin"><AdminTestimonials /></PrivateRoute>} />
      <Route path="/admin/leaderboard"   element={<PrivateRoute role="admin"><AdminLeaderboard /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
