import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor, Eye, EyeOff } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";
import ccsLogo from '../images/ccs_logo.png';

const COURSES = ["BSIT", "BSCS", "BSIS", "ACT"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id_number: "",
    full_name: "",
    email: "",
    address: "",
    password: "",
    confirm_password: "",
    year_level: "1",
    course: "BSIT",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        id_number: form.id_number,
        full_name: form.full_name,
        email: form.email,
        address: form.address,
        password: form.password,
        year_level: parseInt(form.year_level),
        course: form.course,
      });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white-500 rounded-2xl mb-4 shadow-lg shadow-grey-200">
            <img src={ccsLogo} alt="CCS Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="font-display text-2xl font-700 text-zinc-900">
            Create Account
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            CCS Sit-in Monitoring System
          </p>
        </div>

        <div className="card shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">ID Number</label>
                <input
                  className="input"
                  placeholder="23770000"
                  value={form.id_number}
                  onChange={(e) => set("id_number", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Year Level</label>
                <select
                  className="input"
                  value={form.year_level}
                  onChange={(e) => set("year_level", e.target.value)}
                >
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                placeholder="Juan Dela Cruz"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="juan@student.edu"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Course</label>
                <select
                  className="input"
                  value={form.course}
                  onChange={(e) => set("course", e.target.value)}
                >
                  {COURSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Address</label>
                <input
                  className="input"
                  placeholder="City, Province"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                className="input"
                type="password"
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={(e) => set("confirm_password", e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Already registered?{" "}
            <Link to="/login" className="text-purple-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-xs text-zinc-400 hover:text-zinc-600">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
