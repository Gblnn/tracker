import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Loader2, MapPinCheck, Search, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/utilis';
import type { EmployeeSummary } from '../types/attendance';
import { Avatar } from './Avatar';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';

interface EmployeeTableProps {
  summaries: EmployeeSummary[];
  onFilteredSummariesChange?: (summaries: EmployeeSummary[]) => void;
  date?: string;
  useFirstLast?: boolean;
}

function RollingDigit({ next, direction, durationMs }: { next: string; direction: 'up' | 'down'; durationMs: number }) {
  const [prev, setPrev] = useState(next);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (next === prev) return;
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setPrev(next);
      setIsAnimating(false);
    }, durationMs);
    return () => clearTimeout(timer);
  }, [next, prev, durationMs]);

  const prevClass = isAnimating ? (direction === 'up' ? 'roll-prev-up' : 'roll-prev-down') : 'roll-idle-prev';
  const nextClass = isAnimating ? (direction === 'up' ? 'roll-next-up' : 'roll-next-down') : 'roll-idle-next';

  return (
    <span className="rolling-digit-window" style={{ ['--roll-ms' as any]: `${durationMs}ms` }}>
      <span className={`rolling-digit-prev ${prevClass}`}>{/\d/.test(prev) ? prev : next}</span>
      <span className={`rolling-digit-next ${nextClass}`}>{next}</span>
    </span>
  );
}

function RollingNumber({ value, durationMs = 620 }: { value: number; durationMs?: number }) {
  const prevValueRef = useRef(value);
  const direction: 'up' | 'down' = value >= prevValueRef.current ? 'up' : 'down';
  const digits = String(Math.max(0, value)).split('');

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  return (
    <span className="rolling-number" aria-label={`${value}`}>
      {digits.map((digit, i) => (
        <RollingDigit key={i} next={digit} direction={direction} durationMs={durationMs} />
      ))}
    </span>
  );
}

