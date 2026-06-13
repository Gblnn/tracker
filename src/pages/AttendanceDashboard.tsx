import Back from '@/components/back';
import { DatePicker } from '@/components/date-picker';
import Directive from '@/components/directive';
import RefreshButton from '@/components/refresh-button';
import { Laptop2, LayoutGrid, List, Loader2, Sidebar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [navVisible, setNavVisible] = useState(true);

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
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginLeft: "0.25rem" }}>
            <h1>Attendance</h1>
            <p style={{ fontSize: "0.8rem", color: "green", background: "rgba(0 255 0/ 0.1)", padding: "0.05rem 0.5rem", borderRadius: "0.5rem", fontWeight: 500 }}>LIVE</p>
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
        }}
      >
        {/* LEFT NAV */}
        <AnimatePresence initial={false}>
          {navVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0, x: -20, paddingLeft: 0, paddingRight: 0, marginRight: 0, borderWidth: 0 }}
              animate={{ width: "25ch", opacity: 1, x: 0, paddingLeft: "0.5rem", paddingRight: "0.5rem", marginRight: "0.75rem", borderWidth: 1 }}
              exit={{ width: 0, opacity: 0, x: -20, paddingLeft: 0, paddingRight: 0, marginRight: 0, borderWidth: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              style={{
                borderStyle: "solid",
                borderColor: "rgba(100 100 100 / 0.1)",
                borderRadius: "0.5rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                flexShrink: 0,
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <Directive height='3rem' titleSize="0.9rem" onClick={() => setTab('summary')} title="Summary" icon={<LayoutGrid color="darkblue" size={16} />} />
                <Directive height='3rem' titleSize="0.9rem" onClick={() => setTab('log')} title="Punch Log" icon={<List color="darkblue" size={16} />} />
                <Directive height='3rem' titleSize="0.9rem" onClick={() => setTab('reports')} title="Reports" icon={<TrendingUp color="darkblue" size={16} />} />
                <Directive height='3rem' titleSize="0.9rem" onClick={() => setTab('devices')} title="Devices" icon={<Laptop2 color="darkblue" size={16} />} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>


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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "", padding: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "0.25rem" }}>
              <button style={{ background: "rgba(100 100 100/ 0.05)" }} onClick={() => setNavVisible(v => !v)}>
                <Sidebar color="darkblue" size={14} />
              </button>

              <h3 style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginLeft: "", fontSize: "1.25rem", fontWeight: 500 }}>
                {/* {viewOptions.find(opt => opt.value === tab)?.icon} */}
                {activeViewLabel}
              </h3>
            </div>


            {
              tab === 'summary' || tab === 'log' ? (
                <DatePicker value={date} onChange={setDate} />
              ) : null
            }

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