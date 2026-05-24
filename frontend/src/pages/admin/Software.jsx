import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Building,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  "IDE",
  "Productivity",
  "Browser",
  "Server",
  "Database",
  "Design",
  "Virtualization",
  "Language Runtime",
  "General",
];

export default function AdminSoftware() {
  const [software, setSoftware] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("software"); // 'software' | 'labs'
  const [form, setForm] = useState({
    name: "",
    version: "",
    category: "IDE",
    description: "",
    lab_id: "",
    is_available: true,
  });
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/software").then((r) => setSoftware(r.data)),
      api.get("/labs").then((r) => setLabs(r.data)),
    ]).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setAdding(true);
    try {
      await api.post("/software", { ...form, lab_id: form.lab_id || null });
      toast.success("Software added");
      setForm({
        name: "",
        version: "",
        category: "IDE",
        description: "",
        lab_id: "",
        is_available: true,
      });
      load();
    } catch {
      toast.error("Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleSoftware = async (s) => {
    try {
      await api.patch(`/software/${s.id}`, { is_available: !s.is_available });
      setSoftware((prev) =>
        prev.map((x) =>
          x.id === s.id ? { ...x, is_available: !x.is_available } : x,
        ),
      );
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this software?")) return;
    try {
      await api.delete(`/software/${id}`);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const handleToggleLab = async (lab) => {
    try {
      const res = await api.patch(`/labs/${lab.id}/toggle`);
      setLabs((prev) =>
        prev.map((l) =>
          l.id === lab.id ? { ...l, is_available: res.data.is_available } : l,
        ),
      );
      toast.success(
        `${lab.name} marked as ${res.data.is_available ? "Available" : "Unavailable"}`,
      );
    } catch {
      toast.error("Failed to update lab status");
    }
  };

  const filtered = software.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.lab_name?.toLowerCase().includes(search.toLowerCase()),
  );

  // Compute correct software counts per lab from current software state
  const labsWithCount = labs.map((lab) => ({
    ...lab,
    computed_total: software.filter((s) => String(s.lab_id) === String(lab.id))
      .length,
    computed_available: software.filter(
      (s) => String(s.lab_id) === String(lab.id) && s.is_available,
    ).length,
  }));

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Software &amp; Labs
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Manage software and laboratory availability
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "software", label: "Software Management" },
            { key: "labs", label: "Lab Availability" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-purple-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "labs" ? (
          /* Lab Availability Panel */
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Set each laboratory's availability. Unavailable labs will not
              appear in the student reservation system.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {labsWithCount.map((lab) => (
                <div
                  key={lab.id}
                  className={`card border-2 transition-all ${
                    lab.is_available
                      ? "border-green-200 dark:border-green-800/50"
                      : "border-red-200 dark:border-red-800/50 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          lab.is_available
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        <Building
                          size={18}
                          className={
                            lab.is_available
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-500 dark:text-red-400"
                          }
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {lab.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Room {lab.room_number} · {lab.capacity} seats
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge ${lab.is_available ? "badge-green" : "badge-red"}`}
                      >
                        {lab.is_available ? "● Available" : "○ Unavailable"}
                      </span>
                      <button
                        onClick={() => handleToggleLab(lab)}
                        className={`p-2 rounded-xl transition-colors ${
                          lab.is_available
                            ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                            : "text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        }`}
                        title={
                          lab.is_available
                            ? "Mark Unavailable"
                            : "Mark Available"
                        }
                      >
                        {lab.is_available ? (
                          <ToggleRight size={28} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={28} className="text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Software Management Panel */
          <>
            <div className="card mb-6">
              <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Add Software
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="label">Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Visual Studio Code"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Version</label>
                  <input
                    className="input"
                    placeholder="e.g. 1.89"
                    value={form.version}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, version: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <input
                    className="input"
                    placeholder="Brief description (optional)"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Lab Room</label>
                  <select
                    className="input"
                    value={form.lab_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lab_id: e.target.value }))
                    }
                  >
                    <option value="">All Labs</option>
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_available: e.target.checked }))
                    }
                    className="w-4 h-4 accent-purple-500"
                  />
                  Available
                </label>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="btn-primary"
                >
                  <Plus size={15} /> {adding ? "Adding..." : "Add Software"}
                </button>
              </div>
            </div>

            <div className="mb-4 relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                className="input pl-9 w-72"
                placeholder="Search software, category, lab..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-zinc-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-16 text-zinc-400">
                <Package className="mx-auto mb-2 opacity-30" size={36} />
                <p>No software yet</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
                  {filtered.length} entries
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                    <tr>
                      {[
                        "Name",
                        "Version",
                        "Category",
                        "Lab",
                        "Description",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                    {filtered.map((s) => (
                      <tr key={s.id} className="table-row-hover">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {s.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {s.version || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-purple">
                            {s.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs">
                          {s.lab_name || "All Labs"}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs max-w-xs truncate">
                          {s.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {s.is_available ? (
                            <span className="badge badge-green">
                              ✓ Available
                            </span>
                          ) : (
                            <span className="badge badge-red">
                              ✗ Unavailable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleSoftware(s)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                              {s.is_available ? (
                                <ToggleRight
                                  size={18}
                                  className="text-green-500"
                                />
                              ) : (
                                <ToggleLeft size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