export function EmployeeTable({ summaries, onFilteredSummariesChange, date, useFirstLast = true }: EmployeeTableProps) {
  const [search, setSearch] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedAssignedLocations, setSelectedAssignedLocations] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedEmpPrefixes, setSelectedEmpPrefixes] = useState<string[]>([]);
  const [selectedEmpTypes, setSelectedEmpTypes] = useState<string[]>([]);
  const [onlyWithRemarks, setOnlyWithRemarks] = useState(false);
  const [totalPage, setTotalPage] = useState<0 | 1 | 2>(0);
  const [splitLocationColumns, setSplitLocationColumns] = useState(false);
  const [loading] = useState(false);
  const [renderLimit, setRenderLimit] = useState(100);

  useEffect(() => {
    setRenderLimit(100);
  }, [search, selectedLocations, selectedAssignedLocations, selectedDepartments, selectedStatuses, selectedEmpPrefixes, selectedEmpTypes, onlyWithRemarks]);


  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();

    summaries.forEach((emp) => {
      if (emp.location) {
        locations.add(emp.location);
      }
    });

    const sorted = Array.from(locations).sort();
    const hasBlank = summaries.some(emp => !emp.location || emp.location.trim() === '');
    if (hasBlank) {
      sorted.push('(Blank)');
    }
    return sorted;
  }, [summaries]);

  const uniqueAssignedLocations = useMemo(() => {
    const locations = new Set<string>();

    summaries.forEach((emp) => {
      if (emp.assignedLocation) {
        locations.add(emp.assignedLocation);
      }
    });

    const sorted = Array.from(locations).sort();
    const hasBlank = summaries.some(emp => !emp.assignedLocation || emp.assignedLocation.trim() === '');
    if (hasBlank) {
      sorted.push('(Blank)');
    }
    return sorted;
  }, [summaries]);

  const uniqueMergedLocations = useMemo(() => {
    const locations = new Set<string>();
    summaries.forEach((emp) => {
      const mergedLoc = emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null);
      if (mergedLoc) {
        locations.add(mergedLoc);
      }
    });
    const sorted = Array.from(locations).sort();
    const hasBlank = summaries.some(emp => {
      const mergedLoc = emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null);
      return !mergedLoc || mergedLoc.trim() === '';
    });
    if (hasBlank) {
      sorted.push('(Blank)');
    }
    return sorted;
  }, [summaries]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    summaries.forEach((emp) => {
      if (emp.department) depts.add(emp.department);
    });
    const sorted = Array.from(depts).sort();
    const hasBlank = summaries.some(emp => !emp.department || emp.department.trim() === '');
    if (hasBlank) {
      sorted.push('(Blank)');
    }
    return sorted;
  }, [summaries]);

  const empCodePrefixes = useMemo(() => {
    const prefixes = new Set<string>();
    summaries.forEach((emp) => {
      if (emp.emp_id && emp.emp_id.length >= 2) {
        prefixes.add(emp.emp_id.slice(0, 2).toUpperCase());
      }
    });
    return Array.from(prefixes).sort();
  }, [summaries]);

  const uniqueEmpTypes = useMemo(() => {
    const types = new Set<string>();
    summaries.forEach((emp) => {
      if (emp.emp_type) types.add(emp.emp_type);
    });
    const sorted = Array.from(types).sort();
    const hasBlank = summaries.some(emp => !emp.emp_type || emp.emp_type.trim() === '');
    if (hasBlank) {
      sorted.push('(Blank)');
    }
    return sorted;
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    return summaries.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        (emp.emp_id && emp.emp_id.toLowerCase().includes(search.toLowerCase()));

      const mergedLoc = emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null);

      const matchesLocation = splitLocationColumns
        ? (selectedLocations.length === 0 ||
          (emp.location && selectedLocations.includes(emp.location)) ||
          ((!emp.location || emp.location.trim() === '') && selectedLocations.includes('(Blank)')))
        : (selectedLocations.length === 0 ||
          (mergedLoc && selectedLocations.includes(mergedLoc)) ||
          ((!mergedLoc || mergedLoc.trim() === '') && selectedLocations.includes('(Blank)')));

      const matchesAssignedLocation = !splitLocationColumns ||
        selectedAssignedLocations.length === 0 ||
        (emp.assignedLocation && selectedAssignedLocations.includes(emp.assignedLocation)) ||
        ((!emp.assignedLocation || emp.assignedLocation.trim() === '') && selectedAssignedLocations.includes('(Blank)'));

      const matchesDepartment =
        selectedDepartments.length === 0 ||
        (emp.department && selectedDepartments.includes(emp.department)) ||
        ((!emp.department || emp.department.trim() === '') && selectedDepartments.includes('(Blank)'));

      const matchesStatus =
        selectedStatuses.length === 0 ||
        (selectedStatuses.includes('Present') && emp.isPresent) ||
        (selectedStatuses.includes('Absent') && !emp.isPresent);

      const matchesPrefix =
        selectedEmpPrefixes.length === 0 ||
        (emp.emp_id && emp.emp_id.length >= 2 && selectedEmpPrefixes.includes(emp.emp_id.slice(0, 2).toUpperCase()));

      const matchesEmpType =
        selectedEmpTypes.length === 0 ||
        (emp.emp_type && selectedEmpTypes.includes(emp.emp_type)) ||
        ((!emp.emp_type || emp.emp_type.trim() === '') && selectedEmpTypes.includes('(Blank)'));

      const matchesRemarks = !onlyWithRemarks || !!(emp.remarks && emp.remarks.length > 0);

      return matchesSearch && matchesLocation && matchesAssignedLocation && matchesDepartment && matchesStatus && matchesPrefix && matchesEmpType && matchesRemarks;
    });
  }, [summaries, search, selectedLocations, selectedAssignedLocations, selectedDepartments, selectedStatuses, selectedEmpPrefixes, selectedEmpTypes, onlyWithRemarks, splitLocationColumns]);

  // Call the callback whenever filteredSummaries changes
  useEffect(() => {
    if (onFilteredSummariesChange) {
      onFilteredSummariesChange(filteredSummaries);
    }
  }, [filteredSummaries, onFilteredSummariesChange]);

  const stats = useMemo(() => {
    const total = filteredSummaries.length;
    const present = filteredSummaries.filter(emp => emp.isPresent).length;
    const absent = total - present;
    return { total, present, absent };
  }, [filteredSummaries]);

  const prefixCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSummaries.forEach(emp => {
      const prefix = emp.emp_id && emp.emp_id.length >= 2
        ? emp.emp_id.slice(0, 2).toUpperCase()
        : 'OTHER';
      counts[prefix] = (counts[prefix] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredSummaries]);

  const prefixChartData = useMemo(() => {
    return prefixCounts.map(([prefix, count]) => ({
      name: prefix,
      value: count
    }));
  }, [prefixCounts]);

  const projectChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSummaries.forEach(emp => {
      const loc = emp.location || 'UN-MAPPED';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([project, count]) => ({
        name: project,
        value: count
      }));
  }, [filteredSummaries]);

  const activeDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
  const yearMonth = useMemo(() => activeDate.substring(0, 7), [activeDate]);
  const lastDay = useMemo(() => {
    const parts = activeDate.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
  }, [activeDate]);

  const [monthlyPunches, setMonthlyPunches] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMonthlyData = async () => {
      setLoadingChart(true);
      try {
        const startOfMonth = `${yearMonth}-01T00:00:00`;
        const endOfMonth = `${yearMonth}-${String(lastDay).padStart(2, '0')}T23:59:59`;

        let allData: any[] = [];
        let from = 0;
        let to = 999;
        let finished = false;

        while (!finished) {
          const { data, error } = await supabase
            .from('punches')
            .select('user_id, punch_time')
            .gte('punch_time', startOfMonth)
            .lte('punch_time', endOfMonth)
            .order('punch_time', { ascending: true })
            .range(from, to);

          if (error) throw error;

          if (data && data.length > 0) {
            allData = [...allData, ...data];
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

        if (isMounted) {
          setMonthlyPunches(allData);
        }
      } catch (err) {
        console.error('Failed to fetch monthly punches for chart:', err);
      } finally {
        if (isMounted) {
          setLoadingChart(false);
        }
      }
    };

    fetchMonthlyData();
    return () => {
      isMounted = false;
    };
  }, [yearMonth, lastDay]);

  const monthlyStats = useMemo(() => {
    if (!filteredSummaries.length) return [];

    const filteredUserIds = new Set(filteredSummaries.map(emp => emp.device_user_id));

    const daysData: Record<number, Set<string>> = {};
    for (let d = 1; d <= lastDay; d++) {
      daysData[d] = new Set<string>();
    }

    for (const p of monthlyPunches) {
      if (!filteredUserIds.has(p.user_id)) continue;
      const pDate = new Date(p.punch_time);
      const ds = pDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
      if (ds.startsWith(yearMonth)) {
        const dayNum = parseInt(ds.split('-')[2]);
        if (daysData[dayNum]) {
          daysData[dayNum].add(p.user_id);
        }
      }
    }

    const dataList = [];
    const totalStaff = filteredSummaries.length;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
    const currentYearMonth = todayStr.substring(0, 7);

    for (let d = 1; d <= lastDay; d++) {
      const isFuture = (yearMonth > currentYearMonth) ||
        (yearMonth === currentYearMonth && d > parseInt(todayStr.split('-')[2]));

      const presentCount = daysData[d].size;
      const absentCount = totalStaff - presentCount;

      dataList.push({
        day: d,
        name: `Day ${d}`,
        present: isFuture ? null : presentCount,
        absent: isFuture ? null : absentCount,
        total: totalStaff,
      });
    }
    return dataList;
  }, [monthlyPunches, filteredSummaries, lastDay, yearMonth]);

  const chartTicks = useMemo(() => {
    const ticks = [1, 5, 10, 15, 20, 25];
    if (lastDay >= 28) {
      ticks.push(lastDay);
    }
    return ticks;
  }, [lastDay]);

  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 text-sm" style={{ border: "", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <User />
            </EmptyMedia>
            <EmptyTitle>No employees found</EmptyTitle>
            <EmptyDescription>
              Add employees to get started
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto overflow-hidden animate-fade-in" style={{ border: "", width: "100%" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out forwards;
        }
        .card-state-container {
          position: relative;
          flex: 1;
          width: 100%;
          min-height: 0;
        }
        .card-state-pane {
          position: absolute;
          inset: 0;
          transition: opacity 0.22s ease-in-out, transform 0.22s ease-in-out;
          width: 100%;
          height: 100%;
        }
        .card-state-pane-active {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
          z-index: 10;
        }
        .card-state-pane-inactive {
          opacity: 0;
          transform: scale(0.96) translateY(3px);
          pointer-events: none;
          z-index: 0;
        }
        .rolling-number {
          display: inline-flex;
          align-items: baseline;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .rolling-digit-window {
          position: relative;
          display: inline-flex;
          width: 0.62em;
          height: 1em;
          line-height: 1em;
          overflow: hidden;
        }
        .rolling-digit-prev,
        .rolling-digit-next {
          position: absolute;
          left: 0;
          width: 100%;
          height: 100%;
          text-align: center;
          line-height: 1em;
          will-change: transform, opacity;
        }
        .rolling-digit-prev { top: 0; }
        .rolling-digit-next { top: 0; }
        .roll-idle-prev { transform: translateY(0%); opacity: 0; }
        .roll-idle-next { transform: translateY(0%); opacity: 1; }
        @keyframes digitPrevUp {
          from { transform: translateY(0%); opacity: 1; }
          to { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes digitNextUp {
          from { transform: translateY(100%); opacity: 1; }
          to { transform: translateY(0%); opacity: 1; }
        }
        @keyframes digitPrevDown {
          from { transform: translateY(0%); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        @keyframes digitNextDown {
          from { transform: translateY(-100%); opacity: 1; }
          to { transform: translateY(0%); opacity: 1; }
        }
        .roll-prev-up { animation: digitPrevUp var(--roll-ms) cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
        .roll-next-up { animation: digitNextUp var(--roll-ms) cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
        .roll-prev-down { animation: digitPrevDown var(--roll-ms) cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
        .roll-next-down { animation: digitNextDown var(--roll-ms) cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
      ` }} />
      {
        (
          // Stat Cards
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "0.75rem", gap: "0.75rem", borderBottom: "1px solid rgba(100 100 100/ 0.1)" }}>

            <div style={{
              display: "flex",
              flex: 1,
              background: "rgba(100 100 100/ 0.05)",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              flexFlow: "column",
              height: "9.5rem",
              minWidth: 0,
              justifyContent: "space-between",
              alignItems: "stretch"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.25rem", zIndex: 20 }}>
                <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827", margin: 0, paddingLeft: "0.25rem" }}>
                  {totalPage === 0 ? "Total" : totalPage === 1 ? `Total (${stats.total}) - ID` : `Total (${stats.total}) - Project`}
                </p>
                <button
                  type="button"
                  onClick={() => setTotalPage(prev => (prev === 0 ? 1 : prev === 1 ? 2 : 0))}
                  style={{
                    background: "rgba(0,0,0,0.05)",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "0.25rem",
                    color: "grey",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.025em"
                  }}
                  className="hover:opacity-80 transition-opacity"
                  title="Cycle view"
                >
                  {totalPage === 0 ? "Categories" : totalPage === 1 ? "Projects" : "Total"}
                </button>
              </div>

              {loading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 className='animate-spin w-8 h-8 text-gray-400' />
                </div>
              ) : (
                <div className="card-state-container">
                  {/* Category Chart Pane */}
                  <div className={`card-state-pane ${totalPage === 1 ? "card-state-pane-active" : "card-state-pane-inactive"}`} style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
                      {prefixChartData.length === 0 ? (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#9ca3af" }}>
                          No data
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={prefixChartData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fill: "#6b7280", fontWeight: 500 }}
                            />
                            <Tooltip
                              cursor={{ fill: 'transparent' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div style={{ background: "white", padding: "0.25rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", fontSize: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", zIndex: 50 }}>
                                      <p style={{ fontWeight: 600, margin: 0, color: "#4f46e5" }}>{data.name}</p>
                                      <p style={{ margin: 0, color: "#374151" }}>Employees: {data.value}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              wrapperStyle={{ outline: 'none' }}
                            />
                            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                              {prefixChartData.map((index) => (
                                <Cell key={`cell-id-${index}`} fill="#4f46e5" fillOpacity={0.8} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Project Chart Pane */}
                  <div className={`card-state-pane ${totalPage === 2 ? "card-state-pane-active" : "card-state-pane-inactive"}`} style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
                      {projectChartData.length === 0 ? (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#9ca3af" }}>
                          No data
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={projectChartData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fill: "#6b7280", fontWeight: 500 }}
                            />
                            <Tooltip
                              cursor={{ fill: 'transparent' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div style={{ background: "white", padding: "0.25rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", fontSize: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", zIndex: 50 }}>
                                      <p style={{ fontWeight: 600, margin: 0, color: "#10b981" }}>{data.name}</p>
                                      <p style={{ margin: 0, color: "#374151" }}>Employees: {data.value}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              wrapperStyle={{ outline: 'none' }}
                            />
                            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                              {projectChartData.map((index) => (
                                <Cell key={`cell-proj-${index}`} fill="#10b981" fillOpacity={0.8} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Total Number Pane */}
                  <div className={`card-state-pane ${totalPage === 0 ? "card-state-pane-active" : "card-state-pane-inactive"}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <h1 style={{ fontWeight: 600, fontSize: "2.5rem", margin: 0 }}>
                      <RollingNumber value={stats.total} durationMs={680} />
                    </h1>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.75rem", flexFlow: "column", height: "9.5rem", minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.25rem" }}>
                <p className='text-gray-500' style={{ fontSize: "1rem", fontWeight: 500, marginLeft: "0.5rem" }}>Present</p>
                <h1 className='text-teal-600' style={{ fontWeight: 600, fontSize: "1.75rem", marginRight: "0.5rem" }}>
                  {loading ? <Loader2 className='animate-spin w-4 h-4' /> : <RollingNumber value={stats.present} durationMs={680} />}
                </h1>
              </div>
              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                {loadingChart ? (
                  <div style={{ display: "flex", alignItems: "", justifyContent: "center", height: "100%", color: "", border: "", paddingTop: "1rem" }}>
                    <Loader2 size={25} className="animate-spin text-teal-600" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 15 }}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#009688" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#009688" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="rgba(100, 100, 100, 0.08)" />
                      <XAxis
                        dataKey="day"
                        type="number"
                        domain={[1, lastDay]}
                        ticks={chartTicks}
                        axisLine={false}
                        tickLine={false}
                        height={15}
                        tickMargin={4}
                        tick={{ fontSize: 9, fill: 'rgba(100, 100, 100, 0.4)', fontWeight: 500 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stroke="#009688"
                        strokeWidth={2}
                        fill="url(#colorPresent)"
                        connectNulls
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{ background: "white", padding: "0.25rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", fontSize: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                <p style={{ fontWeight: 600, margin: 0 }}>Day {data.day}</p>
                                <p style={{ color: "#009688", margin: 0 }}>Present: {data.present}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        wrapperStyle={{ outline: 'none' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className='' style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.75rem", flexFlow: "column", height: "9.5rem", minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.25rem" }}>
                <p className='text-gray-500' style={{ fontSize: "1rem", fontWeight: 500, marginLeft: "0.5rem" }}>Absent</p>
                <h1 style={{ fontWeight: 600, fontSize: "1.75rem", color: "#F43F5E", marginRight: "0.5rem" }}>
                  {loading ? <Loader2 className='animate-spin w-4 h-4' /> : <RollingNumber value={stats.absent} durationMs={680} />}
                </h1>
              </div>
              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                {loadingChart ? (
                  <div style={{ display: "flex", alignItems: "", justifyContent: "center", height: "100%", color: "", border: "", paddingTop: "1rem" }}>
                    <Loader2 size={25} className="animate-spin text-rose-600" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 15 }}>
                      <defs>
                        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="rgba(100, 100, 100, 0.08)" />
                      <XAxis
                        dataKey="day"
                        type="number"
                        domain={[1, lastDay]}
                        ticks={chartTicks}
                        axisLine={false}
                        tickLine={false}
                        height={15}
                        tickMargin={4}
                        tick={{ fontSize: 9, fill: 'rgba(100, 100, 100, 0.4)', fontWeight: 500 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="absent"
                        stroke="#F43F5E"
                        strokeWidth={2}
                        fill="url(#colorAbsent)"
                        connectNulls
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{ background: "white", padding: "0.25rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", fontSize: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                <p style={{ fontWeight: 600, margin: 0 }}>Day {data.day}</p>
                                <p style={{ color: "#F43F5E", margin: 0 }}>Absent: {data.absent}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        wrapperStyle={{ outline: 'none' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>)
      }
      {/* Table Section */}
      <div className="overflow-auto flex-1 animate-fade-in" style={{ border: "", width: "100%" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "420px" }}>
                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex items-center group flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-darkblue transition-colors" />
                    <input
                      type="text"
                      placeholder="Search Employee..."
                      value={search}
                      style={{ fontSize: "0.8rem", fontWeight: "400" }}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-6 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors tracking-wide text-gray-700"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`h-8 text-xs border transition-colors px-2 rounded-md font-semibold flex items-center gap-1 outline-none uppercase tracking-wide shrink-0 ${selectedEmpPrefixes.length > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      <span className="truncate">
                        {selectedEmpPrefixes.length === 0
                          ? 'ID (All)'
                          : selectedEmpPrefixes.length === 1
                            ? `ID: ${selectedEmpPrefixes[0]}`
                            : `ID (${selectedEmpPrefixes.length})`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-0.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[180px] max-h-[300px] overflow-y-auto p-0 z-50">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedEmpPrefixes(empCodePrefixes);
                          }}
                          className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left bg-transparent border-none"
                          style={{ flex: 1 }}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedEmpPrefixes([]);
                          }}
                          className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right bg-transparent border-none"
                          style={{ flex: 1 }}
                        >
                          Clear
                        </button>
                      </div>
                      <div className="py-1">
                        {empCodePrefixes.map(prefix => {
                          const isChecked = selectedEmpPrefixes.includes(prefix);
                          return (
                            <DropdownMenuCheckboxItem
                              key={prefix}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEmpPrefixes([...selectedEmpPrefixes, prefix]);
                                } else {
                                  setSelectedEmpPrefixes(selectedEmpPrefixes.filter(item => item !== prefix));
                                }
                              }}
                              onSelect={(e) => e.preventDefault()}
                              className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                            >
                              {prefix}
                            </DropdownMenuCheckboxItem>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
              <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: "130px" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-700 hover:bg-gray-100 transition-colors px-2 rounded-md font-semibold w-full justify-between flex items-center outline-none uppercase tracking-wide">
                    <span className="truncate">
                      {selectedEmpTypes.length === 0
                        ? 'Type (All)'
                        : selectedEmpTypes.length === 1
                          ? selectedEmpTypes[0]
                          : `Type (${selectedEmpTypes.length})`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[140px] max-h-[300px] overflow-y-auto p-0 z-50">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEmpTypes(uniqueEmpTypes);
                        }}
                        className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left bg-transparent border-none"
                        style={{ flex: 1 }}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEmpTypes([]);
                        }}
                        className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right bg-transparent border-none"
                        style={{ flex: 1 }}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="py-1">
                      {uniqueEmpTypes.map(t => {
                        const isChecked = selectedEmpTypes.includes(t);
                        return (
                          <DropdownMenuCheckboxItem
                            key={t}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEmpTypes([...selectedEmpTypes, t]);
                              } else {
                                setSelectedEmpTypes(selectedEmpTypes.filter(item => item !== t));
                              }
                            }}
                            onSelect={(e) => e.preventDefault()}
                            className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                          >
                            {t}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: "160px" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                    <span className="truncate">
                      {selectedDepartments.length === 0
                        ? 'Department (All)'
                        : selectedDepartments.length === 1
                          ? selectedDepartments[0]
                          : `Dept (${selectedDepartments.length})`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
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
                          setSelectedDepartments(uniqueDepartments);
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
                          setSelectedDepartments([]);
                        }}
                        className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right"
                        style={{ background: "none", flex: 1 }}
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="py-1">
                      {uniqueDepartments.map(dept => {
                        const isChecked = selectedDepartments.includes(dept);
                        return (
                          <DropdownMenuCheckboxItem
                            key={dept}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDepartments([...selectedDepartments, dept]);
                              } else {
                                setSelectedDepartments(selectedDepartments.filter(item => item !== dept));
                              }
                            }}
                            onSelect={(e) => e.preventDefault()}
                            className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                          >
                            {dept}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>

              <th
                className="text-left py-1 font-medium text-xs tracking-wide"
                style={{
                  width: splitLocationColumns ? '160px' : '0px',
                  minWidth: splitLocationColumns ? '160px' : '0px',
                  maxWidth: splitLocationColumns ? '160px' : '0px',
                  paddingLeft: splitLocationColumns ? '0.25rem' : '0px',
                  paddingRight: splitLocationColumns ? '0.25rem' : '0px',
                  overflow: 'hidden',
                  transition: 'width 260ms ease, min-width 260ms ease, max-width 260ms ease, padding 260ms ease'
                }}
              >
                <div
                  style={{
                    opacity: splitLocationColumns ? 1 : 0,
                    transform: splitLocationColumns ? 'translateX(0)' : 'translateX(-8px)',
                    pointerEvents: splitLocationColumns ? 'auto' : 'none',
                    transition: 'opacity 180ms ease, transform 220ms ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                      <span className="truncate">
                        {selectedAssignedLocations.length === 0
                          ? 'Assigned (All)'
                          : selectedAssignedLocations.length === 1
                            ? selectedAssignedLocations[0]
                            : `Assigned (${selectedAssignedLocations.length})`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
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
                            setSelectedAssignedLocations(uniqueAssignedLocations);
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
                            setSelectedAssignedLocations([]);
                          }}
                          className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right"
                          style={{ background: "none", flex: 1 }}
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="py-1">
                        {uniqueAssignedLocations.map(loc => {
                          const isChecked = selectedAssignedLocations.includes(loc);
                          return (
                            <DropdownMenuCheckboxItem
                              key={loc}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAssignedLocations([...selectedAssignedLocations, loc]);
                                } else {
                                  setSelectedAssignedLocations(selectedAssignedLocations.filter(item => item !== loc));
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
                </div>
              </th>

              <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: "210px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "space-between" }}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                      <span className="truncate">
                        {selectedLocations.length === 0
                          ? 'Location (All)'
                          : selectedLocations.length === 1
                            ? selectedLocations[0]
                            : `Loc (${selectedLocations.length})`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
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
                            setSelectedLocations(splitLocationColumns ? uniqueLocations : uniqueMergedLocations);
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
                        {(splitLocationColumns ? uniqueLocations : uniqueMergedLocations).map(loc => {
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

                  <button
                    type="button"
                    onClick={() => {
                      setSplitLocationColumns(prev => !prev);
                      setSelectedLocations([]);
                      setSelectedAssignedLocations([]);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.25rem",
                      borderRadius: "0.25rem",

                      cursor: "pointer",
                      height: "1.75rem",
                      width: "1.75rem",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease-in-out",
                      flexShrink: 0
                    }}
                    className={splitLocationColumns
                      ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }
                    title={splitLocationColumns ? "Merge Assigned & Actual Locations" : "Split Assigned & Actual Locations"}
                  >
                    <MapPinCheck className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>

              <th style={{ width: "200px" }} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                {useFirstLast ? "First In" : "Check In"}
              </th>
              <th style={{ width: "200px" }} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                {useFirstLast ? "Last Out" : "Check Out"}
              </th>
              <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: "200px" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                    <span className="truncate">
                      {selectedStatuses.length === 0
                        ? 'Status (All)'
                        : selectedStatuses.length === 1
                          ? selectedStatuses[0]
                          : `Status (${selectedStatuses.length})`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[140px] max-h-[300px] overflow-y-auto p-0 z-50">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedStatuses(['Present', 'Absent']);
                        }}
                        className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left"
                        style={{ background: "none", flex: 1 }}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedStatuses([]);
                        }}
                        className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right"
                        style={{ background: "none", flex: 1 }}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="py-1">
                      <DropdownMenuCheckboxItem
                        checked={selectedStatuses.includes('Present')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses([...selectedStatuses, 'Present']);
                          } else {
                            setSelectedStatuses(selectedStatuses.filter(s => s !== 'Present'));
                          }
                        }}
                        onSelect={(e) => e.preventDefault()}
                        className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                      >
                        Present
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={selectedStatuses.includes('Absent')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses([...selectedStatuses, 'Absent']);
                          } else {
                            setSelectedStatuses(selectedStatuses.filter(s => s !== 'Absent'));
                          }
                        }}
                        onSelect={(e) => e.preventDefault()}
                        className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                      >
                        Absent
                      </DropdownMenuCheckboxItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              <th
                style={{ width: "220px" }}
                className={`text-left px-4 py-3 font-medium text-xs uppercase tracking-wide cursor-pointer select-none transition-colors ${onlyWithRemarks ? 'text-amber-700 bg-amber-50/60' : 'text-gray-500 hover:bg-gray-100'}`}
                onClick={() => setOnlyWithRemarks(prev => !prev)}
                title="Toggle only rows with remarks"
              >
                Remarks {onlyWithRemarks ? '' : ''}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center text-gray-400 font-medium">
                  {search ? `No results found for "${search}"` : 'No matching employees found.'}
                </td>
              </tr>
            ) : (
              <>
                {filteredSummaries.slice(0, renderLimit).map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex gap-2.5" style={{ border: '', display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                        <Avatar size={"md"} name={emp.name} index={idx} />
                        <div style={{ display: "flex", flexFlow: "column" }}>
                          <span className="font-medium text-gray-900" style={{ textAlign: "left", textTransform: "capitalize" }}>{emp.name.toLowerCase()}</span>
                          {emp.emp_id && (
                            <div className="text-xs text-gray-400" style={{ textAlign: "left" }}>{emp.emp_id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.emp_type ? (
                        <span style={{ display: "flex", justifyContent: "center", alignItems: "center" }} className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wider`}>
                          {emp.emp_type.toUpperCase()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{emp.department ?? '—'}</td>
                    {/* Assigned Location */}
                    <td
                      className="py-3 text-gray-500"
                      style={{
                        width: splitLocationColumns ? '160px' : '0px',
                        minWidth: splitLocationColumns ? '160px' : '0px',
                        maxWidth: splitLocationColumns ? '160px' : '0px',
                        paddingLeft: splitLocationColumns ? '1rem' : '0px',
                        paddingRight: splitLocationColumns ? '1rem' : '0px',
                        overflow: 'hidden',
                        transition: 'width 260ms ease, min-width 260ms ease, max-width 260ms ease, padding 260ms ease'
                      }}
                    >
                      <div
                        style={{
                          opacity: splitLocationColumns ? 1 : 0,
                          transform: splitLocationColumns ? 'translateX(0)' : 'translateX(-8px)',
                          pointerEvents: splitLocationColumns ? 'auto' : 'none',
                          transition: 'opacity 180ms ease, transform 220ms ease',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {emp.isVerified ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <div className="flex items-center gap-1 text-emerald-700" style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-start" }}>
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span style={{ fontWeight: 500 }}>{emp.assignedLocation}</span>
                            </div>
                            {/* {emp.verifiedBy && (
                              <span style={{ fontSize: "0.65rem", color: "#6b7280", paddingLeft: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem" }}>
                                by {emp.verifiedBy}
                              </span>
                            )} */}
                          </div>
                        ) : (
                          emp.assignedLocation ?? '—'
                        )}
                      </div>
                    </td>
                    {/* Punch Location / Merged Location */}
                    <td className="px-4 py-3 text-gray-500">
                      {splitLocationColumns ? (
                        emp.location ?? '—'
                      ) : (
                        emp.isVerified ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <div className="flex items-center gap-1 text-emerald-700" style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-start" }}>
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span style={{ fontWeight: 500 }}>{emp.assignedLocation}</span>
                            </div>
                            {/* {emp.verifiedBy && (
                              <span style={{ fontSize: "0.65rem", color: "#6b7280", paddingLeft: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem" }}>
                                by {emp.verifiedBy}
                              </span>
                            )} */}
                          </div>
                        ) : (
                          emp.location || emp.assignedLocation || '—'
                        )
                      )}
                    </td>

                    <td className="px-4 py-3 tabular-nums text-gray-700">{formatTime(emp.firstIn)}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">{formatTime(emp.lastOut)}</td>
                    <td className="px-4 py-4" style={{ border: "", display: "flex", justifyContent: "center", alignItems: "center", }}>
                      {emp.isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {emp.remarks && emp.remarks.length > 0 ? (
                          emp.remarks.map((remark, rIdx) => {
                            const isLate = remark.toLowerCase().includes('late');
                            const isEarly = remark.toLowerCase().includes('early');

                            let badgeColorClass = 'bg-gray-50 text-gray-600 border-gray-100';
                            if (isLate) {
                              let isWarning = false;
                              const match = remark.match(/Late in by (?:(\d+)h\s*)?(?:(\d+)m)?/i);
                              if (match) {
                                const hours = match[1] ? parseInt(match[1], 10) : 0;
                                const minutes = match[2] ? parseInt(match[2], 10) : 0;
                                const totalMinutes = hours * 60 + minutes;
                                if (totalMinutes < 45) {
                                  isWarning = true;
                                }
                              }
                              badgeColorClass = isWarning
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100';
                            } else if (isEarly) {
                              badgeColorClass = 'bg-amber-50 text-amber-700 border-amber-100';
                            }

                            return (
                              <span
                                key={rIdx}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColorClass}`}
                              >
                                {remark}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSummaries.length > renderLimit && (
                  <tr>
                    <td colSpan={9} className="p-4 text-center bg-white/80 backdrop-blur-xs sticky bottom-0 z-10 border-t border-gray-50">
                      <div className="flex items-center justify-center gap-4 w-full">
                        <span className="text-xs text-gray-500 font-medium text-center">
                          Showing {renderLimit} of {filteredSummaries.length} employees
                        </span>
                        <button
                          type="button"
                          onClick={() => setRenderLimit(prev => prev + 100)}
                          className="text-xs font-semibold h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-xs px-4 text-gray-700 cursor-pointer"
                        >
                          Load More
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
    </div>
  );
}
