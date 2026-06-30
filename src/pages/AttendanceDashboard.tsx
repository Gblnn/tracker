import Back from '@/components/back';
import { DatePicker } from '@/components/date-picker';
import Directive from '@/components/directive';
import RefreshButton from '@/components/refresh-button';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightLeft, BarChart3, ChartLine, Database, Laptop2, LayoutGrid, List, Loader2, Sidebar, Terminal as TerminalIcon, TrendingUp, UserCog, UserPlus, Zap, FolderKanban, FileCheck, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { PunchLog } from '../components/PunchLog';
import { useAttendance } from '../lib/useAttendance';
import { todayISO } from '../lib/utilis';
import AddEmployee from './AddEmployee';
import DataManagement from './DataManagement';
import DevicesMaster from './DevicesMaster';
import EmployeeManage from './employee-manage';
import ReportsPage from './ReportsPage';
import Terminal from './Terminal';
import TransferRequests from './transfer-requests';
import ProjectsMaster from './ProjectsMaster';
import TimesheetFinalizer from './TimesheetFinalizer';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '../lib/supabase';

const ROW_SIZE_BYTES = 185;
const FREE_TIER_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

type Tab = 'summary' | 'log' | 'reports' | 'devices' | 'add' | 'manage' | 'terminal' | 'data-management' | 'analytics' | 'transfers' | 'projects' | 'finalize';

