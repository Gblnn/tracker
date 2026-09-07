import Back from '@/components/back';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Download, FileBarChart2, Loader2, Printer, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

type SummaryRow = {
  company_name: string | null;
  emp_id: string | number | null;
  name: string | null;
  nationality: string | null;
  employee_status: string | null;
  date: string | null;
  punch_in: string | null;
  punch_out: string | null;
  overtime: string | null;
  project_code: string | null;
  timesheet_status: string | null;
  timecard_status: string | null;
  remarks: string | null;
  total_working_hours: number | string | null;
};

type DisplayRow = SummaryRow & {
  displayDate: string;
  displayPunchIn: string;
  displayPunchOut: string;
  displayOvertime: string;
  displayHours: string;
};

const PAGE_SIZE = 1000;
const headers = ['Company', 'Employee ID', 'Name', 'Nationality', 'Date', 'Punch In', 'Punch Out', 'OT', 'Project', 'Timesheet Status', 'Timecard Status', 'Remarks', 'Total Hours'];

function formatDate(value: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Dubai',
  }).format(parsed).replace(/\//g, ':');
}

function formatTime(value: string | null): string {
  if (!value) return '';
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function decimalHoursToTime(value: number | string | null): string {
  if (value === null || value === undefined || value === '') return '';
  const hours = Number(value);
  if (!Number.isFinite(hours)) return formatTime(String(value));
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function toDisplayRow(row: SummaryRow): DisplayRow {
  return {
    ...row,
    displayDate: formatDate(row.date),
    displayPunchIn: formatTime(row.punch_in),
    displayPunchOut: formatTime(row.punch_out),
    displayOvertime: formatTime(row.overtime),
    displayHours: decimalHoursToTime(row.total_working_hours),
  };
}

function excelRows(rows: DisplayRow[]) {
  return rows.map((row) => ({
    Company: row.company_name || '',
    'Employee ID': row.emp_id || '',
    Name: row.name || '',
    Nationality: row.nationality || '',
    Date: row.displayDate,
    'Punch In': row.displayPunchIn,
    'Punch Out': row.displayPunchOut,
    OT: row.displayOvertime,
    Project: row.project_code || '',
    'Timesheet Status': row.timesheet_status || '',
    'Timecard Status': row.timecard_status || '',
    Remarks: row.remarks || '',
    'Total Hours': row.displayHours,
  }));
}

export default function EmployeeTimesheetSummaryReport() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const reportRef = useRef<HTMLDivElement>(null);

  const canViewReport = useMemo(() => {
    if (userData?.role === 'admin' || userData?.role === 'site_admin') return true;
    try {
      const permissions = JSON.parse(userData?.clearance || '{}') as Record<string, boolean>;
      return permissions.timesheet_summary_report === true;
    } catch {
      return false;
    }
  }, [userData]);

  useEffect(() => {
    if (userData && !canViewReport) navigate('/attendance', { replace: true });
  }, [canViewReport, navigate, userData]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      let from = 0;
      const fetched: SummaryRow[] = [];
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('v_employee_timesheet_summary')
          .select('*')
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        fetched.push(...((data || []) as SummaryRow[]));
        hasMore = Boolean(data && data.length === PAGE_SIZE);
        if (hasMore) from += PAGE_SIZE;
      }
      setRows(fetched.map(toDisplayRow));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load the timesheet summary.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => row.timecard_status).filter(Boolean) as string[])).sort(), [rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !query || [row.company_name, row.emp_id, row.name, row.project_code, row.remarks]
        .some((value) => String(value || '').toLowerCase().includes(query));
      const matchesDate = !dateFilter || row.displayDate === dateFilter;
      const matchesStatus = statusFilter === 'ALL' || row.timecard_status === statusFilter;
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [dateFilter, rows, search, statusFilter]);

  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelRows(filteredRows));
    worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(header.length + 2, 15) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet Summary');
    XLSX.writeFile(workbook, `employee_timesheet_summary_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const downloadPdf = async () => {
    if (!filteredRows.length) return;
    setExportingPdf(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const margin = 8;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const columnWidths = [24, 17, 27, 19, 18, 15, 15, 13, 19, 25, 25, 38, 20];
      const rowHeight = 7;
      const title = 'Employee Timesheet Summary';
      const drawHeader = () => {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, 10);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin, 10, { align: 'right' });
        let x = margin;
        pdf.setFillColor(30, 41, 59);
        pdf.setTextColor(255, 255, 255);
        pdf.rect(margin, 14, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');
        headers.forEach((header, index) => {
          pdf.text(header, x + 1.5, 18.5);
          x += columnWidths[index];
        });
        pdf.setTextColor(30, 41, 59);
      };
      drawHeader();
      let y = 21;
      filteredRows.forEach((row, rowIndex) => {
        if (y + rowHeight > pageHeight - margin) {
          pdf.addPage();
          drawHeader();
          y = 21;
        }
        const values = [row.company_name, row.emp_id, row.name, row.nationality, row.displayDate, row.displayPunchIn, row.displayPunchOut, row.displayOvertime, row.project_code, row.timesheet_status, row.timecard_status, row.remarks, row.displayHours];
        if (rowIndex % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');
        }
        let x = margin;
        pdf.setFontSize(6.5);
        values.forEach((value, index) => {
          const text = String(value || '').slice(0, index === 11 ? 42 : 22);
          pdf.text(text, x + 1.5, y + 4.5);
          x += columnWidths[index];
        });
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, y + rowHeight, margin + columnWidths.reduce((sum, width) => sum + width, 0), y + rowHeight);
        y += rowHeight;
      });
      pdf.save(`employee_timesheet_summary_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch {
      toast.error('Unable to create the PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <style>{`@media print { body * { visibility: hidden; } #timesheet-summary-report, #timesheet-summary-report * { visibility: visible; } #timesheet-summary-report { position: absolute; inset: 0; width: 100%; } .report-no-print { display: none !important; } }`}</style>
      <div className="report-no-print flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2">
        <Back title="Employee Timesheet Summary" />
        <div className="flex items-center gap-2">
          <button onClick={() => void fetchRows()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50" title="Refresh report"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
          <button onClick={() => window.print()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"><Printer className="h-3.5 w-3.5" />Print</button>
          <button onClick={downloadExcel} disabled={loading || !filteredRows.length} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"><Download className="h-3.5 w-3.5" />Excel</button>
          <button onClick={() => void downloadPdf()} disabled={loading || !filteredRows.length || exportingPdf} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-medium text-white hover:bg-teal-600 disabled:opacity-40">{exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}PDF</button>
        </div>
      </div>

      <div className="report-no-print flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
        <div className="relative min-w-[220px] flex-1 sm:flex-none"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee, company, project..." className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-teal-500" /></div>
        <input value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} placeholder="DD:MM:YYYY" className="h-8 w-[125px] rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-teal-500" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-teal-500"><option value="ALL">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        <span className="text-xs text-slate-500">{filteredRows.length} of {rows.length} records</span>
      </div>

      <div id="timesheet-summary-report" ref={reportRef} className="min-h-0 flex-1 overflow-auto p-3">
        <div className="mb-3 flex items-center gap-2"><FileBarChart2 className="h-5 w-5 text-teal-700" /><div><h1 className="text-lg font-semibold text-slate-800">Employee Timesheet Summary</h1><p className="text-xs text-slate-500">Date: DD:MM:YYYY | Time and hours: HH:MM</p></div></div>
        {loading ? <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading report...</div> : <div className="overflow-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1450px] border-collapse text-xs"><thead className="sticky top-0 z-10 bg-slate-800 text-left text-[10px] uppercase tracking-wide text-white"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{filteredRows.length ? filteredRows.map((row, index) => <tr key={`${row.emp_id}-${row.date}-${index}`} className="border-t border-slate-100 even:bg-slate-50/60 hover:bg-teal-50/40"><td className="px-3 py-2">{row.company_name}</td><td className="px-3 py-2">{row.emp_id}</td><td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">{row.name}</td><td className="px-3 py-2">{row.nationality}</td><td className="whitespace-nowrap px-3 py-2 tabular-nums">{row.displayDate}</td><td className="px-3 py-2 tabular-nums">{row.displayPunchIn}</td><td className="px-3 py-2 tabular-nums">{row.displayPunchOut}</td><td className="px-3 py-2 tabular-nums">{row.displayOvertime}</td><td className="px-3 py-2">{row.project_code}</td><td className="px-3 py-2">{row.timesheet_status}</td><td className="px-3 py-2">{row.timecard_status}</td><td className="max-w-[240px] px-3 py-2">{row.remarks}</td><td className="px-3 py-2 tabular-nums">{row.displayHours}</td></tr>) : <tr><td colSpan={headers.length} className="px-3 py-12 text-center text-slate-400">No records found</td></tr>}</tbody></table></div>}
      </div>
    </div>
  );
}
