import { DatePicker } from '@/components/date-picker';
import { ResponsiveModal } from '@/components/responsive-modal';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { db } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleMinus, Download, Loader2, PartyPopper, Plus, Search, X } from 'lucide-react';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/utilis';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  device_user_id: string;
  name: string;
  department: string | null;
  emp_type: string | null;
  emp_id: string | null;
  location?: string | null;
}

interface PunchDetail {
  user_id: string;
  punch_time: string;
  punch_type: number;
  location?: string | null;
}

interface DaySummary {
  firstIn: string | null;
  firstInLocation: string | null;
  lastOut: string | null;
  lastOutLocation: string | null;
  firstPunch: string | null;
  firstPunchLocation: string | null;
  lastPunch: string | null;
  lastPunchLocation: string | null;
  isPresent: boolean;
}

type AttendanceMatrix = Record<string, Record<string, DaySummary>>;

type ReportType = 'inout' | 'pa' | 'hourly' | 'location_inout';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-OM', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Muscat',
  });
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getDayName(year: number, month: number, day: number): string {
  return new Date(year, month, day).toLocaleDateString('en-OM', { weekday: 'short' });
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 5; // Friday
}

function monthLabel(month: number, year: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-OM', { month: 'long', year: 'numeric' });
}

function getDayHours(summary: DaySummary | undefined): string {
  if (!summary || !summary.firstPunch || !summary.lastPunch || summary.firstPunch === summary.lastPunch) return '—';
  const start = new Date(summary.firstPunch).getTime();
  const end = new Date(summary.lastPunch).getTime();
  return ((end - start) / (1000 * 60 * 60)).toFixed(1);
}

function getOvertime(summary: DaySummary | undefined, empType: string | null): string {
  if (empType === 'staff') return '—';
  const hoursStr = getDayHours(summary);
  if (hoursStr === '—') return '—';
  const hours = parseFloat(hoursStr);
  if (isNaN(hours) || hours <= 8) return '—';
  return (hours - 8).toFixed(1);
}

// Shared row height so both tables stay in sync
const ROW_H = 44;
const HEAD_R1 = 40;
const HEAD_R2 = 26;

// ─── Memoized Subcomponents ───────────────────────────────────────────────────

const InCell = memo(({ daySummary, year, month, d, today, useFirstLast, holidayMap }: {
  daySummary: DaySummary | undefined;
  year: number;
  month: number;
  d: number;
  today: Date;
  useFirstLast: boolean;
  holidayMap: Record<number, { id: string; name: string }>;
}) => {
  if (isWeekend(year, month, d)) return <td className="bg-gray-50 text-gray-300 text-center text-[12px]" style={{ height: ROW_H }}>—</td>;
  const holiday = holidayMap?.[d];
  if (holiday) {
    if (daySummary?.isPresent) {
      const displayTime = useFirstLast ? formatTime(daySummary.firstPunch) : (formatTime(daySummary.firstIn) || '✓');
      return (
        <td className="text-center text-teal-700 font-medium tabular-nums text-[11px] whitespace-nowrap" style={{ height: ROW_H, backgroundColor: '#f4f7ff' }} title={`Holiday Worked: ${holiday.name}`}>
          {displayTime} (H)
        </td>
      );
    }
    return (
      <td className="text-center text-indigo-600 font-bold text-[12px]" style={{ height: ROW_H, backgroundColor: '#f4f7ff' }} title={holiday.name}>
        H
      </td>
    );
  }
  if (daySummary?.isPresent) {
    const displayTime = useFirstLast ? formatTime(daySummary.firstPunch) : (formatTime(daySummary.firstIn) || '✓');
    return (
      <td className="text-center text-emerald-700 font-medium tabular-nums text-[12px] whitespace-nowrap" style={{ height: ROW_H }}>
        {displayTime}
      </td>
    );
  }

  const isFuture = new Date(year, month, d) > today;
  if (isFuture) return <td className="text-center text-gray-300 text-[12px]" style={{ height: ROW_H }}>—</td>;

  return <td className="text-center text-red-400 font-bold text-[12px]" style={{ height: ROW_H }}>A</td>;
});
InCell.displayName = 'InCell';

const OutCell = memo(({ daySummary, year, month, d, useFirstLast, holidayMap }: {
  daySummary: DaySummary | undefined;
  year: number;
  month: number;
  d: number;
  useFirstLast: boolean;
  holidayMap: Record<number, { id: string; name: string }>;
}) => {
  if (isWeekend(year, month, d)) return <td className="bg-gray-50 text-gray-300 text-center text-[12px]" style={{ height: ROW_H }}>—</td>;
  const holiday = holidayMap?.[d];
  if (holiday) {
    if (daySummary?.isPresent) {
      const displayTime = useFirstLast
        ? (daySummary.firstPunch === daySummary.lastPunch ? '' : formatTime(daySummary.lastPunch))
        : (formatTime(daySummary.lastOut) || '—');
      return (
        <td className="text-center text-orange-500 font-medium tabular-nums text-[11px] whitespace-nowrap" style={{ height: ROW_H, backgroundColor: '#f4f7ff' }} title={`Holiday Worked: ${holiday.name}`}>
          {displayTime}
        </td>
      );
    }
    return <td className="text-center text-[12px]" style={{ height: ROW_H, backgroundColor: '#f4f7ff' }} title={holiday.name} />;
  }
  if (daySummary?.isPresent) {
    const displayTime = useFirstLast
      ? (daySummary.firstPunch === daySummary.lastPunch ? '' : formatTime(daySummary.lastPunch))
      : (formatTime(daySummary.lastOut) || '—');
    return (
      <td className="text-center text-orange-500 font-medium tabular-nums text-[12px] whitespace-nowrap" style={{ height: ROW_H }}>
        {displayTime}
      </td>
    );
  }
  return <td className="text-center text-[12px]" style={{ height: ROW_H }} />;
});
OutCell.displayName = 'OutCell';

const LocationInCell = memo(({ daySummary, year, month, d, today, useFirstLast, holidayMap }: {
  daySummary: DaySummary | undefined;
  year: number;
  month: number;
  d: number;
  today: Date;
  useFirstLast: boolean;
  holidayMap: Record<number, { id: string; name: string }>;
}) => {
  if (isWeekend(year, month, d)) return <td className="bg-gray-50 text-gray-300 text-center text-[11px]" style={{ height: ROW_H }}>—</td>;
  const holiday = holidayMap?.[d];
  if (holiday) {
    if (daySummary?.isPresent) {
      const displayTime = useFirstLast ? formatTime(daySummary.firstPunch) : (formatTime(daySummary.firstIn) || '✓');
      const displayLoc = useFirstLast ? daySummary.firstPunchLocation : (daySummary.firstInLocation || '—');
      return (
        <td className="text-center" style={{ height: ROW_H, verticalAlign: 'middle', padding: '2px', backgroundColor: '#f4f7ff' }} title={`Holiday Worked: ${holiday.name}`}>
          <div className="flex flex-col items-center justify-center leading-tight">
            <span className="text-teal-700 font-semibold tabular-nums text-[11px]">{displayTime} (H)</span>
            <span className="text-gray-400 text-[10px] truncate max-w-[110px]" title={displayLoc || ''}>{displayLoc || '—'}</span>
          </div>
        </td>
      );
    }
    return (
      <td className="text-center text-indigo-600 font-bold text-[12px]" style={{ height: ROW_H, backgroundColor: '#f4f7ff' }} title={holiday.name}>
        H
      </td>
    );
  }
  if (daySummary?.isPresent) {
    const displayTime = useFirstLast ? formatTime(daySummary.firstPunch) : (formatTime(daySummary.firstIn) || '✓');
    const displayLoc = useFirstLast ? daySummary.firstPunchLocation : (daySummary.firstInLocation || '—');
    return (
      <td className="text-center bg-white" style={{ height: ROW_H, verticalAlign: 'middle', padding: '2px' }}>
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="text-emerald-700 font-semibold tabular-nums text-[12px]">{displayTime}</span>
          <span className="text-gray-400 text-[10px] truncate max-w-[110px]" title={displayLoc || ''}>{displayLoc || '—'}</span>
        </div>
      </td>
    );
  }

  const isFuture = new Date(year, month, d) > today;
  if (isFuture) return <td className="text-center text-gray-300 text-[12px]" style={{ height: ROW_H }}>—</td>;

  return <td className="text-center text-red-400 font-bold text-[12px]" style={{ height: ROW_H }}>A</td>;
});
LocationInCell.displayName = 'LocationInCell';

