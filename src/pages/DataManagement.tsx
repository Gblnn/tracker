import {
  ChevronLeft,
  ChevronRight,
  Database,
  HardDrive,
  List,
  Loader2,
  Users,
  Zap
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  device_user_id: string;
  name: string;
  emp_id: string | null;
  department: string | null;
}

interface CompactPunch {
  user_id: string;
  location: string | null;
  punch_type: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROW_SIZE_BYTES = 185; // Est. Postgres row size (headers + variables + indexing overhead)
const FREE_TIER_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DataManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allPunches, setAllPunches] = useState<CompactPunch[]>([]);

  // Total DB record count
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideZeroPunches] = useState<boolean>(true); // Defaults to hiding employees with 0 punches

  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  // Loading states
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(true);


  // ── Fetch metadata & total counts ──────────────────────────────────────────
  const fetchMetadata = useCallback(async () => {
    setStatsLoading(true);
    try {
      // 1. Fetch total count of punches
      const { count, error: countErr } = await supabase
        .from('punch_details')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;
      setTotalCount(count ?? 0);

      // 2. Fetch list of employees
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id, device_user_id, name, emp_id, department')
        .order('name', { ascending: true });

      if (empErr) throw empErr;
      setEmployees(empData ?? []);

    } catch (err) {
      console.error('Error fetching data metadata:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch all punches' user_id & location for in-memory aggregation ─────────
  const fetchPunches = useCallback(async () => {
    setRecordsLoading(true);
    try {
      let punchesList: CompactPunch[] = [];
      let from = 0;
      let to = 4999;
      let finished = false;

      while (!finished) {
        const { data, error } = await supabase
          .from('punch_details')
          .select('user_id, location, punch_type')
          .range(from, to);

        if (error) throw error;
        if (data && data.length > 0) {
          punchesList = [...punchesList, ...data];
          if (data.length < 5000) {
            finished = true;
          } else {
            from += 5000;
            to += 5000;
          }
        } else {
          finished = true;
        }
      }
      setAllPunches(punchesList);
    } catch (err) {
      console.error('Error fetching all punches:', err);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMetadata();
    fetchPunches();
  }, [fetchMetadata, fetchPunches]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Manual refresh trigger


  // Space calculations
  const totalSpaceUsed = totalCount * ROW_SIZE_BYTES;
  const quotaPercent = parseFloat(((totalSpaceUsed / FREE_TIER_QUOTA_BYTES) * 100).toFixed(3));
  const remainingSpace = Math.max(0, FREE_TIER_QUOTA_BYTES - totalSpaceUsed);

  // Gradient selection based on quota utilization
  const getProgressGradient = () => {
    if (quotaPercent < 50) return 'from-emerald-500 to-teal-500';
    if (quotaPercent < 85) return 'from-amber-400 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  // ── In-Memory Aggregations ──────────────────────────────────────────────────
  const employeeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let matchedPunchesCount = 0;

    for (const p of allPunches) {
      counts[p.user_id] = (counts[p.user_id] || 0) + 1;
      matchedPunchesCount++;
    }

    // Build storage list per employee
    let list = employees.map(emp => {
      const count = counts[emp.device_user_id] || 0;
      const sizeBytes = count * ROW_SIZE_BYTES;
      return {
        emp,
        count,
        sizeBytes,
        percentOfTotal: matchedPunchesCount > 0 ? parseFloat(((count / matchedPunchesCount) * 100).toFixed(2)) : 0
      };
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item =>
        item.emp.name.toLowerCase().includes(q) ||
        (item.emp.emp_id && item.emp.emp_id.toLowerCase().includes(q)) ||
        item.emp.device_user_id.toLowerCase().includes(q)
      );
    }

    // Hide zero punches if checked
    if (hideZeroPunches) {
      list = list.filter(item => item.count > 0);
    }

    // Sort by storage footprint descending
    list.sort((a, b) => b.sizeBytes - a.sizeBytes);

    return {
      list,
      matchedPunchesCount
    };
  }, [allPunches, employees, searchQuery, hideZeroPunches]);

  // Client-Side Pagination for grouped rows
  const totalFilteredCount = employeeStats.list.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  const paginatedList = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return employeeStats.list.slice(from, to);
  }, [employeeStats.list, page, pageSize]);

  // Selection space consumed
  const selectionSpace = useMemo(() => {
    return employeeStats.list.reduce((sum, item) => sum + item.sizeBytes, 0);
  }, [employeeStats.list]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%', padding: '1rem', boxSizing: 'border-box', backgroundColor: '#f9fafb' }}>



      {/* ── QUOTA PROGRESS BAR ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm flex-shrink-0">
        <div style={{ alignItems: "center", border: "", justifyContent: "space-between" }} className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-500" />
            <span style={{ fontSize: "1rem", fontWeight: 500 }} className="font-semibold text-gray-755">Supabase Free Plan Usage</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }} className="text-gray-900">
              {formatSize(totalSpaceUsed)} / 500 MB ({quotaPercent}%)
            </span>
          </div>

          <div style={{ marginRight: "0.75rem" }} className="flex justify-between items-center text-[11px] text-gray-500 font-normal">
            <span className="font-semibold text-teal-500">{formatSize(remainingSpace)} remaining </span>

          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-250/20 mb-2">
          <div
            className={`h-full bg-gradient-to-r ${getProgressGradient()} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(100, quotaPercent)}%` }}
          />
        </div>


      </div>

      {/* ── STATISTICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 flex-shrink-0">
        {/* Card 1: Total Punches */}
        <div style={{ justifyContent: "flex-start" }} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <p style={{ fontWeight: 500 }} className="text-[11px] uppercase text-gray-400 leading-tight">Total Punch Rows</p>
            <h3 style={{ fontWeight: "500", fontSize: "1.25rem" }} className="text-base text-gray-905 mt-0.5">
              {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : totalCount.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Card 2: Total Space */}
        <div style={{ justifyContent: "flex-start" }} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg">
            <HardDrive className="w-8 h-8" />
          </div>
          <div>
            <p style={{ fontWeight: 500 }} className="text-[11px] uppercase font-bold text-gray-400 leading-tight">Total Space (Est.)</p>
            <h3 style={{ fontWeight: "500", fontSize: "1.25rem" }} className="text-base text-gray-905 mt-0.5">
              {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : formatSize(totalSpaceUsed)}
            </h3>
          </div>
        </div>

        {/* Card 3: Filtered Employees Count */}
        <div style={{ justifyContent: "flex-start" }} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p style={{ fontWeight: 500 }} className="text-[11px] uppercase font-bold text-gray-400 leading-tight">Active Employees</p>
            <h3 style={{ fontWeight: "500", fontSize: "1.25rem" }} className="text-base text-gray-905 mt-0.5">
              {recordsLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : totalFilteredCount.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Card 4: Selection Storage */}
        <div style={{ justifyContent: "flex-start" }} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg">
            <List className="w-8 h-8" />
          </div>
          <div>
            <p style={{ fontWeight: 505 }} className="text-[11px] uppercase font-bold text-gray-400 leading-tight">Selection Usage</p>
            <h3 style={{ fontWeight: "500", fontSize: "1.25rem" }} className="text-base text-gray-905 mt-0.5">
              {recordsLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : formatSize(selectionSpace)}
            </h3>
          </div>
        </div>
      </div>

      {/* ── RECORDS TABLE AREA ── */}
      <div className="bg-white border border-gray-200 rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm">

        {/* Table Body Container */}
        <div style={{ width: "100%" }} className="flex-1 overflow-auto">
          <table style={{ width: "100%" }} className="w-full border-collapse text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5 w-12 text-center text-[10px] font-bold uppercase tracking-wider">#</th>

                {/* Employee Details Column Header with Integrated Search Bar */}
                <th className="px-4 py-1.5 min-w-[280px]">
                  <div className="flex items-center justify-between gap-4">

                    <div className="relative flex-1">

                      <input
                        style={{ width: "100%", padding: "0.5rem", paddingLeft: "1rem", fontSize: "0.9rem" }}
                        type="text"
                        placeholder="Search employee or ID..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full text-xs font-normal border border-gray-200 rounded-lg pl-8 pr-2 py-1 outline-none bg-white focus:border-indigo-400 transition-colors normal-case tracking-normal"
                      />
                    </div>
                  </div>
                </th>

                <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider w-32">Punches Count</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider w-40">Estimated Space</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Database Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 bg-white">
              {recordsLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-405">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                    Loading and aggregating database space records…
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-405">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const sequentialIndex = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-center text-gray-450 font-mono">{sequentialIndex}</td>
                      <td style={{ fontSize: "0.8rem", fontWeight: 500 }} className="px-4 py-2.5 text-gray-900">
                        <div className="capitalize">{item.emp.name.toLowerCase()}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          Device PIN: {item.emp.device_user_id} {item.emp.emp_id ? `· ID: ${item.emp.emp_id}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-805">
                        {item.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold font-mono text-indigo-650">
                        {formatSize(item.sizeBytes)}
                      </td>
                      <td style={{ border: "", display: "flex" }} className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                            <div className="h-full bg-teal-500 rounded-full animate-pulse" style={{ width: `${item.percentOfTotal}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-gray-500 font-semibold">{item.percentOfTotal}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        {!recordsLoading && totalFilteredCount > 0 && (
          <div style={{ width: "100%", justifyContent: "space-between" }} className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-gray-505">
              Showing <span className="font-semibold text-gray-800">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-gray-800">
                {Math.min(page * pageSize, totalFilteredCount)}
              </span>{' '}
              of <span className="font-semibold text-gray-800">{totalFilteredCount.toLocaleString()}</span> entries
            </span>

            <div className="inline-flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center justify-center p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center justify-center p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
