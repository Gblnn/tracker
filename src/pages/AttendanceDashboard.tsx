import Back from '@/components/back';
import { DatePicker } from '@/components/date-picker';
import Directive from '@/components/directive';
import RefreshButton from '@/components/refresh-button';
import { AnimatePresence, motion } from 'framer-motion';
import { Database, Gauge, Laptop2, LayoutGrid, List, Loader2, Sidebar, Terminal as TerminalIcon, TrendingUp, UserCog, UserPlus, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { PunchLog } from '../components/PunchLog';
import { useAttendance } from '../lib/useAttendance';
import { todayISO } from '../lib/utilis';
import AddEmployee from './AddEmployee';
import DevicesMaster from './DevicesMaster';
import ReportsPage from './ReportsPage';
import EmployeeManage from './employee-manage';
import Terminal from './Terminal';
import DataManagement from './DataManagement';
import { useAuth } from '@/components/AuthProvider';

type Tab = 'summary' | 'log' | 'reports' | 'devices' | 'add' | 'manage' | 'terminal' | 'data-management';

export default function AttendanceDashboard() {
  const [date, setDate] = useState<string>(todayISO());
  const [tab, setTab] = useState<Tab>('summary');

  const { punches, employees, employeeSummaries, loading, refetch } = useAttendance(date);
  const [navVisible, setNavVisible] = useState(true);
  const { userData } = useAuth();

  const canEditAttendance = useMemo(() => {
    try {
      const permissions = JSON.parse(userData?.clearance || "{}") as Record<string, boolean>;
      const hasStructuredClearance = Object.keys(permissions).length > 0;
      const hasAttendanceModule = permissions.attendance === true;
      const hasAttendanceEdit = permissions.attendance_edit === true;
      const hasExplicitEditBlock = permissions.attendance_edit === false;

      if (hasAttendanceModule) {
        return hasAttendanceEdit;
      }

      if (permissions.attendance === false || hasExplicitEditBlock) {
        return false;
      }

      if (userData?.role === "admin" || userData?.role === "site_admin") {
        return !hasStructuredClearance;
      }

      return false;
    } catch {
      return userData?.role === "admin" || userData?.role === "site_admin";
    }
  }, [userData]);

  useEffect(() => {
    if (!canEditAttendance && tab === 'manage') {
      setTab('summary');
    }
  }, [canEditAttendance, tab]);

  const viewOptions = useMemo(() => {
    const options = [
      { value: 'summary', label: 'Dashboard', icon: <LayoutGrid color="darkblue" className="w-4 h-4" /> },
      { value: 'manage', label: 'Manage', icon: <UserPlus color="darkblue" className="w-4 h-4" /> },
      { value: 'log', label: 'Punch Log', icon: <List color="darkblue" className="w-4 h-4" /> },
      { value: 'reports', label: 'Reports', icon: <TrendingUp color="darkblue" className="w-4 h-4" /> },
      { value: 'devices', label: 'Devices', icon: <Laptop2 color="darkblue" className="w-4 h-4" /> },
      { value: 'terminal', label: 'Terminal', icon: <TerminalIcon color="darkblue" className="w-4 h-4" /> },
      { value: 'data-management', label: 'Data Management', icon: <Database color="darkblue" className="w-4 h-4" /> },
    ];
    if (!canEditAttendance) {
      return options.filter(opt => opt.value !== 'manage');
    }
    return options;
  }, [canEditAttendance]);

  const activeViewLabel = useMemo(
    () => viewOptions.find(opt => opt.value === tab)?.label,
    [tab, viewOptions]
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

                <Directive bg={tab === 'summary' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('summary')} title="Dashboard" icon={<Gauge size={16} />} />

                {canEditAttendance && (
                  <Directive bg={tab === 'manage' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('manage')} title="Manage" icon={<UserCog size={16} />} />
                )}

                {/* <Directive bg={tab === 'add' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize='0.9rem' onClick={() => { setTab('add') }} title={"Add Employee"} icon={<UserPlus size={16} />} /> */}

                <Directive bg={tab === 'log' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('log')} title="Punch Log" icon={<List size={16} />} />

                <Directive bg={tab === 'reports' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('reports')} title="Reports" icon={<TrendingUp size={16} />} />

                <Directive bg={tab === 'devices' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('devices')} title="Devices" icon={<Laptop2 size={16} />} />

                <Directive bg={tab === 'terminal' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('terminal')} title="Terminal" icon={<TerminalIcon size={16} />} />

                <Directive bg={tab === 'data-management' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('data-management')} title="Data Management" icon={<Zap size={16} />} />
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
                <Sidebar size={14} />
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
              flexFlow: "column",
            }}
          >
            {/* Stat Card */}


            {/* Stat Card */}
            {
              tab === "log" ? (
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "0.75rem", gap: "0.75rem", }}>

                  <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.5rem", justifyContent: "center", flexFlow: "column", alignItems: "center", height: "6rem" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 400, color: "grey" }}>Check Ins</p>
                    <h1 style={{ fontWeight: 600, fontSize: "2rem" }}>{punches.filter((p) => p.punch_type === 0).length}</h1>
                  </div>

                  <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.5rem", justifyContent: "center", flexFlow: "column", alignItems: "center", height: "6rem" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 400, color: "grey" }}>Check Outs</p>
                    <h1 style={{ fontWeight: 600, fontSize: "2rem" }}>{punches.filter((p) => p.punch_type === 1).length}</h1>
                  </div>

                  {/* <div style={{ display: "flex", flex: 1, background: "rgba(100 100 100/ 0.05)", borderRadius: "0.5rem", padding: "0.5rem", justifyContent: "center", flexFlow: "column", alignItems: "center" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 400, color: "grey" }}>Total</p>
                    <h1 style={{ fontWeight: 600, fontSize: "2rem" }}>{punches.length}</h1>
                  </div> */}
                </div>)
                : null
            }

            {loading ? (
              <div style={{ margin: "auto" }}>
                <Loader2 className="animate-spin" />
              </div>
            ) : tab === 'summary' ? (
              <EmployeeTable summaries={employeeSummaries} date={date} />
            ) : tab === 'log' ? (
              <PunchLog punches={punches} employees={employees} onEmployeeAdded={refetch} />
            ) : tab === 'devices' ? (
              <DevicesMaster />
            ) : tab === 'terminal' ? (
              <Terminal />
            ) : tab === 'data-management' ? (
              <DataManagement />
            ) :
              tab === 'add' ? (
                <AddEmployee />
              )
                :
                tab === 'manage' ? (
                  <EmployeeManage />
                ) :
                  (
                    <ReportsPage />
                  )}
          </div>
        </div>
      </div>
    </div>
  );
}