const LocationOutCell = memo(({ daySummary, year, month, d, useFirstLast, holidayMap }: {
  daySummary: DaySummary | undefined;
  year: number;
  month: number;
  d: number;
  useFirstLast: boolean;
  holidayMap: Record<number, { id: string; name: string }>;
}) => {
  if (isWeekend(year, month, d)) return <td className="bg-gray-50 text-gray-300 text-center text-[11px]" style={{ height: ROW_H }}>—</td>;
  const holiday = holidayMap?.[d];
  if (holiday) {
    if (daySummary?.isPresent) {
      const displayTime = useFirstLast
        ? (daySummary.firstPunch === daySummary.lastPunch ? '' : formatTime(daySummary.lastPunch))
        : (formatTime(daySummary.lastOut) || '—');
      const displayLoc = useFirstLast
        ? (daySummary.firstPunch === daySummary.lastPunch ? '' : (daySummary.lastPunchLocation || '—'))
        : (daySummary.lastOutLocation || '—');

      if (!displayTime && !displayLoc) {
        return <td className="text-center text-[12px]" style={{ height: ROW_H, backgroundColor: '#f4f7ff' }} />;
      }

      return (
        <td className="text-center" style={{ height: ROW_H, verticalAlign: 'middle', padding: '2px', backgroundColor: '#f4f7ff' }} title={`Holiday Worked: ${holiday.name}`}>
          <div className="flex flex-col items-center justify-center leading-tight">
            <span className="text-orange-500 font-semibold tabular-nums text-[11px]">{displayTime || '—'}</span>
            <span className="text-gray-400 text-[10px] truncate max-w-[110px]" title={displayLoc || ''}>{displayLoc || '—'}</span>
          </div>
        </td>
      );
    }
    return <td className="text-center text-[12px]" style={{ height: ROW_H, backgroundColor: '#f4f7ff' }} title={holiday.name} />;
  }
  if (daySummary?.isPresent) {
    const displayTime = useFirstLast
      ? (daySummary.firstPunch === daySummary.lastPunch ? '' : formatTime(daySummary.lastPunch))
      : (formatTime(daySummary.lastOut) || '—');
    const displayLoc = useFirstLast
      ? (daySummary.firstPunch === daySummary.lastPunch ? '' : (daySummary.lastPunchLocation || '—'))
      : (daySummary.lastOutLocation || '—');

    if (!displayTime && !displayLoc) {
      return <td className="text-center text-[12px]" style={{ height: ROW_H }} />;
    }

    return (
      <td className="text-center bg-white" style={{ height: ROW_H, verticalAlign: 'middle', padding: '2px' }}>
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="text-orange-500 font-semibold tabular-nums text-[12px]">{displayTime || '—'}</span>
          <span className="text-gray-400 text-[10px] truncate max-w-[110px]" title={displayLoc || ''}>{displayLoc || '—'}</span>
        </div>
      </td>
    );
  }
  return <td className="text-center text-[12px]" style={{ height: ROW_H }} />;
});
LocationOutCell.displayName = 'LocationOutCell';

interface FrozenRowProps {
  emp: Employee;
  index: number;
  locationList: string;
  presenceCount: number;
  absentCount: number;
  overtimeCount: string;
  showOvertime: boolean;
}

const FrozenRow = memo(({ emp, index, locationList, presenceCount, absentCount, overtimeCount, showOvertime }: FrozenRowProps) => {
  return (
    <tr style={{ height: ROW_H, borderBottom: '1px solid #f9fafb' }}>
      <td className="text-[13px] text-gray-400 text-center bg-white px-1">{index + 1}</td>
      <td style={{ textTransform: "capitalize" }} className="text-[13px] font-medium text-gray-900 bg-white px-3 whitespace-nowrap">
        {emp.name.toLowerCase()}
        {emp.emp_id && <div className="text-[11px] text-gray-400 font-normal">{emp.emp_id}</div>}
      </td>
      <td
        className="text-[13px] text-gray-500 bg-white px-2 truncate"
        style={{ maxWidth: 170 }}
        title={locationList}
      >
        {locationList}
      </td>
      <td className="text-center text-[13px] font-semibold text-emerald-700" style={{ background: '#ecfdf5', height: ROW_H }}>
        {presenceCount}
      </td>
      <td className="text-center text-[13px] font-semibold text-red-600" style={{ background: '#fef2f2', height: ROW_H }}>
        {absentCount}
      </td>
      {showOvertime && (
        <td className="text-center text-[13px] font-semibold text-amber-700" style={{ background: '#fffbeb', height: ROW_H }}>
          {overtimeCount}
        </td>
      )}
      <td className="bg-white" />
    </tr>
  );
});
FrozenRow.displayName = 'FrozenRow';

interface ScrollableRowProps {
  emp: Employee;
  dayList: number[];
  reportType: ReportType;
  useFirstLast: boolean;
  matrixForEmployee: Record<string, DaySummary> | undefined;
  year: number;
  month: number;
  today: Date;
  holidayMap: Record<number, { id: string; name: string }>;
}

