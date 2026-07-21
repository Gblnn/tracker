import { useAuth } from '@/components/AuthProvider';
import { DatePicker } from '@/components/date-picker';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Laptop2,
  Loader2,
  Lock,
  Search,
  Stamp,
  Unlock,
  X,
  SquareCheck,
  Undo2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { toast } from 'sonner';
import { parsePunchLocation, parseLocationGeofence } from '../lib/geofence';
import { supabase } from '../lib/supabase';


interface Employee {
  id: number;
  device_user_id: string;
  name: string;
  department: string | null;
  emp_id: string;
  emp_type: 'staff' | 'worker' | null;
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
  project_in_time?: string | null;
  project_out_time?: string | null;
  project_location?: string | null;
}

const normalizeString = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const findProjectCode = (currentProject: string | null | undefined, projectList: Project[]): string => {
  if (!currentProject || currentProject === 'No Project Assigned') return '';

  const normCp = normalizeString(currentProject);
  const match = projectList.find(p => {
    const normCode = normalizeString(p.project_code);
    const normName = normalizeString(p.project_name);
    const normLoc = p.project_location ? normalizeString(parseLocationGeofence(p.project_location).name) : '';
    return normCode === normCp || normName === normCp || (normLoc && normLoc === normCp) ||
      normCode.includes(normCp) || normCp.includes(normCode) ||
      normName.includes(normCp) || normCp.includes(normName) ||
      (normLoc && (normLoc.includes(normCp) || normCp.includes(normLoc)));
  });

  return match ? match.project_code : '';
};

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
  status?: string;
  isApproved?: boolean;
  approval?: boolean;
  inDatabase?: boolean;
  machine?: string | null;
  verified_by?: string | null;
}

type SourceFilter = 'ALL' | 'MANUAL' | 'LEAVE_LOG' | 'DEVICE' | 'NO_SOURCE';

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

const calculateTotalHours = (punchIn: string, punchOut: string) => {
  if (!punchIn || !punchOut) return '—';
  try {
    const [inH, inM] = punchIn.split(':').map(Number);
    const [outH, outM] = punchOut.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return '—';
    let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMin < 0) diffMin += 24 * 60;
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    const formattedHrs = String(hrs).padStart(2, '0');
    const formattedMins = String(mins).padStart(2, '0');
    return `${formattedHrs}:${formattedMins}`;
  } catch {
    return '—';
  }
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

const parseAttestedBy = (attestedBy: string | null | undefined, isApproved: boolean) => {
  const str = attestedBy || '';
  if (str.includes('|')) {
    const parts = str.split('|');
    return {
      verifier: parts[0] || null,
      approver: parts[1] || null,
      machineCode: parts[2] || null
    };
  }
  if (str.includes('@')) {
    if (isApproved) {
      return {
        verifier: null,
        approver: str,
        machineCode: null
      };
    } else {
      return {
        verifier: str,
        approver: null,
        machineCode: null
      };
    }
  }
  return {
    verifier: null,
    approver: null,
    machineCode: str || null
  };
};

const getSourceCategory = (row: TimesheetRow): Exclude<SourceFilter, 'ALL'> => {
  if (row.isEdited) return 'MANUAL';

  const { machineCode } = parseAttestedBy(row.attested_by, !!row.isApproved);
  if (machineCode === 'Leave Log') return 'LEAVE_LOG';

  const hasDevice = machineCode && machineCode !== 'Un-Mapped' && machineCode !== 'Timekeeper';
  return hasDevice ? 'DEVICE' : 'NO_SOURCE';
};


const getApprovalBadge = (row: TimesheetRow) => {
  if (!row.isApproved) return null;
  const { approver } = parseAttestedBy(row.attested_by, !!row.isApproved);
  const displayText = approver || 'Approved';
  if (!displayText) return null;
  return (
    <span style={{ borderBottom: "2px solid #4f46e5", gap: "0.25rem" }} className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-indigo-800 bg-indigo-50/50 rounded-t-[3px]">
      <Stamp size={12} />
      {displayText}
    </span>
  );
};

const getDbAttestedAndVerified = (r: TimesheetRow, userEmail: string | null | undefined) => {
  const email = userEmail || '';
  const devSerials: string[] = [];
  if (r.original_in_punch) devSerials.push(r.original_in_punch.device_serial);
  if (r.original_out_punch) devSerials.push(r.original_out_punch.device_serial);
  const uniqueSerials = Array.from(new Set(devSerials)).filter(Boolean);
  const deviceCode = uniqueSerials.join('/');

  if (r.original_in_punch && r.original_out_punch) {
    const inM = extractTime(r.original_in_punch.punch_time);
    const outM = extractTime(r.original_out_punch.punch_time);
    const isUnmodified = r.punch_in === inM && r.punch_out === outM;
    if (isUnmodified) {
      return {
        attested_by: deviceCode || 'Timekeeper',
        machine: deviceCode || null,
        verified_by: null
      };
    } else {
      return {
        attested_by: deviceCode || 'Timekeeper',
        machine: deviceCode || null,
        verified_by: email || null
      };
    }
  } else if (r.original_in_punch || r.original_out_punch) {
    return {
      attested_by: deviceCode || 'Timekeeper',
      machine: deviceCode || null,
      verified_by: email || null
    };
  } else {
    return {
      attested_by: email || 'Timekeeper',
      machine: null,
      verified_by: null
    };
  }
};

