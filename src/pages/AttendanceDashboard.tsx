import Back from '@/components/back';
import { DatePicker } from '@/components/date-picker';
import Directive from '@/components/directive';
import RefreshButton from '@/components/refresh-button';
import { Laptop2, LayoutGrid, List, Loader2, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { PunchLog } from '../components/PunchLog';
import { useAttendance } from '../lib/useAttendance';
import { todayISO } from '../lib/utilis';
import DevicesMaster from './DevicesMaster';
import ReportsPage from './ReportsPage';

type Tab = 'summary' | 'log' | 'reports' | 'devices';

export default function AttendanceDashboard() {
  const [date, setDate] = useState<string>(todayISO());
  const [tab, setTab] = useState<Tab>('summary');

  const { punches, employees, employeeSummaries, loading } = useAttendance(date);

  const viewOptions = [
    { value: 'summary', label: 'Summary', icon: <LayoutGrid color="darkblue" className="w-4 h-4" /> },
    { value: 'log', label: 'Punch Log', icon: <List color="darkblue" className="w-4 h-4" /> },
    { value: 'reports', label: 'Reports', icon: <TrendingUp color="darkblue" className="w-4 h-4" /> },
    { value: 'devices', label: 'Devices', icon: <Laptop2 color="darkblue" className="w-4 h-4" /> },
  ];

  const activeViewLabel = useMemo(
    () => viewOptions.find(opt => opt.value === tab)?.label,
    [tab]
  );

  return (
    <div style={{ height: "100svh", display: "flex", flexDirection: "column" }}>
      <Back
      customTitle={
        <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
        <h1>Attendance</h1>
        <p style={{fontSize:"0.8rem", color:"green", background:"rgba(0 255 0/ 0.1)", padding:"0.05rem 0.5rem", borderRadius:"0.5rem", fontWeight:500}}>LIVE</p>
        </div>
      } 
      fixed 
      extra={<RefreshButton />} />

      {/* ✅ CRITICAL FIX: minWidth + overflow hidden */}
      <div
        id="content-body"
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          border: "1px solid rgba(100 100 100 / 0.1)",
          borderRadius: "1rem",
          margin: "1rem",
          marginTop: "5rem",
          padding: "0.5rem",
          gap: "0.75rem",
        }}
      >
        {/* LEFT NAV */}
        <div
          style={{
            border: "1px solid rgba(100 100 100 / 0.1)",
            borderRadius: "0.5rem",
            width: "25ch",
            padding: "0.5rem",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <Directive titleSize="0.9rem" onClick={() => setTab('summary')} title="Summary" icon={<LayoutGrid color="darkblue" size={16} />} />
            <Directive titleSize="0.9rem" onClick={() => setTab('log')} title="Punch Log" icon={<List color="darkblue" size={16} />} />
            <Directive titleSize="0.9rem" onClick={() => setTab('reports')} title="Reports" icon={<TrendingUp color="darkblue" size={16} />} />
            <Directive titleSize="0.9rem" onClick={() => setTab('devices')} title="Devices" icon={<Laptop2 color="darkblue" size={16} />} />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0, // ✅ IMPORTANT
            gap: "0.5rem",
          }}
        >
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginLeft:"0.75rem", fontSize:"1.35rem" }}>
              {viewOptions.find(opt => opt.value === tab)?.icon}
              {activeViewLabel}
            </h2>

            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* CONTENT */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              border: "1px solid rgba(100 100 100 / 0.1)",
              borderRadius: "0.75rem",
              overflow: "hidden",
              display: "flex",
              
            }}
          >
            {loading ? (
              <div style={{ margin: "auto" }}>
                <Loader2 className="animate-spin" />
              </div>
            ) : tab === 'summary' ? (
              <EmployeeTable summaries={employeeSummaries} />
            ) : tab === 'log' ? (
              <PunchLog punches={punches} employees={employees} />
            ) : tab === 'devices' ? (
              <DevicesMaster />
            ) : (
              <ReportsPage />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}