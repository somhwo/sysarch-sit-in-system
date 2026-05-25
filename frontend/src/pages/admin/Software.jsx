import { useEffect, useState } from "react";
import {
  Package, Plus, Trash2, ToggleLeft, ToggleRight,
  Search, Building2, CheckCircle2, XCircle, Edit2, X, Save,
  Layers, Monitor
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../lib/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  "IDE", "Productivity", "Browser", "Server", "Database",
  "Design", "Virtualization", "Language Runtime", "General",
];

const LAB_ROOMS = ['524', '526', '528', '530'];

const CATEGORY_COLORS = {
  "IDE":               "badge-purple",
  "Productivity":      "badge-blue",
  "Browser":           "badge-green",
  "Server":            "badge-yellow",
  "Database":          "badge-red",
  "Design":            "badge-purple",
  "Virtualization":    "badge-blue",
  "Language Runtime":  "badge-green",
  "General":           "badge-yellow",
};

const EMPTY_FORM = { name: "", version: "", category: "IDE", description: "", lab_id: "", is_available: true };

export default function AdminSoftware() {
  const [software, setSoftware] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("software");
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/software").then(r => setSoftware(r.data)),
      api.get("/labs").then(r => setLabs(r.data)),
    ]).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setAdding(true);
    try {
      await api.post("/software", { ...form, lab_id: form.lab_id || null });
      toast.success("Software added");
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch { toast.error("Failed to add"); }
    finally { setAdding(false); }
  };

  const handleToggleSoftware = async (s) => {
    try {
      await api.patch(`/software/${s.id}`, { is_available: !s.is_available });
      setSoftware(prev => prev.map(x => x.id === s.id ? { ...x, is_available: !x.is_available } : x));
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this software?")) return;
    try {
      await api.delete(`/software/${id}`);
      toast.success("Deleted");
      load();
    } catch { toast.error("Failed"); }
  };

  const handleToggleLab = async (lab) => {
    try {
      const res = await api.patch(`/labs/${lab.id}/toggle`);
      setLabs(prev => prev.map(l => l.id === lab.id ? { ...l, is_available: res.data.is_available } : l));
      toast.success(`${lab.name} marked as ${res.data.is_available ? "Available" : "Unavailable"}`);
    } catch { toast.error("Failed to update lab status"); }
  };

  const filtered = software.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.lab_name?.toLowerCase().includes(search.toLowerCase())
  );

  const labsWithCount = labs.map(lab => ({
    ...lab,
    computed_total: software.filter(s => String(s.lab_id) === String(lab.id)).length,
    computed_available: software.filter(s => String(s.lab_id) === String(lab.id) && s.is_available).length,
  }));

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Lab &amp; Software</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Manage software and laboratory availability</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "software", label: "Software Management", icon: Monitor },
            { key: "labs",     label: "Lab Availability",    icon: Building2 },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === key
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === "labs" ? (
          /* ── Lab Availability ── */
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              Toggle laboratory availability. Unavailable labs will not appear in the student reservation system.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {labsWithCount.map(lab => (
                <div key={lab.id} className={`card border-2 transition-all ${
                  lab.is_available ? "border-green-200 dark:border-green-800/50" : "border-red-200 dark:border-red-800/50 opacity-80"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        lab.is_available ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                      }`}>
                        <Building2 size={20} className={lab.is_available ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"} />
                      </div>
                      <div>
                        <p className="font-display font-bold text-zinc-900 dark:text-zinc-100">{lab.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Room {lab.room_number} · {lab.capacity} seats</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="font-semibold text-green-600 dark:text-green-400">{lab.computed_available}</span>/{lab.computed_total} software available
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge ${lab.is_available ? "badge-green" : "badge-red"}`}>
                        {lab.is_available ? "● Available" : "○ Unavailable"}
                      </span>
                      <button
                        onClick={() => handleToggleLab(lab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          lab.is_available
                            ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                            : "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                        }`}
                        title={lab.is_available ? "Mark Unavailable" : "Mark Available"}
                      >
                        {lab.is_available
                          ? <><ToggleRight size={18} className="text-green-500" /> Mark Unavailable</>
                          : <><ToggleLeft size={18} className="text-zinc-400" /> Mark Available</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Software Management ── */
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input className="input pl-9 w-72" placeholder="Search software, category, lab..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={() => setShowForm(v => !v)} className="btn-primary">
                <Plus size={15} /> {showForm ? 'Hide Form' : 'Add Software'}
              </button>
            </div>

            {/* Add Software Form */}
            {showForm && (
              <div className="card mb-6 border-2 border-purple-100 dark:border-purple-800/40">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers size={16} className="text-purple-500" /> Add New Software
                  </h2>
                  <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    <X size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="label">Name *</label>
                    <input className="input" placeholder="e.g. Visual Studio Code"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Version</label>
                    <input className="input" placeholder="e.g. 1.89"
                      value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="col-span-2">
                    <label className="label">Description</label>
                    <input className="input" placeholder="Brief description (optional)"
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Lab Assignment</label>
                    <select className="input" value={form.lab_id} onChange={e => setForm(f => ({ ...f, lab_id: e.target.value }))}>
                      <option value="">All Labs</option>
                      {labs.map(l => <option key={l.id} value={l.id}>{l.name} (Room {l.room_number})</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                    <input type="checkbox" checked={form.is_available}
                      onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                      className="w-4 h-4 accent-purple-500" />
                    Available immediately
                  </label>
                  <button onClick={handleAdd} disabled={adding} className="btn-primary">
                    <Save size={15} /> {adding ? "Adding..." : "Add Software"}
                  </button>
                </div>
              </div>
            )}

            {/* Software table */}
            {loading ? (
              <div className="text-center py-12 text-zinc-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-16 text-zinc-400">
                <Package className="mx-auto mb-2 opacity-30" size={36} />
                <p className="font-medium">No software found</p>
                {search && <p className="text-sm mt-1">Try a different search term</p>}
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</span>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckCircle2 size={12} className="text-green-500" />
                    {software.filter(s => s.is_available).length} available
                    <span className="ml-2">
                      <XCircle size={12} className="text-red-400 inline mr-1" />
                      {software.filter(s => !s.is_available).length} unavailable
                    </span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                    <tr>
                      {["Name", "Version", "Category", "Lab", "Description", "Status", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                    {filtered.map(s => (
                      <tr key={s.id} className="table-row-hover">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">{s.version || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${CATEGORY_COLORS[s.category] || 'badge-purple'}`}>{s.category}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs">
                          {s.lab_name ? `${s.lab_name}` : <span className="italic text-zinc-300 dark:text-zinc-600">All Labs</span>}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs max-w-xs truncate">{s.description || "—"}</td>
                        <td className="px-4 py-3">
                          {s.is_available
                            ? <span className="badge badge-green flex items-center gap-1 w-fit"><CheckCircle2 size={11} /> Available</span>
                            : <span className="badge badge-red flex items-center gap-1 w-fit"><XCircle size={11} /> Unavailable</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleToggleSoftware(s)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                              title={s.is_available ? "Mark Unavailable" : "Mark Available"}>
                              {s.is_available
                                ? <ToggleRight size={18} className="text-green-500" />
                                : <ToggleLeft size={18} />
                              }
                            </button>
                            <button onClick={() => handleDelete(s.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
