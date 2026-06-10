import { useState } from 'react';
import { Avatar } from './Avatar';
import type { Punch, Employee } from '../types/attendance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime, VERIFY_LABELS, PUNCH_TYPE_LABELS } from '../lib/utilis';

interface PunchLogProps {
  punches: Punch[];
  employees: Employee[];
}

export function PunchLog({ punches, employees }: PunchLogProps) {
  const [search, setSearch] = useState('');
  const [punchTypeFilter, setPunchTypeFilter] = useState<'all' | 0 | 1>('all'); // 0 for Check-in, 1 for Check-out

  const empMap = Object.fromEntries(employees.map((e) => [e.device_user_id, e]));
  const empIndex = Object.fromEntries(employees.map((e, i) => [e.device_user_id, i]));

  const filtered = punches.filter((p) => {
    const emp = empMap[p.user_id];
    const name = emp?.name ?? p.user_id; // Fallback to user_id if name is not available

    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesPunchType = punchTypeFilter === 'all' || p.punch_type === punchTypeFilter;

    return matchesSearch && matchesPunchType;
  });

  return (
    <div>
      <div style={{}} className="flex items-center gap-5 px-2 py-3 border-b border-gray-100">
        <i className="ti ti-search text-gray-400 text-base" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search employee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
            <i className="ti ti-x text-sm" aria-hidden="true" />
          </button>
        )}

        <Select value={punchTypeFilter.toString()} onValueChange={(value) => setPunchTypeFilter(value === 'all' ? 'all' : parseInt(value) as 0 | 1)}>
          <SelectTrigger className="w-[150px] h-9 text-sm bg-gray-50 border-gray-100 rounded-lg focus:ring-offset-0 focus:ring-gray-200">
            <SelectValue placeholder="Punch Type" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-gray-100 shadow-xl">
            <SelectItem value="all" className="rounded-md focus:bg-gray-50">
              All Types
            </SelectItem>
            <SelectItem value="0" className="rounded-md focus:bg-gray-50">
              Check-in
            </SelectItem>
            <SelectItem value="1" className="rounded-md focus:bg-gray-50">
              Check-out
            </SelectItem>
          </SelectContent>
        </Select>

      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {search ? 'No results found.' : 'No punches recorded for this date.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Verify</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((punch) => {
                const emp = empMap[punch.user_id];
                const name = emp?.name ?? punch.user_id;
                const idx = empIndex[punch.user_id] ?? 0;
                const isIn = punch.punch_type === 0;

                return (
                  <tr key={punch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5" style={{display:"flex", justifyContent:"flex-start", alignItems:"center"}}>
                        <Avatar size={"md"} name={name} index={idx} />
                        <span className="font-medium text-gray-900">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">
                      {formatTime(punch.punch_time)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isIn
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        <i
                          className={`ti ${isIn ? 'ti-login' : 'ti-logout'} text-[11px]`}
                          aria-hidden="true"
                        />
                        {PUNCH_TYPE_LABELS[punch.punch_type] ?? punch.punch_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      
                      {VERIFY_LABELS[punch.verify_type] ?? punch.verify_type}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {punch.device_serial ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
