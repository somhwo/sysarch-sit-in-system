import { useEffect, useState, useRef } from "react";
import { FileText, Download, Filter, X } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../lib/api";

function exportPDF(records, filters, labs, students) {
  const labName = filters.lab_room || null;
  const stuName =
    students.find((s) => s.id == filters.student_id)?.full_name || null;
  const now = new Date();
  const genDate = now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build filter description
  const filterParts = [];
  if (labName) filterParts.push(`Laboratory: ${labName}`);
  if (stuName) filterParts.push(`Student: ${stuName}`);
  if (filters.month) filterParts.push(`Month: ${filters.month}`);
  if (filters.date_from) filterParts.push(`From: ${filters.date_from}`);
  if (filters.date_to) filterParts.push(`To: ${filters.date_to}`);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Sit-in Records Report</title>
<style>
  @page { size: A4 landscape; margin: 1.5cm 1.8cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; }
  .header { text-align: center; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 2px solid #7c3aed; }
  .header h1 { font-size: 20px; color: #7c3aed; font-weight: 700; letter-spacing: -0.5px; }
  .header h2 { font-size: 13px; color: #52525b; font-weight: 500; margin-top: 3px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .meta-block { background: #f4f4f5; padding: 8px 14px; border-radius: 8px; }
  .meta-block .key { font-size: 9px; text-transform: uppercase; color: #71717a; letter-spacing: .5px; }
  .meta-block .val { font-size: 12px; font-weight: 600; color: #18181b; margin-top: 2px; }
  .filters { background: #ede9fe; border-left: 3px solid #7c3aed; padding: 7px 12px; border-radius: 0 6px 6px 0; margin-bottom: 14px; font-size: 10px; color: #5b21b6; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #7c3aed; color: white; }
  thead th { padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; }
  tbody tr:nth-child(even) { background: #faf5ff; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #e4e4e7; vertical-align: middle; }
  .mono { font-family: 'Courier New', monospace; font-size: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 600; }
  .badge-purple { background: #ede9fe; color: #6d28d9; }
  .footer { margin-top: 18px; display: flex; justify-content: space-between; color: #71717a; font-size: 9px; border-top: 1px solid #e4e4e7; padding-top: 10px; }
  .summary { display: flex; gap: 16px; margin-bottom: 14px; }
  .stat-card { flex: 1; background: #f9fafb; border: 1px solid #e4e4e7; border-radius: 8px; padding: 10px 14px; }
  .stat-card .n { font-size: 20px; font-weight: 700; color: #7c3aed; }
  .stat-card .l { font-size: 9px; color: #71717a; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
</style>
</head>
<body>
<div class="header">
  <h1>CCS Sit-in Management System</h1>
  <h2>Sit-in Records Report${labName ? ` — ${labName}` : ""}</h2>
</div>

<div class="meta">
  <div class="meta-block">
    <div class="key">Generated On</div>
    <div class="val">${genDate}</div>
  </div>
  <div class="meta-block">
    <div class="key">Total Records</div>
    <div class="val">${records.length}</div>
  </div>
  ${labName ? `<div class="meta-block"><div class="key">Laboratory</div><div class="val">${labName}</div></div>` : ""}
  ${stuName ? `<div class="meta-block"><div class="key">Student</div><div class="val">${stuName}</div></div>` : ""}
</div>

${filterParts.length ? `<div class="filters">Filters applied: ${filterParts.join("  ·  ")}</div>` : ""}

<div class="summary">
  <div class="stat-card">
    <div class="n">${records.length}</div>
    <div class="l">Total Records</div>
  </div>
  <div class="stat-card">
    <div class="n">${new Set(records.map((r) => r.student_id)).size}</div>
    <div class="l">Unique Students</div>
  </div>
  <div class="stat-card">
    <div class="n">${new Set(records.map((r) => r.lab_room)).size}</div>
    <div class="l">Laboratories</div>
  </div>
  <div class="stat-card">
    <div class="n">${new Set(records.map((r) => r.date)).size}</div>
    <div class="l">Unique Days</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>ID Number</th>
      <th>Full Name</th>
      <th>Course / Year</th>
      <th>Purpose</th>
      <th>Laboratory</th>
      <th>PC No.</th>
      <th>Date</th>
      <th>Time In</th>
      <th>Time Out</th>
    </tr>
  </thead>
  <tbody>
    ${records
      .map(
        (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="mono">${r.id_number || ""}</td>
      <td><strong>${r.full_name || ""}</strong></td>
      <td><span class="badge badge-purple">${r.course || ""}</span> Year ${r.year_level || ""}</td>
      <td>${r.purpose || ""}</td>
      <td>${r.lab_room || ""}</td>
      <td class="mono">${r.pc_number || "—"}</td>
      <td>${r.date ? new Date(r.date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "—"}</td>
      <td class="mono">${r.time_in || "—"}</td>
      <td class="mono">${r.time_out || "—"}</td>
    </tr>`,
      )
      .join("")}
  </tbody>
</table>

<div class="footer">
  <span>CCS Sit-in Management System — Confidential</span>
  <span>Generated: ${genDate}</span>
</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.print();
  };
}

export default function AdminRecords() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    lab_room: "",
    student_id: "",
    month: "",
    date_from: "",
    date_to: "",
  });

  const loadData = async () => {
    setLoading(true);
    const params = {};
    if (filters.lab_room) params.lab_room = filters.lab_room;
    if (filters.student_id) params.student_id = filters.student_id;
    if (filters.month) params.month = filters.month;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    try {
      const r = await api.get("/sessions/records", { params });
      setRecords(r.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    api
      .get("/students")
      .then((r) => setStudents(r.data))
      .catch(() => {});
    api
      .get("/labs")
      .then((r) => setLabs(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [
    filters.lab_room,
    filters.student_id,
    filters.month,
    filters.date_from,
    filters.date_to,
  ]);

  const filtered = records.filter((r) => {
    const q = filters.search.toLowerCase();
    return (
      !q ||
      r.full_name?.toLowerCase().includes(q) ||
      r.id_number?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q) ||
      r.pc_number?.toLowerCase().includes(q)
    );
  });

  const clearFilters = () =>
    setFilters({
      search: "",
      lab_room: "",
      student_id: "",
      month: "",
      date_from: "",
      date_to: "",
    });
  const hasActiveFilters =
    filters.lab_room ||
    filters.student_id ||
    filters.month ||
    filters.date_from ||
    filters.date_to;

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Sit-in Records
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Complete history of all sit-in sessions
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="input py-2 text-sm w-44"
              placeholder="Search name, ID..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`btn-secondary text-sm py-2 ${hasActiveFilters ? "ring-2 ring-purple-400" : ""}`}
            >
              <Filter size={14} /> Filters {hasActiveFilters && `(active)`}
            </button>
            <button
              onClick={() => exportPDF(filtered, filters, labs, students)}
              className="btn-primary text-sm py-2"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Filter Records
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Laboratory</label>
                <select
                  className="input text-sm"
                  value={filters.lab_room}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, lab_room: e.target.value }))
                  }
                >
                  <option value="">All Laboratories</option>
                  {labs.map((l) => (
                    <option key={l.id} value={l.room_number}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Student</label>
                <select
                  className="input text-sm"
                  value={filters.student_id}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, student_id: e.target.value }))
                  }
                >
                  <option value="">All Students</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.id_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Month</label>
                <input
                  type="month"
                  className="input text-sm"
                  value={filters.month}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      month: e.target.value,
                      date_from: "",
                      date_to: "",
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Date From</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={filters.date_from}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      date_from: e.target.value,
                      month: "",
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Date To</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={filters.date_to}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      date_to: e.target.value,
                      month: "",
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">
              Loading records...
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700/50 text-xs text-zinc-500 dark:text-zinc-400">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </div>
              <table className="w-full text-sm">
                <thead className="bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                  <tr>
                    {[
                      "#",
                      "ID Number",
                      "Full Name",
                      "Course",
                      "Purpose",
                      "Lab",
                      "PC No.",
                      "Date",
                      "Time In",
                      "Time Out",
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
                  {filtered.map((r, i) => (
                    <tr key={r.id} className="table-row-hover">
                      <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                        {r.id_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {r.full_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-purple">{r.course}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {r.purpose}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {r.lab_room}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {r.pc_number || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {r.date
                          ? new Date(r.date).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {r.time_in}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {r.time_out}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-12 text-zinc-400"
                      >
                        <FileText
                          className="mx-auto mb-2 opacity-30"
                          size={32}
                        />
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
