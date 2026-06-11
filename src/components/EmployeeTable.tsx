import { useState, useMemo } from 'react';
import { Avatar } from './Avatar';
import type { EmployeeSummary } from '../types/attendance';
import { formatTime } from '../lib/utilis';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from 'lucide-react';

interface EmployeeTableProps {
  summaries: EmployeeSummary[];
}

export function EmployeeTable({ summaries }: EmployeeTableProps) {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

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

  
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No employees found. Add employees to Supabase first.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto overflow-hidden" style={{border:"", width:"100%"}}>
      {/* Toolbar: Search and Location Filter */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-20" style={{border:'', width:"100%"}}>
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
          <SelectTrigger className="w-[160px] h-10 bg-gray-50 border-none rounded-xl text-xs font-medium focus:ring-1 focus:ring-gray-200">
            <SelectValue placeholder="All Locations" />
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
      <div className="overflow-auto flex-1" style={{border:"", width:"100%"}}>
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
                <div className="flex gap-2.5" style={{border:'', display:"flex", justifyContent:"flex-start", alignItems:"center"}}>
                  <Avatar size={"md"} name={emp.name} index={idx} />
                  <div style={{display:"flex", flexFlow:"column"}}>
                    <div className="font-medium text-gray-900" style={{textAlign: "left"}}>{emp.name}</div>
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
