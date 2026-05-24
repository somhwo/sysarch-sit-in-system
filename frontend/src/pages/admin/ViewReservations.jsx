import { useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";

const formatDate = (dt) =>
  dt
    ? new Date(dt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "—";

const STATUS = {
  Pending: { cls: "badge-yellow", label: "Pending" },
  Approved: { cls: "badge-green", label: "Approved" },
  Cancelled: { cls: "badge-red", label: "Cancelled" },
};

export default function AdminViewReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    const qs = filter !== "All" ? `?status=${filter}` : "";
    api
      .get(`/reservations${qs}`)
      .then((r) => setReservations(r.data))
      .catch(() => toast.error("Failed to load reservations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleAction = async (id, status) => {
    setActing(id);
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      toast.success(
        status === "Approved"
          ? "Reservation accepted!"
          : "Reservation cancelled",
      );
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Action failed";
      if (err.response?.status === 409) {
        toast.custom(
          (t) => (
            <div
              className={`flex items-start gap-3 bg-white border border-red-200 shadow-lg rounded-2xl px-4 py-3 max-w-sm ${t.visible ? "opacity-100" : "opacity-0"}`}
            >
              <AlertTriangle
                size={18}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-0.5">
                  Scheduling Conflict
                </p>
                <p className="text-xs text-zinc-600 leading-snug">{msg}</p>
              </div>
            </div>
          ),
          { duration: 7000 },
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setActing(null);
    }
  };

  const pendingCount = reservations.filter(
    (r) => r.status === "Pending",
  ).length;
  const filters = ["All", "Pending", "Approved", "Cancelled"];

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Reservations
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
              Accept or cancel student lab reservation requests
              {pendingCount > 0 && filter === "All" && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                  {pendingCount} pending
                </span>
              )}
            </p>
          </div>
          <button onClick={load} className="btn-secondary text-sm py-2 gap-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-600"
              }`}
            >
              {f}
              {f === "Pending" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-400 text-zinc-900 text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card text-center py-16 text-zinc-400">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
            Loading...
          </div>
        ) : reservations.length === 0 ? (
          <div className="card text-center py-20 text-zinc-400">
            <CalendarClock className="mx-auto mb-3 opacity-25" size={40} />
            <p className="font-medium text-zinc-500 dark:text-zinc-400">
              No {filter !== "All" ? filter.toLowerCase() : ""} reservations
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
              {reservations.length} reservation
              {reservations.length !== 1 ? "s" : ""}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 dark:border-zinc-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    PC / Lab
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Purpose
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                {reservations.map((r) => {
                  const s = STATUS[r.status] ?? STATUS.Pending;
                  const isActing = acting === r.id;
                  return (
                    <tr key={r.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {r.full_name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {r.id_number} · {r.course} Y{r.year_level}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-semibold text-zinc-800">
                          {r.pc_number}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Lab {r.lab_room}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {r.time_preferred}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-purple">{r.purpose}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(r.id, "Approved")}
                              disabled={isActing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-700 text-xs font-semibold transition-colors disabled:opacity-40"
                            >
                              <Check size={13} /> Accept
                            </button>
                            <button
                              onClick={() => handleAction(r.id, "Cancelled")}
                              disabled={isActing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 text-xs font-semibold transition-colors disabled:opacity-40"
                            >
                              <X size={13} /> Cancel
                            </button>
                          </div>
                        ) : r.status === "Approved" ? (
                          <button
                            onClick={() => handleAction(r.id, "Cancelled")}
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 text-xs font-semibold transition-colors disabled:opacity-40"
                          >
                            <X size={13} /> Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
