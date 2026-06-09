import { Avatar } from './Avatar';
import type { EmployeeSummary } from '../types/attendance';
import { formatTime } from '../lib/utilis';

interface EmployeeTableProps {
  summaries: EmployeeSummary[];
}

export function EmployeeTable({ summaries }: EmployeeTableProps) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No employees found. Add employees to Supabase first.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Employee</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Department</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">First in</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Last out</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {summaries.map((emp, idx) => (
            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex gap-2.5" style={{border:'', display:"flex", justifyContent:"flex-start", alignItems:"center"}}>
                  <Avatar name={emp.name} index={idx} />
                  <div>
                    <div className="font-medium text-gray-900" style={{textAlign: "left"}}>{emp.name}</div>
                    {emp.emp_id && (
                      <div className="text-xs text-gray-400">{emp.emp_id}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500">{emp.department ?? '—'}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
