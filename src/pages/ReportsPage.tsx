import { Download, Loader2, MapPin, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/utilis';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationStat {
  location: string;
  total_punches: number;
  unique_employees: number;
  check_ins: number;
  check_outs: number;
}

interface EmployeeStat {
  user_id: string;
  employee_name: string | null;
  department: string | null;
  total_punches: number;
  first_in: string | null;
  last_out: string | null;
  locations: string[];
}

interface PunchDetail {
  id: number;
  user_id: string;
  punch_time: string;
  punch_type: number;
  device_serial: string;
  employee_name: string | null;
  department: string | null;
  location: string | null;
}

type Tab = 'location' | 'employee';
type RangeMode = 'single' | 'range';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-OM', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Muscat'
  });
}

// function formatDate(iso: string): string {
//   return new Date(iso).toLocaleDateString('en-OM', {
//     day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Muscat'
//   });
// }

function downloadCSV(data: object[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify((row as Record<string, unknown>)[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('location');
  const [rangeMode, setRangeMode] = useState<RangeMode>('single');
  const [date, setDate] = useState(todayISO());
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [punches, setPunches] = useState<PunchDetail[]>([]);

  const startDate = rangeMode === 'single' ? date : dateFrom;
  const endDate = rangeMode === 'single' ? date : dateTo;

  const fetchPunches = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('punch_details')
      .select('*')
      .gte('punch_time', `${startDate}T00:00:00`)
      .lte('punch_time', `${endDate}T23:59:59`)
      .order('punch_time', { ascending: false });

    if (err) setError(err.message);
    else setPunches(data ?? []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { fetchPunches(); }, [fetchPunches]);

  // ── Location stats ──────────────────────────────────────────────────────────
  const locationStats: LocationStat[] = (() => {
    const map = new Map<string, LocationStat>();
    for (const p of punches) {
      const loc = p.location ?? 'Unknown';
      if (!map.has(loc)) {
        map.set(loc, { location: loc, total_punches: 0, unique_employees: 0, check_ins: 0, check_outs: 0 });
      }
      const s = map.get(loc)!;
      s.total_punches++;
      if (p.punch_type === 0) s.check_ins++;
      else s.check_outs++;
    }
    // Count unique employees per location
    for (const [loc, stat] of map.entries()) {
      const ids = new Set(punches.filter(p => (p.location ?? 'Unknown') === loc).map(p => p.user_id));
      stat.unique_employees = ids.size;
    }
    return [...map.values()].sort((a, b) => b.total_punches - a.total_punches);
  })();

  // ── Employee stats ──────────────────────────────────────────────────────────
  const employeeStats: EmployeeStat[] = (() => {
    const map = new Map<string, EmployeeStat>();
    for (const p of punches) {
      if (!map.has(p.user_id)) {
        map.set(p.user_id, {
          user_id: p.user_id,
          employee_name: p.employee_name,
          department: p.department,
          total_punches: 0,
          first_in: null,
          last_out: null,
          locations: [],
        });
      }
      const s = map.get(p.user_id)!;
      s.total_punches++;
      if (p.punch_type === 0) {
        if (!s.first_in || p.punch_time < s.first_in) s.first_in = p.punch_time;
      } else {
        if (!s.last_out || p.punch_time > s.last_out) s.last_out = p.punch_time;
      }
      if (p.location && !s.locations.includes(p.location)) s.locations.push(p.location);
    }
    return [...map.values()].sort((a, b) => b.total_punches - a.total_punches);
  })();

  const totalUnique = new Set(punches.map(p => p.user_id)).size;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          {/* <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
          </div> */}

          {/* Date controls */}
          <div className="flex items-center gap-2 flex-wrap" style={{display:"flex", flexFlow:"column"}}>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['single', 'range'] as RangeMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setRangeMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                    rangeMode === m ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500'
                  }`}
                >
                  {m === 'single' ? 'Single day' : 'Date range'}
                </button>
              ))}
            </div>

            {rangeMode === 'single' ? (
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg ">
                
                <input
                  type="date" value={date}
                  onChange={e => setDate(e.target.value)}
                  className="outline-none bg-transparent text-sm text-gray-700 cursor-pointer"
                  style={{textAlign:"center"}}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                  
                  <input
                    type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="outline-none bg-transparent text-sm text-gray-700 cursor-pointer"
                  />
                </div>
                <span className="text-gray-400 text-sm">to</span>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                  
                  <input
                    type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="outline-none bg-transparent text-sm text-gray-700 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Total punches
            </div>
            <div className="text-3xl font-semibold text-gray-900">{punches.length}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Unique employees
            </div>
            <div className="text-3xl font-semibold text-gray-900">{totalUnique}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Locations active
            </div>
            <div className="text-3xl font-semibold text-gray-900">{locationStats.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {([['location', 'By Location'], ['employee', 'By Employee']] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Download CSV */}
          <button
            onClick={() => {
              if (tab === 'location') downloadCSV(locationStats, `location-report-${startDate}.csv`);
              else downloadCSV(employeeStats.map(e => ({
                employee: e.employee_name ?? e.user_id,
                department: e.department ?? '—',
                total_punches: e.total_punches,
                first_in: e.first_in ? formatTime(e.first_in) : '—',
                last_out: e.last_out ? formatTime(e.last_out) : '—',
                locations: e.locations.join(' | '),
              })), `employee-report-${startDate}.csv`);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : tab === 'location' ? (
            <LocationTable stats={locationStats} />
          ) : (
            <EmployeeReportTable stats={employeeStats} rangeMode={rangeMode} />
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          All times in Asia/Muscat (GMT+4)
        </p>
      </div>
    </div>
  );
}

// ─── Location Table ───────────────────────────────────────────────────────────

function LocationTable({ stats }: { stats: LocationStat[] }) {
  if (!stats.length) return (
    <div className="text-center py-12 text-gray-400 text-sm">No data for this period.</div>
  );
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Location</th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Unique Employees</th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Check-ins</th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Check-outs</th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Total Punches</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {stats.map((s) => (
          <tr key={s.location} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <span className="font-medium text-gray-900">{s.location}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-gray-700">{s.unique_employees}</td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                {s.check_ins}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                {s.check_outs}
              </span>
            </td>
            <td className="px-4 py-3 font-medium text-gray-900">{s.total_punches}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Employee Report Table ────────────────────────────────────────────────────

function EmployeeReportTable({ stats, rangeMode }: { stats: EmployeeStat[], rangeMode: RangeMode }) {
  if (!stats.length) return (
    <div className="text-center py-12 text-gray-400 text-sm">No data for this period.</div>
  );
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Employee</th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Department</th>
          {rangeMode === 'single' && <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">First In</th>}
          {rangeMode === 'single' && <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Last Out</th>}
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Total Punches</th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Locations</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {stats.map((s) => (
          <tr key={s.user_id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
              <div className="font-medium text-gray-900">{s.employee_name ?? s.user_id}</div>
            </td>
            <td className="px-4 py-3 text-gray-500">{s.department ?? '—'}</td>
            {rangeMode === 'single' && <td className="px-4 py-3 tabular-nums text-gray-700">{formatTime(s.first_in)}</td>}
            {rangeMode === 'single' && <td className="px-4 py-3 tabular-nums text-gray-700">{formatTime(s.last_out)}</td>}
            <td className="px-4 py-3 font-medium text-gray-900">{s.total_punches}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {s.locations.length ? s.locations.map(loc => (
                  <span key={loc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    <MapPin className="w-2.5 h-2.5" />{loc}
                  </span>
                )) : <span className="text-gray-400">—</span>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
