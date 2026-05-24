import { useEffect, useState } from "react";
import { MessageSquare, Search, Star } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../lib/api";

const formatDate = (dt) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dt) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function StarDisplay({ rating, size = 13 }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-zinc-300 dark:text-zinc-600"
          }
        />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/feedback")
      .then((r) => setFeedback(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = feedback.filter(
    (f) =>
      f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.id_number?.includes(search) ||
      f.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      f.lab_room?.toLowerCase().includes(search.toLowerCase()) ||
      f.content?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Feedback
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Student feedback submitted for completed sessions
            </p>
          </div>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              className="input pl-9 w-60"
              placeholder="Search name, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-zinc-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-20 text-zinc-400">
            <MessageSquare className="mx-auto mb-3 opacity-25" size={40} />
            <p className="font-medium text-zinc-500 dark:text-zinc-400">
              No feedback yet
            </p>
            <p className="text-sm mt-1">
              Feedback submitted by students will appear here
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500 dark:text-zinc-400">
              {filtered.length} feedback entr
              {filtered.length !== 1 ? "ies" : "y"}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 dark:border-zinc-700">
                <tr>
                  {[
                    "Student",
                    "Session Info",
                    "Date",
                    "Submitted",
                    "Rating",
                    "Feedback",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                {filtered.map((f) => (
                  <tr key={f.id} className="table-row-hover align-top">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {f.full_name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {f.id_number}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {f.course} · Year {f.year_level}
                      </p>
                    </td>

                    {/* Session info */}
                    <td className="px-4 py-3">
                      <span className="badge badge-purple text-xs">
                        {f.purpose}
                      </span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Lab {f.lab_room}
                      </p>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        {f.time_in} – {f.time_out}
                      </p>
                    </td>

                    {/* Session date */}
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      {formatDate(f.session_date)}
                    </td>

                    {/* Submitted at */}
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {formatDateTime(f.submitted_at)}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <StarDisplay rating={f.rating} />
                    </td>

                    {/* Feedback content */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                        {f.content}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
