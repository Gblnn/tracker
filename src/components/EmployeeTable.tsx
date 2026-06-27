import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2, Search, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
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

export function EmployeeTable({ summaries, onFilteredSummariesChange, date, useFirstLast = true }: EmployeeTableProps) {
  const [search, setSearch] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [loading] = useState(false);


  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();

    summaries.forEach((emp) => {
      if (emp.location) {
        locations.add(emp.location);
      }
    });

    return Array.from(locations).sort();
  }, [summaries]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    summaries.forEach((emp) => {
      if (emp.department) depts.add(emp.department);
    });
    return Array.from(depts).sort();
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    return summaries.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        (emp.emp_id && emp.emp_id.toLowerCase().includes(search.toLowerCase()));

      const matchesLocation =
        selectedLocations.length === 0 ||
        (emp.location && selectedLocations.includes(emp.location));

      const matchesDepartment =
        selectedDepartments.length === 0 ||
        (emp.department && selectedDepartments.includes(emp.department));

      const matchesStatus =
        selectedStatuses.length === 0 ||
        (selectedStatuses.includes('Present') && emp.isPresent) ||
        (selectedStatuses.includes('Absent') && !emp.isPresent);

      return matchesSearch && matchesLocation && matchesDepartment && matchesStatus;
    });
  }, [summaries, search, selectedLocations, selectedDepartments, selectedStatuses]);

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
    <div className="flex flex-col h-auto overflow-hidden" style={{ border: "", width: "100%" }}>
      {
        (
          // Stat Cards
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "0.75rem", gap: "0.75rem", borderBottom: "1px solid rgba(100 100 100/ 0.1)" }}>

            <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.75rem", flexFlow: "column", height: "9.5rem", minWidth: 0, justifyContent: "center", alignItems: "center" }}>
              <p style={{ fontSize: "1rem", fontWeight: 500, color: "grey", marginBottom: "0.25rem" }}>Total</p>
              <h1 style={{ fontWeight: 600, fontSize: "2.5rem" }}>
                {loading ? <Loader2 className='animate-spin w-10 h-10' /> : stats.total}
              </h1>
            </div>

            <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.75rem", flexFlow: "column", height: "9.5rem", minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.25rem" }}>
                <p className='text-gray-500' style={{ fontSize: "1rem", fontWeight: 500, marginLeft: "0.5rem" }}>Present</p>
                <h1 className='text-teal-600' style={{ fontWeight: 600, fontSize: "1.75rem", marginRight: "0.5rem" }}>
                  {loading ? <Loader2 className='animate-spin w-4 h-4' /> : stats.present}
                </h1>
              </div>
              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                {loadingChart ? (
                  <div style={{ display: "flex", alignItems: "", justifyContent: "center", height: "100%", color: "", border: "", paddingTop: "1rem" }}>
                    <Loader2 size={25} className="animate-spin text-teal-600" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#009688" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#009688" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                  {loading ? <Loader2 className='animate-spin w-4 h-4' /> : stats.absent}
                </h1>
              </div>
              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                {loadingChart ? (
                  <div style={{ display: "flex", alignItems: "", justifyContent: "center", height: "100%", color: "", border: "", paddingTop: "1rem" }}>
                    <Loader2 size={25} className="animate-spin text-rose-600" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
      <div className="overflow-auto flex-1" style={{ border: "", width: "100%" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "370px" }}>
                <div className="relative flex items-center group w-full">
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
                  <DropdownMenuContent className="w-[180px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50 max-h-[300px] overflow-y-auto">
                    <DropdownMenuCheckboxItem
                      checked={selectedDepartments.length === 0}
                      onCheckedChange={() => setSelectedDepartments([])}
                      className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                    >
                      All Departments
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator className="my-1 border-gray-100" />
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
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          {dept}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: "160px" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                    <span className="truncate">
                      {selectedLocations.length === 0
                        ? 'Location (All)'
                        : selectedLocations.length === 1
                          ? selectedLocations[0]
                          : `Loc (${selectedLocations.length})`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[180px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50 max-h-[300px] overflow-y-auto">
                    <DropdownMenuCheckboxItem
                      checked={selectedLocations.length === 0}
                      onCheckedChange={() => setSelectedLocations([])}
                      className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                    >
                      All Locations
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator className="my-1 border-gray-100" />
                    {uniqueLocations.map(loc => {
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
                          className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                        >
                          {loc}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  <DropdownMenuContent className="w-[140px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50">
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.length === 0}
                      onCheckedChange={() => setSelectedStatuses([])}
                      className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                    >
                      All Statuses
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator className="my-1 border-gray-100" />
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.includes('Present')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStatuses([...selectedStatuses, 'Present']);
                        } else {
                          setSelectedStatuses(selectedStatuses.filter(s => s !== 'Present'));
                        }
                      }}
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
                      className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                    >
                      Absent
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              <th style={{ width: "220px" }} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-gray-400 font-medium">
                  {search ? `No results found for "${search}"` : 'No matching employees found.'}
                </td>
              </tr>
            ) : (
              filteredSummaries.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex gap-2.5" style={{ border: '', display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                      <Avatar size={"md"} name={emp.name} index={idx} />
                      <div style={{ display: "flex", flexFlow: "column" }}>
                        <div className="font-medium text-gray-900" style={{ textAlign: "left", textTransform: "capitalize" }}>{emp.name.toLowerCase()}</div>
                        {emp.emp_id && (
                          <div className="text-xs text-gray-400">{emp.emp_id}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{emp.department ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.location ?? '—'}</td>
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
                          return (
                            <span
                              key={rIdx}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isLate
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : isEarly
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-gray-50 text-gray-600 border-gray-100'
                                }`}
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
              ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
