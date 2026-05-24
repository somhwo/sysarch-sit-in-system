import { useState, useEffect } from 'react';
import { Monitor, CalendarDays, XCircle, AlertTriangle } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PURPOSES = ['C# Programming','C Programming','Java Programming','ASP.Net Programming','PHP Programming','Python Programming','Database Management','Web Development','Other'];
const TOTAL    = 50;
const COLS     = [[1,2,3,4,5,6,7,8],[9,10,11,12,13,14,15,16],[17,18,19,20,21,22,23,24],[25,26,27,28,29,30,31,32],[33,34,35,36,37,38,39,40],[41,42,43,44,45,46,47,48],[49,50]];
const pad = n => String(n).padStart(2,'0');

const STATUS_BADGE = {
  Pending:   'badge-yellow',
  Approved:  'badge-green',
  Cancelled: 'badge-red',
  Active:    'badge-purple',
};

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
}

function PCCard({ number, unavailable, selected, onClick }) {
  return (
    <button onClick={onClick} disabled={unavailable}
      className={['group flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-150 w-14',
        unavailable ? 'border-red-300 dark:border-red-800/70 bg-red-50 dark:bg-red-950/50 cursor-not-allowed pointer-events-none'
        : selected  ? 'border-purple-700 bg-purple-50 dark:bg-purple-900/30 shadow-md cursor-pointer'
                    : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer'
      ].join(' ')}>
      <Monitor size={20} className={unavailable?'text-red-400 dark:text-red-500':selected?'text-purple-700 dark:text-purple-400':'text-zinc-400 group-hover:text-purple-500'} />
      <span className={['text-[10px] font-semibold',unavailable?'text-red-400 dark:text-red-500':selected?'text-purple-700 dark:text-purple-400':'text-zinc-400'].join(' ')}>
        PC {pad(number)}
      </span>
      {unavailable && (
        <span className="text-[8px] font-bold text-red-500 dark:text-red-400 leading-none uppercase tracking-wide">Taken</span>
      )}
    </button>
  );
}

