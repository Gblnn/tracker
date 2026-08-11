import { useAuth } from '@/components/AuthProvider';
import { ResponsiveModal } from '@/components/responsive-modal';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleMinus,
  CloudDownload,
  Database,
  Disc,
  HardDrive,
  Laptop,
  List,
  Loader2,
  Smartphone,
  Users,
  X,
  Zap
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { MonthPicker } from '../components/month-picker';
import { supabase } from '../lib/supabase';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  device_user_id: string;
  name: string;
  emp_id: string | null;
  department: string | null;
  fingerprint_templates?: Record<string, any> | null;
  face_templates?: Record<string, any> | null;
}

function getEmployeeTemplatesSize(emp: Employee): number {
  let totalBytes = 0;
  if (emp.fingerprint_templates) {
    Object.values(emp.fingerprint_templates).forEach((val: any) => {
      if (val && val.template) {
        totalBytes += val.template.length;
      }
    });
  }
  if (emp.face_templates) {
    Object.values(emp.face_templates).forEach((val: any) => {
      if (val && val.template) {
        totalBytes += val.template.length;
      }
    });
  }
  return totalBytes;
}

function getEmployeeTemplatesCount(emp: Employee): number {
  const fingerprintCount = emp.fingerprint_templates
    ? Object.values(emp.fingerprint_templates).filter((val: any) => val && val.template).length
    : 0;
  const faceCount = emp.face_templates
    ? Object.values(emp.face_templates).filter((val: any) => val && val.template).length
    : 0;
  return fingerprintCount + faceCount;
}

interface CompactPunch {
  user_id: string;
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

