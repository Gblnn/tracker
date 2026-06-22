import { useState, useMemo, useEffect } from 'react';
import { Avatar } from './Avatar';
import type { EmployeeSummary } from '../types/attendance';
import { formatTime } from '../lib/utilis';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, User, X } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';
import { supabase } from '../lib/supabase';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

interface EmployeeTableProps {
  summaries: EmployeeSummary[];
  onFilteredSummariesChange?: (summaries: EmployeeSummary[]) => void;
  date?: string;
}

export function EmployeeTable({ summaries, onFilteredSummariesChange, date }: EmployeeTableProps) {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
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

  const filteredSummaries = useMemo(() => {
    return summaries.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        (emp.emp_id && emp.emp_id.toLowerCase().includes(search.toLowerCase()));

      const matchesLocation =
        locationFilter === 'all' ||
        emp.location === locationFilter;

      return matchesSearch && matchesLocation;
    });
  }, [summaries, search, locationFilter]);

  // Call the callback whenever filteredSummaries changes
  useEffect(() => {
    if (onFilteredSummariesChange) {
      onFilteredSummariesChange(filteredSummaries);
    }
  }, [summaries, search, locationFilter]);

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
              <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "grey", marginBottom: "0.25rem" }}>Total Staff</p>
              <h1 style={{ fontWeight: 600, fontSize: "2.5rem" }}>
                {loading ? <Loader2 className='animate-spin w-10 h-10' /> : stats.total}
              </h1>
            </div>

            <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.75rem", flexFlow: "column", height: "9.5rem", minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.25rem" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "grey" }}>Present</p>
                <h1 style={{ fontWeight: 600, fontSize: "1.75rem", color: "#10b981" }}>
                  {loading ? <Loader2 className='animate-spin w-4 h-4' /> : stats.present}
                </h1>
              </div>
              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                {loadingChart ? (
                  <div style={{ display: "flex", alignItems: "", justifyContent: "center", height: "100%", color: "", border: "", paddingTop: "1rem" }}>
                    <Loader2 size={25} className="animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Line
                        type="monotone"
                        dataKey="present"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{ background: "white", padding: "0.25rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", fontSize: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                <p style={{ fontWeight: 600, margin: 0 }}>Day {data.day}</p>
                                <p style={{ color: "#10b981", margin: 0 }}>Present: {data.present}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        wrapperStyle={{ outline: 'none' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.75rem", flexFlow: "column", height: "9.5rem", minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0.25rem" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "grey" }}>Absent</p>
                <h1 style={{ fontWeight: 600, fontSize: "1.75rem", color: "#ef4444" }}>
                  {loading ? <Loader2 className='animate-spin w-4 h-4' /> : stats.absent}
                </h1>
              </div>
              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                {loadingChart ? (
                  <div style={{ display: "flex", alignItems: "", justifyContent: "center", height: "100%", color: "", border: "", paddingTop: "1rem" }}>
                    <Loader2 size={25} className="animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Line
                        type="monotone"
                        dataKey="absent"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{ background: "white", padding: "0.25rem 0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", fontSize: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                <p style={{ fontWeight: 600, margin: 0 }}>Day {data.day}</p>
                                <p style={{ color: "#ef4444", margin: 0 }}>Absent: {data.absent}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        wrapperStyle={{ outline: 'none' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>)
      }
      {/* Toolbar: Search and Location Filter */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 bg-white sticky top-0 z-20" style={{ border: '', width: "100%" }}>
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-darkblue transition-colors" />
          <input
            type="text"
            placeholder="Search name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border-none rounded-xl outline-none focus:ring-1 focus:ring-gray-200 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger style={{ width: "fit-content" }} className=" h-10 bg-gray-50 border-none rounded-xl text-xs font-medium focus:ring-1 focus:ring-gray-200">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-gray-100 shadow-xl">
            <SelectItem value="all">All Locations</SelectItem>
            {uniqueLocations.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Section */}
      <div className="overflow-auto flex-1" style={{ border: "", width: "100%" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide ">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide ">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">First in</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Last out</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-400 font-medium">
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
                        <div className="font-medium text-gray-900" style={{ textAlign: "left" }}>{emp.name}</div>
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
                  <td className="px-4 py-3">
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