export default function StudentReservation() {
  const [labs, setLabs]               = useState([]);
  const [availableLabs, setAvailableLabs] = useState([]);
  const [selectedPC, setSelectedPC]   = useState(null);
  const [unavailable, setUnavailable] = useState([]);
  const [form, setForm]               = useState({ purpose:PURPOSES[0], lab_room:'', date:'', time_preferred:'' });
  const [submitting, setSubmitting]   = useState(false);
  const [myRes, setMyRes]             = useState([]);
  const [cancelling, setCancelling]   = useState(null);

  const loadMy = () => api.get('/reservations/my').then(r => setMyRes(r.data)).catch(()=>{});

  useEffect(() => {
    api.get('/labs').then(r => {
      const all = r.data;
      setLabs(all);
      const avail = all.filter(l => l.is_available);
      setAvailableLabs(avail);
      if (avail.length > 0) setForm(f => ({...f, lab_room: avail[0].room_number}));
    }).catch(()=>{});
    loadMy();
  }, []);

  useEffect(() => {
    if (!form.date || !form.lab_room) { setUnavailable([]); return; }

    const fetchAvailability = () => {
      const params = new URLSearchParams({ date: form.date, lab_room: form.lab_room });
      if (form.time_preferred) params.set('time_preferred', form.time_preferred);
      api.get(`/reservations/availability?${params}`).then(r => {
        const taken = r.data.taken || [];
        setUnavailable(taken);
        if (selectedPC && taken.includes(selectedPC)) setSelectedPC(null);
      }).catch(() => {});
    };

    fetchAvailability();
    // Poll every 15 seconds for real-time updates
    const interval = setInterval(fetchAvailability, 15000);
    return () => clearInterval(interval);
  }, [form.date, form.lab_room, form.time_preferred]);

  const handleSubmit = async () => {
    if (!selectedPC)          { toast.error('Please select a PC'); return; }
    if (!form.date)           { toast.error('Please pick a date'); return; }
    if (!form.time_preferred) { toast.error('Please pick a time'); return; }
    if (!form.lab_room)       { toast.error('No available labs'); return; }
    setSubmitting(true);
    try {
      await api.post('/reservations', { ...form, pc_number:`PC-${pad(selectedPC)}` });
      toast.success('Reservation submitted!');
      setSelectedPC(null);
      setForm(f => ({ ...f, date:'', time_preferred:'' }));
      loadMy();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.patch(`/reservations/${id}/cancel`);
      toast.success('Reservation cancelled');
      loadMy();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCancelling(null); }
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Reserve a Seat</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Pick your lab, PC, date and time</p>
        </div>

        {availableLabs.length === 0 && !labs.length ? null : availableLabs.length === 0 ? (
          <div className="card border-2 border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/10 flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">No laboratories currently available</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-0.5">All labs are temporarily unavailable. Please check back later or contact the administrator.</p>
            </div>
          </div>
        ) : null}

        {availableLabs.length > 0 && (
          <div className="grid grid-cols-3 gap-6 items-start">
            {/* PC Grid */}
            <div className="col-span-2 card p-5 dark:bg-zinc-800">
              <div className="flex items-center gap-5 mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-red-300 bg-red-50 dark:bg-red-950/50 dark:border-red-800/70 inline-block" /> Unavailable</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 inline-block" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-purple-700 bg-purple-50 inline-block" /> Selected</span>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {COLS.map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-2">
                    {col.map(n => (
                      <PCCard key={n} number={n}
                        unavailable={unavailable.includes(n)}
                        selected={selectedPC===n}
                        onClick={() => setSelectedPC(n)} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700 text-sm text-center text-zinc-500 dark:text-zinc-400">
                {selectedPC
                  ? <span className="text-purple-700 dark:text-purple-400 font-semibold">PC {pad(selectedPC)} selected</span>
                  : <span>Click an available seat above</span>}
              </div>
            </div>

            {/* Form */}
            <div className="card space-y-4 dark:bg-zinc-800">
              <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100">Reservation Details</h2>
              <div>
                <label className="label">Purpose</label>
                <select className="input" value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}>
                  {PURPOSES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Lab Room</label>
                <select className="input" value={form.lab_room} onChange={e=>setForm(f=>({...f,lab_room:e.target.value}))}>
                  {availableLabs.map(l=><option key={l.id} value={l.room_number}>{l.name} (Room {l.room_number})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" min={new Date().toISOString().split('T')[0]}
                  value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </div>
              <div>
                <label className="label">Preferred Time</label>
                <input type="time" className="input" value={form.time_preferred}
                  onChange={e=>setForm(f=>({...f,time_preferred:e.target.value}))} />
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
                <Monitor size={18} className={selectedPC?'text-purple-600 dark:text-purple-400':'text-zinc-300 dark:text-zinc-600'} />
                <div>
                  <p className="text-xs text-zinc-400">Selected PC</p>
                  <p className={`text-sm font-semibold ${selectedPC?'text-purple-700 dark:text-purple-400':'text-zinc-400'}`}>
                    {selectedPC ? `PC ${pad(selectedPC)}` : 'None'}
                  </p>
                </div>
              </div>
              <button onClick={handleSubmit}
                disabled={submitting||!selectedPC||!form.date||!form.time_preferred}
                className="btn-primary w-full justify-center">
                <CalendarDays size={15} /> {submitting?'Submitting...':'Submit Reservation'}
              </button>
            </div>
          </div>
        )}

        {/* My Reservations */}
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">My Reservations</h2>
          {myRes.length === 0 ? (
            <div className="card text-center py-12 text-zinc-400">
              <CalendarDays className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-sm">No reservations yet</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700">
                  <tr>
                    {['Date','Time','Lab','PC','Purpose','Status','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                  {myRes.map(r => (
                    <tr key={r.id} className="table-row-hover">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">{r.time_preferred}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">Lab {r.lab_room}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{r.pc_number}</td>
                      <td className="px-4 py-3"><span className="badge badge-purple">{r.purpose}</span></td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_BADGE[r.status]||'badge-yellow'}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'Pending' || r.status === 'Approved' ? (
                          <button onClick={() => handleCancel(r.id)} disabled={cancelling===r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800/40 text-xs font-medium transition-colors disabled:opacity-40">
                            <XCircle size={12} /> Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