  // Selected employee for detail view modal
  const [selectedEmpForPunches, setSelectedEmpForPunches] = useState<Employee | null>(null);
  const [empPunches, setEmpPunches] = useState<any[]>([]);
  const [loadingEmpPunches, setLoadingEmpPunches] = useState<boolean>(false);
  const [deletingPunchId, setDeletingPunchId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState<boolean>(false);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [downloadingMonth, setDownloadingMonth] = useState<boolean>(false);
  const [clearingMonth, setClearingMonth] = useState<boolean>(false);

  const { userData } = useAuth();

  const canEditAttendance = useMemo(() => {
    try {
      const permissions = JSON.parse(userData?.clearance || "{}") as Record<string, boolean>;
      const hasStructuredClearance = Object.keys(permissions).length > 0;
      const hasAttendanceModule = permissions.attendance === true;
      const hasAttendanceEdit = permissions.attendance_edit === true;
      const hasExplicitEditBlock = permissions.attendance_edit === false;

      if (hasAttendanceModule) {
        return hasAttendanceEdit;
      }

      if (permissions.attendance === false || hasExplicitEditBlock) {
        return false;
      }

      if (userData?.role === "admin" || userData?.role === "site_admin") {
        return !hasStructuredClearance;
      }

      return false;
    } catch {
      return userData?.role === "admin" || userData?.role === "site_admin";
    }
  }, [userData]);


  // ── Fetch metadata & total counts ──────────────────────────────────────────
  const fetchMetadata = useCallback(async () => {
    setStatsLoading(true);
    try {
      // 1. Fetch total count of punches
      const { count, error: countErr } = await supabase
        .from('punches')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;
      setTotalCount(count ?? 0);

      // 2. Fetch list of employees
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id, device_user_id, name, emp_id, department, fingerprint_templates, face_templates')
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
      let to = 999;
      let finished = false;

      while (!finished) {
        const { data, error } = await supabase
          .from('punches')
          .select('user_id')
          .range(from, to);

        if (error) throw error;
        if (data && data.length > 0) {
          punchesList = [...punchesList, ...data];
          if (data.length < 1000) {
            finished = true;
          } else {
            from += 1000;
            to += 1000;
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

  const fetchEmpPunches = useCallback(async (userId: string) => {
    setLoadingEmpPunches(true);
    try {
      const { data, error } = await supabase
        .from('punches')
        .select('*')
        .eq('user_id', userId)
        .order('punch_time', { ascending: false });

      if (error) throw error;
      setEmpPunches(data ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch punches');
    } finally {
      setLoadingEmpPunches(false);
    }
  }, []);

  // Keep a local cached employee to prevent content flashing blank during close transition
  const [cachedEmp, setCachedEmp] = useState<Employee | null>(null);

  useEffect(() => {
    if (selectedEmpForPunches) {
      setCachedEmp(selectedEmpForPunches);
    }
  }, [selectedEmpForPunches]);

  const displayEmp = selectedEmpForPunches || cachedEmp;

  useEffect(() => {
    if (selectedEmpForPunches) {
      fetchEmpPunches(selectedEmpForPunches.device_user_id);
    } else {
      setEmpPunches([]);
    }
  }, [selectedEmpForPunches, fetchEmpPunches]);

  const handleDeletePunch = async (punchId: number) => {
    if (!confirm('Are you sure you want to delete this punch record?')) return;
    setDeletingPunchId(punchId);
    try {
      const { data, error } = await supabase
        .from('punches')
        .delete()
        .eq('id', punchId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Permission denied. Please verify your Supabase Row Level Security (RLS) policies allow DELETE actions on the "punches" table for public/anon clients.');
      }

      toast.success('Punch log deleted successfully');
      setEmpPunches(prev => prev.filter(p => p.id !== punchId));
      fetchMetadata(); // update total row count
      fetchPunches(); // update aggregations
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete punch log');
    } finally {
      setDeletingPunchId(null);
    }
  };

  const handleDeleteAllPunches = async () => {
    const activeEmp = selectedEmpForPunches || cachedEmp;
    if (!activeEmp) return;
    const msg = `WARNING: Are you sure you want to delete ALL (${empPunches.length}) punch records for ${activeEmp.name}? This action cannot be undone.`;
    if (!confirm(msg)) return;
    setDeletingAll(true);
    try {
      const { data, error } = await supabase
        .from('punches')
        .delete()
        .eq('user_id', activeEmp.device_user_id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Permission denied. Please verify your Supabase Row Level Security (RLS) policies allow DELETE actions on the "punches" table for public/anon clients.');
      }

      toast.success('All punch logs deleted successfully');
      setEmpPunches([]);
      fetchMetadata(); // update total row count
      fetchPunches(); // update aggregations
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete all punch logs');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDownloadMonthlyPunches = async () => {
    if (!selectedMonth) return;
    setDownloadingMonth(true);
    try {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const yr = parseInt(yearStr);
      const mo = parseInt(monthStr);
      const start = `${yearStr}-${monthStr}-01T00:00:00Z`;
      const end = new Date(yr, mo, 1).toISOString();

      let punchesList: any[] = [];
      let from = 0;
      let to = 999;
      let finished = false;

      while (!finished) {
        const { data, error } = await supabase
          .from('punches')
          .select('*')
          .gte('punch_time', start)
          .lt('punch_time', end)
          .range(from, to);

        if (error) throw error;
        if (data && data.length > 0) {
          punchesList = [...punchesList, ...data];
          if (data.length < 1000) {
            finished = true;
          } else {
            from += 1000;
            to += 1000;
          }
        } else {
          finished = true;
        }
      }

      if (punchesList.length === 0) {
        toast.info('No punch records found for the selected month');
        return;
      }

      const employeeMap = new Map(employees.map(e => [e.device_user_id, e]));
      const rows = punchesList.map(p => {
        const emp = employeeMap.get(p.user_id);
        const verifyMethod = getVerifyTypeName(p.verify_type);
        const punchType = p.punch_type === 0 ? 'IN' : 'OUT';
        return {
          'Punch ID': p.id,
          'Employee Name': emp ? emp.name : 'Unmapped Device User',
          'HR Employee ID': emp ? emp.emp_id : 'N/A',
          'Device User ID': p.user_id,
          'Punch Time': new Date(p.punch_time).toLocaleString(),
          'Punch Type': punchType,
          'Verify Method': verifyMethod,
          'Source/Location': p.mobile_location ? (p.location || 'Mobile') : (p.device_serial || 'Device')
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Punches');
      XLSX.writeFile(workbook, `Punches_${selectedMonth}.xlsx`);
      toast.success(`Successfully downloaded ${punchesList.length} punch records.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download monthly punch data');
    } finally {
      setDownloadingMonth(false);
    }
  };

  const handleClearMonthlyPunches = async () => {
    if (!selectedMonth) return;
    if (!canEditAttendance) {
      toast.error('Permission denied: You do not have permission to delete punch records.');
      return;
    }

    const [yearStr, monthStr] = selectedMonth.split('-');
    const yr = parseInt(yearStr);
    const mo = parseInt(monthStr);
    const monthName = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const msg = `WARNING: This will permanently delete ALL punch records for the month of ${monthName}.\nThis action CANNOT be undone.\n\nTo proceed, please type 'DELETE' in all uppercase:`;
    const confirmInput = prompt(msg);

    if (confirmInput !== 'DELETE') {
      if (confirmInput !== null) {
        toast.error('Confirmation mismatch. Deletion aborted.');
      }
      return;
    }

    setClearingMonth(true);
    try {
      const start = `${yearStr}-${monthStr}-01T00:00:00Z`;
      const end = new Date(yr, mo, 1).toISOString();

      const { data, error } = await supabase
        .from('punches')
        .delete()
        .gte('punch_time', start)
        .lt('punch_time', end)
        .select();

      if (error) throw error;

      const deletedCount = data ? data.length : 0;
      toast.success(`Successfully deleted ${deletedCount} punch records for ${monthName}.`);
      fetchMetadata(); // update counts
      fetchPunches(); // update cache
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear punch records');
    } finally {
      setClearingMonth(false);
    }
  };

  const getVerifyTypeName = (type: number): string => {
    switch (type) {
      case 1: return 'Fingerprint';
      case 4: return 'Card';
      case 15: return 'Face';
      case 0: return 'Mobile / App';
      default: return `Type ${type}`;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Manual refresh trigger


  const totalBiometricsSpace = useMemo(() => {
    return employees.reduce((sum, emp) => sum + getEmployeeTemplatesSize(emp), 0);
  }, [employees]);

  // Space calculations
  const totalSpaceUsed = totalCount * ROW_SIZE_BYTES + totalBiometricsSpace;
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

    const employeeUserIds = new Set(employees.map(e => e.device_user_id));

    // Build storage list per employee
    let list = employees.map(emp => {
      const count = counts[emp.device_user_id] || 0;
      const templateSize = getEmployeeTemplatesSize(emp);
      const templateCount = getEmployeeTemplatesCount(emp);
      const sizeBytes = count * ROW_SIZE_BYTES + templateSize;
      return {
        emp,
        count,
        templateCount,
        templateSize,
        sizeBytes,
        percentOfTotal: matchedPunchesCount > 0 ? parseFloat(((count / matchedPunchesCount) * 100).toFixed(2)) : 0
      };
    });

    // Add unmapped/orphaned device user IDs
    Object.entries(counts).forEach(([userId, count]) => {
      if (!employeeUserIds.has(userId)) {
        const sizeBytes = count * ROW_SIZE_BYTES;
        list.push({
          emp: {
            id: -parseInt(userId) || -Math.floor(Math.random() * 1000000), // unique negative id
            device_user_id: userId,
            name: `Unmapped Device User (ID: ${userId})`,
            emp_id: 'N/A',
            department: 'Unmapped / Orphaned'
          },
          count,
          templateCount: 0,
          templateSize: 0,
          sizeBytes,
          percentOfTotal: matchedPunchesCount > 0 ? parseFloat(((count / matchedPunchesCount) * 100).toFixed(2)) : 0
        });
      }
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%', padding: '1rem', boxSizing: 'border-box', backgroundColor: '#f9fafb' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out forwards;
        }
      ` }} />



      {/* ── QUOTA PROGRESS BAR ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm flex-shrink-0">
        <div style={{ alignItems: "center", border: "", justifyContent: "space-between" }} className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-500 animate-pulse" />
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
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 mb-1">
          <div
            className={`h-full bg-gradient-to-r ${getProgressGradient()} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(100, quotaPercent)}%` }}
          />
        </div>
      </div>

      {/* ── STATISTICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 flex-shrink-0">


        {/* Card 5: Monthly Actions */}
        <div style={{ justifyContent: "flex-start" }} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg shrink-0">
            <Disc className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 505 }} className="text-[11px] uppercase font-bold text-gray-400 leading-tight">Manage</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap" style={{ justifyContent: "flex-start", alignItems: "center" }}>
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
              <button
                onClick={handleDownloadMonthlyPunches}
                disabled={downloadingMonth || statsLoading || recordsLoading}
                className="h-7 w-7 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 text-teal-600 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 border-0"
                title="Download Excel Report for selected month"
              >
                {downloadingMonth ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudDownload className="w-3.5 h-3.5" />
                )}
              </button>
              {canEditAttendance && (
                <button
                  onClick={handleClearMonthlyPunches}
                  disabled={clearingMonth || statsLoading || recordsLoading}
                  className="h-7 w-7 disabled:opacity-50 text-red-655 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 border-0"
                  title="Purge database punch records for selected month"
                >
                  {clearingMonth ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  ) : (
                    <CircleMinus className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Card 1: Total Punches */}
        <div style={{ justifyContent: "flex-start" }} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg shrink-0">
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
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg shrink-0">
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
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg shrink-0">
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
          <div className="p-2.5 bg-teal-50 text-teal-500 rounded-lg shrink-0">
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
        <div style={{ width: "100%" }} className="flex-1 overflow-auto animate-fade-in">
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
                <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider w-40">Templates</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider w-40">Estimated Space</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Database Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 bg-white">
              {recordsLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-405">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                    Loading and aggregating database space records…
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-405">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const sequentialIndex = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={item.emp.id}
                      onClick={() => setSelectedEmpForPunches(item.emp)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      title="Click to view and manage punch logs"
                    >
                      <td className="px-4 py-2.5 text-center text-gray-450 font-mono">{sequentialIndex}</td>
                      <td style={{ fontSize: "0.8rem", fontWeight: 500 }} className="px-4 py-2.5 text-gray-900">
                        <div className="capitalize">{item.emp.name.toLowerCase()}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          Device ID: {item.emp.device_user_id} {item.emp.emp_id ? `· ID: ${item.emp.emp_id}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-805">
                        {item.count.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: "500" }} className="px-4 py-2.5 text-center font-mono text-gray-700">
                        <div>{formatSize(item.templateSize)}</div>
                        <div style={{ fontSize: '9px', fontWeight: 'normal', color: '#6b7280', fontFamily: 'sans-serif', textTransform: 'none', marginTop: '2px' }}>
                          {item.templateCount} template{item.templateCount === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td style={{ fontWeight: "500" }} className="px-4 py-2.5 text-center font-mono text-indigo-650">
                        <div>{formatSize(item.sizeBytes)}</div>
                        {/* {item.templateSize > 0 && (
                          <div style={{ fontSize: '9px', fontWeight: 'normal', color: '#6b7280', fontFamily: 'sans-serif', textTransform: 'none', marginTop: '2px' }}>
                            (incl. templates {formatSize(item.templateSize)})
                          </div>
                        )} */}
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

      <ResponsiveModal
        open={!!selectedEmpForPunches}
        onOpenChange={(open) => { if (!open) setSelectedEmpForPunches(null); }}
        title=""
        description=""
        hideHeader
        contentStyle={{ padding: 0, width: '100%', maxWidth: '650px' }}
      >
        {displayEmp && (
          <div style={{ width: '100%', height: '500px', display: 'flex', flexDirection: 'column' }} className="overflow-hidden bg-white rounded-2xl">
            {/* Modal Header */}
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Database className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 capitalize">
                    {displayEmp.name.toLowerCase()}'s Punches
                  </h2>
                  <p className="text-xs text-gray-400">
                    Device ID: {displayEmp.device_user_id} · {empPunches.length} total records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEditAttendance && empPunches.length > 0 && (
                  <button
                    style={{ marginRight: "0.5rem" }}
                    onClick={handleDeleteAllPunches}
                    disabled={deletingAll || loadingEmpPunches}
                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-655 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <CircleMinus className="w-3.5 h-3.5 text-red-600" />
                    Purge All
                  </button>
                )}
                <button onClick={() => setSelectedEmpForPunches(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden p-4 flex flex-col">
              {loadingEmpPunches ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-500 mb-2" />
                  <span>Fetching historical punch logs...</span>
                </div>
              ) : empPunches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                  <span className="text-sm font-medium">No punches found</span>
                  <span className="text-xs text-gray-400">This user has no punch records stored in the database.</span>
                </div>
              ) : (
                <div style={{ width: '100%', flex: 1 }} className="border border-gray-150 rounded-xl overflow-auto shadow-xs">
                  <table style={{ width: '100%' }} className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Date & Time</th>
                        <th className="px-4 py-2 font-semibold">Type</th>
                        <th className="px-4 py-2 font-semibold">Verify Method</th>
                        <th className="px-4 py-2 font-semibold">Source/Location</th>
                        {canEditAttendance && <th className="px-4 py-2 w-12 text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {empPunches.map((punch) => {
                        const isMobile = !!punch.mobile_location;
                        const formattedTime = new Date(punch.punch_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                        return (
                          <tr key={punch.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2 text-gray-900 font-medium whitespace-nowrap">
                              {formattedTime}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${punch.punch_type === 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-orange-50 text-orange-700 border border-orange-100'
                                }`}>
                                {punch.punch_type === 0 ? 'IN' : 'OUT'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                              {getVerifyTypeName(punch.verify_type)}
                            </td>
                            <td className="px-4 py-2 text-gray-500 max-w-[150px] truncate">
                              <div className="flex items-center gap-1">
                                {isMobile ? (
                                  <>
                                    <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span className="truncate">{punch.location || 'Mobile'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Laptop className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="font-mono text-[10px] truncate">{punch.device_serial || 'Device'}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            {canEditAttendance && (
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => handleDeletePunch(punch.id)}
                                  disabled={deletingPunchId === punch.id}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Delete this punch log"
                                >
                                  {deletingPunchId === punch.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CircleMinus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </ResponsiveModal>

    </div>
  );
}
