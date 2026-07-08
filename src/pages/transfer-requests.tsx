import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import Back from "@/components/back";
import { DatePicker } from "@/components/date-picker";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseLocationGeofence, parsePunchLocation } from "@/lib/geofence";
import { supabase } from "@/lib/supabase";
import { ArrowRight, ArrowRightLeft, Loader2, Plus, Search, User, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import ReactTimeAgo from "react-time-ago";
import { toast } from "sonner";

interface Props {
  embedMode?: boolean;
}

interface Transfer {
  id: string;
  created_at: string;
  transfer_date: string;
  from_project: string;
  to_project: string;
  initiator: string;
  acceptor: string;
  emp_id?: string | null;
}

interface Employee {
  id: number;
  device_user_id: string;
  name: string;
  department: string | null;
  emp_id: string | null;
  location?: string | null;
}

export default function TransferRequests({ embedMode = false }: Props) {
  const { userData } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employeeLocations, setEmployeeLocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState("");

  // New Transfer Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transferDate, setTransferDate] = useState("");
  const [fromProject, setFromProject] = useState("");
  const [toProject, setToProject] = useState("");
  const [initiator, setInitiator] = useState("");
  const [acceptor, setAcceptor] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [employeeMasterVisible, setEmployeeMasterVisible] = useState(true);

  const fetchTransfers = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [transRes, empsRes, devRes, punchRes, projRes] = await Promise.all([
        supabase.from("transfers").select("*").order("created_at", { ascending: false }),
        supabase.from("employees").select("*").order("name", { ascending: true }),
        supabase.from("devices").select("serial_no, location"),
        supabase.from("punches").select("user_id, device_serial, mobile_location").order("punch_time", { ascending: false }).limit(2000),
        supabase.from("projects").select("project_name, project_location")
      ]);

      if (transRes.error) throw transRes.error;
      if (empsRes.error) throw empsRes.error;
      if (devRes.error) throw devRes.error;
      if (punchRes.error) throw punchRes.error;
      if (projRes.error) throw projRes.error;

      const loadedTransfers = transRes.data || [];
      const loadedEmployees = empsRes.data || [];
      const loadedDevices = devRes.data || [];
      const loadedPunches = punchRes.data || [];
      const loadedProjects = projRes.data || [];

      setTransfers(loadedTransfers);
      setEmployees(loadedEmployees);
      setProjects(loadedProjects);

      // Build deviceMap
      const deviceMap = Object.fromEntries(
        loadedDevices.map(d => [d.serial_no, d.location])
      );

      // Build projLocationMap
      const projLocationMap: Record<string, string> = {};
      loadedProjects.forEach(p => {
        const { name } = parseLocationGeofence(p.project_location);
        if (p.project_name && name) {
          projLocationMap[p.project_name.toLowerCase().trim()] = name;
        }
      });

      // Calculate fallback dynamic punch-based locations (most recent punch location)
      const empFallbackLocs: Record<string, string> = {};
      loadedPunches.forEach(p => {
        const devLoc = deviceMap[p.device_serial];
        let { location: loc } = parsePunchLocation(p.mobile_location, devLoc);
        if (loc) {
          const key = loc.toLowerCase().trim();
          if (projLocationMap[key]) {
            loc = projLocationMap[key];
          }
        }
        const isRealLocation = loc && loc !== '—' && loc !== 'Un-Mapped';
        if (isRealLocation && !empFallbackLocs[p.user_id]) {
          empFallbackLocs[p.user_id] = loc;
        }
      });

      // Resolve final current locations for each employee:
      // Precedence: latest transfer `to_project` -> dynamic location fallback
      const resolvedLocs: Record<string, string> = {};
      loadedEmployees.forEach(emp => {
        // Find transfers for this employee, sorted by transfer_date desc, created_at desc
        const empTrans = loadedTransfers
          .filter(t => t.emp_id === emp.emp_id || t.emp_id === String(emp.id))
          .sort((a, b) => {
            const dateA = new Date(a.transfer_date).getTime();
            const dateB = new Date(b.transfer_date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

        if (empTrans.length > 0) {
          resolvedLocs[emp.id] = empTrans[0].to_project;
        } else {
          const dynLoc = empFallbackLocs[emp.device_user_id] || emp.location || "—";
          resolvedLocs[emp.id] = dynLoc;
        }
      });

      setEmployeeLocations(resolvedLocs);
    } catch (err: any) {
      console.error("Error fetching transfers and dependencies:", err);
      toast.error("Failed to load transfers list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);



  const handleEmployeeChange = (empIdVal: string) => {
    setSelectedEmployeeId(empIdVal);
    if (empIdVal) {
      const currentLoc = employeeLocations[empIdVal];
      if (currentLoc && currentLoc !== "—") {
        setFromProject(currentLoc);
      } else {
        setFromProject("");
      }
    } else {
      setFromProject("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferDate || !fromProject || !toProject || !initiator || !selectedEmployeeId) {
      toast.error("Please select an employee and fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      // Find the employee object to get the preferred identifier (we use emp_id or string(id))
      const targetEmp = employees.find(emp => String(emp.id) === selectedEmployeeId);
      const dbEmpId = targetEmp ? (targetEmp.emp_id || String(targetEmp.id)) : selectedEmployeeId;

      const { error } = await supabase
        .from("transfers")
        .insert({
          transfer_date: transferDate,
          from_project: fromProject,
          to_project: toProject,
          initiator: initiator,
          acceptor: acceptor,
          emp_id: dbEmpId
        });

      if (error) throw error;

      toast.success("Transfer recorded successfully!");
      setModalOpen(false);
      fetchTransfers();
    } catch (err: any) {
      console.error("Error creating transfer:", err);
      toast.error(err.message || "Failed to submit transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    const q = searchQuery.toLowerCase();
    const emp = employees.find(e => e.emp_id === t.emp_id || String(e.id) === t.emp_id);
    const empName = emp ? emp.name.toLowerCase() : "";
    return (
      empName.includes(q) ||
      (t.from_project || "").toLowerCase().includes(q) ||
      (t.to_project || "").toLowerCase().includes(q) ||
      (t.initiator || "").toLowerCase().includes(q) ||
      (t.acceptor || "").toLowerCase().includes(q)
    );
  });

  const filteredEmployees = employees.filter((emp) => {
    const q = searchEmployeeQuery.toLowerCase();
    const loc = employeeLocations[emp.id] || "";
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.emp_id || "").toLowerCase().includes(q) ||
      (emp.department || "").toLowerCase().includes(q) ||
      loc.toLowerCase().includes(q)
    );
  });

  const handleNewTransfer = () => {
    const today = new Date().toISOString().split("T")[0];
    setTransferDate(today);
    setFromProject("");
    setToProject("");
    setInitiator(userData?.name || userData?.email || "");
    setAcceptor("");
    setSelectedEmployeeId("");
    setModalOpen(true);
  };

  const handleStartTransfer = (emp: Employee) => {
    const today = new Date().toISOString().split("T")[0];
    setTransferDate(today);
    setSelectedEmployeeId(String(emp.id));
    const currentLoc = employeeLocations[emp.id];
    if (currentLoc && currentLoc !== "—") {
      setFromProject(currentLoc);
    } else {
      setFromProject("");
    }
    setToProject("");
    setInitiator(userData?.name || userData?.email || "");
    setAcceptor("");
    setModalOpen(true);
  };

  const handleShowTransferDetail = (t: Transfer) => {
    setSelectedTransfer(t);
    setDetailModalOpen(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", backgroundColor: "#f9fafb" }}>
      {!embedMode && (
        <Back
          blurBG
          fixed
          title="Transfers"
          extra={
            <RefreshButton
              fetchingData={refreshing}
              onClick={() => fetchTransfers(true)}
            />
          }
        />
      )}

      {/* Main split content container */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        flex: 1,
        gap: employeeMasterVisible ? "1.25rem" : "0px",
        padding: "1.25rem",
        overflow: "hidden",
        marginTop: embedMode ? "0" : "5rem",
        transition: "gap 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>

        {/* Left Column: Employee Master */}
        <div style={{
          width: employeeMasterVisible ? "35%" : "0px",
          minWidth: employeeMasterVisible ? "280px" : "0px",
          flex: employeeMasterVisible ? 1 : "none",
          opacity: employeeMasterVisible ? 1 : 0,
          transform: employeeMasterVisible ? "translateX(0)" : "translateX(-20px)",
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderRadius: "0.75rem",
          border: employeeMasterVisible ? "1px solid #e5e7eb" : "0px solid transparent",
          overflow: "hidden",
          boxShadow: employeeMasterVisible ? "0 1px 3px rgba(0, 0, 0, 0.05)" : "none"
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid #f3f4f6",
            height: "57px",
            boxSizing: "border-box"
          }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              Employee Master
            </h3>
          </div>

          {/* Employee List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Loader2 className="animate-spin w-6 h-6 text-blue-900" />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", gap: "0.5rem", padding: "2rem" }}>
                <User className="w-12 h-12 text-gray-200" />
                <span style={{ fontSize: "0.85rem" }}>No employees found</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: "#f9fafb" }}>
                    <TableHead style={{ padding: "0.5rem 0.75rem", width: "280px" }}>
                      <div className="relative flex items-center group w-full" style={{ position: "relative" }}>
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", width: "0.8rem", height: "0.8rem", color: "#9ca3af" }} />
                        <input
                          type="text"
                          placeholder="Search Employee..."
                          value={searchEmployeeQuery}
                          onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                          className="w-full pl-8 pr-6 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors tracking-wide text-gray-700"
                          style={{
                            width: "100%",
                            paddingLeft: "2rem",
                            paddingRight: "1.5rem",
                            paddingTop: "0.35rem",
                            paddingBottom: "0.35rem",
                            fontSize: "0.75rem",
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.375rem",
                            outline: "none",
                            fontWeight: "400"
                          }}
                        />
                        {searchEmployeeQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchEmployeeQuery('')}
                            style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </TableHead>
                    <TableHead style={{ fontWeight: 600, color: "#374151", verticalAlign: "middle" }}>Department</TableHead>
                    <TableHead style={{ fontWeight: 600, color: "#374151", verticalAlign: "middle" }}>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp, idx) => {
                    const empTrans = transfers.filter(t => t.emp_id === emp.emp_id || t.emp_id === String(emp.id));
                    const hasTransfer = empTrans.length > 0;
                    const loc = employeeLocations[emp.id] || "—";
                    return (
                      <TableRow
                        key={emp.id}
                        onClick={() => handleStartTransfer(emp)}
                        style={{ transition: "background 0.2s", cursor: "pointer" }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <Avatar size="md" name={emp.name} index={idx} />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 500, color: "#111827", textTransform: "capitalize", textAlign: "left" }}>{emp.name.toLowerCase()}</span>
                              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{emp.emp_id || emp.device_user_id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                          {emp.department || "—"}
                        </TableCell>
                        <TableCell>
                          {hasTransfer ? (
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              backgroundColor: "#eff6ff",
                              color: "#1e40af",
                              border: "1px solid #bfdbfe",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500
                            }}>
                              <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#3b82f6", borderRadius: "50%" }}></span>
                              {loc}
                              <span style={{ fontSize: "0.65rem", color: "#60a5fa", marginLeft: "0.2rem" }}>(Assigned)</span>
                            </div>
                          ) : (
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                              border: "1px solid #e5e7eb",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500
                            }}>
                              <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#9ca3af", borderRadius: "50%" }}></span>
                              {loc}

                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Right Column: Transfer Log */}
        <div style={{
          flex: 1.2,
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid #f3f4f6",
            height: "57px",
            boxSizing: "border-box"
          }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <Button
                variant="ghost"
                onClick={() => setEmployeeMasterVisible(!employeeMasterVisible)}
                style={{
                  height: "1.75rem",
                  width: "1.75rem",
                  padding: 0,
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title={employeeMasterVisible ? "Hide Employee Master" : "Show Employee Master"}
              >
                {employeeMasterVisible ? (
                  <PanelLeftClose className="w-4.5 h-4.5 text-gray-500 hover:text-gray-900 transition-colors" />
                ) : (
                  <PanelLeftOpen className="w-4.5 h-4.5 text-gray-500 hover:text-gray-900 transition-colors" />
                )}
              </Button>
              LOG
            </h3>

            <Button
              onClick={handleNewTransfer}
              size="sm"
              style={{
                height: "1.75rem",
                padding: "0 0.6rem",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                backgroundColor: "black",
                color: "white"
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Transfer
            </Button>
          </div>

          {/* Transfers Table */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Loader2 className="animate-spin w-6 h-6 text-blue-900" />
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#6b7280", gap: "0.5rem" }}>
                <ArrowRightLeft className="w-12 h-12 text-gray-200" />
                <h4 style={{ fontWeight: 600, color: "#374151" }}>No transfers found</h4>
                <p style={{ fontSize: "0.8rem" }}>Create a new transfer request to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: "#f9fafb" }}>
                    <TableHead style={{ padding: "0.5rem 0.75rem", width: "280px" }}>
                      <div className="relative flex items-center group w-full" style={{ position: "relative" }}>
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", width: "0.8rem", height: "0.8rem", color: "#9ca3af" }} />
                        <input
                          type="text"
                          placeholder="Search Employee..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-6 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors tracking-wide text-gray-700"
                          style={{
                            width: "100%",
                            paddingLeft: "2rem",
                            paddingRight: "1.5rem",
                            paddingTop: "0.35rem",
                            paddingBottom: "0.35rem",
                            fontSize: "0.75rem",
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.375rem",
                            outline: "none",
                            fontWeight: "400"
                          }}
                        />
                        {searchQuery && (
                          <button 
                            type="button"
                            onClick={() => setSearchQuery('')} 
                            style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </TableHead>
                    <TableHead style={{ fontWeight: 600, color: "#374151" }}>Route</TableHead>
                    {!employeeMasterVisible && (
                      <>
                        <TableHead style={{ fontWeight: 600, color: "#374151" }}>Initiator</TableHead>
                        <TableHead style={{ fontWeight: 600, color: "#374151" }}>Acceptor</TableHead>
                      </>
                    )}
                    <TableHead style={{ fontWeight: 600, color: "#374151" }}>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((t, idx) => {
                    const emp = employees.find(e => e.emp_id === t.emp_id || String(e.id) === t.emp_id);
                    return (
                      <TableRow 
                        key={t.id} 
                        onClick={() => handleShowTransferDetail(t)}
                        style={{ transition: "background 0.2s", cursor: "pointer" }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <Avatar size="md" name={emp ? emp.name : "Unknown Employee"} index={idx} />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 500, color: "#111827", textTransform: "capitalize" }}>{emp ? emp.name.toLowerCase() : "Unknown Employee"}</span>
                              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{t.emp_id || "—"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
                            <span style={{ color: "#4b5563" }}>{t.from_project}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            <span style={{ color: "#1e3a8a" }}>{t.to_project}</span>
                          </div>
                        </TableCell>
                        {!employeeMasterVisible && (
                          <>
                            <TableCell>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span>{t.initiator}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {t.acceptor ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                                  <User className="w-3.5 h-3.5 text-indigo-400" />
                                  <span style={{ color: "#4f46e5", fontWeight: 500 }}>{t.acceptor}</span>
                                </div>
                              ) : (
                                <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.8rem" }}>Pending acceptance</span>
                              )}
                            </TableCell>
                          </>
                        )}
                        <TableCell style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          <ReactTimeAgo date={new Date(t.created_at)} locale="en-US" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

      </div>

      {/* New Transfer Modal */}
      <ResponsiveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title=""
        description=""
      >
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.75rem" }}>
            <ArrowRightLeft className="w-5 h-5 text-blue-900" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827" }}>Record New Transfer</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Select Employee *</label>
            <select
              required
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              style={{
                height: "2.25rem",
                borderRadius: "0.375rem",
                border: "1px solid #e5e7eb",
                padding: "0 0.5rem",
                fontSize: "0.85rem",
                backgroundColor: "white",
                outline: "none"
              }}
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.name} ({emp.emp_id || emp.device_user_id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Transfer Date *</label>
            <DatePicker
              value={transferDate}
              onChange={setTransferDate}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>From Project *</label>
              <Input
                type="text"
                required
                placeholder="Select or type..."
                value={fromProject}
                onChange={(e) => setFromProject(e.target.value)}
                list="from-project-list"
                style={{ fontSize: "0.85rem" }}
              />
              <datalist id="from-project-list">
                {projects.map((p, idx) => (
                  <option key={idx} value={p.project_name} />
                ))}
              </datalist>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>To Project *</label>
              <Input
                type="text"
                required
                placeholder="Select or type..."
                value={toProject}
                onChange={(e) => setToProject(e.target.value)}
                list="to-project-list"
                style={{ fontSize: "0.85rem" }}
              />
              <datalist id="to-project-list">
                {projects.map((p, idx) => (
                  <option key={idx} value={p.project_name} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              style={{ height: "2.25rem", fontSize: "0.85rem" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{
                height: "2.25rem",
                fontSize: "0.85rem",
                backgroundColor: "#1e3a8a",
                color: "white"
              }}
            >
              {submitting ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Transfer Detail Modal */}
      <ResponsiveModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        title=""
        description=""
      >
        {selectedTransfer && (() => {
          const emp = employees.find(e => e.emp_id === selectedTransfer.emp_id || String(e.id) === selectedTransfer.emp_id);
          return (
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.75rem" }}>
                <ArrowRightLeft className="w-5 h-5 text-blue-900" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827" }}>Transfer Details</h3>
              </div>

              {/* Employee Card */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
                <Avatar size="md" name={emp ? emp.name : "Unknown Employee"} index={0} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600, color: "#111827", textTransform: "capitalize" }}>{emp ? emp.name.toLowerCase() : "Unknown Employee"}</span>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>ID: {selectedTransfer.emp_id || "—"}</span>
                  {emp?.department && <span style={{ fontSize: "0.75rem", color: "#4b5563" }}>Dept: {emp.department}</span>}
                </div>
              </div>

              {/* Route Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Route</span>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>FROM</span>
                    <span style={{ fontWeight: 500 }}>{selectedTransfer.from_project}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>TO</span>
                    <span style={{ fontWeight: 500 }}>{selectedTransfer.to_project}</span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Transfer Date</span>
                  <span style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 500 }}>
                    {new Date(selectedTransfer.transfer_date).toLocaleDateString(undefined, { dateStyle: "long" })}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Logged At</span>
                  <span style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 500 }}>
                    {new Date(selectedTransfer.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Initiated By</span>
                  <span style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 500 }}>{selectedTransfer.initiator || "—"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Accepted By</span>
                  <span style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 500 }}>{selectedTransfer.acceptor || "Pending Acceptance"}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <Button
                  onClick={() => setDetailModalOpen(false)}
                  style={{ height: "2.25rem", fontSize: "0.85rem", backgroundColor: "#1e3a8a", color: "white" }}
                >
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </ResponsiveModal>
    </div>
  );
}
