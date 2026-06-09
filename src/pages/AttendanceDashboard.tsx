import { useState } from 'react';
import { StatCard } from '../components/StatCard';
import { EmployeeTable } from '../components/EmployeeTable';
import { PunchLog } from '../components/PunchLog';
import { useAttendance } from '../lib/useAttendance';
import { todayISO } from '../lib/utilis';
import Back from '@/components/back';
import { Loader2 } from 'lucide-react';

type Tab = 'summary' | 'log';

export default function AttendanceDashboard() {
  const [date, setDate] = useState<string>(todayISO());
  const [tab, setTab] = useState<Tab>('summary');

  const { punches, employees, employeeSummaries, stats, loading, error } = useAttendance(date);

  // const attendancePct =
  //   stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      <Back fixed  extra={
        <div>
          
        </div>
        
      }/>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4" style={{border:"", marginTop:"3rem"}}>
          <div style={{width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div className="flex items-center gap-2.5 mb-1" style={{border:"", width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:"0.5rem"}}>
                <h1 className="text-xl font-semibold text-gray-900">Attendance</h1>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              </div>
              
              <input
          style={{border:"1px solid rgba(100 100 100/ 0.5)", width:"fit-content", textAlign:"center", padding:"0.25rem 0.5rem", borderRadius:"0.375rem"}}
          
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="outline-none bg-transparent text-sm text-gray-700 cursor-pointer"
            />
              
            </div>
            {/* <p className="text-sm text-gray-400">{formatDate(date)}</p> */}
            
          </div>

          {/* <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:border-gray-300 transition-colors">
            <i className="ti ti-calendar text-gray-400 text-base" aria-hidden="true" />
            
          </div> */}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total employees" value={stats.total || <Loader2 className="animate-spin" />} icon="ti-users" />
          <StatCard
            label="Present today"
            value={stats.present || <Loader2 className="animate-spin" />}
            // sub={`${attendancePct}% attendance`}
            icon="ti-circle-check"
          />
          <StatCard label="Check-ins" value={stats.checkIns || <Loader2 className="animate-spin" />} icon="ti-login" />
          <StatCard label="Check-outs" value={stats.checkOuts || <Loader2 className="animate-spin" />} icon="ti-logout" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          {(['summary', 'log'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'summary' ? 'Employee summary' : 'Punch log'}
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
              <i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true" />
              Loading…
            </div>
          ) : tab === 'summary' ? (
            <EmployeeTable summaries={employeeSummaries} />
          ) : (
            <PunchLog punches={punches} employees={employees} />
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Updates in real time · All times in Asia/Muscat (GMT+4)
        </p>
      </div>
    </div>
  );
}
