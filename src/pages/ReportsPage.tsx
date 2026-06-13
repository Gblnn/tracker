import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react';
import { Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
}

interface DaySummary {
  firstIn: string | null;
  lastOut: string | null;
  isPresent: boolean;
}

type AttendanceMatrix = Record<string, Record<number, DaySummary>>;

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

// Shared row height so both tables stay in sync
const ROW_H = 44;
const HEAD_R1 = 40;
const HEAD_R2 = 26;

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffMonthlyReport() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [punches, setPunches] = useState<PunchDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState('all');
  const [pdfLoading, setPdfLoading] = useState(false);

  const rightRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const tableAreaRef = useRef<HTMLDivElement>(null);

  const days = daysInMonth(year, month);
  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => i + 1), [days]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month + 1)}-01T00:00:00`;
    const end = `${year}-${pad(month + 1)}-${pad(days)}T23:59:59`;

    const [{ data: empData, error: eErr }, { data: pData, error: pErr }] = await Promise.all([
      supabase.from('employees')
        .select('id, device_user_id, name, department, emp_type, emp_id')
        .eq('emp_type', 'Staff')
        .order('name', { ascending: true }),
      supabase.from('punch_details')
        .select('user_id, punch_time, punch_type')
        .gte('punch_time', start)
        .lte('punch_time', end),
    ]);

    if (eErr) setError(eErr.message);
    else if (pErr) setError(pErr.message);
    else { setEmployees(empData ?? []); setPunches(pData ?? []); }
    setLoading(false);
  }, [year, month, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Matrix ─────────────────────────────────────────────────────────────────
  const matrix: AttendanceMatrix = useMemo(() => {
    const r: AttendanceMatrix = {};
    for (const p of punches) {
      const ds = new Date(p.punch_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
      const dn = parseInt(ds.split('-')[2]);
      if (!r[p.user_id]) r[p.user_id] = {};
      if (!r[p.user_id][dn]) r[p.user_id][dn] = { firstIn: null, lastOut: null, isPresent: false };
      const c = r[p.user_id][dn];
      c.isPresent = true;
      if (p.punch_type === 0) { if (!c.firstIn || p.punch_time < c.firstIn) c.firstIn = p.punch_time; }
      else { if (!c.lastOut || p.punch_time > c.lastOut) c.lastOut = p.punch_time; }
    }
    return r;
  }, [punches]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const departments = useMemo(() =>
    [...new Set(employees.map(e => e.department).filter(Boolean) as string[])].sort(),
    [employees]);

  const filtered = useMemo(() =>
    deptFilter === 'all' ? employees : employees.filter(e => e.department === deptFilter),
    [employees, deptFilter]);

  const workDays = useMemo(() =>
    dayList.filter(d => !isWeekend(year, month, d)).length,
    [dayList, year, month]);

  const pastWorkDays = useMemo(() =>
    dayList.filter(d => !isWeekend(year, month, d) && new Date(year, month, d) <= today).length,
    [dayList, year, month]);

  const presenceDays = (uid: string) => Object.values(matrix[uid] ?? {}).filter(d => d.isPresent).length;
  const absentDays = (uid: string) => Math.max(0, pastWorkDays - presenceDays(uid));

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

    rows.push([`Staff Attendance — ${monthLabel(month, year)}`]);
    rows.push([]);

    const r1: string[] = ['#', 'Name', 'Emp ID', 'Department'];
    const r2: string[] = ['', '', '', ''];
    const r3: string[] = ['', '', '', ''];
    for (let d = 1; d <= days; d++) {
      r1.push(String(d)); r1.push('');
      r2.push(getDayName(year, month, d)); r2.push('');
      r3.push('In'); r3.push('Out');
    }
    r1.push('P', 'A'); r2.push('', ''); r3.push('', '');
    rows.push(r1, r2, r3);

    filtered.forEach((emp, idx) => {
      const row: (string | number)[] = [idx + 1, emp.name, emp.emp_id ?? '', emp.department ?? ''];
      for (let d = 1; d <= days; d++) {
        const c = matrix[emp.device_user_id]?.[d];
        if (isWeekend(year, month, d)) { row.push('OFF', ''); }
        else if (c?.isPresent) { row.push(formatTime(c.firstIn) || '✓', formatTime(c.lastOut) || ''); }
        else if (new Date(year, month, d) > today) { row.push('—', ''); }
        else { row.push('A', ''); }
      }
      row.push(presenceDays(emp.device_user_id), absentDays(emp.device_user_id));
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const cols = [{ wch: 4 }, { wch: 22 }, { wch: 9 }, { wch: 14 }];
    for (let i = 0; i < days; i++) cols.push({ wch: 7 }, { wch: 7 });
    cols.push({ wch: 6 }, { wch: 6 });
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

    const totalWidth = 454 + (days * 92);
    const offscreen = document.createElement("div");
    offscreen.style.cssText =
      `position:fixed;top:0;left:-${totalWidth + 1000}px;` +
      `width:${totalWidth}px;height:auto;z-index:-9999;overflow:visible;background:white;padding:24px;box-sizing:border-box;`;

    // Title and stats header in offscreen wrapper
    const header = document.createElement("div");
    header.style.cssText = `margin-bottom: 20px; font-family: ui-sans-serif, system-ui, sans-serif;`;

    const title = document.createElement("h2");
    title.innerText = `Staff Attendance Report — ${monthLabel(month, year)}`;
    title.style.cssText = `margin: 0; font-size: 22px; font-weight: 600; color: #111827;`;

    const subtitle = document.createElement("div");
    subtitle.innerText = `${filtered.length} staff  ·  ${workDays} working days  ·  Department: ${deptFilter === 'all' ? 'All Departments' : deptFilter}`;
    subtitle.style.cssText = `margin-top: 6px; font-size: 13px; color: #4b5563;`;

    header.appendChild(title);
    header.appendChild(subtitle);
    offscreen.appendChild(header);

    const tableAreaClone = tableAreaRef.current.cloneNode(true) as HTMLElement;
    tableAreaClone.style.overflow = "visible";
    tableAreaClone.style.height = "auto";
    tableAreaClone.style.flex = "none";
    tableAreaClone.style.display = "flex";
    tableAreaClone.style.flexDirection = "row";
    tableAreaClone.style.width = `${totalWidth}px`;
    tableAreaClone.style.borderTop = "none";

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
      rightPanelClone.style.width = `${days * 92}px`;
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
      pdf.save(`Staff_Attendance_${year}_${String(month + 1).padStart(2, '0')}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      if (offscreen.parentNode) {
        offscreen.parentNode.removeChild(offscreen);
      }
      setPdfLoading(false);
    }
  }, [days, month, year, filtered, workDays, deptFilter]);

  // ── Cell renderers ─────────────────────────────────────────────────────────
  function InCell({ uid, d }: { uid: string; d: number }) {
    const c = matrix[uid]?.[d];
    if (isWeekend(year, month, d)) return <td className="bg-gray-50 text-gray-300 text-center text-[12px]" style={{ height: ROW_H }}>—</td>;
    if (c?.isPresent) return <td className="text-center text-emerald-700 font-medium tabular-nums text-[12px] whitespace-nowrap" style={{ height: ROW_H }}>{formatTime(c.firstIn) || '✓'}</td>;

    const isFuture = new Date(year, month, d) > today;
    if (isFuture) return <td className="text-center text-gray-300 text-[12px]" style={{ height: ROW_H }}>—</td>;

    return <td className="text-center text-red-400 font-bold text-[12px]" style={{ height: ROW_H }}>A</td>;
  }

  function OutCell({ uid, d }: { uid: string; d: number }) {
    const c = matrix[uid]?.[d];
    if (isWeekend(year, month, d)) return <td className="bg-gray-50 text-gray-300 text-center text-[12px]" style={{ height: ROW_H }}>—</td>;
    if (c?.isPresent) return <td className="text-center text-orange-500 font-medium tabular-nums text-[12px] whitespace-nowrap" style={{ height: ROW_H }}>{formatTime(c.lastOut) || '—'}</td>;
    return <td className="text-center text-[12px]" style={{ height: ROW_H }} />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    // Fill the parent panel entirely — no own padding or min-h
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: "100%" }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0.75rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

          {/* Dept filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Month nav */}
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

          {/* Pills */}
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            {filtered.length} staff
          </span>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            {workDays} working days
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
          No staff found.
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
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: 454 }}>
              <colgroup>
                <col style={{ width: 28 }} />
                <col style={{ width: 180 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 52 }} />
                <col style={{ width: 52 }} />
                <col style={{ width: 12 }} />
              </colgroup>
              <thead>
                {/* Row 1: day number */}
                <tr style={{ background: '#111827', color: '#fff', position: 'sticky', top: 0, zIndex: 5, paddingBottom: "1rem", height: "2.5rem" }}>
                  <th className="text-[13px] font-medium text-center px-1 py-2">#</th>
                  <th className="text-[13px] font-medium text-left px-3 py-2">Name</th>
                  <th className="text-[13px] font-medium text-left px-2 py-2">Location</th>
                  <th className="text-[13px] font-medium text-center py-2" style={{ background: '#065f46' }}>P</th>
                  <th className="text-[13px] font-medium text-center py-2" style={{ background: '#7f1d1d' }}>A</th>
                  <th style={{ background: '#111827' }} />
                </tr>
                {/* Row 2: In/Out sub-label spacer */}
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: HEAD_R1, zIndex: 5, border: "", height: HEAD_R2 }}>
                  <th style={{ padding: '4px 0' }} />
                  <th style={{ padding: '4px 0' }} />
                  <th style={{ padding: '4px 0' }} />
                  <th style={{ background: '#ecfdf5' }} />
                  <th style={{ background: '#fef2f2' }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => (
                  <tr
                    key={emp.id}
                    style={{ height: ROW_H, borderBottom: '1px solid #f9fafb' }}
                  >
                    <td className="text-[13px] text-gray-400 text-center bg-white px-1">{idx + 1}</td>
                    <td className="text-[13px] font-medium text-gray-900 bg-white px-3 whitespace-nowrap">
                      {emp.name}
                      {emp.emp_id && <div className="text-[11px] text-gray-400 font-normal">{emp.emp_id}</div>}
                    </td>
                    <td className="text-[13px] text-gray-500 bg-white px-2 whitespace-nowrap">{emp.location ?? '—'}</td>
                    <td className="text-center text-[13px] font-semibold text-emerald-700" style={{ background: '#ecfdf5', height: ROW_H }}>
                      {presenceDays(emp.device_user_id)}
                    </td>
                    <td className="text-center text-[13px] font-semibold text-red-600" style={{ background: '#fef2f2', height: ROW_H }}>
                      {absentDays(emp.device_user_id)}
                    </td>
                    <td className="bg-white" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── RIGHT SCROLLABLE PANEL ── */}
          <div
            ref={rightRef}
            style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}
          >
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: `${dayList.length * 92}px`, borderSpacing: 0 }}>
              <colgroup>
                {dayList.map(d => (
                  <Fragment key={`col-${d}`}>
                    <col style={{ width: 46 }} />
                    <col style={{ width: 46 }} />
                  </Fragment>
                ))}
              </colgroup>
              <thead>
                {/* Row 1: day number + weekday */}
                <tr style={{ background: '#111827', color: '#fff', position: 'sticky', top: 0, zIndex: 5, height: HEAD_R1 }}>
                  {dayList.map(d => (
                    <th
                      key={d}
                      colSpan={2}
                      className="text-center text-[13px] font-medium"
                      style={{ background: isWeekend(year, month, d) ? '#374151' : '#111827' }}
                    >
                      <div className="leading-tight">{d}</div>
                      <div className="text-[10px] font-normal opacity-60 leading-tight">{getDayName(year, month, d)}</div>
                    </th>
                  ))}
                </tr>
                {/* Row 2: In / Out labels */}
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: HEAD_R1, zIndex: 5, height: HEAD_R2 }}>
                  {dayList.map(d => (
                    <Fragment key={`lbl-${d}`}>
                      <th className="text-[11px] text-gray-400 font-medium text-center" style={{ background: isWeekend(year, month, d) ? '#f3f4f6' : '#f9fafb' }}>In</th>
                      <th className="text-[11px] text-gray-400 font-medium text-center" style={{ background: isWeekend(year, month, d) ? '#f3f4f6' : '#f9fafb' }}>Out</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id} style={{ height: ROW_H, borderBottom: '1px solid #f9fafb' }} className="hover:bg-blue-50/20">
                    {dayList.map(d => (
                      <Fragment key={`day-${d}`}>
                        <InCell uid={emp.device_user_id} d={d} />
                        <OutCell uid={emp.device_user_id} d={d} />
                      </Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="text-center text-[10px] text-gray-300 py-1 flex-shrink-0">
        — = Friday off · A = Absent · Green = In · Orange = Out · All times GMT+4
      </div>
    </div>
  );
}