const TimesheetRowComponent = memo(({
  emp,
  row,
  isSelected,
  isSelectionMode,
  isLocked,
  canUserEdit,
  projects,
  isFocalFiltered,
  saving,
  onRowSelect,
  onUpdateRow,
  onUndoRow
}: {
  emp: Employee;
  row: TimesheetRow;
  isSelected: boolean;
  isSelectionMode: boolean;
  isLocked: boolean;
  canUserEdit: boolean;
  projects: Project[];
  isFocalFiltered: boolean;
  saving: boolean;
  onRowSelect: (userId: string) => void;
  onUpdateRow: (userId: string, key: keyof TimesheetRow, value: any) => void;
  onUndoRow: (userId: string) => void;
}) => {
  const hasNoRedBorders = useMemo(() => {
    // 1. Status check
    const isStatusRed = !row.status || row.status === 'no status';
    if (isStatusRed) return false;

    // 2. Project & Punch check (only when status is not absent/no status)
    if (row.status !== 'absent' && row.status !== 'no status') {
      const isProjectRed = !row.project_code || row.project_code === '' || row.project_code === 'UNASSIGNED';
      if (isProjectRed) return false;

      // Both punch times must be filled
      if (!row.punch_in || !row.punch_out) return false;
    }

    // 3. Remarks check (only when status is absent)
    if (row.status === 'absent') {
      const isRemarksRed = !row.remarks || row.remarks.trim() === '' || row.remarks === 'Custom: ' || row.remarks.trim() === 'Custom:';
      if (isRemarksRed) return false;
    }

    return true;
  }, [row.status, row.project_code, row.remarks, row.punch_in, row.punch_out]);

  const deviceCode = useMemo(() => {
    // 1. If it's a complete match of biometric punches
    if (row.original_in_punch && row.original_out_punch) {
      const inM = extractTime(row.original_in_punch.punch_time);
      const outM = extractTime(row.original_out_punch.punch_time);
      if (row.punch_in === inM && row.punch_out === outM) {
        return row.original_in_punch.device_serial === row.original_out_punch.device_serial
          ? row.original_in_punch.device_serial
          : `${row.original_in_punch.device_serial}/${row.original_out_punch.device_serial}`;
      }
    }
    // 2. If it's a partial match/incomplete biometric punch (e.g. only one punch exists, or one of them was modified by the user)
    const devSerials: string[] = [];
    if (row.original_in_punch) {
      devSerials.push(row.original_in_punch.device_serial);
    }
    if (row.original_out_punch) {
      devSerials.push(row.original_out_punch.device_serial);
    }
    const uniqueSerials = Array.from(new Set(devSerials)).filter(Boolean);
    if (uniqueSerials.length > 0) {
      return uniqueSerials.join('/');
    }

    // 3. Fallback: if loaded from database and matched.machine is set
    if (row.machine) {
      return row.machine;
    }

    return '';
  }, [row.punch_in, row.punch_out, row.original_in_punch, row.original_out_punch, row.machine]);

  return (
    <tr className={hasNoRedBorders ? 'green-row-highlight' : undefined}>
      <td
        className="sticky-checkbox transition-[width,opacity] duration-200 ease-in-out overflow-hidden"
        style={{
          width: isSelectionMode ? "48px" : "0px",
          minWidth: isSelectionMode ? "48px" : "0px",
          maxWidth: isSelectionMode ? "48px" : "0px",
          opacity: isSelectionMode ? 1 : 0,
          pointerEvents: isSelectionMode ? "auto" : "none",
          textAlign: 'center',
          padding: '0'
        }}
      >
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onRowSelect(emp.device_user_id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border border-slate-400 bg-white data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white focus-visible:ring-indigo-500 cursor-pointer shrink-0"
          />
        </div>
      </td>
      {/* Employee Info */}
      <td className="sticky-name transition-[left] duration-200 ease-in-out" style={{ left: isSelectionMode ? '48px' : '0' }} onClick={() => {
        if (isSelectionMode) {
          onRowSelect(emp.device_user_id);
        }
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              border: 'none',
              flexShrink: 0
            }}
            title={emp.name}
          >
            {(() => {
              const parts = emp.name ? emp.name.trim().split(/\s+/) : [];
              if (parts.length === 0) return '??';
              if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            })()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a', textTransform: "uppercase" }}>{emp.name.toLowerCase()}</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>
                {emp.device_user_id}
              </span>
              <span>·</span>
              <span style={{ textTransform: 'capitalize' }}>
                {emp.emp_type || 'undefined'}
              </span>
            </div>
          </div>
        </div>
      </td>


      {/* Status Select */}
      <td>
        <Select
          value={row.status || 'no status'}
          onValueChange={(val) => onUpdateRow(emp.device_user_id, 'status', val)}
          disabled={isLocked || !canUserEdit}
        >
          <SelectTrigger className={`w-[140px] text-xs h-8 bg-white border focus:ring-1 ${(!row.status || row.status === 'no status')
            ? 'border-red-500 focus:ring-red-500 bg-red-50/30'
            : 'border-slate-300 focus:ring-slate-300'
            }`}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200 z-50">
            <SelectItem value="no status" className="text-xs cursor-pointer focus:bg-slate-50">No Status</SelectItem>
            <SelectItem value="present" className="text-xs cursor-pointer focus:bg-slate-50">Present</SelectItem>
            <SelectItem value="absent" className="text-xs cursor-pointer focus:bg-slate-50">Absent</SelectItem>
            {emp.emp_type !== 'staff' && (
              <SelectItem value="present with OT" className="text-xs cursor-pointer focus:bg-slate-50">Present with OT</SelectItem>
            )}
          </SelectContent>
        </Select>
      </td>

      {/* Punch In Input */}
      <td>
        <Input
          type="time"
          value={row.punch_in}
          onChange={(e) => onUpdateRow(emp.device_user_id, 'punch_in', e.target.value)}
          disabled={isLocked || !canUserEdit || !!row.original_in_punch}
          style={((row.status === 'present' || row.status === 'present with OT') && !row.punch_in) ? {
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#ef4444',
            backgroundColor: 'rgba(254, 242, 242, 0.3)'
          } : undefined}
          className="h-8 text-xs w-[120px] bg-white border border-slate-300 focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
      </td>

      {/* Punch Out Input */}
      <td>
        <Input
          type="time"
          value={row.punch_out}
          onChange={(e) => onUpdateRow(emp.device_user_id, 'punch_out', e.target.value)}
          disabled={isLocked || !canUserEdit || !!row.original_out_punch}
          style={((row.status === 'present' || row.status === 'present with OT') && !row.punch_out) ? {
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#ef4444',
            backgroundColor: 'rgba(254, 242, 242, 0.3)'
          } : undefined}
          className="h-8 text-xs w-[120px] bg-white border border-slate-300 focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
      </td>

      {/* Total Hours */}
      <td style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
        {calculateTotalHours(row.punch_in, row.punch_out)}
      </td>

      {/* Overtime Input */}
      <td>
        {emp.emp_type === 'staff' ? (
          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '12px' }}>—</span>
        ) : (
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={row.overtime}
            onChange={(e) => onUpdateRow(emp.device_user_id, 'overtime', parseFloat(e.target.value) || 0)}
            className="table-input"
            disabled={isLocked || !canUserEdit}
            style={{ width: '70px', fontFamily: 'monospace' }}
          />
        )}
      </td>

      {/* Project Allocation Select */}
      {!isFocalFiltered && (
        <td>
          <Select
            value={row.project_code || 'UNASSIGNED'}
            onValueChange={(val) => onUpdateRow(emp.device_user_id, 'project_code', val === 'UNASSIGNED' ? '' : val)}
            disabled={isLocked || !canUserEdit}
          >
            <SelectTrigger className={`w-[150px] text-xs h-8 bg-white border focus:ring-1 ${(row.status !== 'absent' && row.status !== 'no status' && (!row.project_code || row.project_code === '' || row.project_code === 'UNASSIGNED'))
              ? 'border-red-500 focus:ring-red-500 bg-red-50/30'
              : 'border-slate-300 focus:ring-slate-300'
              }`}>
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
      )}

      {/* Remarks Input */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Select
            value={
              row.remarks === ''
                ? 'NONE'
                : (row.remarks === 'Present' || row.remarks === 'Forgot to Punch' || row.remarks === 'Sick Leave' || row.remarks === 'Unpaid Leave' || row.remarks === 'Casual Leave' || row.remarks === 'Emergency Leave')
                  ? row.remarks
                  : 'CUSTOM'
            }
            onValueChange={(val) => {
              if (val === 'NONE') {
                onUpdateRow(emp.device_user_id, 'remarks', '');
              } else if (val === 'CUSTOM') {
                onUpdateRow(emp.device_user_id, 'remarks', 'Custom: ');
              } else {
                onUpdateRow(emp.device_user_id, 'remarks', val);
              }
            }}
            disabled={isLocked || !canUserEdit}
          >
            <SelectTrigger className={`w-[150px] text-xs h-8 bg-white border focus:ring-1 ${(row.status === 'absent' && (!row.remarks || row.remarks.trim() === '' || row.remarks === 'Custom: '))
              ? 'border-red-500 focus:ring-red-500 bg-red-50/30'
              : 'border-slate-300 focus:ring-slate-300'
              }`}>
              <SelectValue placeholder="No Remark" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 z-50">
              <SelectItem value="NONE" className="text-xs cursor-pointer focus:bg-slate-50">No Remark</SelectItem>

              <SelectItem value="Forgot to Punch" className="text-xs cursor-pointer focus:bg-slate-50">Forgot to Punch</SelectItem>
              <SelectItem value="Sick Leave" className="text-xs cursor-pointer focus:bg-slate-50">Sick Leave</SelectItem>
              <SelectItem value="Unpaid Leave" className="text-xs cursor-pointer focus:bg-slate-50">Unpaid Leave</SelectItem>
              <SelectItem value="Casual Leave" className="text-xs cursor-pointer focus:bg-slate-50">Casual Leave</SelectItem>
              <SelectItem value="Emergency Leave" className="text-xs cursor-pointer focus:bg-slate-50">Emergency Leave</SelectItem>

              <SelectItem value="CUSTOM" className="text-xs cursor-pointer focus:bg-slate-50">Custom...</SelectItem>
            </SelectContent>
          </Select>

          {(row.remarks !== '' && row.remarks !== 'Present' && row.remarks !== 'Forgot to Punch' && row.remarks !== 'Sick Leave' && row.remarks !== 'Unpaid Leave' && row.remarks !== 'Casual Leave' && row.remarks !== 'Emergency Leave') && (
            <Input
              type="text"
              value={row.remarks.startsWith('Custom: ') ? row.remarks.substring(8) : row.remarks}
              onChange={(e) => onUpdateRow(emp.device_user_id, 'remarks', 'Custom: ' + e.target.value)}
              placeholder="Type custom remark..."
              disabled={isLocked || !canUserEdit}
              className={`h-8 text-xs w-[150px] bg-white border focus:ring-1 ${(row.status === 'absent' && (row.remarks === 'Custom: ' || row.remarks.trim() === 'Custom:'))
                ? 'border-red-500 focus:ring-red-500 bg-red-50/30'
                : 'border-slate-300 focus:ring-slate-300'
                }`}
            />
          )}
        </div>
      </td>

      {/* Source & Actions */}
      <td className="sticky-action">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 6px' }}>
          {/* 1. Source Badge (Original & Unchanged - Full Width) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
            {(row.isApproved || row.isEdited) ? (() => {
              const badgeBg = isLocked
                ? '#4f46e5'
                : (row.isApproved || hasNoRedBorders ? 'teal' : '#d97706');

              const badgeText = isLocked
                ? 'Approved'
                : (row.isApproved || hasNoRedBorders ? 'Verified' : 'Manual');

              const isVerifiedState = isLocked
                ? false
                : (row.isApproved || hasNoRedBorders);

              return (
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: badgeBg,
                    color: 'white',
                    border: "none",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    flex: 1
                  }}
                  className="source-badge"
                >
                  {isVerifiedState ? (
                    <span className="badge-text-fade" key="verified">
                      <Check className="w-3 h-3 shrink-0" />
                      Verified
                    </span>
                  ) : (
                    <span className="badge-text-fade" key="non-verified">
                      {badgeText}
                    </span>
                  )}
                </span>
              );
            })() : (
              (() => {
                const { machineCode } = parseAttestedBy(row.attested_by, !!row.isApproved);
                const hasDevice = machineCode && machineCode !== 'Un-Mapped' && machineCode !== 'Timekeeper';
                if (machineCode === 'Leave Log') {
                  return (
                    <span style={{ fontSize: "0.7rem", background: "#6366f1", color: "white", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px", padding: "1px 6px", borderRadius: "3px", flex: 1 }} className="source-badge source-leave" title={row.attested_by}>
                      <Calendar className="w-3 h-3 shrink-0" />
                      Leave Log
                    </span>
                  );
                } else if (hasDevice) {
                  return (
                    <span style={{ fontSize: "0.7rem", background: "teal", color: "white", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px", padding: "1px 6px", borderRadius: "3px", flex: 1 }} className="source-badge source-auto" title={row.attested_by}>
                      <Laptop2 className="w-3 h-3 shrink-0" />
                      {machineCode}
                    </span>
                  );
                } else {
                  return (
                    <span style={{ fontSize: "0.7rem", background: "slategray", color: "white", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px", padding: "1px 6px", borderRadius: "3px", flex: 1 }} className="source-badge source-nosource" title={row.attested_by || "No source found"}>
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      No Source
                    </span>
                  );
                }
              })()
            )}

            {((row.isEdited || row.inDatabase || row.isApproved) && !isLocked && canUserEdit && !(isFocalFiltered && row.approval)) && (
              <button
                type="button"
                onClick={() => onUndoRow(emp.device_user_id)}
                disabled={saving}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all cursor-pointer border border-slate-200 bg-white flex items-center justify-center shrink-0"
                title={row.inDatabase ? (isFocalFiltered ? "Revoke verification" : "Revoke approval") : "Undo manual changes back to original"}
                style={{ width: "20px", height: "20px" }}
              >
                <Undo2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. Attestation Details & Status/Actions inline underneath */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {(row.isEdited || row.verified_by) ? (
              <span className={hasNoRedBorders ? 'text-teal-600' : 'text-amber-700'} style={{ fontSize: '10px', whiteSpace: 'nowrap', fontWeight: 555 }} title={row.attested_by}>
                {(() => {
                  const displayEmail = row.verified_by || (() => {
                    const { verifier, approver } = parseAttestedBy(row.attested_by, !!row.isApproved);
                    return isFocalFiltered
                      ? (verifier || row.attested_by)
                      : (approver || verifier || row.attested_by);
                  })();
                  return displayEmail ? displayEmail.split('|').filter(Boolean).join(' | ') : 'Timekeeper';
                })()}{deviceCode && ` (${deviceCode})`}
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
                {row.verify_type}
              </span>
            )}

            {isLocked && getApprovalBadge(row)}
          </div>
        </div>
      </td>
    </tr>
  );
});

interface TimesheetFinalizerProps {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}

export default function TimesheetFinalizer({ refreshTrigger, onLoadingChange }: TimesheetFinalizerProps = {}) {
  const [date, setDate] = useState<string>(getYesterdayString());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<Record<string, TimesheetRow>>({});
  const initialRowsRef = useRef<Record<string, TimesheetRow>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  const [punchMode, setPunchMode] = useState<'first_last' | 'check_in_out'>('first_last');
  const [punchGroups, setPunchGroups] = useState<Record<string, Punch[]>>({});
  const [deviceProjectMap, setDeviceProjectMap] = useState<Record<string, string>>({});
  const [employeeAssignedProjects, setEmployeeAssignedProjects] = useState<Record<string, string>>({});

  // Selection and bulk states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const [isBulkPunchTimeOpen, setIsBulkPunchTimeOpen] = useState(false);
  const [bulkPunchInValue, setBulkPunchInValue] = useState('');
  const [bulkPunchOutValue, setBulkPunchOutValue] = useState('');

  const [isBulkOvertimeOpen, setIsBulkOvertimeOpen] = useState(false);
  const [bulkOvertimeValue, setBulkOvertimeValue] = useState(0);

  const [isBulkProjectOpen, setIsBulkProjectOpen] = useState(false);
  const [bulkProjectValue, setBulkProjectValue] = useState('');

  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<'present' | 'absent' | 'present with OT' | 'no status'>('no status');

  const [isBulkRemarksOpen, setIsBulkRemarksOpen] = useState(false);
  const [bulkRemarksValue, setBulkRemarksValue] = useState('');
  const [bulkCustomRemarksValue, setBulkCustomRemarksValue] = useState('');

  const punchModeRef = useRef(punchMode);
  useEffect(() => {
    punchModeRef.current = punchMode;
  }, [punchMode]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Synchronize loading with parent via onLoadingChange
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [punchFilter] = useState<'ALL' | 'NO_IN' | 'NO_OUT' | 'BOTH'>('ALL');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [empTypeFilter, setEmpTypeFilter] = useState<'all' | 'staff' | 'worker'>('all');
  const [roundOT] = useState(true);
  const [focalProjectCodes, setFocalProjectCodes] = useState<string[]>([]);
  const [isFocalFiltered, setIsFocalFiltered] = useState(false);

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

  const canUserEdit = useMemo(() => {
    return canEditAttendance || isFocalFiltered;
  }, [canEditAttendance, isFocalFiltered]);

  const employeesMap = useMemo(() => {
    return Object.fromEntries(employees.map(e => [e.device_user_id, e]));
  }, [employees]);

  const [renderLimit, setRenderLimit] = useState(100);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setRenderLimit(100);
  }, [search, punchFilter, selectedProjects]);

  const guessRow = useCallback((
    emp: Employee,
    empPunches: Punch[],
    mode: 'first_last' | 'check_in_out',
    currentProjects: Project[],
    currentDeviceProjectMap: Record<string, string>,
    assignedProjectsMap: Record<string, string>
  ) => {
    let firstPunch: Punch | null = null;
    let lastPunch: Punch | null = null;
    let computedProject = '';

    if (empPunches.length > 0) {
      if (mode === 'first_last') {
        firstPunch = empPunches[0];
        if (empPunches.length > 1) {
          const last = empPunches[empPunches.length - 1];
          const diffMs = new Date(last.punch_time).getTime() - new Date(firstPunch.punch_time).getTime();
          if (diffMs > 5 * 60 * 1000) { // 5 minutes threshold
            lastPunch = last;
          }
        }
      } else {
        const checkInPunches = empPunches.filter(p => p.punch_type === 0);
        const checkOutPunches = empPunches.filter(p => p.punch_type === 1);
        firstPunch = checkInPunches.length > 0 ? checkInPunches[0] : null;
        const lastOutPunch = checkOutPunches.length > 0 ? checkOutPunches[checkOutPunches.length - 1] : null;

        if (firstPunch && lastOutPunch) {
          const diffMs = new Date(lastOutPunch.punch_time).getTime() - new Date(firstPunch.punch_time).getTime();
          if (diffMs > 5 * 60 * 1000) {
            lastPunch = lastOutPunch;
          }
        } else if (lastOutPunch) {
          lastPunch = lastOutPunch;
        }
      }
    }

    if (firstPunch) {
      const isMobilePunch = firstPunch.mobile_location || (firstPunch.raw && firstPunch.raw.includes('MOBILE'));

      if (isMobilePunch) {
        computedProject = '';
        if (firstPunch.mobile_location) {
          const { location: projName } = parsePunchLocation(firstPunch.mobile_location, undefined);
          if (projName && projName !== '—' && projName !== 'Un-Mapped') {
            const matchedProj = (currentProjects || []).find(p => p.project_name.toLowerCase().trim() === projName.toLowerCase().trim());
            if (matchedProj) {
              computedProject = matchedProj.project_code;
            }
          }
        }
      } else {
        computedProject = currentDeviceProjectMap[firstPunch.device_serial] || '';
      }
    } else {
      computedProject = assignedProjectsMap[emp.emp_id] || '';
    }

    const inTime = firstPunch ? extractTime(firstPunch.punch_time) : '';
    const outTime = lastPunch ? extractTime(lastPunch.punch_time) : '';

    // Auto overtime check (shift hours > 10)
    let autoOvertime = 0;
    if (inTime && outTime && emp.emp_type !== 'staff') {
      const [inH, inM] = inTime.split(':').map(Number);
      const [outH, outM] = outTime.split(':').map(Number);
      let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMin < 0) diffMin += 24 * 60; // overnight shift check
      const hours = diffMin / 60;
      if (hours > 10) {
        const rawOT = hours - 10;
        autoOvertime = roundOT
          ? Math.round(rawOT * 2) / 2
          : parseFloat(rawOT.toFixed(1));
      }
    }

    let resolvedAttestedBy = firstPunch ? firstPunch.device_serial : 'Timekeeper';
    if (firstPunch && (firstPunch.mobile_location || (firstPunch.raw && firstPunch.raw.includes('MOBILE')))) {
      const { location: projName } = parsePunchLocation(firstPunch.mobile_location, undefined);
      if (projName === 'Un-Mapped') {
        resolvedAttestedBy = 'Un-Mapped';
      } else {
        resolvedAttestedBy = projName || 'Mobile';
      }
    }

    const defaultStatus = (inTime || outTime)
      ? (autoOvertime > 0 ? 'present with OT' : 'present')
      : 'no status';

    return {
      employee_code: emp.device_user_id,
      employee_name: emp.name,
      department: emp.department,
      punch_in: inTime,
      punch_out: outTime,
      project_code: computedProject,
      overtime: autoOvertime,
      remarks: '',
      verify_type: firstPunch ? getVerifyTypeLabel(firstPunch) : 'Manual Input',
      attested_by: resolvedAttestedBy,
      isEdited: false,
      original_in_punch: firstPunch,
      original_out_punch: lastPunch,
      status: defaultStatus,
      isApproved: false
    };
  }, [userData?.email, roundOT]);

  const handleModeChange = (newMode: 'first_last' | 'check_in_out') => {
    setPunchMode(newMode);
    setRows(prev => {
      const next = { ...prev };
      employees.forEach(emp => {
        const row = next[emp.device_user_id];
        if (row && !row.isEdited && !row.isApproved && !row.inDatabase) {
          const empPunches = punchGroups[emp.device_user_id] || [];
          next[emp.device_user_id] = {
            ...guessRow(emp, empPunches, newMode, projects, deviceProjectMap, employeeAssignedProjects),
            isApproved: false,
            approval: false,
            inDatabase: false
          };
        }
      });
      return next;
    });
    // toast.success(`Switched to ${newMode === 'first_last' ? 'First In / Last Out' : 'Check In / Check Out'} logic.`);
  };

  const loadTimesheet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch employees, projects, devices, and latest employee project mappings (to map serials and latest assigned projects)
      const [
        { data: empData, error: empErr },
        { data: projData, error: projErr },
        { data: devData, error: devErr },
        { data: latestProjData, error: latestProjErr }
      ] = await Promise.all([
        supabase.from('employees').select('id, device_user_id, name, department, emp_id, emp_type').or('status.ilike.active,status.is.null').order('name'),
        supabase.from('projects').select('project_code, project_name, project_in_time, project_out_time, project_location').order('project_code'),
        supabase.from('devices').select('serial_no, project_code'),
        supabase.from('v_employee_latest_project').select('emp_id, current_project')
      ]);

      if (empErr) throw empErr;
      if (projErr) throw projErr;
      if (devErr) throw devErr;
      if (latestProjErr) throw latestProjErr;

      const assignedProjMap: Record<string, string> = {};
      if (latestProjData) {
        latestProjData.forEach(item => {
          if (item.emp_id && item.current_project) {
            assignedProjMap[item.emp_id] = findProjectCode(item.current_project, projData || []);
          }
        });
      }
      setEmployeeAssignedProjects(assignedProjMap);

      // 1. Determine if focal point filter is active
      let focalProjectCodes: string[] = [];
      let isFocalFiltered = false;

      if (userData?.role !== 'admin' && userData?.email) {
        const { data: focalProjects } = await supabase
          .from('projects')
          .select('project_code')
          .eq('focal_point_email', userData.email);

        if (focalProjects && focalProjects.length > 0) {
          focalProjectCodes = focalProjects.map(p => p.project_code);
          isFocalFiltered = true;
        }
      }

      setFocalProjectCodes(focalProjectCodes);
      setIsFocalFiltered(isFocalFiltered);

      const projectDeviceSerials = (devData ?? [])
        .filter(d => d.project_code && focalProjectCodes.includes(d.project_code))
        .map(d => d.serial_no);

      let allowedEmpIds = new Set<number>();
      let allowedDeviceUserIds = new Set<string>();

      if (isFocalFiltered) {
        if (projectDeviceSerials.length > 0) {
          const { data: cmdData } = await supabase
            .from('device_commands')
            .select('employee_id')
            .in('device_serial', projectDeviceSerials);

          if (cmdData) {
            cmdData.forEach(c => {
              if (c.employee_id) allowedEmpIds.add(c.employee_id);
            });
          }

          const { data: punchUserIds } = await supabase
            .from('punches')
            .select('user_id')
            .in('device_serial', projectDeviceSerials)
            .limit(5000);

          if (punchUserIds) {
            punchUserIds.forEach(p => {
              if (p.user_id) allowedDeviceUserIds.add(p.user_id);
            });
          }
        }
      }

      const filteredEmployees = isFocalFiltered
        ? (empData || []).filter(emp =>
          allowedEmpIds.has(emp.id) ||
          allowedDeviceUserIds.has(emp.device_user_id) ||
          (emp.emp_id && assignedProjMap[emp.emp_id] && focalProjectCodes.includes(assignedProjMap[emp.emp_id]))
        )
        : (empData || []);

      const filteredProjects = isFocalFiltered
        ? (projData || []).filter(p => focalProjectCodes.includes(p.project_code))
        : (projData || []);

      setEmployees(filteredEmployees);
      setProjects(filteredProjects);

      const devProjMap = Object.fromEntries(
        (devData || []).map(d => [d.serial_no, d.project_code])
      );
      setDeviceProjectMap(devProjMap);

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

      const visibleDeviceUserIds = new Set(filteredEmployees.map(emp => emp.device_user_id).filter(Boolean));
      const filteredPunches = isFocalFiltered
        ? (punchesData || []).filter(p =>
          (p.user_id && visibleDeviceUserIds.has(p.user_id)) ||
          (p.device_serial && projectDeviceSerials.includes(p.device_serial))
        )
        : (punchesData || []);

      // Group punches by employee device_user_id
      const pGroups: Record<string, Punch[]> = {};
      filteredPunches.forEach((p: Punch) => {
        if (!pGroups[p.user_id]) {
          pGroups[p.user_id] = [];
        }
        pGroups[p.user_id].push(p);
      });
      setPunchGroups(pGroups);

      // 3. Fetch existing finalized timesheet rows
      const { data: existingRows, error: existingErr } = await supabase
        .from('timesheet')
        .select('*')
        .eq('date', date);
      if (existingErr) throw existingErr;

      // 4. Fetch leave logs
      const { data: leavesData, error: leavesErr } = await supabase
        .from('leave_log')
        .select('*')
        .lte('from', date);
      if (leavesErr) throw leavesErr;

      // Filter perpetual leaves and fetch their punches
      const perpetualEmpIds = (leavesData || [])
        .filter(l => l.till === null)
        .map(l => l.emp_id);

      let punchesAfterLeaveStart: any[] = [];
      if (perpetualEmpIds.length > 0) {
        const minFromDate = (leavesData || [])
          .filter(l => l.till === null)
          .reduce((min, l) => l.from < min ? l.from : min, date);

        const { data: punchCheckData } = await supabase
          .from('punches')
          .select('user_id, punch_time')
          .in('user_id', perpetualEmpIds)
          .gte('punch_time', `${minFromDate}T00:00:00`)
          .lte('punch_time', `${date}T23:59:59`);
        punchesAfterLeaveStart = punchCheckData || [];
      }

      const activeLeaves = (leavesData || []).filter(l => {
        if (l.from > date) return false;
        if (l.till !== null) {
          return l.till >= date;
        } else {
          const hasPunched = punchesAfterLeaveStart.some(p => {
            if (p.user_id !== l.emp_id) return false;
            const punchDate = new Date(p.punch_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
            return punchDate >= l.from && punchDate <= date;
          });
          return !hasPunched;
        }
      });

      const filteredExistingRows = isFocalFiltered
        ? (existingRows || []).filter(row => row.project_code && focalProjectCodes.includes(row.project_code))
        : (existingRows || []);

      // Calculate global lock: locked if all employees have a matching timesheet database record
      // For focal points, it's locked if a record exists. For admin, locked if record exists AND approval !== false.
      const isDayLocked = filteredExistingRows.length > 0 && filteredEmployees.every(emp =>
        filteredExistingRows.some(row => row.employee_code === emp.device_user_id && (isFocalFiltered ? true : row.approval !== false))
      );
      setIsLocked(isDayLocked);

      // Find locked metadata from the first record if any
      if (filteredExistingRows.length > 0) {
        const sampleRow = filteredExistingRows[0];
        setLockedBy(sampleRow.attested_by && sampleRow.attested_by.includes('@') ? sampleRow.attested_by : 'Biometric System');
      } else {
        setLockedBy(null);
      }

      // Map loaded rows
      const existingRowsMap = Object.fromEntries(
        filteredExistingRows.map(r => [r.employee_code, r])
      );
      const initialRows: Record<string, TimesheetRow> = {};
      filteredEmployees.forEach(emp => {
        const matched = existingRowsMap[emp.device_user_id];
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
            isEdited: matched.verify_type === 'Manual Input' || !!matched.verified_by,
            status: matched.status || (matched.overtime > 0 ? 'present with OT' : (matched.punch_in || matched.punch_out ? 'present' : 'no status')),
            isApproved: isFocalFiltered ? true : (matched.approval !== false),
            approval: matched.approval !== false,
            inDatabase: true,
            machine: matched.machine,
            verified_by: matched.verified_by
          };
        } else {
          // Guess initial values from raw punches
          const empPunches = pGroups[emp.device_user_id] || [];
          const guessed = guessRow(emp, empPunches, punchModeRef.current, filteredProjects, devProjMap, assignedProjMap);

          // Check if employee is on leave on this date
          const employeeLeave = activeLeaves.find(l => l.emp_id === emp.device_user_id);
          if (employeeLeave && guessed.status === 'absent') {
            guessed.remarks = employeeLeave.status; // e.g. "Annual Leave", "Sick Leave"
            guessed.verify_type = 'Manual Input';
            guessed.attested_by = 'Leave Log';
          }

          initialRows[emp.device_user_id] = {
            ...guessed,
            isApproved: false,
            approval: false,
            inDatabase: false
          };
        }
      });
      setRows(initialRows);
      initialRowsRef.current = initialRows;
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheet finalizer data.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [date, userData?.email]);

  useEffect(() => {
    loadTimesheet();
  }, [loadTimesheet, refreshTrigger]);

  const handleUndoRow = useCallback(async (userId: string) => {
    const currentVal = rows[userId];
    if (!currentVal) return;

    if (!canUserEdit) {
      toast.error('You do not have clearance to modify this.');
      return;
    }

    if (isFocalFiltered && currentVal.approval) {
      toast.error('Cannot revoke a record that has already been approved by the admin.');
      return;
    }

    if (currentVal.inDatabase) {
      const actionText = isFocalFiltered ? 'verification' : 'approval';
      toast.loading(`Revoking ${actionText} and reverting...`, { id: `undo-${userId}` });
      try {
        const { error: delErr } = await supabase
          .from('timesheet')
          .delete()
          .eq('date', date)
          .eq('employee_code', userId);
        if (delErr) throw delErr;
        toast.success(`Verification/Approval for ${currentVal.employee_name} revoked & reverted.`, { id: `undo-${userId}` });
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || `Failed to revoke ${actionText}.`, { id: `undo-${userId}` });
        return;
      }
    }

    setRows(prev => {
      const current = prev[userId];
      if (!current) return prev;

      const emp = employeesMap[userId];
      if (!emp) return prev;
      const empPunches = punchGroups[userId] || [];
      const guessed = guessRow(emp, empPunches, punchMode, projects, deviceProjectMap, employeeAssignedProjects);

      return {
        ...prev,
        [userId]: {
          ...guessed,
          isApproved: false,
          approval: false,
          inDatabase: false
        }
      };
    });

    if (!currentVal.inDatabase) {
      toast.success("Changes reverted to original.");
    }
  }, [rows, date, isFocalFiltered, canUserEdit, employeesMap, punchGroups, punchMode, projects, deviceProjectMap, employeeAssignedProjects, guessRow]);

  const autoPostRowsBatch = useCallback(async (updatedRows: TimesheetRow[]) => {
    if (!canUserEdit || updatedRows.length === 0) return;

    const payloads = updatedRows
      .filter(r => {
        const isStatusRed = !r.status || r.status === 'no status';
        if (isStatusRed) return false;

        if (r.status !== 'absent' && r.status !== 'no status') {
          const isProjectRed = !r.project_code || r.project_code === '' || r.project_code === 'UNASSIGNED';
          if (isProjectRed) return false;

          // Punch In & Out check
          if (!r.punch_in || !r.punch_out) return false;
        }

        if (r.status === 'absent') {
          const isRemarksRed = !r.remarks || r.remarks.trim() === '' || r.remarks === 'Custom: ' || r.remarks.trim() === 'Custom:';
          if (isRemarksRed) return false;
        }
        return true;
      })
      .map(r => {
        const inTimestamp = buildTimestamp(date, r.punch_in);
        const outTimestamp = buildTimestamp(date, r.punch_out);
        const dbFields = getDbAttestedAndVerified(r, userData?.email);

        return {
          date: date,
          project_code: r.project_code || null,
          employee_code: r.employee_code,
          punch_in: inTimestamp,
          punch_out: outTimestamp,
          overtime: r.overtime,
          verify_type: r.verify_type,
          attested_by: dbFields.attested_by,
          machine: dbFields.machine,
          verified_by: dbFields.verified_by,
          remarks: r.remarks.startsWith('Custom: ')
            ? (r.remarks.substring(8).trim() || null)
            : (r.remarks.trim() || null),
          status: r.status || null,
          last_updated: new Date().toISOString(),
          approval: isFocalFiltered ? (r.approval && r.isApproved) : true,
          focal_approval: isFocalFiltered ? (r.approval && r.isApproved) : null
        };
      });

    if (payloads.length === 0) return;

    try {
      const employeeCodes = payloads.map(p => p.employee_code);
      const { error: delErr } = await supabase
        .from('timesheet')
        .delete()
        .eq('date', date)
        .in('employee_code', employeeCodes);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from('timesheet')
        .insert(payloads);
      if (insErr) throw insErr;

      setRows(prev => {
        const next = { ...prev };
        payloads.forEach(payload => {
          const userId = payload.employee_code;
          const curr = next[userId];
          if (curr) {
            next[userId] = {
              ...curr,
              inDatabase: true,
              isApproved: true,
              approval: !isFocalFiltered,
              machine: payload.machine,
              verified_by: payload.verified_by,
              attested_by: payload.attested_by,
              isEdited: payload.verify_type === 'Manual Input' || !!payload.verified_by
            };
          }
        });
        return next;
      });

      toast.success('Changes saved to timesheet.', { id: 'autosave' });
    } catch (err: any) {
      console.error('Batch auto-post failed:', err);
      toast.error('Failed to auto-save changes.', { id: 'autosave' });
    }
  }, [date, isFocalFiltered, canUserEdit, userData?.email]);

  const updateRow = useCallback((userId: string, key: keyof TimesheetRow, value: any) => {
    let updatedRow: TimesheetRow | null = null;
    setRows(prev => {
      const current = prev[userId];
      if (!current) return prev;
      const updated = { ...current, [key]: value };

      // Set isEdited flag if user modifies main fields
      if (key === 'punch_in' || key === 'punch_out' || key === 'overtime' || key === 'project_code' || key === 'status' || key === 'remarks') {
        updated.isEdited = true;
        updated.verify_type = 'Manual Input';
        updated.attested_by = userData?.email || 'Timekeeper';
      }

      // Automatically handle status adjustments
      if (key === 'status') {
        const emp = employeesMap[userId];
        const isStaff = emp?.emp_type === 'staff';
        const statusVal = (value === 'present with OT' && isStaff) ? 'present' : (value as 'present' | 'absent' | 'present with OT' | 'no status');
        updated.status = statusVal;

        if (statusVal === 'absent') {
          updated.punch_in = '';
          updated.punch_out = '';
          updated.overtime = 0;
          updated.remarks = '';
          const emp = employeesMap[userId];
          if (emp) {
            updated.project_code = employeeAssignedProjects[emp.emp_id] || '';
          }
        } else if (statusVal === 'no status') {
          updated.punch_in = '';
          updated.punch_out = '';
          updated.overtime = 0;
          updated.remarks = '';
        } else if (statusVal === 'present' || statusVal === 'present with OT') {
          const emp = employeesMap[userId];
          const projCode = current.project_code || (emp ? employeeAssignedProjects[emp.emp_id] : '') || '';
          const targetProj = projects.find(p => p.project_code === projCode);
          const inTime = targetProj?.project_in_time ? extractTime(targetProj.project_in_time) : '08:00';
          const outTime = targetProj?.project_out_time ? extractTime(targetProj.project_out_time) : '17:00';

          if (!current.punch_in && !current.punch_out) {
            updated.punch_in = inTime;
            updated.punch_out = outTime;
          }
          if (current.remarks === 'Absent') {
            updated.remarks = '';
          }

          if (statusVal === 'present') {
            updated.overtime = 0;
          } else {
            const inTimeVal = updated.punch_in;
            const outTimeVal = updated.punch_out;
            if (inTimeVal && outTimeVal && emp?.emp_type !== 'staff') {
              const [inH, inM] = inTimeVal.split(':').map(Number);
              const [outH, outM] = outTimeVal.split(':').map(Number);
              let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
              if (diffMin < 0) diffMin += 24 * 60;
              const hours = diffMin / 60;
              if (hours > 10) {
                const rawOT = hours - 10;
                updated.overtime = roundOT
                  ? Math.round(rawOT * 2) / 2
                  : parseFloat(rawOT.toFixed(1));
              } else {
                updated.overtime = 1.0;
              }
            } else {
              updated.overtime = emp?.emp_type !== 'staff' ? 1.0 : 0;
            }
          }
        }
      }

      // Automatically recalculate overtime on input change and sync status
      if (key === 'punch_in' || key === 'punch_out') {
        const inTime = key === 'punch_in' ? value : current.punch_in;
        const outTime = key === 'punch_out' ? value : current.punch_out;

        const emp = employeesMap[userId];
        const isStaff = emp?.emp_type === 'staff';

        if (inTime && outTime) {
          if (!isStaff) {
            const [inH, inM] = inTime.split(':').map(Number);
            const [outH, outM] = outTime.split(':').map(Number);
            let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
            if (diffMin < 0) diffMin += 24 * 60;
            const hours = diffMin / 60;
            if (hours > 10) {
              const rawOT = hours - 10;
              updated.overtime = roundOT
                ? Math.round(rawOT * 2) / 2
                : parseFloat(rawOT.toFixed(1));
              updated.status = 'present with OT';
            } else {
              updated.overtime = 0;
              updated.status = 'present';
            }
          } else {
            updated.overtime = 0;
            updated.status = 'present';
          }
        } else if (inTime || outTime) {
          updated.status = 'present';
          updated.overtime = 0;
        } else {
          updated.status = 'absent';
          updated.overtime = 0;
          updated.remarks = '';
          const emp = employeesMap[userId];
          if (emp) {
            updated.project_code = employeeAssignedProjects[emp.emp_id] || '';
          }
        }
      }

      if (key === 'overtime') {
        const otVal = value as number;
        if (otVal > 0) {
          updated.status = 'present with OT';
          if (!current.punch_in && !current.punch_out) {
            const emp = employeesMap[userId];
            const projCode = current.project_code || (emp ? employeeAssignedProjects[emp.emp_id] : '') || '';
            const targetProj = projects.find(p => p.project_code === projCode);
            const inTime = targetProj?.project_in_time ? extractTime(targetProj.project_in_time) : '08:00';
            const outTime = targetProj?.project_out_time ? extractTime(targetProj.project_out_time) : '17:00';
            updated.punch_in = inTime;
            updated.punch_out = outTime;
          }
        } else {
          updated.status = (updated.punch_in || updated.punch_out) ? 'present' : 'absent';
        }
      }

      updatedRow = updated;
      return { ...prev, [userId]: updated };
    });

    if (updatedRow) {
      autoPostRowsBatch([updatedRow]);
    }
  }, [employeesMap, employeeAssignedProjects, roundOT, userData?.email, projects, autoPostRowsBatch]);

  const handleRowSelect = useCallback((userId: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleBulkUpdate = (field: keyof TimesheetRow, value: any) => {
    if (selectedRowIds.size === 0) {
      toast.error('No rows selected.');
      return;
    }

    const updatedRows: TimesheetRow[] = [];
    setRows(prev => {
      const next = { ...prev };
      selectedRowIds.forEach(userId => {
        const current = next[userId];
        if (!current) return;

        let updated = { ...current, [field]: value };

        // Set isEdited flag if user modifies main fields
        if (field === 'punch_in' || field === 'punch_out' || field === 'overtime' || field === 'project_code' || field === 'status' || field === 'remarks') {
          updated.isEdited = true;
          updated.verify_type = 'Manual Input';
          updated.attested_by = userData?.email || 'Timekeeper';
        }

        // Automatically handle status adjustments
        if (field === 'status') {
          const emp = employeesMap[userId];
          const isStaff = emp?.emp_type === 'staff';
          const statusVal = (value === 'present with OT' && isStaff) ? 'present' : (value as 'present' | 'absent' | 'present with OT' | 'no status');
          updated.status = statusVal;

          if (statusVal === 'absent') {
            updated.punch_in = '';
            updated.punch_out = '';
            updated.overtime = 0;
            updated.remarks = '';
            const emp = employeesMap[userId];
            if (emp) {
              updated.project_code = employeeAssignedProjects[emp.emp_id] || '';
            }
          } else if (statusVal === 'no status') {
            updated.punch_in = '';
            updated.punch_out = '';
            updated.overtime = 0;
            updated.remarks = '';
          } else if (statusVal === 'present' || statusVal === 'present with OT') {
            const emp = employeesMap[userId];
            const projCode = current.project_code || (emp ? employeeAssignedProjects[emp.emp_id] : '') || '';
            const targetProj = projects.find(p => p.project_code === projCode);
            const inTime = targetProj?.project_in_time ? extractTime(targetProj.project_in_time) : '08:00';
            const outTime = targetProj?.project_out_time ? extractTime(targetProj.project_out_time) : '17:00';

            if (!current.punch_in && !current.punch_out) {
              updated.punch_in = inTime;
              updated.punch_out = outTime;
            }
            if (current.remarks === 'Absent') {
              updated.remarks = '';
            }

            if (statusVal === 'present') {
              updated.overtime = 0;
            } else {
              const inTimeVal = updated.punch_in;
              const outTimeVal = updated.punch_out;
              if (inTimeVal && outTimeVal && emp?.emp_type !== 'staff') {
                const [inH, inM] = inTimeVal.split(':').map(Number);
                const [outH, outM] = outTimeVal.split(':').map(Number);
                let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
                if (diffMin < 0) diffMin += 24 * 60;
                const hours = diffMin / 60;
                if (hours > 10) {
                  const rawOT = hours - 10;
                  updated.overtime = roundOT
                    ? Math.round(rawOT * 2) / 2
                    : parseFloat(rawOT.toFixed(1));
                } else {
                  updated.overtime = 1.0;
                }
              } else {
                updated.overtime = emp?.emp_type !== 'staff' ? 1.0 : 0;
              }
            }
          }
        }

        // Automatically recalculate overtime on input change and sync status
        if (field === 'punch_in' || field === 'punch_out') {
          const inTime = field === 'punch_in' ? value : current.punch_in;
          const outTime = field === 'punch_out' ? value : current.punch_out;

          const emp = employeesMap[userId];
          const isStaff = emp?.emp_type === 'staff';

          if (inTime && outTime) {
            if (!isStaff) {
              const [inH, inM] = inTime.split(':').map(Number);
              const [outH, outM] = outTime.split(':').map(Number);
              let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
              if (diffMin < 0) diffMin += 24 * 60;
              const hours = diffMin / 60;
              if (hours > 10) {
                const rawOT = hours - 10;
                updated.overtime = roundOT
                  ? Math.round(rawOT * 2) / 2
                  : parseFloat(rawOT.toFixed(1));
                updated.status = 'present with OT';
              } else {
                updated.overtime = 0;
                updated.status = 'present';
              }
            } else {
              updated.overtime = 0;
              updated.status = 'present';
            }
          } else if (inTime || outTime) {
            updated.status = 'present';
            updated.overtime = 0;
          } else {
            updated.status = 'absent';
            updated.overtime = 0;
            updated.remarks = '';
            if (emp) {
              updated.project_code = employeeAssignedProjects[emp.emp_id] || '';
            }
          }
        }

        if (field === 'overtime') {
          const otVal = value as number;
          if (otVal > 0) {
            updated.status = 'present with OT';
            if (!current.punch_in && !current.punch_out) {
              const emp = employeesMap[userId];
              const projCode = current.project_code || (emp ? employeeAssignedProjects[emp.emp_id] : '') || '';
              const targetProj = projects.find(p => p.project_code === projCode);
              const inTime = targetProj?.project_in_time ? extractTime(targetProj.project_in_time) : '08:00';
              const outTime = targetProj?.project_out_time ? extractTime(targetProj.project_out_time) : '17:00';
              updated.punch_in = inTime;
              updated.punch_out = outTime;
            }
          } else {
            updated.status = (updated.punch_in || updated.punch_out) ? 'present' : 'absent';
          }
        }

        next[userId] = updated;
        updatedRows.push(updated);
      });
      return next;
    });

    toast.success(`Bulk updated selected rows.`);
    setSelectedRowIds(new Set());
    setIsSelectionMode(false);

    if (updatedRows.length > 0) {
      autoPostRowsBatch(updatedRows);
    }
  };

  const handleBulkPunchTimeUpdate = (inTime: string, outTime: string) => {
    if (selectedRowIds.size === 0) {
      toast.error('No rows selected.');
      return;
    }

    const updatedRows: TimesheetRow[] = [];
    setRows(prev => {
      const next = { ...prev };
      selectedRowIds.forEach(userId => {
        const current = next[userId];
        if (!current) return;

        let updated = { ...current };

        const updateIn = inTime !== '';
        const updateOut = outTime !== '';

        if (!updateIn && !updateOut) return;

        if (updateIn) {
          updated.punch_in = inTime;
        }
        if (updateOut) {
          updated.punch_out = outTime;
        }

        updated.isEdited = true;
        updated.verify_type = 'Manual Input';
        updated.attested_by = userData?.email || 'Timekeeper';

        const currentIn = updated.punch_in;
        const currentOut = updated.punch_out;

        const emp = employeesMap[userId];
        const isStaff = emp?.emp_type === 'staff';

        if (currentIn && currentOut) {
          if (!isStaff) {
            const [inH, inM] = currentIn.split(':').map(Number);
            const [outH, outM] = currentOut.split(':').map(Number);
            let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
            if (diffMin < 0) diffMin += 24 * 60;
            const hours = diffMin / 60;
            if (hours > 10) {
              const rawOT = hours - 10;
              updated.overtime = roundOT
                ? Math.round(rawOT * 2) / 2
                : parseFloat(rawOT.toFixed(1));
              updated.status = 'present with OT';
            } else {
              updated.overtime = 0;
              updated.status = 'present';
            }
          } else {
            updated.overtime = 0;
            updated.status = 'present';
          }
        } else if (currentIn || currentOut) {
          updated.status = 'present';
          updated.overtime = 0;
        } else {
          updated.status = 'absent';
          updated.overtime = 0;
          updated.remarks = '';
          if (emp) {
            updated.project_code = employeeAssignedProjects[emp.emp_id] || '';
          }
        }

        next[userId] = updated;
        updatedRows.push(updated);
      });
      return next;
    });

    toast.success(`Bulk updated selected rows.`);
    setSelectedRowIds(new Set());
    setIsSelectionMode(false);

    if (updatedRows.length > 0) {
      autoPostRowsBatch(updatedRows);
    }
  };


  const handleBulkRevoke = useCallback(async () => {
    if (selectedRowIds.size === 0) {
      toast.error('No rows selected.');
      return;
    }

    if (!canUserEdit) {
      toast.error('You do not have clearance to modify this.');
      return;
    }

    const userIds = Array.from(selectedRowIds);

    const recordsToRevoke = userIds.filter(userId => {
      const r = rows[userId];
      if (!r) return false;
      if (isFocalFiltered && r.approval) return false;
      return true;
    });

    if (recordsToRevoke.length === 0) {
      toast.error('No revocable records selected.');
      return;
    }

    const recordsInDb = recordsToRevoke.filter(userId => rows[userId]?.inDatabase);

    if (recordsInDb.length > 0) {
      const actionText = isFocalFiltered ? 'verification' : 'approval';
      toast.loading(`Revoking ${actionText} for ${recordsInDb.length} records...`, { id: 'bulk-revoke' });
      try {
        const { error: delErr } = await supabase
          .from('timesheet')
          .delete()
          .eq('date', date)
          .in('employee_code', recordsInDb);
        if (delErr) throw delErr;
        toast.success(`Verification/Approval for selected records revoked & reverted.`, { id: 'bulk-revoke' });
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || `Failed to revoke.`, { id: 'bulk-revoke' });
        return;
      }
    }

    setRows(prev => {
      const next = { ...prev };
      recordsToRevoke.forEach(userId => {
        const current = next[userId];
        if (!current) return;

        const emp = employeesMap[userId];
        if (!emp) return;
        const empPunches = punchGroups[userId] || [];
        const guessed = guessRow(emp, empPunches, punchMode, projects, deviceProjectMap, employeeAssignedProjects);

        next[userId] = {
          ...guessed,
          isApproved: false,
          approval: false,
          inDatabase: false
        };
      });
      return next;
    });

    if (recordsInDb.length === 0) {
      toast.success("Changes reverted to original.");
    }

    setSelectedRowIds(new Set());
    setIsSelectionMode(false);
  }, [selectedRowIds, rows, date, isFocalFiltered, canUserEdit, employeesMap, punchGroups, punchMode, projects, deviceProjectMap, employeeAssignedProjects, guessRow]);

  const handleFinalize = async () => {
    if (!canUserEdit) {
      toast.error('You do not have clearance to finalize timesheets.');
      return;
    }

    setSaving(true);
    const actionPastText = isFocalFiltered ? 'verified' : 'finalized and locked';
    try {
      const hasNoSourceRows = Object.values(rows).some(r => {
        const { machineCode } = parseAttestedBy(r.attested_by, !!r.isApproved);
        const hasDevice = machineCode && machineCode !== 'Un-Mapped' && machineCode !== 'Timekeeper';
        return r.status !== 'absent' && r.status !== 'no status' && !r.isEdited && !hasDevice;
      });

      if (hasNoSourceRows) {
        toast.error("Cannot finalize. Some records have no biometric source. Please review items labeled 'No Source'.");
        setSaving(false);
        return;
      }

      const hasNoStatusRows = Object.values(rows).some(r => {
        return !r.status || r.status === 'no status';
      });

      if (hasNoStatusRows) {
        toast.error("Cannot finalize. Some records do not have a status selected.");
        setSaving(false);
        return;
      }

      const hasNoRemarksAbsentRows = Object.values(rows).some(r => {
        return r.status === 'absent' && (!r.remarks || r.remarks.trim() === '' || r.remarks === 'Custom: ');
      });

      if (hasNoRemarksAbsentRows) {
        toast.error("Cannot finalize. All absent employees must have a reason selected in remarks.");
        setSaving(false);
        return;
      }

      const hasMissingPunchTimes = Object.values(rows).some(r => {
        return (r.status === 'present' || r.status === 'present with OT') && (!r.punch_in || !r.punch_out);
      });

      if (hasMissingPunchTimes) {
        toast.error("Cannot finalize. Some present employees do not have both punch in and punch out times.");
        setSaving(false);
        return;
      }

      // 1. Construct payloads for insertion
      const payloads = Object.values(rows)
        .filter(r => r.punch_in || r.punch_out || r.remarks || r.isEdited || r.status)
        .map(r => {
          const inTimestamp = buildTimestamp(date, r.punch_in);
          const outTimestamp = buildTimestamp(date, r.punch_out);
          const dbFields = getDbAttestedAndVerified(r, userData?.email);

          return {
            date: date,
            project_code: r.project_code || null,
            employee_code: r.employee_code,
            punch_in: inTimestamp,
            punch_out: outTimestamp,
            overtime: r.overtime,
            verify_type: r.verify_type,
            attested_by: dbFields.attested_by,
            machine: dbFields.machine,
            verified_by: dbFields.verified_by,
            remarks: r.remarks.startsWith('Custom: ')
              ? (r.remarks.substring(8).trim() || null)
              : (r.remarks.trim() || null),
            status: r.status || null,
            last_updated: new Date().toISOString(),
            approval: !isFocalFiltered
          };
        });

      if (payloads.length === 0) {
        throw new Error('No employee shifts to finalize.');
      }

      // 2. Delete any existing entries for this date
      let deleteQuery = supabase.from('timesheet').delete().eq('date', date);
      if (isFocalFiltered && focalProjectCodes.length > 0) {
        deleteQuery = deleteQuery.in('project_code', focalProjectCodes);
      }
      const { error: delErr } = await deleteQuery;
      if (delErr) throw delErr;

      // 3. Insert newly approved/finalized records
      const { error: insErr } = await supabase
        .from('timesheet')
        .insert(payloads);
      if (insErr) throw insErr;

      toast.success(`Timesheets for ${date} ${actionPastText} for payroll!`);
      loadTimesheet();
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize timesheet.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (!canUserEdit) {
      toast.error('You do not have clearance to unlock timesheets.');
      return;
    }

    setSaving(true);
    try {
      // Delete existing rows for this date to unlock it
      let deleteQuery = supabase.from('timesheet').delete().eq('date', date);
      if (isFocalFiltered && focalProjectCodes.length > 0) {
        deleteQuery = deleteQuery.in('project_code', focalProjectCodes);
      }
      const { error: delErr } = await deleteQuery;
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

      if (sourceFilter !== 'ALL') {
        const category = getSourceCategory(row);
        if (category !== sourceFilter) return false;
      }

      if (empTypeFilter !== 'all') {
        const empType = emp.emp_type?.toLowerCase().trim();
        if (empTypeFilter === 'staff' && empType !== 'staff') return false;
        if (empTypeFilter === 'worker' && empType !== 'worker') return false;
      }

      return true;
    });
  }, [employees, rows, search, punchFilter, selectedProjects, sourceFilter, empTypeFilter]);

  return (
    <div className="bg-white animate-fade-in" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out forwards;
        }
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
          width: max-content;
          min-width: 100%;
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
        .timesheet-table tr.green-row-highlight td,
        .timesheet-table tr.green-row-highlight td.sticky-name,
        .timesheet-table tr.green-row-highlight td.sticky-action,
        .timesheet-table tr.green-row-highlight td.sticky-checkbox {
          background-color: #f1fbf7 !important;
        }
        .timesheet-table tr.green-row-highlight:hover td,
        .timesheet-table tr.green-row-highlight:hover td.sticky-name,
        .timesheet-table tr.green-row-highlight:hover td.sticky-action,
        .timesheet-table tr.green-row-highlight:hover td.sticky-checkbox {
          background-color: #e2f7f0 !important;
        }
        .timesheet-table td {
          transition: background-color 0.5s ease-in-out;
        }
        .source-badge {
          transition: background-color 0.5s ease-in-out;
        }
        @keyframes fade-in-only {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .badge-text-fade {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          animation: fade-in-only 0.3s ease-out forwards;
        }
        .timesheet-table td.sticky-action {
          position: sticky;
          right: 0;
          background-color: #ffffff;
          z-index: 5;
          box-shadow: -2px 0 5px -2px rgba(0,0,0,0.05), inset 1px 0 0 #f1f5f9;
        }
        .timesheet-table tr:hover td.sticky-action {
          background-color: #fafafb !important;
        }
        .timesheet-table th.sticky-action {
          position: sticky;
          right: 0;
          top: 0;
          z-index: 15;
          background-color: #f8fafc;
          box-shadow: -2px 0 5px -2px rgba(0,0,0,0.05), inset 1px 0 0 #e2e8f0, inset 0 -1px 0 #e2e8f0;
        }
        .timesheet-table td.sticky-name {
          position: sticky;
          left: 0;
          background-color: #ffffff;
          z-index: 5;
          box-shadow: 2px 0 5px -2px rgba(0,0,0,0.05);
        }
        .timesheet-table tr:hover td.sticky-name {
          background-color: #fafafb !important;
        }
        .timesheet-table th.sticky-name {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 15;
          background-color: #f8fafc;
          box-shadow: 2px 0 5px -2px rgba(0,0,0,0.05), inset 0 -1px 0 #e2e8f0;
        }
        .timesheet-table td.sticky-checkbox {
          position: sticky;
          left: 0;
          background-color: #ffffff;
          z-index: 5;
          transition: width 200ms ease-in-out, min-width 200ms ease-in-out, max-width 200ms ease-in-out, opacity 200ms ease-in-out, padding 200ms ease-in-out;
        }
        .timesheet-table tr:hover td.sticky-checkbox {
          background-color: #fafafb !important;
        }
        .timesheet-table th.sticky-checkbox {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 15;
          background-color: #f8fafc;
          box-shadow: inset 0 -1px 0 #e2e8f0;
          transition: width 200ms ease-in-out, min-width 200ms ease-in-out, max-width 200ms ease-in-out, opacity 200ms ease-in-out, padding 200ms ease-in-out;
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

              {canUserEdit && !isLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedRowIds(new Set());
                  }}
                  className={`h-8 w-8 p-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${isSelectionMode
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
                    : 'bg-white border-slate-300 text-slate-555 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  title="Toggle Selection Mode"
                >
                  <SquareCheck className="w-4 h-4" />
                </button>
              )}

              <DatePicker

                value={date}
                onChange={setDate as any}
                disabled={loading || saving}
                className="h-8 text-sm font-medium bg-white border border-slate-300 w-[160px] p-4"
              />
              <span className="text-xs text-gray-555 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-full font-medium shrink-0">
                {filteredEmployees.length} rows
              </span>

              {isFocalFiltered && focalProjectCodes.length > 0 && (
                <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-full font-medium shrink-0">
                  Project: {focalProjectCodes.join(', ')}
                </span>
              )}



              {isSelectionMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={selectedRowIds.size === 0}
                      className="h-8 px-3 select-none border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer font-medium text-[12px] text-slate-700 gap-1.5 shrink-0"
                    >
                      <span>Selected ({selectedRowIds.size})</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[180px] bg-white border border-slate-200 z-50 p-1">
                    <DropdownMenuItem
                      onClick={() => {
                        setBulkPunchInValue('');
                        setBulkPunchOutValue('');
                        setIsBulkPunchTimeOpen(true);
                      }}
                      className="text-xs cursor-pointer focus:bg-slate-50 rounded-md p-2"
                    >
                      Allocate Punch Time
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setBulkOvertimeValue(0);
                        setIsBulkOvertimeOpen(true);
                      }}
                      className="text-xs cursor-pointer focus:bg-slate-50 rounded-md p-2"
                    >
                      Allocate Overtime
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setBulkProjectValue('');
                        setIsBulkProjectOpen(true);
                      }}
                      className="text-xs cursor-pointer focus:bg-slate-50 rounded-md p-2"
                    >
                      Allocate Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setBulkStatusValue('present');
                        setIsBulkStatusOpen(true);
                      }}
                      className="text-xs cursor-pointer focus:bg-slate-50 rounded-md p-2"
                    >
                      Allocate Status
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setBulkRemarksValue('');
                        setBulkCustomRemarksValue('');
                        setIsBulkRemarksOpen(true);
                      }}
                      className="text-xs cursor-pointer focus:bg-slate-50 rounded-md p-2"
                    >
                      Allocate Remarks
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleBulkRevoke}
                      className="text-xs cursor-pointer text-red-600 hover:text-red-700 focus:bg-red-50 focus:text-red-700 rounded-md p-2 font-medium"
                    >
                      Revoke Changes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
          {canUserEdit && (
            isLocked ? (
              <button disabled={loading || saving} className="btn-unlock" onClick={handleUnlock}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                {isFocalFiltered ? 'Unlock Project Timesheet' : 'Unlock Timesheet'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Animated Toggle for In/Out Logic */}
                <div
                  onClick={() => handleModeChange(punchMode === 'first_last' ? 'check_in_out' : 'first_last')}
                  className="h-8 select-none border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer font-medium text-[12px] text-slate-700 relative overflow-hidden transition-all duration-200 shrink-0 animate-fade-in"
                  style={{ width: "9rem" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      handleModeChange(punchMode === 'first_last' ? 'check_in_out' : 'first_last');
                    }
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300 transform"
                    style={{
                      opacity: punchMode === 'first_last' ? 1 : 0,
                      transform: punchMode === 'first_last' ? 'translateY(0)' : 'translateY(-15px)',
                      pointerEvents: punchMode === 'first_last' ? 'auto' : 'none'
                    }}
                  >
                    First In / Last Out
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300 transform"
                    style={{
                      opacity: punchMode === 'first_last' ? 0 : 1,
                      transform: punchMode === 'first_last' ? 'translateY(15px)' : 'translateY(0)',
                      pointerEvents: punchMode === 'first_last' ? 'none' : 'auto'
                    }}
                  >
                    Check In / Check Out
                  </div>
                </div>

                <button disabled={loading || saving} style={{ fontSize: "0.8rem", fontWeight: 500 }} className="btn-finalize" onClick={handleFinalize}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {isFocalFiltered ? 'Verify & Finalize Day' : 'Approve & Finalize Day'}
                </button>
              </div>
            )
          )}
        </div>

        {/* Loading Indicator */}
        {loading && isInitialLoad ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', gap: '8px', color: '#94a3b8', fontSize: '13px', border: "1px solid rgba(100 100 100/ 0.15)", height: "100%", borderRadius: "12px" }}>
            <Loader2 className="animate-spin" size={20} />
            Loading Daily Shifts…
          </div>
        ) : error ? (
          <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '12px', fontSize: '13px' }}>
            {error}
          </div>
        ) : (
          <div className="table-scroll-container animate-fade-in" style={{ opacity: loading ? 0.65 : 1, transition: 'opacity 0.15s ease' }}>
            <table className="timesheet-table">
              <thead>
                <tr>
                  <th
                    className="sticky-checkbox transition-[width,opacity] duration-200 ease-in-out overflow-hidden"
                    style={{
                      width: isSelectionMode ? "48px" : "0px",
                      minWidth: isSelectionMode ? "48px" : "0px",
                      maxWidth: isSelectionMode ? "48px" : "0px",
                      opacity: isSelectionMode ? 1 : 0,
                      pointerEvents: isSelectionMode ? "auto" : "none",
                      textAlign: 'center',
                      padding: '0'
                    }}
                  >
                    <div className="w-12 h-10 flex items-center justify-center overflow-hidden">
                      <Checkbox
                        checked={
                          filteredEmployees.length > 0 &&
                          filteredEmployees.every(emp => selectedRowIds.has(emp.device_user_id))
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRowIds(new Set(filteredEmployees.map(emp => emp.device_user_id)));
                          } else {
                            setSelectedRowIds(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded border border-slate-400 bg-white data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white focus-visible:ring-indigo-500 cursor-pointer shrink-0"
                      />
                    </div>
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide sticky-name transition-[left] duration-200 ease-in-out" style={{ width: '320px', left: isSelectionMode ? '48px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      <div className="relative flex items-center group flex-1">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`w-[30px] h-[30px] rounded-lg border flex items-center justify-center cursor-pointer transition-all shrink-0 focus:outline-none ${empTypeFilter === 'all'
                                ? 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                : empTypeFilter === 'staff'
                                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            title={
                              empTypeFilter === 'all'
                                ? 'Filter: All Types'
                                : empTypeFilter === 'staff'
                                  ? 'Filter: Staff only'
                                  : 'Filter: Workers only'
                            }
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border border-gray-100 shadow-xl rounded-lg z-[100] w-[130px] p-1">
                          <DropdownMenuItem
                            onClick={() => setEmpTypeFilter('all')}
                            className={`text-xs cursor-pointer focus:bg-gray-50 rounded-md p-2 font-medium ${empTypeFilter === 'all' ? 'text-indigo-600 bg-indigo-50/50 font-semibold' : 'text-gray-700'}`}
                          >
                            ALL TYPES
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEmpTypeFilter('staff')}
                            className={`text-xs cursor-pointer focus:bg-gray-50 rounded-md p-2 font-medium ${empTypeFilter === 'staff' ? 'text-indigo-600 bg-indigo-50/50 font-semibold' : 'text-gray-700'}`}
                          >
                            STAFF ONLY
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEmpTypeFilter('worker')}
                            className={`text-xs cursor-pointer focus:bg-gray-50 rounded-md p-2 font-medium ${empTypeFilter === 'worker' ? 'text-indigo-600 bg-indigo-50/50 font-semibold' : 'text-gray-700'}`}
                          >
                            WORKERS ONLY
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </th>

                  <th style={{ width: '140px' }}>Status</th>
                  <th style={{ width: '100px' }}>Punch In</th>
                  <th style={{ width: '100px' }}>Punch Out</th>
                  <th style={{ width: '65px', textAlign: 'center' }}>Total</th>
                  <th style={{ width: '90px' }}>Overtime</th>
                  {!isFocalFiltered && (
                    <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: '160px' }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-555 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide cursor-pointer">
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
                              style={{ justifyContent: "flex-start" }}
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
                                  style={{ justifyContent: "flex-start" }}
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
                  )}
                  <th style={{ width: '200px' }}>Remarks</th>
                  <th className="sticky-action text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: '250px' }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-555 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide cursor-pointer">
                        <span className="truncate">
                          {sourceFilter === 'ALL'
                            ? 'Source (All)'
                            : sourceFilter === 'MANUAL'
                              ? 'Source (Manual)'
                              : sourceFilter === 'LEAVE_LOG'
                                ? 'Source (Leave Log)'
                                : sourceFilter === 'DEVICE'
                                  ? 'Source (Device)'
                                  : 'Source (No Source)'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[190px] p-1 bg-white border border-slate-200 z-50">
                        <DropdownMenuCheckboxItem
                          style={{ justifyContent: "flex-start" }}
                          checked={sourceFilter === 'ALL'}
                          onCheckedChange={() => setSourceFilter('ALL')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          All Sources
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          style={{ justifyContent: "flex-start" }}
                          checked={sourceFilter === 'MANUAL'}
                          onCheckedChange={() => setSourceFilter('MANUAL')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          Manual
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          style={{ justifyContent: "flex-start" }}
                          checked={sourceFilter === 'LEAVE_LOG'}
                          onCheckedChange={() => setSourceFilter('LEAVE_LOG')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          Leave Log
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          style={{ justifyContent: "flex-start" }}
                          checked={sourceFilter === 'DEVICE'}
                          onCheckedChange={() => setSourceFilter('DEVICE')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          Device
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          style={{ justifyContent: "flex-start" }}
                          checked={sourceFilter === 'NO_SOURCE'}
                          onCheckedChange={() => setSourceFilter('NO_SOURCE')}
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          No Source
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={isFocalFiltered ? 9 : 10} className="py-20 text-center text-gray-400 font-medium bg-white">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredEmployees.slice(0, renderLimit).map(emp => {
                      const row = rows[emp.device_user_id];
                      if (!row) return null;

                      return (
                        <TimesheetRowComponent
                          key={emp.device_user_id}
                          emp={emp}
                          row={row}
                          isSelected={selectedRowIds.has(emp.device_user_id)}
                          isSelectionMode={isSelectionMode}
                          isLocked={isLocked}
                          canUserEdit={canUserEdit}
                          projects={projects}
                          isFocalFiltered={isFocalFiltered}
                          saving={saving}
                          onRowSelect={handleRowSelect}
                          onUpdateRow={updateRow}
                          onUndoRow={handleUndoRow}
                        />
                      );
                    })}
                    {filteredEmployees.length > renderLimit && (
                      <tr>
                        <td colSpan={isFocalFiltered ? 9 : 10} style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: "1rem" }} className="p-4 text-center bg-white/80 backdrop-blur-xs sticky bottom-0 z-10 border-t border-gray-150">
                          <div className="flex items-center justify-center gap-4 w-full">
                            <span className="text-xs text-gray-500 font-medium text-center">
                              Showing {renderLimit} of {filteredEmployees.length} records
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLoadingMore(true);
                                setTimeout(() => {
                                  setRenderLimit(prev => prev + 100);
                                  setLoadingMore(false);
                                }, 50);
                              }}
                              disabled={loadingMore}
                              className="text-xs font-semibold h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-xs px-4 text-gray-755 cursor-pointer flex items-center justify-center gap-1.5 min-w-[100px]"
                            >
                              {loadingMore ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                "Load More"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Bulk Allocate Punch Time Dialog */}
      <Dialog open={isBulkPunchTimeOpen} onOpenChange={(open) => { if (!open) setIsBulkPunchTimeOpen(false); }}>
        <DialogContent className="sm:max-w-[425px] bg-white z-[100]">
          <DialogHeader>
            <DialogTitle>Bulk Update Punch Time</DialogTitle>
            <DialogDescription>
              Enter a new Punch In and/or Punch Out time for the {selectedRowIds.size} selected employee(s). Leaving either field blank will keep its original value.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Punch In Time</label>
              <Input
                type="time"
                value={bulkPunchInValue}
                onChange={(e) => setBulkPunchInValue(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Punch Out Time</label>
              <Input
                type="time"
                value={bulkPunchOutValue}
                onChange={(e) => setBulkPunchOutValue(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkPunchTimeOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleBulkPunchTimeUpdate(bulkPunchInValue, bulkPunchOutValue);
                setIsBulkPunchTimeOpen(false);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update Punch Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Allocate Overtime Dialog */}
      <Dialog open={isBulkOvertimeOpen} onOpenChange={(open) => { if (!open) setIsBulkOvertimeOpen(false); }}>
        <DialogContent className="sm:max-w-[425px] bg-white z-[100]">
          <DialogHeader>
            <DialogTitle>Bulk Update Overtime</DialogTitle>
            <DialogDescription>
              Enter overtime hours for the {selectedRowIds.size} selected employee(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Overtime Hours</label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={bulkOvertimeValue}
                onChange={(e) => setBulkOvertimeValue(parseFloat(e.target.value) || 0)}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkOvertimeOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleBulkUpdate('overtime', bulkOvertimeValue);
                setIsBulkOvertimeOpen(false);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update Overtime
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Allocate Project Dialog */}
      <Dialog open={isBulkProjectOpen} onOpenChange={(open) => { if (!open) setIsBulkProjectOpen(false); }}>
        <DialogContent className="sm:max-w-[425px] bg-white z-[100]">
          <DialogHeader>
            <DialogTitle>Bulk Update Project</DialogTitle>
            <DialogDescription>
              Select a project to allocate for the {selectedRowIds.size} selected employee(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Project Allocation</label>
              <Select
                value={bulkProjectValue || 'UNASSIGNED'}
                onValueChange={(val) => setBulkProjectValue(val === 'UNASSIGNED' ? '' : val)}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-white border border-slate-300">
                  <SelectValue placeholder="Choose Project" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 z-[120]">
                  <SelectItem value="UNASSIGNED" className="text-xs cursor-pointer focus:bg-slate-50">-- Choose Project --</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.project_code} value={p.project_code} className="text-xs cursor-pointer focus:bg-slate-50">
                      {p.project_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkProjectOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleBulkUpdate('project_code', bulkProjectValue);
                setIsBulkProjectOpen(false);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Allocate Status Dialog */}
      <Dialog open={isBulkStatusOpen} onOpenChange={(open) => { if (!open) setIsBulkStatusOpen(false); }}>
        <DialogContent className="sm:max-w-[425px] bg-white z-[100]">
          <DialogHeader>
            <DialogTitle>Bulk Update Status</DialogTitle>
            <DialogDescription>
              Select status for the {selectedRowIds.size} selected employee(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Status</label>
              <Select
                value={bulkStatusValue}
                onValueChange={(val: any) => setBulkStatusValue(val)}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-white border border-slate-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 z-[120]">
                  <SelectItem value="no status" className="text-xs cursor-pointer focus:bg-slate-50">No Status</SelectItem>
                  <SelectItem value="present" className="text-xs cursor-pointer focus:bg-slate-50">Present</SelectItem>
                  <SelectItem value="absent" className="text-xs cursor-pointer focus:bg-slate-50">Absent</SelectItem>
                  <SelectItem value="present with OT" className="text-xs cursor-pointer focus:bg-slate-50">Present with OT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkStatusOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleBulkUpdate('status', bulkStatusValue);
                setIsBulkStatusOpen(false);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Allocate Remarks Dialog */}
      <Dialog open={isBulkRemarksOpen} onOpenChange={(open) => { if (!open) setIsBulkRemarksOpen(false); }}>
        <DialogContent className="sm:max-w-[425px] bg-white z-[100]">
          <DialogHeader>
            <DialogTitle>Bulk Update Remarks</DialogTitle>
            <DialogDescription>
              Set remark for the {selectedRowIds.size} selected employee(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Remark</label>
              <Select
                value={
                  bulkRemarksValue === ''
                    ? 'NONE'
                    : (bulkRemarksValue === 'Present' || bulkRemarksValue === 'Forgot to Punch' || bulkRemarksValue === 'Sick Leave' || bulkRemarksValue === 'Unpaid Leave' || bulkRemarksValue === 'Casual Leave' || bulkRemarksValue === 'Emergency Leave')
                      ? bulkRemarksValue
                      : 'CUSTOM'
                }
                onValueChange={(val) => {
                  if (val === 'NONE') {
                    setBulkRemarksValue('');
                  } else if (val === 'CUSTOM') {
                    setBulkRemarksValue('Custom: ');
                  } else {
                    setBulkRemarksValue(val);
                  }
                }}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-white border border-slate-300">
                  <SelectValue placeholder="No Remark" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 z-[120]">
                  <SelectItem value="NONE" className="text-xs cursor-pointer focus:bg-slate-50">No Remark</SelectItem>
                  <SelectItem value="Forgot to Punch" className="text-xs cursor-pointer focus:bg-slate-50">Forgot to Punch</SelectItem>
                  <SelectItem value="Sick Leave" className="text-xs cursor-pointer focus:bg-slate-50">Sick Leave</SelectItem>
                  <SelectItem value="Unpaid Leave" className="text-xs cursor-pointer focus:bg-slate-50">Unpaid Leave</SelectItem>
                  <SelectItem value="Casual Leave" className="text-xs cursor-pointer focus:bg-slate-50">Casual Leave</SelectItem>
                  <SelectItem value="Emergency Leave" className="text-xs cursor-pointer focus:bg-slate-50">Emergency Leave</SelectItem>
                  <SelectItem value="CUSTOM" className="text-xs cursor-pointer focus:bg-slate-50">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkRemarksValue.startsWith('Custom: ') && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">Custom Remark</label>
                <Input
                  type="text"
                  value={bulkCustomRemarksValue}
                  onChange={(e) => setBulkCustomRemarksValue(e.target.value)}
                  placeholder="Type custom remark..."
                  className="h-9"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkRemarksOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const finalRemark = bulkRemarksValue.startsWith('Custom: ')
                  ? 'Custom: ' + bulkCustomRemarksValue
                  : bulkRemarksValue;
                handleBulkUpdate('remarks', finalRemark);
                setIsBulkRemarksOpen(false);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update Remarks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