const ScrollableRow = memo(({
  dayList,
  reportType,
  useFirstLast,
  matrixForEmployee,
  year,
  month,
  today,
  holidayMap
}: ScrollableRowProps) => {
  return (
    <tr style={{ height: ROW_H, borderBottom: '1px solid #f9fafb' }} className="hover:bg-blue-50/20">
      {dayList.map(d => {
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
        const c = matrixForEmployee?.[dateKey];
        if (reportType === 'hourly') {
          const holiday = holidayMap?.[d];
          const bg = isWeekend(year, month, d) ? '#f9fafb' : holiday ? '#eef2ff' : 'white';
          return (
            <td key={`day-${d}`} className="text-center text-[12px] font-medium text-gray-400" style={{ height: ROW_H, background: bg }} title={holiday ? `Holiday: ${holiday.name}` : undefined}>
              {holiday && !c?.isPresent ? 'HOL' : getDayHours(c)}
            </td>
          );
        }
        if (reportType === 'pa') {
          let content = '';
          let color = '';
          const holiday = holidayMap?.[d];
          const bg = isWeekend(year, month, d) ? '#f9fafb' : holiday ? '#eef2ff' : 'white';

          if (isWeekend(year, month, d)) { content = '—'; color = 'text-gray-300'; }
          else if (holiday) {
            if (c?.isPresent) { content = 'P(H)'; color = 'text-teal-600 font-bold'; }
            else { content = 'H'; color = 'text-indigo-500 font-bold'; }
          }
          else if (c?.isPresent) { content = 'P'; color = 'text-emerald-500 font-bold'; }
          else if (new Date(year, month, d) > today) { content = '—'; color = 'text-gray-300'; }
          else { content = 'A'; color = 'text-red-400 font-bold'; }

          return (
            <td key={`day-${d}`} className={`text-center text-[12px] ${color}`} style={{ height: ROW_H, background: bg }} title={holiday ? `Holiday: ${holiday.name}` : undefined}>
              {content}
            </td>
          );
        }
        if (reportType === 'location_inout') {
          return (
            <Fragment key={`day-${d}`}>
              <LocationInCell daySummary={c} year={year} month={month} d={d} today={today} useFirstLast={useFirstLast} holidayMap={holidayMap} />
              <LocationOutCell daySummary={c} year={year} month={month} d={d} useFirstLast={useFirstLast} holidayMap={holidayMap} />
            </Fragment>
          );
        }
        return (
          <Fragment key={`day-${d}`}>
            <InCell daySummary={c} year={year} month={month} d={d} today={today} useFirstLast={useFirstLast} holidayMap={holidayMap} />
            <OutCell daySummary={c} year={year} month={month} d={d} useFirstLast={useFirstLast} holidayMap={holidayMap} />
          </Fragment>
        );
      })}
    </tr>
  );
});
ScrollableRow.displayName = 'ScrollableRow';

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffMonthlyReport() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [punches, setPunches] = useState<PunchDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter] = useState('all');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportType, setReportType] = useState<ReportType>('inout');
  const [useFirstLast, setUseFirstLast] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportView, setReportView] = useState<'monthly' | 'daily' | 'individual'>('monthly');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(() => todayISO());
  const [empSearch, setEmpSearch] = useState("");
  const [openEmpSelect, setOpenEmpSelect] = useState(false);

  // Holidays State
  interface Holiday {
    id: string;
    day: number;
    name: string;
  }
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHolidayDay, setNewHolidayDay] = useState(1);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);

  // Realtime holidays fetch from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'attendance_holidays'),
      where('year', '==', year),
      where('month', '==', month)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Holiday[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          day: data.day,
          name: data.name
        });
      });
      list.sort((a, b) => a.day - b.day);
      setHolidays(list);
    }, (err) => {
      console.error('Error fetching holidays:', err);
    });

    return () => unsubscribe();
  }, [year, month]);

  const holidayMap = useMemo(() => {
    const map: Record<number, { id: string; name: string }> = {};
    holidays.forEach(h => {
      map[h.day] = { id: h.id, name: h.name };
    });
    return map;
  }, [holidays]);

  const isHoliday = useCallback((d: number) => {
    return !!holidayMap[d];
  }, [holidayMap]);

  const rightRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const tableAreaRef = useRef<HTMLDivElement>(null);

  const days = daysInMonth(year, month);
  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => i + 1), [days]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let start = '';
    let end = '';

    if (reportView === 'daily') {
      if (!selectedDailyDate) {
        setLoading(false);
        return;
      }
      start = `${selectedDailyDate}T00:00:00`;
      end = `${selectedDailyDate}T23:59:59`;
    } else {
      const pad = (n: number) => String(n).padStart(2, '0');
      start = `${year}-${pad(month + 1)}-01T00:00:00`;
      end = `${year}-${pad(month + 1)}-${pad(days)}T23:59:59`;
    }

    try {
      const { data: empData, error: eErr } = await supabase.from('employees')
        .select('id, device_user_id, name, department, emp_type, emp_id')
        .order('name', { ascending: true });

      if (eErr) {
        setError(eErr.message);
        setLoading(false);
        return;
      }

      let allPunches: any[] = [];
      let from = 0;
      let to = 999;
      let finished = false;

      while (!finished) {
        const { data, error: pErr } = await supabase.from('punch_details')
          .select('user_id, punch_time, punch_type, location')
          .gte('punch_time', start)
          .lte('punch_time', end)
          .order('punch_time', { ascending: true })
          .range(from, to);

        if (pErr) {
          setError(pErr.message);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          allPunches = [...allPunches, ...data];
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

      setEmployees(empData ?? []);
      setPunches(allPunches);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [year, month, days, reportView, selectedDailyDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Matrix ─────────────────────────────────────────────────────────────────
  const matrix: AttendanceMatrix = useMemo(() => {
    const r: AttendanceMatrix = {};
    for (const p of punches) {
      const ds = new Date(p.punch_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
      if (!r[p.user_id]) r[p.user_id] = {};
      if (!r[p.user_id][ds]) {
        r[p.user_id][ds] = {
          firstIn: null,
          firstInLocation: null,
          lastOut: null,
          lastOutLocation: null,
          firstPunch: null,
          firstPunchLocation: null,
          lastPunch: null,
          lastPunchLocation: null,
          isPresent: false
        };
      }
      const c = r[p.user_id][ds];
      c.isPresent = true;
      if (p.punch_type === 0) {
        if (!c.firstIn || p.punch_time < c.firstIn) {
          c.firstIn = p.punch_time;
          c.firstInLocation = p.location || null;
        }
      } else {
        if (!c.lastOut || p.punch_time > c.lastOut) {
          c.lastOut = p.punch_time;
          c.lastOutLocation = p.location || null;
        }
      }

      if (!c.firstPunch || p.punch_time < c.firstPunch) {
        c.firstPunch = p.punch_time;
        c.firstPunchLocation = p.location || null;
      }
      if (!c.lastPunch || p.punch_time > c.lastPunch) {
        c.lastPunch = p.punch_time;
        c.lastPunchLocation = p.location || null;
      }
    }

    // Clean up duplicate punches within 5 minutes
    Object.values(r).forEach(userDates => {
      Object.values(userDates).forEach(c => {
        if (c.firstPunch && c.lastPunch && c.firstPunch !== c.lastPunch) {
          const diffMs = new Date(c.lastPunch).getTime() - new Date(c.firstPunch).getTime();
          if (diffMs <= 5 * 60 * 1000) { // 5 minutes threshold
            c.lastPunch = c.firstPunch;
            c.lastPunchLocation = c.firstPunchLocation;
          }
        }
        if (c.firstIn && c.lastOut) {
          const diffMs = Math.abs(new Date(c.lastOut).getTime() - new Date(c.firstIn).getTime());
          if (diffMs <= 5 * 60 * 1000) { // 5 minutes threshold
            c.lastOut = null;
            c.lastOutLocation = null;
          }
        }
      });
    });

    return r;
  }, [punches]);

  // ── Derived ────────────────────────────────────────────────────────────────
  // const departments = useMemo(() =>
  //   [...new Set(employees.map(e => e.department).filter(Boolean) as string[])].sort(),
  //   [employees]);

  const locations = useMemo(() =>
    [...new Set(punches.map(p => p.location).filter(Boolean) as string[])].sort(),
    [punches]);

  const employeeLocations = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const p of punches) {
      if (!p.location) continue;
      if (!map[p.user_id]) {
        map[p.user_id] = new Set();
      }
      map[p.user_id].add(p.location);
    }
    const result: Record<string, string> = {};
    for (const [uid, locSet] of Object.entries(map)) {
      result[uid] = Array.from(locSet).sort().join(', ');
    }
    return result;
  }, [punches]);

  const filtered = useMemo(() => {
    let list = deptFilter === 'all' ? employees : employees.filter(e => e.department === deptFilter);
    if (selectedLocations.length > 0) {
      list = list.filter(e => {
        const locs = employeeLocations[e.device_user_id];
        if (!locs) return false;
        const employeeLocArray = locs.split(', ');
        return employeeLocArray.some(loc => selectedLocations.includes(loc));
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.emp_id && e.emp_id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [employees, deptFilter, selectedLocations, searchQuery, employeeLocations]);

  const selectedEmp = useMemo(() => {
    return employees.find(e => e.device_user_id === selectedEmployeeId) || filtered[0] || employees[0];
  }, [employees, filtered, selectedEmployeeId]);

  const selectableEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(emp =>
      emp.name.toLowerCase().includes(q) ||
      (emp.emp_id && emp.emp_id.toLowerCase().includes(q))
    );
  }, [filtered, empSearch]);

  const dateListInRange = useMemo(() => {
    if (!selectedDailyDate) return [];
    return [selectedDailyDate];
  }, [selectedDailyDate]);

  const workDays = useMemo(() =>
    dayList.filter(d => !isWeekend(year, month, d) && !isHoliday(d)).length,
    [dayList, year, month, isHoliday]);

  // const pastWorkDays = useMemo(() =>
  //   dayList.filter(d => !isWeekend(year, month, d) && !isHoliday(d) && new Date(year, month, d) <= today).length,
  //   [dayList, year, month, isHoliday, today]);

  const presenceDays = (uid: string) => {
    return dayList.filter(d => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
      return !!matrix[uid]?.[dateKey]?.isPresent;
    }).length;
  };
  const absentDays = (uid: string) => {
    return dayList.filter(d => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
      return (
        new Date(year, month, d) <= today &&
        !isWeekend(year, month, d) &&
        !isHoliday(d) &&
        !matrix[uid]?.[dateKey]?.isPresent
      );
    }).length;
  };

  const totalOvertime = (uid: string, empType: string | null) => {
    if (empType === 'staff') return '—';
    let total = 0;
    dayList.forEach(d => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
      const c = matrix[uid]?.[dateKey];
      if (c?.isPresent) {
        const hoursStr = getDayHours(c);
        if (hoursStr !== '—') {
          const hours = parseFloat(hoursStr);
          if (!isNaN(hours) && hours > 8) {
            total += hours - 8;
          }
        }
      }
    });
    return total > 0 ? total.toFixed(1) : '—';
  };

  const totalHours = (uid: string) => {
    let total = 0;
    dayList.forEach(d => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
      const c = matrix[uid]?.[dateKey];
      if (c?.isPresent) {
        const hoursStr = getDayHours(c);
        if (hoursStr !== '—') {
          const hours = parseFloat(hoursStr);
          if (!isNaN(hours)) {
            total += hours;
          }
        }
      }
    });
    return total > 0 ? total.toFixed(1) : '—';
  };

  // ── Scroll sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const r = rightRef.current;
    const l = leftRef.current;
    if (!r || !l) return;
    const sync = () => { l.scrollTop = r.scrollTop; };
    r.addEventListener('scroll', sync);
    return () => r.removeEventListener('scroll', sync);
  }, [loading]);

  // ── Month nav ──────────────────────────────────────────────────────────────
  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  // ── Excel export ───────────────────────────────────────────────────────────
  function exportExcel() {
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [];

    if (reportView === 'individual') {
      if (!selectedEmp) return;
      rows.push([`Staff Individual Monthly Report — ${selectedEmp.name}`]);
      rows.push([`Period: ${monthLabel(month, year)}`]);
      rows.push([]);
      rows.push(['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Hours', 'Overtime']);

      dayList.forEach((d) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
        const dateObj = new Date(year, month, d);
        const displayDate = dateObj.toLocaleDateString('en-OM', { day: '2-digit', month: 'short', year: 'numeric' });
        const displayDayName = getDayName(year, month, d);

        const c = matrix[selectedEmp.device_user_id]?.[dateStr];
        const isWeekendDay = isWeekend(year, month, d);
        const isHolidayDay = isHoliday(d);
        const holiday = holidayMap[d];

        let statusText = 'Absent';
        let checkInText = '—';
        let checkOutText = '—';
        let hoursText = '—';
        let overtimeText = '—';

        if (isWeekendDay) {
          statusText = 'Weekend';
        } else if (isHolidayDay) {
          statusText = c?.isPresent ? 'Worked (Holiday)' : `Holiday (${holiday?.name || 'Holiday'})`;
        } else if (c?.isPresent) {
          statusText = 'Present';
        } else {
          statusText = dateObj > today ? '—' : 'Absent';
        }

        if (c?.isPresent) {
          if (useFirstLast) {
            checkInText = formatTime(c.firstPunch) || '✓';
            checkOutText = c.firstPunch === c.lastPunch ? '—' : (formatTime(c.lastPunch) || '—');
          } else {
            checkInText = formatTime(c.firstIn) || '✓';
            checkOutText = formatTime(c.lastOut) || '—';
          }

          const inLoc = useFirstLast ? c.firstPunchLocation : c.firstInLocation;
          const outLoc = useFirstLast ? c.lastPunchLocation : c.lastOutLocation;

          if (inLoc) checkInText += ` (${inLoc})`;
          if (outLoc && c.firstPunch !== c.lastPunch) checkOutText += ` (${outLoc})`;

          hoursText = getDayHours(c);
          overtimeText = getOvertime(c, selectedEmp.emp_type);
        }

        rows.push([
          displayDate,
          displayDayName,
          statusText,
          checkInText,
          checkOutText,
          hoursText,
          overtimeText
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 8 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, ws, `Individual_Report`);
      XLSX.writeFile(wb, `Individual_${selectedEmp.name.replace(/\s+/g, '_')}_${year}_${String(month + 1).padStart(2, '0')}.xlsx`);
      return;
    }

    if (reportView === 'daily') {
      rows.push([`Staff Daily Attendance Report`]);
      rows.push([`Date: ${selectedDailyDate}`]);
      rows.push([]);
      rows.push(['Date', '#', 'Name', 'Emp ID', 'Department', 'Status', 'Check In', 'Check Out', 'Hours', 'Overtime']);

      dateListInRange.forEach((dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const displayDate = dateObj.toLocaleDateString('en-OM', { day: '2-digit', month: 'short', year: 'numeric' });
        const isWeekendDay = isWeekend(y, m - 1, d);
        const isHolidayDay = holidays.some(h => h.day === d && year === y && month === (m - 1));

        filtered.forEach((emp, idx) => {
          const c = matrix[emp.device_user_id]?.[dateStr];

          let statusText = 'Absent';
          let checkInText = '—';
          let checkOutText = '—';
          let hoursText = '—';

          if (isWeekendDay) {
            statusText = 'Weekend';
          } else if (isHolidayDay) {
            statusText = c?.isPresent ? 'Worked (Holiday)' : 'Holiday';
          } else if (c?.isPresent) {
            statusText = 'Present';
          } else {
            statusText = dateObj > today ? '—' : 'Absent';
          }

          if (c?.isPresent) {
            if (useFirstLast) {
              checkInText = formatTime(c.firstPunch) || '✓';
              checkOutText = c.firstPunch === c.lastPunch ? '—' : (formatTime(c.lastPunch) || '—');
            } else {
              checkInText = formatTime(c.firstIn) || '✓';
              checkOutText = formatTime(c.lastOut) || '—';
            }

            const inLoc = useFirstLast ? c.firstPunchLocation : c.firstInLocation;
            const outLoc = useFirstLast ? c.lastPunchLocation : c.lastOutLocation;

            if (inLoc) checkInText += ` (${inLoc})`;
            if (outLoc && c.firstPunch !== c.lastPunch) checkOutText += ` (${outLoc})`;

            hoursText = getDayHours(c);
          }

          const overtimeText = getOvertime(c, emp.emp_type);

          rows.push([
            displayDate,
            idx + 1,
            emp.name,
            emp.emp_id ?? '',
            emp.department ?? '',
            statusText,
            checkInText,
            checkOutText,
            hoursText,
            overtimeText
          ]);
        });
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 12 }, { wch: 4 }, { wch: 25 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 8 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, ws, `Daily_Report`);
      XLSX.writeFile(wb, `Daily_Attendance_${selectedDailyDate}.xlsx`);
      return;
    }

    rows.push([`Staff Attendance — ${monthLabel(month, year)}`]);
    rows.push([]);

    const monthName = new Date(year, month, 1).toLocaleDateString('en-OM', { month: 'long' });
    const r1: string[] = ['#', 'Name', 'Emp ID', 'Location'];
    const r2: string[] = ['', '', '', ''];
    const r3: string[] = ['', '', '', ''];
    const colCount = reportType === 'inout' || reportType === 'location_inout' ? 2 : 1;

    for (let d = 1; d <= days; d++) {
      r1.push(`${d} ${monthName} ${year}`);
      if (colCount === 2) r1.push('');
      r2.push(getDayName(year, month, d));
      if (colCount === 2) r2.push('');
      if (reportType === 'hourly') {
        r3.push('hours');
      } else if (reportType === 'pa') {
        r3.push('status');
      } else if (reportType === 'location_inout') {
        r3.push('In (Time - Loc)', 'Out (Time - Loc)');
      } else {
        r3.push('In', 'Out');
      }
    }
    if (reportType === 'hourly') {
      r1.push('P', 'A', 'OT'); r2.push('', '', ''); r3.push('', '', '');
    } else {
      r1.push('P', 'A'); r2.push('', ''); r3.push('', '');
    }
    rows.push(r1, r2, r3);

    filtered.forEach((emp, idx) => {
      const row: (string | number)[] = [idx + 1, emp.name, emp.emp_id ?? '', employeeLocations[emp.device_user_id] || '—'];
      for (let d = 1; d <= days; d++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const c = matrix[emp.device_user_id]?.[dateKey];
        const isHolidayDay = isHoliday(d);
        const holiday = holidayMap[d];

        if (reportType === 'hourly') {
          if (isWeekend(year, month, d)) { row.push('OFF'); }
          else if (isHolidayDay) { row.push(c?.isPresent ? getDayHours(c) : 'HOL'); }
          else { row.push(getDayHours(c)); }
        } else if (reportType === 'pa') {
          if (isWeekend(year, month, d)) { row.push('OFF'); }
          else if (isHolidayDay) { row.push(c?.isPresent ? 'P(H)' : 'H'); }
          else if (c?.isPresent) { row.push('P'); }
          else if (new Date(year, month, d) > today) { row.push('—'); }
          else { row.push('A'); }
        } else if (reportType === 'location_inout') {
          if (isWeekend(year, month, d)) { row.push('OFF', ''); }
          else if (isHolidayDay && !c?.isPresent) { row.push(`HOL (${holiday?.name || 'Holiday'})`, ''); }
          else if (c?.isPresent) {
            if (useFirstLast) {
              const inTime = formatTime(c.firstPunch);
              const inLoc = c.firstPunchLocation || '—';
              const outTime = c.firstPunch === c.lastPunch ? '' : formatTime(c.lastPunch);
              const outLoc = c.firstPunch === c.lastPunch ? '' : (c.lastPunchLocation || '—');
              row.push(
                inTime ? `${inTime} (${inLoc})${isHolidayDay ? ' (H)' : ''}` : '',
                outTime ? `${outTime} (${outLoc})${isHolidayDay ? ' (H)' : ''}` : ''
              );
            } else {
              const inTime = formatTime(c.firstIn) || '✓';
              const inLoc = c.firstInLocation || '—';
              const outTime = formatTime(c.lastOut) || '';
              const outLoc = c.lastOutLocation || '—';
              row.push(
                `${inTime} (${inLoc})${isHolidayDay ? ' (H)' : ''}`,
                outTime ? `${outTime} (${outLoc})${isHolidayDay ? ' (H)' : ''}` : ''
              );
            }
          }
          else if (new Date(year, month, d) > today) { row.push('—', ''); }
          else { row.push('A', ''); }
        } else {
          if (isWeekend(year, month, d)) { row.push('OFF', ''); }
          else if (isHolidayDay && !c?.isPresent) { row.push('HOL', ''); }
          else if (c?.isPresent) {
            if (useFirstLast) {
              row.push(
                (formatTime(c.firstPunch) || '') + (isHolidayDay ? ' (H)' : ''),
                (c.firstPunch === c.lastPunch ? '' : formatTime(c.lastPunch)) + (isHolidayDay && c.firstPunch !== c.lastPunch ? ' (H)' : '')
              );
            } else {
              row.push(
                (formatTime(c.firstIn) || '✓') + (isHolidayDay ? ' (H)' : ''),
                (formatTime(c.lastOut) || '') + (isHolidayDay && c.lastOut ? ' (H)' : '')
              );
            }
          }
          else if (new Date(year, month, d) > today) { row.push('—', ''); }
          else { row.push('A', ''); }
        }
      }
      row.push(presenceDays(emp.device_user_id), absentDays(emp.device_user_id));
      if (reportType === 'hourly') {
        row.push(totalOvertime(emp.device_user_id, emp.emp_type));
      }
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const cols = [{ wch: 4 }, { wch: 22 }, { wch: 9 }, { wch: 14 }];
    for (let i = 0; i < days; i++) {
      if (reportType === 'location_inout') {
        cols.push({ wch: 18 }); cols.push({ wch: 18 });
      } else {
        const width = colCount === 2 ? 8 : 12;
        cols.push({ wch: width }); if (colCount === 2) cols.push({ wch: width });
      }
    }
    cols.push({ wch: 6 }, { wch: 6 });
    if (reportType === 'hourly') {
      cols.push({ wch: 6 });
    }
    ws['!cols'] = cols;
    ws['!freeze'] = { xSplit: 4, ySplit: 5, topLeftCell: 'E6', activeCell: 'E6', sqref: 'E6' };
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Attendance');
    XLSX.writeFile(wb, `Staff_${year}_${String(month + 1).padStart(2, '0')}.xlsx`);
  }

  // ── PDF export ─────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (!tableAreaRef.current) return;
    setPdfLoading(true);

    // Give UI a tick to render loading spinner
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const isDaily = reportView === 'daily';
    const isIndividual = reportView === 'individual';
    const colWidth = reportType === 'location_inout' ? 240 : reportType === 'inout' ? 92 : 46;
    const totalWidth = isDaily || isIndividual ? 960 : 584 + (days * colWidth);
    const offscreen = document.createElement("div");
    offscreen.style.cssText =
      `position:fixed;top:0;left:-${totalWidth + 1000}px;` +
      `width:${totalWidth}px;height:auto;z-index:-9999;overflow:visible;background:white;padding:24px;box-sizing:border-box;`;

    // Title and stats header in offscreen wrapper
    const header = document.createElement("div");
    header.style.cssText = `margin-bottom: 20px; font-family: ui-sans-serif, system-ui, sans-serif;`;

    const title = document.createElement("h2");
    title.innerText = isDaily
      ? `Staff Daily Attendance Report — Date: ${selectedDailyDate}`
      : isIndividual
        ? `Individual Attendance Report — ${selectedEmp?.name} — ${monthLabel(month, year)}`
        : `Staff Attendance Report — ${monthLabel(month, year)}`;
    title.style.cssText = `margin: 0; font-size: 22px; font-weight: 600; color: #111827;`;

    const subtitle = document.createElement("div");
    const locText = selectedLocations.length === 0 ? 'All Locations' : selectedLocations.join(', ');
    subtitle.innerText = isDaily
      ? `${filtered.length} staff  ·  Location: ${locText}`
      : isIndividual
        ? `Department: ${selectedEmp?.department || '—'}  ·  Emp ID: ${selectedEmp?.emp_id || '—'}`
        : `${filtered.length} staff  ·  ${workDays} working days  ·  Location: ${locText}`;
    subtitle.style.cssText = `margin-top: 6px; font-size: 13px; color: #4b5563;`;

    header.appendChild(title);
    header.appendChild(subtitle);
    offscreen.appendChild(header);

    const tableAreaClone = tableAreaRef.current.cloneNode(true) as HTMLElement;
    tableAreaClone.style.overflow = "visible";
    tableAreaClone.style.height = "auto";
    tableAreaClone.style.flex = "none";
    tableAreaClone.style.width = `${totalWidth}px`;
    tableAreaClone.style.borderTop = "none";

    if (reportView === 'monthly') {
      tableAreaClone.style.display = "flex";
      tableAreaClone.style.flexDirection = "row";

      const leftPanelClone = tableAreaClone.children[0] as HTMLElement;
      const rightPanelClone = tableAreaClone.children[1] as HTMLElement;

      if (leftPanelClone) {
        leftPanelClone.style.overflowY = "visible";
        leftPanelClone.style.overflowX = "visible";
        leftPanelClone.style.height = "auto";
        leftPanelClone.style.boxShadow = "none";
        leftPanelClone.style.borderRight = "1px solid #e5e7eb";
      }

      if (rightPanelClone) {
        rightPanelClone.style.overflowX = "visible";
        rightPanelClone.style.overflowY = "visible";
        rightPanelClone.style.height = "auto";
        rightPanelClone.style.flex = "none";
        rightPanelClone.style.width = `${days * colWidth}px`;
      }
    }

    // Convert all sticky header rows to static so they render in standard flow
    const headerTrs = tableAreaClone.querySelectorAll('thead tr');
    headerTrs.forEach((tr) => {
      const trEl = tr as HTMLElement;
      trEl.style.position = 'static';
    });

    offscreen.appendChild(tableAreaClone);
    document.body.appendChild(offscreen);

    try {
      const canvas = await html2canvas(offscreen, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: totalWidth,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const layoutWidth = offscreen.offsetWidth;
      const layoutHeight = offscreen.offsetHeight;

      const pdf = new jsPDF({
        orientation: layoutWidth > layoutHeight ? 'l' : 'p',
        unit: 'px',
        format: [layoutWidth, layoutHeight]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, layoutWidth, layoutHeight, undefined, 'FAST');
      pdf.save(isDaily
        ? `Staff_Daily_Attendance_${selectedDailyDate}.pdf`
        : isIndividual
          ? `Individual_Attendance_${selectedEmp?.name?.replace(/\s+/g, '_')}_${year}_${String(month + 1).padStart(2, '0')}.pdf`
          : `Staff_Attendance_${year}_${String(month + 1).padStart(2, '0')}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      if (offscreen.parentNode) {
        offscreen.parentNode.removeChild(offscreen);
      }
      setPdfLoading(false);
    }
  }, [days, month, year, filtered, workDays, reportType, useFirstLast, deptFilter, selectedLocations, reportView, selectedDailyDate, selectedEmployeeId, selectedEmp]);

  // Render loops updated to use external memoized subcomponents

  // ─────────────────────────────────────────────────────────────────────────
  return (
    // Fill the parent panel entirely — no own padding or min-h
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: "100%" }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0.75rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

          {/* Report View Selector */}
          <Select
            value={reportView}
            onValueChange={(val: 'monthly' | 'daily' | 'individual') => setReportView(val)}
          >
            <SelectTrigger className="h-8 text-xs w-[145px] bg-white border-gray-200 rounded-lg">
              <SelectValue placeholder="Monthly Report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem style={{ justifyContent: "flex-start" }} value="monthly">Monthly Report</SelectItem>
              <SelectItem style={{ justifyContent: "flex-start" }} value="daily">Daily Report</SelectItem>
              <SelectItem style={{ justifyContent: "flex-start" }} value="individual">Individual Report</SelectItem>
            </SelectContent>
          </Select>

          {/* Employee Selector for Individual View */}
          {reportView === 'individual' && (
            <Popover open={openEmpSelect} onOpenChange={setOpenEmpSelect}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-8 text-xs w-[200px] bg-white border border-gray-205 rounded-lg px-3 py-1 flex items-center justify-between shadow-xs hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="truncate font-medium text-gray-700 capitalize">
                    {selectedEmp ? selectedEmp.name.toLowerCase() : "Select Employee"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[240px] p-0 bg-white border border-gray-200 shadow-md rounded-md z-50"
                align="start"
              >
                {/* Search Input Area */}
                <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md">
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      className="text-xs bg-transparent border-0 outline-none w-full p-0 focus:ring-0 placeholder:text-gray-400 normal-case"
                      autoFocus
                    />
                    {empSearch && (
                      <button
                        type="button"
                        onClick={() => setEmpSearch("")}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* List Area */}
                <div className="max-h-[220px] overflow-y-auto py-1">
                  {selectableEmployees.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-gray-400 font-medium">
                      No results found
                    </div>
                  ) : (
                    selectableEmployees.map((emp) => {
                      const isSelected = selectedEmp?.device_user_id === emp.device_user_id;
                      return (
                        <button
                          style={{ justifyContent: "space-between" }}
                          key={emp.device_user_id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId(emp.device_user_id);
                            setOpenEmpSelect(false);
                            setEmpSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between capitalize font-medium ${isSelected
                            ? "bg-amber-50/70 text-amber-900"
                            : "hover:bg-gray-50 bg-transparent"
                            }`}
                        >
                          <div className="truncate">
                            <div>{emp.name.toLowerCase()}</div>
                            {emp.emp_id && (
                              <div className="text-[10px] text-gray-400 font-normal normal-case">
                                ID: {emp.emp_id}
                              </div>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Hide Report Type in Daily and Individual views */}
          {reportView === 'monthly' && (
            <Select
              value={reportType}
              onValueChange={(val: ReportType) => setReportType(val)}
            >
              <SelectTrigger className="h-8 text-xs w-[140px] bg-white border-gray-200 rounded-lg">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem style={{ justifyContent: "flex-start" }} value="inout">In/Out Report</SelectItem>
                <SelectItem style={{ justifyContent: "flex-start" }} value="location_inout">Location In/Out Report</SelectItem>
                <SelectItem style={{ justifyContent: "flex-start" }} value="pa">P/A Matrix</SelectItem>
                <SelectItem style={{ justifyContent: "flex-start" }} value="hourly">Hourly Report</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Toggle for In/Out Logic */}
          {(reportView === 'daily' || reportView === 'individual' || reportType === 'inout' || reportType === 'location_inout') && (
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={useFirstLast}
                onChange={e => setUseFirstLast(e.target.checked)}
                className="w-3.5 h-3.5 accent-gray-900 rounded"
              />
              <span>First In / Last Out</span>
            </label>
          )}

          {/* Single date picker for Daily mode, Month nav for Monthly and Individual modes */}
          {reportView === 'daily' ? (
            <DatePicker
              value={selectedDailyDate}
              onChange={(val) => {
                if (val) {
                  setSelectedDailyDate(val as string);
                }
              }}
              placeholder="Pick a date"
              className="text-xs h-8 border-gray-200 bg-white rounded-lg min-w-[150px]"
            />
          ) : (
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={prevMonth} className="px-1.5 py-1.5 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <span className="px-2 py-1 text-xs font-medium text-gray-700 min-w-[120px] text-center">
                {monthLabel(month, year)}
              </span>
              <button
                onClick={nextMonth}
                disabled={year === today.getFullYear() && month === today.getMonth()}
                className="px-1.5 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          )}

          {/* Pills */}
          {reportView !== 'individual' && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {filtered.length} employees
            </span>
          )}
          {/* {reportView === 'daily' && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {dateListInRange.length * filtered.length} rows
            </span>
          )} */}
          {/* {reportView === 'individual' && selectedEmp && (
            <>
              <span className="text-xs text-gray-450 bg-gray-50 px-2.5 py-1 rounded-full">
                Present: {presenceDays(selectedEmp.device_user_id)} days
              </span>
              <span className="text-xs text-gray-450 bg-gray-50 px-2.5 py-1 rounded-full">
                Absent: {absentDays(selectedEmp.device_user_id)} days
              </span>
              {selectedEmp.emp_type === 'worker' && (
                <span className="text-xs text-gray-450 bg-gray-50 px-2.5 py-1 rounded-full">
                  OT: {totalOvertime(selectedEmp.device_user_id, selectedEmp.emp_type)} hours
                </span>
              )}
            </>
          )} */}
          {reportView !== 'daily' && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {workDays} working days
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsHolidayModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PartyPopper className="w-4 h-4" />
            Holidays ({holidays.length})
          </button>
          <button
            onClick={exportExcel}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            onClick={exportPDF}
            disabled={loading || filtered.length === 0 || pdfLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-grey transition-colors disabled:opacity-40"
          >
            {pdfLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {pdfLoading ? 'Exporting PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-3 mb-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex-shrink-0">
          {error}
        </div>
      )}

      {/* ── Table area ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 flex-1 text-gray-400 text-sm" style={{ border: "", width: "100%" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : reportView === 'daily' ? (
        /* ── DAILY REPORT VIEW ── */
        <div ref={tableAreaRef} className="flex-1 overflow-auto border-t border-gray-200">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#111827] text-white sticky top-0 z-10">
              <tr style={{ height: "2.5rem" }}>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 110 }}>Date</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-center" style={{ width: 50 }}>#</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 270, verticalAlign: 'middle' }}>
                  <div className="flex items-center gap-1.5 w-full">

                    <div className="relative flex-1 ">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        style={{ color: "white" }}
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className=" h-6 w-full border border-gray-750 rounded text-white pl-6 pr-2 py-0.5 outline-none focus:border-gray-500 transition-colors normal-case font-normal"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 100 }}>Emp ID</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 170 }}>Department</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 120 }}>Status</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left">Check In</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left">Check Out</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-center" style={{ width: 80 }}>Hours</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-center" style={{ width: 80 }}>Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {dateListInRange.length === 0 || filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-gray-400 font-medium bg-white">
                    No employees found.
                  </td>
                </tr>
              ) : (
                dateListInRange.map((dateStr) => {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const displayDate = dateObj.toLocaleDateString('en-OM', { day: '2-digit', month: 'short', year: 'numeric' });
                  const isWeekendDay = isWeekend(y, m - 1, d);
                  const isHolidayDay = holidays.some(h => h.day === d && year === y && month === (m - 1));

                  return filtered.map((emp, empIdx) => {
                    const c = matrix[emp.device_user_id]?.[dateStr];

                    let statusBadge = null;
                    let checkInText = '—';
                    let checkOutText = '—';
                    let hoursText = '—';

                    if (isWeekendDay) {
                      statusBadge = <span className="text-gray-400 text-xs">Weekend</span>;
                    } else if (isHolidayDay) {
                      statusBadge = c?.isPresent ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">Worked (H)</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Holiday</span>
                      );
                    } else if (c?.isPresent) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">

                          Present
                        </span>
                      );
                    } else {
                      const isFuture = dateObj > today;
                      statusBadge = isFuture ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                          Absent
                        </span>
                      );
                    }

                    if (c?.isPresent) {
                      if (useFirstLast) {
                        checkInText = formatTime(c.firstPunch) || '✓';
                        checkOutText = c.firstPunch === c.lastPunch ? '—' : (formatTime(c.lastPunch) || '—');
                      } else {
                        checkInText = formatTime(c.firstIn) || '✓';
                        checkOutText = formatTime(c.lastOut) || '—';
                      }

                      // Location mapping
                      const inLoc = useFirstLast ? c.firstPunchLocation : c.firstInLocation;
                      const outLoc = useFirstLast ? c.lastPunchLocation : c.lastOutLocation;

                      if (inLoc) checkInText += ` (${inLoc})`;
                      if (outLoc && c.firstPunch !== c.lastPunch) checkOutText += ` (${outLoc})`;

                      hoursText = getDayHours(c);
                    }

                    const overtimeText = getOvertime(c, emp.emp_type);

                    return (
                      <tr key={`${dateStr}-${emp.id}`} style={{ height: ROW_H }} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                        <td className="px-4 py-2 text-gray-500 font-medium text-xs text-left">{displayDate}</td>
                        <td className="px-4 py-2 text-gray-500 text-center">{empIdx + 1}</td>
                        <td className="px-4 py-2 font-medium text-gray-900 capitalize text-left">{emp.name.toLowerCase()}</td>
                        <td className="px-4 py-2 text-gray-500 text-left">{emp.emp_id ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-500 text-left">{emp.department ?? '—'}</td>
                        <td className="px-4 py-2 text-left">{statusBadge}</td>
                        <td className="px-4 py-2 text-gray-700 font-medium tabular-nums text-xs text-left">{checkInText}</td>
                        <td className="px-4 py-2 text-gray-700 font-medium tabular-nums text-xs text-left">{checkOutText}</td>
                        <td className="px-4 py-2 text-gray-600 font-semibold tabular-nums text-xs text-center">{hoursText}</td>
                        <td className="px-4 py-2 text-gray-600 font-semibold tabular-nums text-xs text-center">{overtimeText}</td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      ) : reportView === 'individual' ? (
        /* ── INDIVIDUAL REPORT VIEW ── */
        <div ref={tableAreaRef} className="flex-1 overflow-auto border-t border-gray-200">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#111827] text-white sticky top-0 z-10">
              <tr style={{ height: "2.5rem" }}>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 130 }}>Date</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 100 }}>Day</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left" style={{ width: 140 }}>Status</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left">Check In</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-left">Check Out</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-center" style={{ width: 80 }}>Hours</th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-center" style={{ width: 80 }}>Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {!selectedEmp ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-400 font-medium bg-white">
                    No employee selected.
                  </td>
                </tr>
              ) : (
                dayList.map((d) => {
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
                  const dateObj = new Date(year, month, d);
                  const displayDate = dateObj.toLocaleDateString('en-OM', { day: '2-digit', month: 'short', year: 'numeric' });
                  const displayDayName = getDayName(year, month, d);

                  const c = matrix[selectedEmp.device_user_id]?.[dateStr];
                  const isWeekendDay = isWeekend(year, month, d);
                  const isHolidayDay = isHoliday(d);
                  const holiday = holidayMap[d];

                  let statusBadge = null;
                  let checkInText = '—';
                  let checkOutText = '—';
                  let hoursText = '—';
                  let overtimeText = '—';

                  if (isWeekendDay) {
                    statusBadge = <span className="text-gray-400 text-xs">Weekend</span>;
                  } else if (isHolidayDay) {
                    statusBadge = c?.isPresent ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">Worked (H)</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Holiday ({holiday?.name})</span>
                    );
                  } else if (c?.isPresent) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Present
                      </span>
                    );
                  } else {
                    const isFuture = dateObj > today;
                    statusBadge = isFuture ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                        Absent
                      </span>
                    );
                  }

                  if (c?.isPresent) {
                    if (useFirstLast) {
                      checkInText = formatTime(c.firstPunch) || '✓';
                      checkOutText = c.firstPunch === c.lastPunch ? '—' : (formatTime(c.lastPunch) || '—');
                    } else {
                      checkInText = formatTime(c.firstIn) || '✓';
                      checkOutText = formatTime(c.lastOut) || '—';
                    }

                    const inLoc = useFirstLast ? c.firstPunchLocation : c.firstInLocation;
                    const outLoc = useFirstLast ? c.lastPunchLocation : c.lastOutLocation;

                    if (inLoc) checkInText += ` (${inLoc})`;
                    if (outLoc && c.firstPunch !== c.lastPunch) checkOutText += ` (${outLoc})`;

                    hoursText = getDayHours(c);
                    overtimeText = getOvertime(c, selectedEmp.emp_type);
                  }

                  return (
                    <tr key={d} style={{ height: ROW_H }} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-500 font-medium text-xs text-left">{displayDate}</td>
                      <td className="px-4 py-2 text-gray-500 text-left capitalize">{displayDayName.toLowerCase()}</td>
                      <td className="px-4 py-2 text-left">{statusBadge}</td>
                      <td className="px-4 py-2 text-gray-700 font-medium tabular-nums text-xs text-left">{checkInText}</td>
                      <td className="px-4 py-2 text-gray-700 font-medium tabular-nums text-xs text-left">{checkOutText}</td>
                      <td className="px-4 py-2 text-gray-600 font-semibold tabular-nums text-xs text-center">{hoursText}</td>
                      <td className="px-4 py-2 text-gray-600 font-semibold tabular-nums text-xs text-center">{overtimeText}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {selectedEmp && (
              <tfoot className="sticky bottom-0 z-10 border-t-2 border-gray-300 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
                <tr style={{ height: ROW_H }} className="font-bold text-xs bg-gray-100 text-gray-800">
                  <td className="px-4 py-2 text-left bg-gray-100" colSpan={3}>TOTALS</td>
                  <td className="px-4 py-2 text-left bg-gray-100">—</td>
                  <td className="px-4 py-2 text-left bg-gray-100">—</td>
                  <td className="px-4 py-2 text-center bg-gray-100 text-gray-900 font-bold tabular-nums">
                    {totalHours(selectedEmp.device_user_id)}
                  </td>
                  <td className="px-4 py-2 text-center bg-gray-100 text-gray-900 font-bold tabular-nums">
                    {totalOvertime(selectedEmp.device_user_id, selectedEmp.emp_type)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        /*
         * Two-panel layout:
         *   Left  = frozen (#, Name, Dept) — overflow hidden, scrollTop synced from right
         *   Right = day columns — overflow-x auto, overflow-y auto (drives scroll)
         * Both panels share the same row height constant so rows stay aligned.
         */
        <div ref={tableAreaRef} style={{ display: 'flex', flex: 1, overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}>

          {/* ── LEFT FROZEN PANEL ── */}
          <div
            ref={leftRef}
            style={{
              flexShrink: 0,
              overflowY: 'hidden',   // vertical scroll driven by right panel
              overflowX: 'hidden',
              boxShadow: '3px 0 8px -3px rgba(0,0,0,0.10)',
              zIndex: 10,
            }}
          >
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: reportType === 'hourly' ? 636 : 584 }}>
              <colgroup>
                <col style={{ width: 28 }} />
                <col style={{ width: 270 }} />
                <col style={{ width: 170 }} />
                <col style={{ width: 52 }} />
                <col style={{ width: 52 }} />
                {reportType === 'hourly' && <col style={{ width: 52 }} />}
                <col style={{ width: 12 }} />
              </colgroup>
              <thead>
                {/* Row 1: day number */}
                <tr style={{ background: '#111827', color: '#fff', position: 'sticky', top: 0, zIndex: 5, paddingBottom: "1rem", height: "2.5rem" }}>
                  <th className="text-[13px] font-medium text-center px-1 py-2">#</th>
                  <th className="text-[13px] font-medium text-left px-3 py-2" style={{ verticalAlign: 'middle' }}>
                    <div className="flex items-center gap-1.5 w-full">

                      <div className="relative flex-1 ">

                        <input
                          style={{ color: "white" }}
                          type="text"
                          placeholder="Search"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className=" h-6 w-full border border-gray-700 rounded text-white pl-6 pr-2 py-0.5 outline-none focus:border-gray-500 transition-colors normal-case font-normal"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="text-[13px] font-medium text-left px-1 py-1" style={{ width: 170 }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-white hover:bg-white/10 focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none px-2 rounded-md transition-colors font-medium w-full justify-between flex items-center outline-none">
                        <span className="truncate">
                          {selectedLocations.length === 0
                            ? 'Location (All)'
                            : selectedLocations.length === 1
                              ? selectedLocations[0]
                              : `Location (${selectedLocations.length})`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-80 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto p-0 z-50">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedLocations(locations);
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
                              setSelectedLocations([]);
                            }}
                            className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right"
                            style={{ background: "none", flex: 1 }}
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="py-1">
                          {locations.map(loc => {
                            const isChecked = selectedLocations.includes(loc);
                            return (
                              <DropdownMenuCheckboxItem
                                key={loc}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLocations([...selectedLocations, loc]);
                                  } else {
                                    setSelectedLocations(selectedLocations.filter(item => item !== loc));
                                  }
                                }}
                                onSelect={(e) => e.preventDefault()}
                                className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                              >
                                {loc}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                  <th className="text-[13px] font-medium text-center py-2" style={{ background: '#065f46' }}>P</th>
                  <th className="text-[13px] font-medium text-center py-2" style={{ background: '#7f1d1d' }}>A</th>
                  {reportType === 'hourly' && <th className="text-[13px] font-medium text-center py-2" style={{ background: '#b45309' }}>OT</th>}
                  <th style={{ background: '#111827' }} />
                </tr>
                {/* Row 2: In/Out sub-label spacer */}
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: HEAD_R1, zIndex: 5, border: "", height: HEAD_R2 }}>
                  <th style={{ padding: '4px 0' }} />
                  <th style={{ padding: '4px 0' }} />
                  <th style={{ padding: '4px 0' }} />
                  <th style={{ background: '#ecfdf5' }} />
                  <th style={{ background: '#fef2f2' }} />
                  {reportType === 'hourly' && <th style={{ background: '#fffbeb' }} />}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={reportType === 'hourly' ? 7 : 6} className="py-20 text-center text-gray-450 font-medium bg-white">
                      No employee found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp, idx) => (
                    <FrozenRow
                      key={emp.id}
                      emp={emp}
                      index={idx}
                      locationList={employeeLocations[emp.device_user_id] || '—'}
                      presenceCount={presenceDays(emp.device_user_id)}
                      absentCount={absentDays(emp.device_user_id)}
                      overtimeCount={totalOvertime(emp.device_user_id, emp.emp_type)}
                      showOvertime={reportType === 'hourly'}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── RIGHT SCROLLABLE PANEL ── */}
          <div
            ref={rightRef}
            style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}
          >
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: `${dayList.length * (reportType === 'location_inout' ? 240 : reportType === 'inout' ? 92 : 46)}px`, borderSpacing: 0 }}>
              <colgroup>
                {dayList.map(d => (
                  reportType === 'inout' || reportType === 'location_inout' ? (
                    <Fragment key={`col-${d}`}>
                      <col style={{ width: reportType === 'location_inout' ? 120 : 46 }} />
                      <col style={{ width: reportType === 'location_inout' ? 120 : 46 }} />
                    </Fragment>
                  ) : (
                    <col key={`col-${d}`} style={{ width: 46 }} />
                  )
                ))}
              </colgroup>
              <thead>
                {/* Row 1: day number + weekday */}
                <tr style={{ background: '#111827', color: '#fff', position: 'sticky', top: 0, zIndex: 5, height: HEAD_R1 }}>
                  {dayList.map(d => {
                    const holiday = holidayMap[d];
                    const bg = isWeekend(year, month, d)
                      ? '#374151'
                      : holiday
                        ? '#3b82f6'
                        : '#111827';
                    return (
                      <th
                        key={d}
                        colSpan={reportType === 'inout' || reportType === 'location_inout' ? 2 : 1}
                        className="text-center text-[13px] font-medium"
                        style={{ background: bg }}
                        title={holiday ? `Holiday: ${holiday.name}` : undefined}
                      >
                        <div className="leading-tight">{d}</div>
                        <div className="text-[10px] font-normal opacity-60 leading-tight">{getDayName(year, month, d)}</div>
                      </th>
                    );
                  })}
                </tr>
                {/* Row 2: In / Out labels */}
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: HEAD_R1, zIndex: 5, height: HEAD_R2 }}>
                  {dayList.map(d => {
                    const holiday = holidayMap[d];
                    const bg = isWeekend(year, month, d) ? '#f3f4f6' : holiday ? '#eef2ff' : '#f9fafb';
                    if (reportType === 'hourly') {
                      return <th key={`lbl-${d}`} className="text-[11px] text-gray-400 font-medium text-center" style={{ background: bg }}>Hrs</th>;
                    }
                    if (reportType === 'pa') {
                      return <th key={`lbl-${d}`} className="text-[11px] text-gray-400 font-medium text-center" style={{ background: bg }}></th>;
                    }
                    return (
                      <Fragment key={`lbl-${d}`}>
                        <th className="text-[11px] text-gray-400 font-medium text-center" style={{ background: bg }}>In</th>
                        <th className="text-[11px] text-gray-400 font-medium text-center" style={{ background: bg }}>Out</th>
                      </Fragment>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={dayList.length * (reportType === 'inout' || reportType === 'location_inout' ? 2 : 1)} className="py-20 text-center text-gray-300 font-medium bg-white" style={{ height: ROW_H }}>
                      —
                    </td>
                  </tr>
                ) : (
                  filtered.map(emp => (
                    <ScrollableRow
                      key={emp.id}
                      emp={emp}
                      dayList={dayList}
                      reportType={reportType}
                      useFirstLast={useFirstLast}
                      matrixForEmployee={matrix[emp.device_user_id]}
                      year={year}
                      month={month}
                      today={today}
                      holidayMap={holidayMap}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="text-center text-[10px] text-gray-300 py-1 flex-shrink-0">
        — = Friday off · A = Absent · H = Holiday · Green = In · Orange = Out · All times GMT+4
      </div>

      {/* Holiday Dialog */}
      <ResponsiveModal
        open={isHolidayModalOpen}
        onOpenChange={setIsHolidayModalOpen}
        title={`Declare Holidays for ${monthLabel(month, year)}`}
        description=""
      >
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }} className="border-b border-gray-100 pb-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Day of Month</label>
              <select
                value={newHolidayDay}
                onChange={e => setNewHolidayDay(parseInt(e.target.value))}
                style={{ height: '2.25rem', width: '80px', fontSize: '0.85rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0 0.5rem', background: 'white' }}
              >
                {dayList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '150px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Holiday Name</label>
              <input
                type="text"
                placeholder="e.g. National Day"
                value={newHolidayName}
                onChange={e => setNewHolidayName(e.target.value)}
                style={{ height: '2.25rem', fontSize: '0.85rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0 0.75rem', outline: 'none' }}
              />
            </div>

            <button
              onClick={async () => {
                if (!newHolidayName.trim()) {
                  toast.error("Please enter a holiday name");
                  return;
                }
                setHolidaySubmitting(true);
                try {
                  await addDoc(collection(db, 'attendance_holidays'), {
                    year,
                    month,
                    day: newHolidayDay,
                    name: newHolidayName.trim(),
                    created_at: new Date().toISOString()
                  });
                  setNewHolidayName('');
                  toast.success("Holiday declared successfully");
                } catch (err) {
                  console.error("Error adding holiday:", err);
                  toast.error("Failed to declare holiday");
                } finally {
                  setHolidaySubmitting(false);
                }
              }}
              disabled={holidaySubmitting}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {holidaySubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Declared Holidays ({holidays.length})</h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
              {holidays.map((h) => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#1f2937' }}>
                    <strong style={{ marginRight: '0.5rem' }}>Day {h.day}:</strong> {h.name}
                  </span>
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete the holiday on day ${h.day}?`)) {
                        try {
                          await deleteDoc(doc(db, 'attendance_holidays', h.id));
                          toast.success("Holiday deleted");
                        } catch (err) {
                          console.error("Error deleting holiday:", err);
                          toast.error("Failed to delete holiday");
                        }
                      }
                    }}
                    style={{ color: '#ef4444' }}
                    className="p-1 hover:bg-red-50 rounded transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    <CircleMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {holidays.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', padding: '1rem 0' }}>No public holidays declared for this month.</p>
              )}
            </div>
          </div>

        </div>
      </ResponsiveModal>
    </div>
  );
}
