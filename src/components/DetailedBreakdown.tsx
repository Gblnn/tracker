import { useState, useMemo, useRef, useCallback } from 'react';
import type { EmployeeSummary } from '../types/attendance';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Filter, CheckCircle2, XCircle } from 'lucide-react';
import { ResponsiveModal } from './responsive-modal';

interface DetailedBreakdownProps {
  summaries: EmployeeSummary[];
  date?: string;
}

export default function DetailedBreakdown({ summaries }: DetailedBreakdownProps) {
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['CIVIL', 'MED', 'LSD', 'STAFF']);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const headerDragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0 });
  const [isHeaderDragging, setIsHeaderDragging] = useState(false);

  // Drilldown modal state
  const [drilldown, setDrilldown] = useState<{
    title: string;
    project?: string;
    department?: string;
    company?: string;
    absentOnly?: boolean;
  } | null>(null);

  // Filter and map summaries to include:
  // - Employees with emp_type === 'staff' (department set to 'STAFF')
  // - Employees with department 'CIVIL', 'MED' or 'LSD'
  const filteredSummaries = useMemo(() => {
    return summaries.map((emp) => {
      const isStaff = emp.emp_type === 'staff';
      const dept = (emp.department || '').trim().toUpperCase();

      if (isStaff) {
        return { ...emp, department: 'STAFF' };
      } else if (dept === 'CIVIL' || dept === 'MED' || dept === 'LSD') {
        return { ...emp, department: dept };
      }
      return null;
    }).filter((emp): emp is NonNullable<typeof emp> => emp !== null);
  }, [summaries]);

  // Restrict summaries to active selected departments
  const activeDeptSummaries = useMemo(() => {
    return filteredSummaries.filter(emp => selectedDepts.includes(emp.department));
  }, [filteredSummaries, selectedDepts]);

  // 1. Group records by unique (Project, Department) pairs
  // For each project, we create a project header row followed by visible department rows
  const rows = useMemo(() => {
    const projectCounts: Record<string, number> = {};
    activeDeptSummaries.forEach((emp) => {
      const project = (emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null)) || 'Unassigned';
      projectCounts[project] = (projectCounts[project] || 0) + 1;
    });

    const uniqueProjects = Array.from(new Set(
      activeDeptSummaries.map((emp) =>
        (emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null)) || 'Unassigned'
      )
    ));

    // Sort projects by count descending. If counts are equal, sort alphabetically.
    uniqueProjects.sort((a, b) => {
      const countA = projectCounts[a] || 0;
      const countB = projectCounts[b] || 0;
      if (countB !== countA) {
        return countB - countA;
      }
      return a.localeCompare(b);
    });

    const resultRows: (
      | { type: 'project'; project: string; department?: never }
      | { type: 'department'; project: string; department: string }
    )[] = [];

    uniqueProjects.forEach((project) => {
      resultRows.push({ type: 'project', project });
      if (selectedDepts.includes('CIVIL')) {
        resultRows.push({ type: 'department', project, department: 'CIVIL' });
      }
      if (selectedDepts.includes('MED')) {
        resultRows.push({ type: 'department', project, department: 'MED' });
      }
      if (selectedDepts.includes('LSD')) {
        resultRows.push({ type: 'department', project, department: 'LSD' });
      }
      if (selectedDepts.includes('STAFF')) {
        resultRows.push({ type: 'department', project, department: 'STAFF' });
      }
    });

    return resultRows;
  }, [activeDeptSummaries, selectedDepts]);

  // 2. Extract unique Company names from ALL summaries, sorted by employee count descending
  const columns = useMemo(() => {
    const companyCounts: Record<string, number> = {};
    let otherCount = 0;

    summaries.forEach((emp) => {
      const comp = emp.company ? emp.company.trim() : '';
      if (comp) {
        companyCounts[comp] = (companyCounts[comp] || 0) + 1;
      } else {
        otherCount++;
      }
    });

    const companies = Object.keys(companyCounts);
    const listWithCounts = companies.map(c => ({ category: c, count: companyCounts[c] }));

    if (otherCount > 0) {
      listWithCounts.push({ category: 'Other', count: otherCount });
    }

    // Sort by count descending. If count is equal, sort alphabetically (Other always goes last)
    listWithCounts.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      if (a.category === 'Other') return 1;
      if (b.category === 'Other') return -1;
      return a.category.localeCompare(b.category);
    });

    return listWithCounts.map(item => item.category);
  }, [summaries]);

  // Helper to get active list of employees based on current filter state
  const getActiveList = (department?: string) => {
    if (department) {
      return activeDeptSummaries;
    } else {
      const showAll = selectedDepts.includes('CIVIL') && selectedDepts.includes('MED') && selectedDepts.includes('LSD') && selectedDepts.includes('STAFF');
      if (showAll) {
        return summaries;
      } else {
        return summaries.filter((emp) => {
          const isStaff = emp.emp_type === 'staff';
          const dept = (emp.department || '').trim().toUpperCase();
          const mappedDept = isStaff ? 'STAFF' : (['CIVIL', 'MED', 'LSD'].includes(dept) ? dept : 'OTHER');
          return selectedDepts.includes(mappedDept);
        });
      }
    }
  };

  // Helper to filter and count employees for a specific cell
  const getCellStats = (project: string, company: string, department?: string) => {
    const listToUse = getActiveList(department);
    const matching = listToUse.filter((emp) => {
      const empProj = (emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null)) || 'Unassigned';
      const empDept = (emp.department || '').trim().toUpperCase();

      const isProjectMatch = empProj === project;
      const isDeptMatch = !department || empDept === department;

      let isCompanyMatch = false;
      const empComp = emp.company ? emp.company.trim() : '';
      if (company === 'Other') {
        isCompanyMatch = !empComp;
      } else {
        isCompanyMatch = empComp.toLowerCase() === company.toLowerCase();
      }

      return isProjectMatch && isDeptMatch && isCompanyMatch;
    });

    const total = matching.length;
    const present = matching.filter(e => e.isPresent).length;
    const absent = total - present;

    return { total, present, absent };
  };

  // Row-level sums (Total present / total overall in each row or project)
  const getRowStats = (project: string, department?: string) => {
    const listToUse = getActiveList(department);
    const matching = listToUse.filter((emp) => {
      const empProj = (emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null)) || 'Unassigned';
      const empDept = (emp.department || '').trim().toUpperCase();
      const isProjectMatch = empProj === project;
      const isDeptMatch = !department || empDept === department;
      return isProjectMatch && isDeptMatch;
    });
    const total = matching.length;
    const present = matching.filter(e => e.isPresent).length;
    const absent = total - present;
    return { total, present, absent };
  };

  // Column-level sums (Total present / total overall in each column)
  const colTotals = useMemo(() => {
    const listToUse = getActiveList();
    return columns.map((col) => {
      const matching = listToUse.filter((emp) => {
        const empComp = emp.company ? emp.company.trim() : '';
        if (col === 'Other') {
          return !empComp;
        } else {
          return empComp.toLowerCase() === col.toLowerCase();
        }
      });
      const total = matching.length;
      const present = matching.filter(e => e.isPresent).length;
      const absent = total - present;
      return { total, present, absent };
    });
  }, [summaries, columns, selectedDepts]);

  // Grand totals across all employees
  const grandTotal = useMemo(() => {
    const listToUse = getActiveList();
    const total = listToUse.length;
    const present = listToUse.filter(e => e.isPresent).length;
    const absent = total - present;
    return { total, present, absent };
  }, [summaries, selectedDepts]);

  // Helper to get employees for the drilldown modal
  const getDrilldownEmployees = (opts: {
    project?: string;
    department?: string;
    company?: string;
    absentOnly?: boolean;
  }): EmployeeSummary[] => {
    const listToUse = getActiveList(opts.department);
    return listToUse.filter((emp) => {
      const empProj = (emp.isVerified ? emp.assignedLocation : (emp.location || emp.assignedLocation || null)) || 'Unassigned';
      const empDept = (emp.department || '').trim().toUpperCase();
      const empComp = emp.company ? emp.company.trim() : '';

      const isProjectMatch = !opts.project || empProj === opts.project;
      const isDeptMatch = !opts.department || empDept === opts.department;

      let isCompanyMatch = true;
      if (opts.company) {
        if (opts.company === 'Other') {
          isCompanyMatch = !empComp;
        } else {
          isCompanyMatch = empComp.toLowerCase() === opts.company.toLowerCase();
        }
      }

      const isAbsenceMatch = opts.absentOnly ? !emp.isPresent : true;
      return isProjectMatch && isDeptMatch && isCompanyMatch && isAbsenceMatch;
    });
  };

  const drilldownEmployees = drilldown ? getDrilldownEmployees(drilldown) : [];

  const handleHeaderPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !tableScrollRef.current) return;

    const target = event.target as HTMLElement;

    // Ignore events that bubble through React portals from outside the header DOM tree
    if (!event.currentTarget.contains(target)) {
      return;
    }

    if (target.closest('button, input, a, [role="button"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')) {
      return;
    }

    headerDragRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: tableScrollRef.current.scrollLeft,
    };
    setIsHeaderDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, []);

  const handleHeaderPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!headerDragRef.current.isDragging || !tableScrollRef.current) return;
    const deltaX = event.clientX - headerDragRef.current.startX;
    tableScrollRef.current.scrollLeft = headerDragRef.current.startScrollLeft - deltaX;
  }, []);

  const handleHeaderPointerUp = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!headerDragRef.current.isDragging) return;
    headerDragRef.current.isDragging = false;
    setIsHeaderDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 w-full h-full">
      {/* Responsive scrollable table container */}
      <div ref={tableScrollRef} className="flex-1 overflow-auto min-h-0 w-full relative">
        <table className="w-full border-separate border-spacing-0 text-left text-xs text-gray-600 min-w-[700px]">
          <thead
            className="sticky top-0 z-30 bg-slate-100"
            style={{ cursor: isHeaderDragging ? 'grabbing' : 'grab', userSelect: isHeaderDragging ? 'none' : 'auto' }}
            onPointerDown={handleHeaderPointerDown}
            onPointerMove={handleHeaderPointerMove}
            onPointerUp={handleHeaderPointerUp}
            onPointerCancel={handleHeaderPointerUp}
          >
            <tr>
              {/* Sticky header for first column */}
              <th
                className="sticky left-0 top-0 z-40 bg-slate-100 px-4 py-3 font-semibold text-gray-700 border-r border-b border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                style={{ minWidth: '220px', textAlign: "left" }}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <span>Project & Department</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-slate-200 rounded-md text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center">
                        <Filter className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 rounded-lg p-1.5 shadow-md z-50">
                      {['CIVIL', 'MED', 'LSD', 'STAFF'].map((dept) => {
                        const isChecked = selectedDepts.includes(dept);
                        return (
                          <DropdownMenuCheckboxItem
                            key={dept}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDepts(prev => [...prev, dept]);
                              } else {
                                setSelectedDepts(prev => prev.filter(d => d !== dept));
                              }
                            }}
                            onSelect={(e) => e.preventDefault()}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer select-none"
                          >
                            {dept}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 font-semibold text-gray-700 text-center border-r border-b border-gray-200">
                  {col}
                </th>
              ))}
              {/* Sticky header for rightmost Total column */}
              <th
                className="sticky right-0 top-0 z-40 bg-slate-100 px-4 py-3 font-semibold text-gray-700 text-center border-l border-b border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row, rIdx) => {
              if (row.type === 'project') {
                const rowStats = getRowStats(row.project);
                return (
                  <tr key={`proj-${row.project}-${rIdx}`} className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors font-medium">
                    {/* Sticky project name column */}
                    <td
                      className="sticky left-0 bg-slate-50 hover:bg-slate-100/80 z-20 px-4 py-2.5 border-r border-b border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] font-bold text-gray-900"
                    >
                      {row.project}
                    </td>

                    {/* Column cells for project totals */}
                    {columns.map((col) => {
                      const cell = getCellStats(row.project, col);
                      if (cell.total === 0) {
                        return (
                          <td key={col} className="px-4 py-2.5 text-center border-r border-b border-gray-100 text-gray-300">
                            —
                          </td>
                        );
                      }
                      return (
                        <td
                          key={col}
                          onClick={() => setDrilldown({
                            title: `${row.project} — ${col}`,
                            project: row.project,
                            company: col
                          })}
                          className="px-4 py-2.5 text-center border-r border-b border-gray-100 cursor-pointer hover:bg-teal-50/50 transition-colors"
                        >
                          <div className="inline-flex items-center gap-1 font-semibold">
                            <span className="text-teal-700">{cell.present}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-700">{cell.total}</span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Sticky Project Total cell — clickable */}
                    <td
                      onClick={() => setDrilldown({ title: row.project, project: row.project })}
                      className="sticky right-0 bg-slate-100 hover:bg-teal-50 z-20 px-4 py-2.5 text-center border-l border-b border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] font-bold text-teal-800 cursor-pointer transition-colors"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>{rowStats.present}</span>
                        <span className="text-gray-400">/</span>
                        <span>{rowStats.total}</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Department Row
              const rowStats = getRowStats(row.project, row.department);
              return (
                <tr key={`dept-${row.project}-${row.department}-${rIdx}`} className="hover:bg-slate-50/50 transition-colors">
                  {/* Sticky department column (indented) */}
                  <td
                    className="sticky left-0 bg-white hover:bg-slate-50/80 z-20 px-4 py-2 pl-8 border-r border-b border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] font-medium text-gray-500"
                  >
                    {row.department}
                  </td>

                  {/* Column cells */}
                  {columns.map((col) => {
                    const cell = getCellStats(row.project, col, row.department);
                    if (cell.total === 0) {
                      return (
                        <td key={col} className="px-4 py-2 text-center border-r border-b border-gray-100 text-gray-300">
                          —
                        </td>
                      );
                    }
                    const isAllPresent = cell.present === cell.total;
                    const isNonePresent = cell.present === 0;
                    return (
                      <td
                        key={col}
                        onClick={() => setDrilldown({
                          title: `${row.project} — ${row.department} — ${col}`,
                          project: row.project,
                          department: row.department,
                          company: col
                        })}
                        className="px-4 py-2 text-center border-r border-b border-gray-100 cursor-pointer hover:bg-teal-50/50 transition-colors"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span className={`font-semibold ${isAllPresent ? 'text-emerald-600' : isNonePresent ? 'text-rose-600' : 'text-amber-600'}`}>
                            {cell.present}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="font-medium text-gray-500">{cell.total}</span>
                        </div>
                      </td>
                    );
                  })}

                  {/* Sticky Row Total cell — clickable */}
                  <td
                    onClick={() => setDrilldown({
                      title: `${row.project} — ${row.department}`,
                      project: row.project,
                      department: row.department
                    })}
                    className="sticky right-0 bg-slate-50 hover:bg-teal-50 z-20 px-4 py-2 text-center border-l border-b border-gray-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] text-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="inline-flex items-center gap-1 font-semibold">
                      <span className={rowStats.present === rowStats.total ? 'text-emerald-700' : 'text-gray-700'}>
                        {rowStats.present}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span>{rowStats.total}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Sticky footer for totals */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-100">
            {/* Absent Employees Row */}
            <tr className="bg-slate-50 hover:bg-slate-50 transition-colors">
              <td
                className="sticky left-0 bg-slate-50 z-40 px-4 py-2.5 font-bold text-gray-800 border-r border-b border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-t border-gray-300"
              >
                Absent
              </td>
              {columns.map((col, idx) => {
                const total = colTotals[idx];
                if (total.total === 0) {
                  return (
                    <td key={col} className="px-4 py-2.5 text-center font-bold text-gray-400 border-r border-b border-gray-200 border-t border-gray-300">
                      —
                    </td>
                  );
                }
                return (
                  <td
                    key={col}
                    onClick={() => setDrilldown({ title: `${col} — Absent`, company: col, absentOnly: true })}
                    className={`px-4 py-2.5 text-center font-bold border-r border-b border-gray-200 border-t border-gray-300 cursor-pointer hover:bg-rose-50/40 transition-colors ${total.absent > 0 ? 'text-rose-600 bg-rose-50/20' : 'text-gray-500'}`}
                  >
                    {total.absent}
                  </td>
                );
              })}
              {/* Sticky Grand Absent cell */}
              <td
                onClick={() => setDrilldown({ title: 'Absent Employees', absentOnly: true })}
                className={`sticky right-0 bg-slate-50 z-40 px-4 py-2.5 text-center font-extrabold border-l border-b border-gray-200 border-t border-gray-300 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-rose-50/50 transition-colors ${grandTotal.absent > 0 ? 'text-rose-700' : 'text-gray-700'}`}
              >
                {grandTotal.absent}
              </td>
            </tr>

            {/* Total Employees Row */}
            <tr className="bg-slate-100 hover:bg-slate-100 transition-colors">
              <td
                className="sticky left-0 bg-slate-100 z-40 px-4 py-2.5 font-bold text-gray-800 border-r border-b border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
              >
                Total Employees
              </td>
              {columns.map((col, idx) => {
                const total = colTotals[idx];
                if (total.total === 0) {
                  return (
                    <td key={col} className="px-4 py-2.5 text-center font-bold text-gray-400 border-r border-b border-gray-200">
                      —
                    </td>
                  );
                }
                return (
                  <td
                    key={col}
                    onClick={() => setDrilldown({ title: col, company: col })}
                    className="px-4 py-2.5 text-center border-r border-b border-gray-200 cursor-pointer hover:bg-teal-50/50 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center gap-1 font-bold">
                      <span className="text-teal-700">{total.present}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-700">{total.total}</span>
                    </div>
                  </td>
                );
              })}
              {/* Sticky Grand Total cell */}
              <td
                onClick={() => setDrilldown({ title: 'Total Employees' })}
                className="sticky right-0 bg-slate-100 z-40 px-4 py-2.5 text-center font-extrabold text-teal-800 border-l border-b border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-teal-50/50 transition-colors"
              >
                {grandTotal.present}/{grandTotal.total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Drilldown Modal */}
      {drilldown && (
        <ResponsiveModal
          open={!!drilldown}
          onOpenChange={(open) => { if (!open) setDrilldown(null); }}
          title={drilldown.title}
          description={`${drilldownEmployees.length} employee(s) · ${drilldownEmployees.filter(e => e.isPresent).length} present · ${drilldownEmployees.filter(e => !e.isPresent).length} absent`}
          contentStyle={{ maxWidth: '560px', maxHeight: '80vh' }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
            {drilldownEmployees.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No employees found.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {drilldownEmployees
                  .slice()
                  .sort((a, b) => (a.isPresent === b.isPresent ? 0 : a.isPresent ? -1 : 1))
                  .map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 py-2.5">
                      {/* Presence indicator */}
                      {emp.isPresent ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 capitalize truncate">{emp.name.toLowerCase()}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {[emp.department, emp.designation].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {emp.company && (
                          <div className="text-xs text-gray-500 font-medium">{emp.company}</div>
                        )}
                        <div className="text-xs text-gray-400">{emp.emp_id ?? emp.device_user_id}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </ResponsiveModal>
      )}
    </div>
  );
}
