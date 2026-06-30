import { useAuth } from '@/components/AuthProvider';
import { DatePicker } from '@/components/date-picker';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Search,
  Unlock,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Employee {
  id: number;
  device_user_id: string;
  name: string;
  department: string | null;
  emp_id: string;
}

interface Punch {
  id: number;
  user_id: string;
  punch_time: string;
  verify_type: number;
  punch_type: number;
  device_serial: string;
  raw: string;
  mobile_location?: string;
}

interface Project {
  project_code: string;
  project_name: string;
}

interface TimesheetRow {
  employee_code: string;
  employee_name: string;
  department: string | null;
  punch_in: string; // "HH:MM" or ""
  punch_out: string; // "HH:MM" or ""
  project_code: string;
  overtime: number;
  remarks: string;
  verify_type: string;
  attested_by: string;
  isEdited: boolean;
  original_in_punch?: Punch | null;
  original_out_punch?: Punch | null;
}

const getYesterdayString = () => {
  const yesterday = new Date(Date.now() - 86400000);
  const yyyy = yesterday.getFullYear();
  const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const extractTime = (timestampStr: string | null) => {
  if (!timestampStr) return '';
  try {
    const dateObj = new Date(timestampStr);
    // Format to local HH:MM (using local browser time)
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
};

const buildTimestamp = (dateStr: string, timeStr: string) => {
  if (!timeStr) return null;
  // Assumes local timezone offset (Asia/Muscat = +04:00)
  return `${dateStr}T${timeStr}:00+04:00`;
};

const getVerifyTypeLabel = (punch: Punch | null): string => {
  if (!punch) return 'Manual Input';
  if (punch.mobile_location || (punch.raw && punch.raw.includes('MOBILE'))) {
    return 'Mobile Punch';
  }
  if (punch.verify_type === 1) return 'Fingerprint';
  if (punch.verify_type === 4 || punch.verify_type === 15) return 'Face';
  if (punch.verify_type === 0 || punch.verify_type === 3) return 'Password';
  return 'Password';
};

export default function TimesheetFinalizer() {
  const [date, setDate] = useState<string>(getYesterdayString());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<Record<string, TimesheetRow>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [punchFilter, setPunchFilter] = useState<'ALL' | 'NO_IN' | 'NO_OUT' | 'BOTH'>('ALL');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

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

  const loadTimesheet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch employees, projects, and devices (to map serials to project codes)
      const [
        { data: empData, error: empErr },
        { data: projData, error: projErr },
        { data: devData, error: devErr }
      ] = await Promise.all([
        supabase.from('employees').select('id, device_user_id, name, department, emp_id').order('name'),
        supabase.from('projects').select('project_code, project_name').order('project_code'),
        supabase.from('devices').select('serial_no, project_code')
      ]);

      if (empErr) throw empErr;
      if (projErr) throw projErr;
      if (devErr) throw devErr;

      setEmployees(empData || []);
      setProjects(projData || []);

      const deviceProjectMap = Object.fromEntries(
        (devData || []).map(d => [d.serial_no, d.project_code])
      );

      // 2. Fetch raw punches for the selected date
      const start = `${date}T00:00:00`;
      const end = `${date}T23:59:59`;
      const { data: punchesData, error: punchErr } = await supabase
        .from('punches')
        .select('*')
        .gte('punch_time', start)
        .lte('punch_time', end)
        .order('punch_time', { ascending: true });
      if (punchErr) throw punchErr;

      // Group punches by employee device_user_id
      const punchGroups: Record<string, Punch[]> = {};
      (punchesData || []).forEach((p: Punch) => {
        if (!punchGroups[p.user_id]) {
          punchGroups[p.user_id] = [];
        }
        punchGroups[p.user_id].push(p);
      });

      // 3. Fetch existing finalized timesheet rows
      const { data: existingRows, error: existingErr } = await supabase
        .from('timesheet')
        .select('*')
        .eq('date', date);
      if (existingErr) throw existingErr;

      const isDayLocked = existingRows && existingRows.length > 0;
      setIsLocked(isDayLocked);

      if (isDayLocked) {
        // Find locked metadata from the first record
        const sampleRow = existingRows[0];
        setLockedBy(sampleRow.attested_by && sampleRow.attested_by.includes('@') ? sampleRow.attested_by : 'Biometric System');

        // Map locked rows
        const initialRows: Record<string, TimesheetRow> = {};
        (empData || []).forEach(emp => {
          const matched = existingRows.find(r => r.employee_code === emp.device_user_id);
          if (matched) {
            initialRows[emp.device_user_id] = {
              employee_code: emp.device_user_id,
              employee_name: emp.name,
              department: emp.department,
              punch_in: extractTime(matched.punch_in),
              punch_out: extractTime(matched.punch_out),
              project_code: matched.project_code ?? '',
              overtime: matched.overtime ?? 0,
              remarks: matched.remarks ?? '',
              verify_type: matched.verify_type || 'Manual Input',
              attested_by: matched.attested_by || '',
              isEdited: matched.verify_type === 'Manual Input'
            };
          } else {
            // Absent/No log
            initialRows[emp.device_user_id] = {
              employee_code: emp.device_user_id,
              employee_name: emp.name,
              department: emp.department,
              punch_in: '',
              punch_out: '',
              project_code: '',
              overtime: 0,
              remarks: '',
              verify_type: 'Manual Input',
              attested_by: userData?.email || 'Timekeeper',
              isEdited: false
            };
          }
        });
        setRows(initialRows);
      } else {
        // Unlock states: Build initial guesses from raw punches
        setLockedBy(null);

        const initialRows: Record<string, TimesheetRow> = {};
        (empData || []).forEach(emp => {
          const empPunches = punchGroups[emp.device_user_id] || [];

          let firstPunch: Punch | null = null;
          let lastPunch: Punch | null = null;
          let computedProject = '';

          if (empPunches.length > 0) {
            firstPunch = empPunches[0];
            computedProject = deviceProjectMap[firstPunch.device_serial] || '';

            if (empPunches.length > 1) {
              const last = empPunches[empPunches.length - 1];
              const diffMs = new Date(last.punch_time).getTime() - new Date(firstPunch.punch_time).getTime();
              if (diffMs > 5 * 60 * 1000) { // 5 minutes threshold
                lastPunch = last;
              }
            }
          }

          const inTime = firstPunch ? extractTime(firstPunch.punch_time) : '';
          const outTime = lastPunch ? extractTime(lastPunch.punch_time) : '';

          // Auto overtime check (shift hours > 8)
          let autoOvertime = 0;
          if (inTime && outTime) {
            const [inH, inM] = inTime.split(':').map(Number);
            const [outH, outM] = outTime.split(':').map(Number);
            let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
            if (diffMin < 0) diffMin += 24 * 60; // overnight shift check
            const hours = diffMin / 60;
            if (hours > 8) {
              autoOvertime = parseFloat((hours - 8).toFixed(1));
            }
          }

          initialRows[emp.device_user_id] = {
            employee_code: emp.device_user_id,
            employee_name: emp.name,
            department: emp.department,
            punch_in: inTime,
            punch_out: outTime,
            project_code: computedProject,
            overtime: autoOvertime,
            remarks: '',
            verify_type: firstPunch ? getVerifyTypeLabel(firstPunch) : 'Manual Input',
            attested_by: firstPunch ? firstPunch.device_serial : (userData?.email || 'Timekeeper'),
            isEdited: false,
            original_in_punch: firstPunch,
            original_out_punch: lastPunch
          };
        });
        setRows(initialRows);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheet finalizer data.');
    } finally {
      setLoading(false);
    }
  }, [date, userData?.email]);

  useEffect(() => {
    loadTimesheet();
  }, [loadTimesheet]);

  const updateRow = (userId: string, key: keyof TimesheetRow, value: any) => {
    setRows(prev => {
      const current = prev[userId];
      const updated = { ...current, [key]: value };

      // Set isEdited flag if user modifies main fields
      if (key === 'punch_in' || key === 'punch_out' || key === 'overtime' || key === 'project_code') {
        updated.isEdited = true;
        updated.verify_type = 'Manual Input';
        updated.attested_by = userData?.email || 'Timekeeper';
      }

      // Automatically recalculate overtime on input change
      if (key === 'punch_in' || key === 'punch_out') {
        const inTime = key === 'punch_in' ? value : current.punch_in;
        const outTime = key === 'punch_out' ? value : current.punch_out;

        if (inTime && outTime) {
          const [inH, inM] = inTime.split(':').map(Number);
          const [outH, outM] = outTime.split(':').map(Number);
          let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
          if (diffMin < 0) diffMin += 24 * 60;
          const hours = diffMin / 60;
          if (hours > 8) {
            updated.overtime = parseFloat((hours - 8).toFixed(1));
          } else {
            updated.overtime = 0;
          }
        } else {
          updated.overtime = 0;
        }
      }

      return { ...prev, [userId]: updated };
    });
  };

  const handleFinalize = async () => {
    if (!canEditAttendance) {
      toast.error('You do not have clearance to finalize timesheets.');
      return;
    }

    setSaving(true);
    try {
      // 1. Construct payloads for insertion
      const payloads = Object.values(rows)
        .filter(r => r.punch_in || r.punch_out || r.remarks || r.isEdited) // Only save active logs
        .map(r => {
          const inTimestamp = buildTimestamp(date, r.punch_in);
          const outTimestamp = buildTimestamp(date, r.punch_out);

          return {
            date: date,
            project_code: r.project_code || null,
            employee_code: r.employee_code,
            punch_in: inTimestamp,
            punch_out: outTimestamp,
            overtime: r.overtime,
            verify_type: r.verify_type,
            attested_by: r.attested_by,
            remarks: r.remarks.startsWith('Custom: ')
              ? (r.remarks.substring(8).trim() || null)
              : (r.remarks.trim() || null),
            last_updated: new Date().toISOString()
          };
        });

      if (payloads.length === 0) {
        throw new Error('No employee shifts to finalize.');
      }

      // 2. Delete any existing entries for this date
      const { error: delErr } = await supabase
        .from('timesheet')
        .delete()
        .eq('date', date);
      if (delErr) throw delErr;

      // 3. Insert newly approved/finalized records
      const { error: insErr } = await supabase
        .from('timesheet')
        .insert(payloads);
      if (insErr) throw insErr;

      toast.success(`Timesheets for ${date} finalized and locked for payroll!`);
      loadTimesheet();
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize timesheet.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (!canEditAttendance) {
      toast.error('You do not have clearance to unlock timesheets.');
      return;
    }

    setSaving(true);
    try {
      // Delete existing rows for this date to unlock it
      const { error: delErr } = await supabase
        .from('timesheet')
        .delete()
        .eq('date', date);
      if (delErr) throw delErr;

      toast.success(`Timesheets for ${date} unlocked for editing.`);
      loadTimesheet();
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlock timesheet.');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const row = rows[emp.device_user_id];
      if (!row) return false;

      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.device_user_id.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (punchFilter === 'NO_IN' && row.original_in_punch) return false;
      if (punchFilter === 'NO_OUT' && (!row.original_in_punch || row.original_out_punch)) return false;
      if (punchFilter === 'BOTH' && (!row.original_in_punch || !row.original_out_punch)) return false;

      // Filter by Project Allocation
      const matchesProject =
        selectedProjects.length === 0 ||
        (selectedProjects.includes('UNASSIGNED') && !row.project_code) ||
        (row.project_code && selectedProjects.includes(row.project_code));

      if (!matchesProject) return false;

      return true;
    });
  }, [employees, rows, search, punchFilter, selectedProjects]);

  return (
    <div className="bg-white" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        .finalizer-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
          overflow: hidden;
        }
        .table-scroll-container {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: auto;
          flex: 1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .date-navigator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 12px;
          width: fit-content;
        }
        .date-navigator input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: brightness(0) saturate(100%) invert(30%);
          opacity: 0.85;
          transition: opacity 0.15s ease;
        }
        .date-navigator input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        .nav-btn {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .nav-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 13px;
        }
        
        .timesheet-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .timesheet-table th {
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: inset 0 -1px 0 #e2e8f0;
          background: #f8fafc;
          padding: 12px 16px;
          color: #475569;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .timesheet-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }
        .timesheet-table tr:hover td {
          background: #fafafb;
        }
        .table-input {
          font-size: 12px;
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          background: #ffffff;
          transition: all 0.15s ease;
        }
        .table-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
        .table-input:disabled {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .timesheet-table input[type="time"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: brightness(0) saturate(100%) invert(30%);
          opacity: 0.75;
          transition: opacity 0.15s ease;
        }
        .timesheet-table input[type="time"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        .source-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .source-auto {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #dcfce7;
        }
        .source-manual {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #dbeafe;
        }
        .btn-finalize {
          background: #0f172a;
          color: #ffffff;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s ease;
        }
        .btn-finalize:hover {
          background: #334155;
        }
        .btn-finalize:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .btn-unlock {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
        }
        .btn-unlock:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
      `}</style>

      <div className="finalizer-container">

        {/* Lock State Banner with Date Navigator */}
        <div style={{
          border: '1px solid rgba(100 100 100/ 0.15)', padding: "0.35rem 0.5rem"
        }} className={`banner ${isLocked ? 'banner-locked' : 'banner-unlocked'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Date Navigator */}
            <div className="date-navigator" style={{
              border: 'none',
              background: 'transparent', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', fontSize: '1rem'
            }}>
              {/* <button className="nav-btn" onClick={() => changeDate(-1)} disabled={loading || saving}>
                <ChevronLeft size={16} />
              </button> */}

              <DatePicker

                value={date}
                onChange={setDate as any}
                disabled={loading || saving}
                className="h-8 text-sm font-medium bg-white border border-slate-300 w-[160px] p-4"
              />

              {/* <button className="nav-btn" onClick={() => changeDate(1)} disabled={loading || saving}>
                <ChevronRight size={16} />
              </button> */}
            </div>

            {/* Lock Status Details */}
            {isLocked && !loading && (
              <span style={{ fontSize: '12px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e' }}>
                <Lock size={13} />
                <span>Locked by {lockedBy}</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {canEditAttendance && (
            isLocked ? (
              <button disabled={loading || saving} className="btn-unlock" onClick={handleUnlock}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                Unlock Timesheet
              </button>
            ) : (
              <button disabled={loading || saving} style={{ fontSize: "0.8rem", fontWeight: 500 }} className="btn-finalize" onClick={handleFinalize}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Approve & Finalize Day
              </button>
            )
          )}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', gap: '8px', color: '#94a3b8', fontSize: '13px', border: "1px solid rgba(100 100 100/ 0.15)", height: "100%", borderRadius: "12px" }}>
            <Loader2 className="animate-spin" size={20} />
            Loading Daily Shifts…
          </div>
        ) : error ? (
          <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '12px', fontSize: '13px' }}>
            {error}
          </div>
        ) : (
          /* Shift Review Table */
          <div className="table-scroll-container">
            <table className="timesheet-table">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: '280px' }}>
                    <div className="relative flex items-center group w-full">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-darkblue transition-colors" />
                      <input
                        type="text"
                        placeholder="Search Employee..."
                        value={search}
                        style={{ fontSize: "0.8rem", fontWeight: "400" }}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-6 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors tracking-wide text-gray-700 font-normal normal-case"
                      />
                      {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                  <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: '220px' }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide cursor-pointer">
                        <span className="truncate">
                          {punchFilter === 'ALL'
                            ? 'Punches (All)'
                            : punchFilter === 'NO_IN'
                              ? 'No Clock In'
                              : punchFilter === 'NO_OUT'
                                ? 'No Clock Out'
                                : 'In & Out Present'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[180px] p-1 bg-white border border-slate-200 z-50">
                        <DropdownMenuCheckboxItem
                          checked={punchFilter === 'ALL'}
                          onCheckedChange={() => setPunchFilter('ALL')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          All Punches
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={punchFilter === 'NO_IN'}
                          onCheckedChange={() => setPunchFilter('NO_IN')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          No Clock In
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={punchFilter === 'NO_OUT'}
                          onCheckedChange={() => setPunchFilter('NO_OUT')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          No Clock Out
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={punchFilter === 'BOTH'}
                          onCheckedChange={() => setPunchFilter('BOTH')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          In & Out Present
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                  <th style={{ width: '150px' }}>Punch In</th>
                  <th style={{ width: '150px' }}>Punch Out</th>
                  <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: '160px' }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide cursor-pointer">
                        <span className="truncate">
                          {selectedProjects.length === 0
                            ? 'Project (All)'
                            : selectedProjects.length === 1
                              ? (selectedProjects[0] === 'UNASSIGNED' ? 'Unassigned' : selectedProjects[0])
                              : `Proj (${selectedProjects.length})`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-slate-200">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedProjects([...projects.map(p => p.project_code), 'UNASSIGNED']);
                            }}
                            className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left"
                            style={{ background: "none", flex: 1 }}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedProjects([]);
                            }}
                            className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right"
                            style={{ background: "none", flex: 1 }}
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="py-1">
                          <DropdownMenuCheckboxItem
                            checked={selectedProjects.includes('UNASSIGNED')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProjects([...selectedProjects, 'UNASSIGNED']);
                              } else {
                                setSelectedProjects(selectedProjects.filter(item => item !== 'UNASSIGNED'));
                              }
                            }}
                            onSelect={(e) => e.preventDefault()}
                            className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                          >
                            Unassigned
                          </DropdownMenuCheckboxItem>
                          {projects.map(p => {
                            const isChecked = selectedProjects.includes(p.project_code);
                            return (
                              <DropdownMenuCheckboxItem
                                key={p.project_code}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedProjects([...selectedProjects, p.project_code]);
                                  } else {
                                    setSelectedProjects(selectedProjects.filter(item => item !== p.project_code));
                                  }
                                }}
                                onSelect={(e) => e.preventDefault()}
                                className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                              >
                                {p.project_code}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                  <th style={{ width: '90px' }}>Overtime</th>
                  <th>Source</th>
                  <th style={{ width: '180px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-gray-400 font-medium bg-white">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const row = rows[emp.device_user_id];
                    if (!row) return null;

                    return (
                      <tr key={emp.device_user_id}>
                        {/* Employee Info */}
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', textTransform: "uppercase" }}>{emp.name.toLowerCase()}</div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>
                                ID: {emp.device_user_id}
                              </span>
                              <span>·</span>
                              <span>{emp.department || 'No Dept'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Punches Tracker */}
                        <td>
                          <div style={{ display: 'flex', flexFlow: 'column', gap: '4px' }}>
                            {row.original_in_punch ? (
                              <div style={{ fontSize: '11px', color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', fontSize: '9px' }}>IN</span>
                                <span>{extractTime(row.original_in_punch.punch_time)}</span>
                                <span style={{ color: '#94a3b8', fontSize: '10px' }}>({row.original_in_punch.device_serial})</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', fontWeight: 500 }}>No clock in</span>
                            )}

                            {row.original_out_punch ? (
                              <div style={{ fontSize: '11px', color: '#475569', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', fontSize: '9px' }}>OUT</span>
                                <span>{extractTime(row.original_out_punch.punch_time)}</span>
                                <span style={{ color: '#94a3b8', fontSize: '10px' }}>({row.original_out_punch.device_serial})</span>
                              </div>
                            ) : (
                              row.original_in_punch ? (
                                <span style={{ fontSize: '11px', color: '#f59e0b', fontStyle: 'italic', fontWeight: 500 }}>No clock out</span>
                              ) : null
                            )}
                          </div>
                        </td>

                        {/* Punch In Input */}
                        <td>
                          <Input
                            type="time"
                            value={row.punch_in}
                            onChange={(e) => updateRow(emp.device_user_id, 'punch_in', e.target.value)}
                            disabled={isLocked || !canEditAttendance}
                            className="h-8 text-xs w-[120px] bg-white border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Punch Out Input */}
                        <td>
                          <Input
                            type="time"
                            value={row.punch_out}
                            onChange={(e) => updateRow(emp.device_user_id, 'punch_out', e.target.value)}
                            disabled={isLocked || !canEditAttendance}
                            className="h-8 text-xs w-[120px] bg-white border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Project Allocation Select */}
                        <td>
                          <Select
                            value={row.project_code || 'UNASSIGNED'}
                            onValueChange={(val) => updateRow(emp.device_user_id, 'project_code', val === 'UNASSIGNED' ? '' : val)}
                            disabled={isLocked || !canEditAttendance}
                          >
                            <SelectTrigger className="w-[150px] text-xs h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-indigo-500">
                              <SelectValue placeholder="Choose Project" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 z-50">
                              <SelectItem value="UNASSIGNED" className="text-xs cursor-pointer focus:bg-slate-50">-- Choose Project --</SelectItem>
                              {projects.map(p => (
                                <SelectItem key={p.project_code} value={p.project_code} className="text-xs cursor-pointer focus:bg-slate-50">
                                  {p.project_code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Overtime Input */}
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={row.overtime}
                            onChange={(e) => updateRow(emp.device_user_id, 'overtime', parseFloat(e.target.value) || 0)}
                            className="table-input"
                            disabled={isLocked || !canEditAttendance}
                            style={{ width: '70px', fontFamily: 'monospace' }}
                          />
                        </td>

                        {/* Source/Attestation Badge */}
                        <td>
                          {row.isEdited ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span className="source-badge source-manual">Manual</span>
                              <span style={{ fontSize: '10px', color: '#64748b', wordBreak: 'break-all' }} title={row.attested_by}>
                                {row.attested_by}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span className="source-badge source-auto">Biometric</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                {row.verify_type}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Remarks Input */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Select
                              value={
                                row.remarks === ''
                                  ? 'NONE'
                                  : (row.remarks === 'Forgot to Punch' || row.remarks === 'Absent')
                                    ? row.remarks
                                    : 'CUSTOM'
                              }
                              onValueChange={(val) => {
                                if (val === 'NONE') {
                                  updateRow(emp.device_user_id, 'remarks', '');
                                } else if (val === 'CUSTOM') {
                                  updateRow(emp.device_user_id, 'remarks', 'Custom: ');
                                } else {
                                  updateRow(emp.device_user_id, 'remarks', val);
                                }
                              }}
                              disabled={isLocked || !canEditAttendance}
                            >
                              <SelectTrigger className="w-[150px] text-xs h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-indigo-500">
                                <SelectValue placeholder="No Remark" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 z-50">
                                <SelectItem value="NONE" className="text-xs cursor-pointer focus:bg-slate-50">No Remark</SelectItem>
                                <SelectItem value="Forgot to Punch" className="text-xs cursor-pointer focus:bg-slate-50">Forgot to Punch</SelectItem>
                                <SelectItem value="Absent" className="text-xs cursor-pointer focus:bg-slate-50">Absent</SelectItem>
                                <SelectItem value="CUSTOM" className="text-xs cursor-pointer focus:bg-slate-50">Custom...</SelectItem>
                              </SelectContent>
                            </Select>

                            {(row.remarks !== '' && row.remarks !== 'Forgot to Punch' && row.remarks !== 'Absent') && (
                              <Input
                                type="text"
                                value={row.remarks.startsWith('Custom: ') ? row.remarks.substring(8) : row.remarks}
                                onChange={(e) => updateRow(emp.device_user_id, 'remarks', 'Custom: ' + e.target.value)}
                                placeholder="Type custom remark..."
                                disabled={isLocked || !canEditAttendance}
                                className="h-8 text-xs w-[150px] bg-white border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                              />
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  }))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
