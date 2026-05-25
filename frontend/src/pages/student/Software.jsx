import { useEffect, useState } from "react";
import {
  Monitor, Search, CheckCircle2, XCircle, ChevronDown, ChevronUp, Building2
} from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import api from "../../lib/api";

const CATEGORIES = ["All", "IDE", "Productivity", "Browser", "Server", "Database", "Design", "Virtualization", "Language Runtime", "General"];

export default function StudentSoftware() {
  const [labs, setLabs] = useState([]);
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedLab, setExpandedLab] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/labs").then(r => setLabs(r.data)),
      api.get("/software").then(r => setSoftware(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = software.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || s.category === category;
    return matchSearch && matchCat;
  });

  const softwareByLab = (labId) => filtered.filter(s => String(s.lab_id) === String(labId));
  const unassigned = filtered.filter(s => !s.lab_id);

  return (
    <StudentLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Lab &amp; Software</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">View lab availability and installed software</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input className="input pl-9 w-60" placeholder="Search software..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === c
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Lab Status Cards */}
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Laboratory Rooms
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="card animate-pulse h-28 bg-zinc-100 dark:bg-zinc-700" />
                ))
              : labs.map(lab => {
                  const swCount = softwareByLab(lab.id).length;
                  const isExpanded = expandedLab === lab.id;
                  return (
                    <button key={lab.id}
                      className={`card text-left cursor-pointer border-2 transition-all ${
                        isExpanded ? "border-purple-400 dark:border-purple-600 shadow-md" : "border-transparent hover:border-purple-200 dark:hover:border-purple-700"
                      }`}
                      onClick={() => setExpandedLab(isExpanded ? null : lab.id)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lab.is_available ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                          <Building2 size={18} className={lab.is_available ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"} />
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-zinc-400 mt-1" /> : <ChevronDown size={14} className="text-zinc-400 mt-1" />}
                      </div>
                      <p className="font-display font-bold text-zinc-900 dark:text-zinc-100 text-sm">{lab.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Room {lab.room_number} · {lab.capacity} seats</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`badge text-xs ${lab.is_available ? "badge-green" : "badge-red"}`}>
                          {lab.is_available ? "Available" : "Unavailable"}
                        </span>
                        <span className="text-xs text-zinc-400">{swCount} software</span>
                      </div>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Expanded Lab Software */}
        {expandedLab && (() => {
          const lab = labs.find(l => l.id === expandedLab);
          const sw = softwareByLab(expandedLab);
          return (
            <div className="card border-l-4 border-l-purple-400">
              <div className="flex items-center justify-between mb-4">
                <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100">
                  Software in {lab?.name} (Room {lab?.room_number})
                </p>
                <span className="text-xs text-zinc-400">{sw.length} installed</span>
              </div>
              {sw.length === 0 ? (
                <p className="text-sm text-zinc-400">No software listed for this lab matching current filters</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sw.map(s => (
                    <div key={s.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-sm ${s.is_available ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 opacity-60"}`}>
                      {s.is_available
                        ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        : <XCircle size={14} className="text-red-400 shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{s.name}</p>
                        {s.version && <p className="text-xs text-zinc-400">v{s.version}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* All Labs software (unassigned) */}
        {unassigned.length > 0 && (
          <div className="card">
            <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Available in All Labs</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {unassigned.map(s => (
                <div key={s.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-sm ${s.is_available ? "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30" : "opacity-60 bg-zinc-50 dark:bg-zinc-700/30 border-zinc-100 dark:border-zinc-700"}`}>
                  {s.is_available
                    ? <CheckCircle2 size={14} className="text-purple-500 shrink-0" />
                    : <XCircle size={14} className="text-zinc-400 shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{s.name}</p>
                    {s.version && <p className="text-xs text-zinc-400">v{s.version}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
