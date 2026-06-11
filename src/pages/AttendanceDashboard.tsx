import Back from '@/components/back';
import { DatePicker } from '@/components/date-picker';
import Directive from '@/components/directive';
import RefreshButton from '@/components/refresh-button';
import { Laptop2, LayoutGrid, List, Loader2, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { PunchLog } from '../components/PunchLog';
import { StatCard } from '../components/StatCard';
import { useAttendance } from '../lib/useAttendance';
import { todayISO } from '../lib/utilis';
import DevicesMaster from './DevicesMaster';
import ReportsPage from './ReportsPage';

type Tab = 'summary' | 'log' | 'reports' | 'devices';

export default function AttendanceDashboard() {
  const [date, setDate] = useState<string>(todayISO());
  const [tab, setTab] = useState<Tab>('summary');

  const { punches, employees, employeeSummaries, stats, loading } = useAttendance(date);

  const viewOptions = [
    { value: 'summary', label: 'Summary', icon: <LayoutGrid color="darkblue" className="w-4 h-4" /> },
    { value: 'log', label: 'Punch Log', icon: <List color="darkblue" className="w-4 h-4" /> },
    { value: 'reports', label: 'Reports', icon: <TrendingUp color="darkblue" className="w-4 h-4" /> },
    { value: 'devices', label: 'Devices', icon: <Laptop2 color="darkblue" className="w-4 h-4" /> },
  ];

  const activeViewLabel = useMemo(() => viewOptions.find(opt => opt.value === tab)?.label, [tab]);

  return (
    <div style={{height:"100svh", border:"", display:"flex", flexFlow:"column"}}>
      <Back
      fixed 
      
      // customTitle={
      //   <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:"0.5rem"}}>
      //    <h1 className="text-xl font-semibold text-gray-900">Attendance</h1>
      //    <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
      //     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      //     Live
      //    </span>
      // {/* <button style={{fontSize:"0.8rem", padding:"0.15rem 0.5rem"}} onClick={() => setShowStats(!showStats)}>Stats</button> */}
      // </div>
      // }
      extra={<RefreshButton/>}
      />
      <div id='content-body' style={{display:"flex", border:'1px solid rgba(100 100 100/ 0.1)',borderRadius:"1rem", height:"100%", flexFlow:"", margin:"1rem", marginTop:"5rem", padding:"0.5rem", gap:"0.75rem", width:""}}>

      <div style={{border:"1px solid rgba(100 100 100/ 0.1)", borderRadius:"0.5rem", width:"25ch", padding:"0.5rem"}}>

      <div style={{display:"flex", flexFlow:"column", gap:"0.25rem"}}>

        <Directive titleSize='0.9rem' onClick={() => setTab('summary')} title={"Summary"} icon={<LayoutGrid color='darkblue' size={16} />} />

        <Directive titleSize='0.9rem' onClick={() => setTab('log')} title={"Punch Log"} icon={<List color='darkblue' size={16} />} />

        <Directive titleSize='0.9rem' onClick={() => setTab('reports')} title={"Reports"} icon={<TrendingUp color="darkblue" size={16} />} />

        

        <Directive titleSize='0.9rem' onClick={() => setTab('devices')} title={"Devices"} icon={<Laptop2 color="darkblue" size={16} />} />

      </div>

        

      </div>

      <div style={{display:"flex" , flexFlow:"column", gap:"0.5rem", flex:1}}>
        <div className="" style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:"1rem", padding:"0rem 0.5rem", border:''}}>  
           
          <h2 style={{display:"flex", gap:"0.5rem", alignItems:"center", border:""}} className="">
            {viewOptions.find(opt => opt.value === tab)?.icon}
            {activeViewLabel}
          </h2>

            <DatePicker value={date} onChange={setDate} />
      </div>

      {tab==="summary" && (
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 " style={{marginBottom:"0.5rem"}}>
           <StatCard label="Total" value={loading?<Loader2 className="animate-spin" />:stats.total?stats.total:0} icon="ti-users" />
           <StatCard
             label="Present today"
             value={loading?<Loader2 className="animate-spin" />:stats.present?stats.present:0}
             // sub={`${attendancePct}% attendance`}
             icon="ti-circle-check"
           />
           <StatCard label="Absent Today" value={loading?<Loader2 className="animate-spin" />:stats.absent?stats.absent:0} icon="ti-circle-x" />
           
         </div>
         )}
         {
          tab==="log" &&
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 " style={{marginBottom:"0.5rem"}}>
          <StatCard label="Check-ins" value={loading?<Loader2 className="animate-spin" />:stats.checkIns?stats.checkIns:0} icon="ti-login" />
           <StatCard label="Check-outs" value={loading?<Loader2 className="animate-spin" />:stats.checkOuts?stats.checkOuts:0} icon="ti-logout" />
           </div>
         }

      

      
      <div className="border border-gray-100 rounded-2xl overflow-y-auto shadow-sm" style={{display:"flex", flexFlow:'column', flex:1, maxHeight:"70vh" }}>
           {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
              <i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true" />
              Loading…
            </div>
          ) : tab === 'summary' ? (
            <>
            
            <EmployeeTable summaries={employeeSummaries} />
            </>
          ) : tab === 'log' ? (
            <PunchLog punches={punches} employees={employees} />
          ) : 
          tab === 'devices' ? (
            <DevicesMaster/>
          ) :
          
          tab === 'reports' ? (
            <ReportsPage />
          ) : (
            <PunchLog punches={punches} employees={employees} />
          )}
      </div>
      </div>
      


    </div>

  </div>
  
    // <div className="min-h-screen bg-white">
    //   <Back blurBG fixed customTitle={
    //     <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:"0.5rem"}}>
    //     <h1 className="text-xl font-semibold text-gray-900">Attendance</h1>
    //   <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
    //     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
    //     Live
    //   </span>
    //   <button style={{fontSize:"0.8rem", padding:"0.15rem 0.5rem"}} onClick={() => setShowStats(!showStats)}>Stats</button>
    //   </div>
    //   } />
    //   <div className="mx-auto px-4 sm:px-6 py-8">

    //     {/* Header */}
    //     <div className="" style={{ marginTop: "3.5rem" }}>
    //       
    //     </div>

    //     {/* Error */}
    //     {error && (
    //       <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
    //         <i className="ti ti-alert-circle" aria-hidden="true" />
    //         {error}
    //       </div>
    //     )}

    //     {/* Stats */}
    //     {showStats && (
    //     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
    //       <StatCard label="Total employees" value={stats.total || <Loader2 className="animate-spin" />} icon="ti-users" />
    //       <StatCard
    //         label="Present today"
    //         value={stats.present || <Loader2 className="animate-spin" />}
    //         // sub={`${attendancePct}% attendance`}
    //         icon="ti-circle-check"
    //       />
    //       <StatCard label="Check-ins" value={stats.checkIns || <Loader2 className="animate-spin" />} icon="ti-login" />
    //       <StatCard label="Check-outs" value={stats.checkOuts || <Loader2 className="animate-spin" />} icon="ti-logout" />
    //     </div>
    //     )}

    //     {/* Table card */}
    //     <div className="border border-gray-100 rounded-2xl overflow-x-auto shadow-sm" style={{ maxHeight: "65vh" }}>
    //       {loading ? (
    //         <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
    //           <i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true" />
    //           Loading…
    //         </div>
    //       ) : tab === 'summary' ? (
    //         <EmployeeTable summaries={employeeSummaries} />
    //       ) : tab === 'log' ? (
    //         <PunchLog punches={punches} employees={employees} />
    //       ) : 
    //       tab === 'devices' ? (
    //         <DevicesMaster/>
    //       ) : (
    //         <PunchLog punches={punches} employees={employees} />
    //       )}
    //     </div>

    //     <p className="text-center text-xs text-gray-300 mt-6">
    //       Updates in real time · All times in Asia/Muscat (GMT+4)
    //     </p>
    //   </div>
    // </div>
  );
}