export default function AttendanceDashboard() {
  const [date, setDate] = useState<string>(todayISO());
  const [tab, setTab] = useState<Tab>('summary');

  const { punches, employees, employeeSummaries, loading, refetch, useFirstLast, setUseFirstLast } = useAttendance(date);
  const [navVisible, setNavVisible] = useState(true);
  const { userData } = useAuth();

  const [dbCount, setDbCount] = useState<number | null>(null);

  const fetchDbCount = () => {
    supabase
      .from('punch_details')
      .select('*', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (!error && count !== null) {
          setDbCount(count);
        }
      });
  };

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

  useEffect(() => {
    if (canEditAttendance) {
      fetchDbCount();
    }
  }, [canEditAttendance]);

  useEffect(() => {
    if (canEditAttendance && tab === 'data-management') {
      fetchDbCount();
    }
  }, [tab, canEditAttendance]);

  useEffect(() => {
    if (canEditAttendance && !loading) {
      fetchDbCount();
    }
  }, [loading, canEditAttendance]);

  const viewOptions = useMemo(() => {
    const options = [
      { value: 'summary', label: 'Dashboard', icon: <LayoutGrid color="darkblue" className="w-4 h-4" /> },
      { value: 'transfers', label: 'Transfers', icon: <ArrowRightLeft color="darkblue" className="w-4 h-4" /> },
      { value: 'analytics', label: 'Analytics', icon: <BarChart3 color="darkblue" className="w-4 h-4" /> },
      { value: 'manage', label: 'Manage', icon: <UserPlus color="darkblue" className="w-4 h-4" /> },
      { value: 'log', label: 'Punch Log', icon: <List color="darkblue" className="w-4 h-4" /> },
      { value: 'reports', label: 'Reports', icon: <TrendingUp color="darkblue" className="w-4 h-4" /> },
      { value: 'devices', label: 'Devices', icon: <Laptop2 color="darkblue" className="w-4 h-4" /> },
      { value: 'projects', label: 'Projects', icon: <FolderKanban color="darkblue" className="w-4 h-4" /> },
      { value: 'finalize', label: 'Finalize Timesheets', icon: <FileCheck color="darkblue" className="w-4 h-4" /> },
      { value: 'terminal', label: 'Terminal', icon: <TerminalIcon color="darkblue" className="w-4 h-4" /> },
      { value: 'data-management', label: 'Data Management', icon: <Database color="darkblue" className="w-4 h-4" /> },
    ];
    if (!canEditAttendance) {
      return options.filter(opt => opt.value !== 'manage' && opt.value !== 'finalize');
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
            {/* <p style={{ fontSize: "0.8rem", color: "green", background: "rgba(0 255 0/ 0.1)", padding: "0.05rem 0.5rem", borderRadius: "0.5rem", fontWeight: 500 }}>LIVE</p> */}
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
                whiteSpace: "nowrap",
                display: "flex",
                flexDirection: "column",
                height: "100%"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <Directive bg={tab === 'summary' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('summary')} title="Dashboard" icon={<ChartLine size={16} />} />

                  {/* <Directive bg={tab === 'transfers' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('transfers')} title="Transfers" icon={<ArrowRightLeft size={16} />} /> */}

                  {canEditAttendance && (
                    <Directive bg={tab === 'manage' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('manage')} title="Manage" icon={<UserCog size={16} />} />
                  )}

                  {/* <Directive bg={tab === 'add' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize='0.9rem' onClick={() => { setTab('add') }} title={"Add Employee"} icon={<UserPlus size={16} />} /> */}

                  <Directive bg={tab === 'log' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('log')} title="Punch Log" icon={<List size={16} />} />

                  <Directive bg={tab === 'reports' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('reports')} title="Reports" icon={<TrendingUp size={16} />} />

                  <Directive bg={tab === 'devices' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('devices')} title="Devices" icon={<Laptop2 size={16} />} />

                  {canEditAttendance && (
                    <Directive bg={tab === 'projects' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('projects')} title="Projects" icon={<FolderKanban size={16} />} />
                  )}



                  <Directive bg={tab === 'terminal' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('terminal')} title="Terminal" icon={<TerminalIcon size={16} />} />

                  {canEditAttendance && (
                    <Directive bg={tab === 'finalize' ? "rgba(100 100 100/ 0.05)" : "rgba(100 100 100/ 0)"} height='3rem' titleSize="0.9rem" onClick={() => setTab('finalize')} title="Finalize Timesheets" icon={<Check size={16} />} />
                  )}
                </div>

                {canEditAttendance && (
                  <div style={{ marginTop: "auto", width: "100%" }}>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTab('data-management')}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "0.75rem",
                        gap: "0.5rem",
                        background: tab === 'data-management' ? "#E0F2F1" : "rgba(246, 248, 252, 0.78)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderRadius: "0.5rem",

                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: tab === 'data-management' ? "0 2px 10px rgba(0, 150, 136, 0.08)" : "0 2px 10px rgba(15, 23, 42, 0.04)",
                      }}
                    >
                      {/* Top row: Icon & Title */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                          <Zap size={16} className={"text-teal-600"} />
                        </div>
                        <span
                          style={{
                            fontWeight: tab === 'data-management' ? 500 : 400,
                            fontSize: "0.85rem",
                            color: tab === 'data-management' ? "#004D40" : "#1F2937",
                            flex: 1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Usage
                        </span>
                        {dbCount === null && (
                          <Loader2 size={12} className="animate-spin text-gray-400" />
                        )}
                      </div>

                      {/* Middle row: Progress bar */}
                      {dbCount !== null && (
                        <div style={{ width: "100%", height: "5px", backgroundColor: tab === 'data-management' ? "#B2DFDB" : "#E5E7EB", borderRadius: "9999px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(100, (dbCount * ROW_SIZE_BYTES / FREE_TIER_QUOTA_BYTES) * 100)}%`,
                              height: "100%",
                              background: ((dbCount * ROW_SIZE_BYTES / FREE_TIER_QUOTA_BYTES) * 100) > 85
                                ? "linear-gradient(to right, #EF4444, #F43F5E)"
                                : ((dbCount * ROW_SIZE_BYTES / FREE_TIER_QUOTA_BYTES) * 100) > 50
                                  ? "linear-gradient(to right, #F59E0B, #F97316)"
                                  : "linear-gradient(to right, #10B981, #14B8A6)",
                              borderRadius: "9999px",
                              transition: "width 0.5s ease-out"
                            }}
                          />
                        </div>
                      )}

                      {/* Bottom row: Usage labels */}
                      {dbCount !== null && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: tab === 'data-management' ? "#00695C" : "#6B7280", fontWeight: 500 }}>
                          <span>{formatSize(dbCount * ROW_SIZE_BYTES)} / 500 MB</span>
                          <span>{Math.min(100, parseFloat(((dbCount * ROW_SIZE_BYTES / FREE_TIER_QUOTA_BYTES) * 100).toFixed(2)))}%</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
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
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {tab === 'summary' && (
                    <button
                      onClick={() => setUseFirstLast(!useFirstLast)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors text-gray-700 h-8"
                    >
                      <span className="text-gray-400 font-normal">Mode </span>
                      <span className="text-teal-600 font-medium">
                        {useFirstLast ? "First In / Last Out" : "Check-in/out"}
                      </span>
                    </button>
                  )}
                  <DatePicker value={date} onChange={setDate} />
                </div>
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
              <EmployeeTable summaries={employeeSummaries} date={date} useFirstLast={useFirstLast} />

            ) : tab === 'transfers' ? (
              <TransferRequests embedMode={true} />
            ) : tab === 'log' ? (
              <PunchLog punches={punches} employees={employees} onEmployeeAdded={refetch} />
            ) : tab === 'devices' ? (
              <DevicesMaster />
            ) : tab === 'projects' ? (
              <ProjectsMaster />
            ) : tab === 'finalize' ? (
              <TimesheetFinalizer />
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