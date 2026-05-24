import { useEffect, useState } from "react";
import {
  Monitor,
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import api from "../../lib/api";

const CATEGORIES = [
  "All",
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

export default function StudentSoftware() {
  const [labs, setLabs] = useState([]);
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedLab, setExpandedLab] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/labs").then((r) => setLabs(r.data)),
      api.get("/software").then((r) => setSoftware(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = software.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || s.category === category;
    return matchSearch && matchCat;
  });

  const softwareByLab = (labId) =>
    filtered.filter((s) => s.lab_id === labId || s.lab_id === String(labId));

  const unassigned = filtered.filter((s) => !s.lab_id);

  return (
    <StudentLayout>
      <div className="max-w-5xl animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Lab & Software
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            View lab availability and installed software
          </p>
        </div>

        {/* Lab Status Cards */}
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Laboratory Rooms
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {loading
              ? [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="card animate-pulse h-24 bg-zinc-100"
                  />
                ))
              : labs.map((lab) => (
                  <div
                    key={lab.id}
                    className={`card cursor-pointer border-2 transition-all ${
                      expandedLab === lab.id
                        ? "border-purple-400 shadow-md"
                        : "border-transparent hover:border-purple-200"
                    }`}
                    onClick={() =>
                      setExpandedLab(expandedLab === lab.id ? null : lab.id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100">
                          {lab.name}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Room {lab.room_number} · {lab.capacity} seats
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {lab.is_available ? (
                          <span className="badge badge-green text-xs">
                            Available
                          </span>
                        ) : (
                          <span className="badge badge-red text-xs">
                            Unavailable
                          </span>
                        )}
                        {expandedLab === lab.id ? (
                          <ChevronUp size={14} className="text-zinc-400" />
                        ) : (
                          <ChevronDown size={14} className="text-zinc-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      {softwareByLab(lab.id).length} software installed
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Expanded Lab Software */}
        {expandedLab && (
          <div className="card border-l-4 border-l-purple-400">
            <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Software in {labs.find((l) => l.id === expandedLab)?.name}
            </p>
            {softwareByLab(expandedLab).length === 0 ? (
              <p className="text-sm text-zinc-400">
                No software listed for this lab
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {softwareByLab(expandedLab).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 text-sm py-1.5"
                  >
                    {s.is_available ? (
                      <CheckCircle
                        size={14}
                        className="text-green-500 shrink-0"
                      />
                    ) : (
                      <XCircle size={14} className="text-red-400  shrink-0" />
                    )}
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {s.name}
                    </span>
                    {s.version && (
                      <span className="text-zinc-400 text-xs">
                        v{s.version}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
