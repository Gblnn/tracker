import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import Back from "@/components/back";
import { DatePicker } from "@/components/date-picker";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseLocationGeofence, parsePunchLocation } from "@/lib/geofence";
import { supabase } from "@/lib/supabase";
import { ArrowRight, ArrowRightLeft, Loader2, Plus, Search, User, X, PanelLeftClose, PanelLeftOpen, SquareCheck, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactTimeAgo from "react-time-ago";
import { toast } from "sonner";

interface Props {
  embedMode?: boolean;
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
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

export default function TransferRequests({ embedMode = false, refreshTrigger, onLoadingChange }: Props = {}) {
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedEmpPrefixes, setSelectedEmpPrefixes] = useState<string[]>([]);
  const [selectedTransferPrefixes, setSelectedTransferPrefixes] = useState<string[]>([]);
  const [selectedFromProjects, setSelectedFromProjects] = useState<string[]>([]);
  const [selectedToProjects, setSelectedToProjects] = useState<string[]>([]);
  const [filterCreatedDate, setFilterCreatedDate] = useState<string>("");
  const [renderLimit, setRenderLimit] = useState(50);

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

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchTransfers(true);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    onLoadingChange?.(loading || refreshing);
  }, [loading, refreshing, onLoadingChange]);

  useEffect(() => {
    setRenderLimit(50);
  }, [searchQuery, selectedTransferPrefixes, selectedFromProjects, selectedToProjects, filterCreatedDate]);



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

    if (isBulkMode) {
      if (!transferDate || !toProject || !initiator || selectedEmployeeIds.size === 0) {
        toast.error("Please fill in all required fields and select at least one employee.");
        return;
      }

      setSubmitting(true);
      try {
        const insertBatch = Array.from(selectedEmployeeIds).map(id => {
          const emp = employees.find(e => e.id === id);
          const empLoc = employeeLocations[id] || "";
          const dbEmpId = emp ? (emp.emp_id || String(emp.id)) : String(id);

          return {
            transfer_date: transferDate,
            from_project: empLoc && empLoc !== "—" ? empLoc : "Un-Mapped",
            to_project: toProject,
            initiator: initiator,
            acceptor: acceptor,
            emp_id: dbEmpId
          };
        });

        const { error } = await supabase.from("transfers").insert(insertBatch);
        if (error) throw error;

        toast.success(`Successfully recorded transfers for ${selectedEmployeeIds.size} employees!`);
        setModalOpen(false);
        setIsSelectionMode(false);
        setSelectedEmployeeIds(new Set());
        fetchTransfers();
      } catch (err: any) {
        console.error("Error bulk creating transfers:", err);
        toast.error(err.message || "Failed to submit bulk transfers.");
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!transferDate || !fromProject || !toProject || !initiator || !selectedEmployeeId) {
        toast.error("Please select an employee and fill in all required fields.");
        return;
      }

      setSubmitting(true);
      try {
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
    }
  };

  const empCodePrefixes = useMemo(() => {
    const prefixes = new Set<string>();
    employees.forEach((emp) => {
      if (emp.emp_id && emp.emp_id.length >= 2) {
        prefixes.add(emp.emp_id.slice(0, 2).toUpperCase());
      }
    });
    return Array.from(prefixes).sort();
  }, [employees]);

  const transferPrefixes = useMemo(() => {
    const prefixes = new Set<string>();
    transfers.forEach((t) => {
      if (t.emp_id && t.emp_id.length >= 2) {
        prefixes.add(t.emp_id.slice(0, 2).toUpperCase());
      } else {
        const emp = employees.find(e => e.emp_id === t.emp_id || String(e.id) === t.emp_id);
        if (emp && emp.emp_id && emp.emp_id.length >= 2) {
          prefixes.add(emp.emp_id.slice(0, 2).toUpperCase());
        }
      }
    });
    return Array.from(prefixes).sort();
  }, [transfers, employees]);

  const uniqueFromProjects = useMemo(() => {
    return [...new Set(transfers.map(t => t.from_project).filter(Boolean) as string[])].sort();
  }, [transfers]);

  const uniqueToProjects = useMemo(() => {
    return [...new Set(transfers.map(t => t.to_project).filter(Boolean) as string[])].sort();
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const q = searchQuery.toLowerCase();
      const emp = employees.find(e => e.emp_id === t.emp_id || String(e.id) === t.emp_id);
      const empName = emp ? emp.name.toLowerCase() : "";

      const matchesSearch = (
        empName.includes(q) ||
        (t.emp_id || "").toLowerCase().includes(q) ||
        (t.from_project || "").toLowerCase().includes(q) ||
        (t.to_project || "").toLowerCase().includes(q) ||
        (t.initiator || "").toLowerCase().includes(q) ||
        (t.acceptor || "").toLowerCase().includes(q)
      );

      // Prefix check
      const empIdVal = emp?.emp_id || t.emp_id || "";
      const matchesPrefix = selectedTransferPrefixes.length === 0 ||
        (empIdVal && empIdVal.length >= 2 && selectedTransferPrefixes.includes(empIdVal.slice(0, 2).toUpperCase()));

      // From project check
      const matchesFrom = selectedFromProjects.length === 0 ||
        (t.from_project && selectedFromProjects.includes(t.from_project));

      // To project check
      const matchesTo = selectedToProjects.length === 0 ||
        (t.to_project && selectedToProjects.includes(t.to_project));

      // Date check
      let matchesDate = true;
      if (filterCreatedDate) {
        const createdDate = new Date(t.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' }); // YYYY-MM-DD
        const filterDateFormatted = new Date(filterCreatedDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
        matchesDate = (createdDate === filterDateFormatted);
      }

      return matchesSearch && matchesPrefix && matchesFrom && matchesTo && matchesDate;
    });
  }, [transfers, employees, searchQuery, selectedTransferPrefixes, selectedFromProjects, selectedToProjects, filterCreatedDate]);

  const uniqueDepartments = useMemo(() => {
    const depts = [...new Set(employees.map(emp => emp.department).filter(Boolean) as string[])].sort();
    const hasBlank = employees.some(emp => !emp.department || emp.department.trim() === '');
    if (hasBlank) {
      depts.push('(Blank)');
    }
    return depts;
  }, [employees]);

  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    employees.forEach(emp => {
      const loc = employeeLocations[emp.id];
      if (loc && loc !== "—") {
        locSet.add(loc);
      }
    });
    const sorted = Array.from(locSet).sort();
    const hasBlank = employees.some(emp => {
      const loc = employeeLocations[emp.id];
      return !loc || loc === "—" || loc.trim() === '';
    });
    if (hasBlank) {
      sorted.push('(Blank)');
    }
    return sorted;
  }, [employees, employeeLocations]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchEmployeeQuery.toLowerCase();
      const loc = employeeLocations[emp.id] || "";

      const matchesSearch = (
        emp.name.toLowerCase().includes(q) ||
        (emp.emp_id || "").toLowerCase().includes(q) ||
        (emp.department || "").toLowerCase().includes(q) ||
        loc.toLowerCase().includes(q)
      );

      const deptVal = emp.department || "";
      const matchesDept = selectedDepartments.length === 0 ||
        (deptVal && selectedDepartments.includes(deptVal)) ||
        ((!deptVal || deptVal.trim() === "") && selectedDepartments.includes('(Blank)'));

      const locVal = loc === "—" ? "" : loc;
      const matchesLoc = selectedLocations.length === 0 ||
        (locVal && selectedLocations.includes(locVal)) ||
        ((!locVal || locVal.trim() === "") && selectedLocations.includes('(Blank)'));

      const empIdVal = emp.emp_id || "";
      const matchesPrefix = selectedEmpPrefixes.length === 0 ||
        (empIdVal && empIdVal.length >= 2 && selectedEmpPrefixes.includes(empIdVal.slice(0, 2).toUpperCase()));

      return matchesSearch && matchesDept && matchesLoc && matchesPrefix;
    });
  }, [employees, searchEmployeeQuery, employeeLocations, selectedDepartments, selectedLocations, selectedEmpPrefixes]);

  const toggleSelectEmployee = (id: number) => {
    setSelectedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployeeIds.has(emp.id));

  const handleSelectAllToggle = () => {
    if (allFilteredSelected) {
      setSelectedEmployeeIds(prev => {
        const next = new Set(prev);
        filteredEmployees.forEach(emp => next.delete(emp.id));
        return next;
      });
    } else {
      setSelectedEmployeeIds(prev => {
        const next = new Set(prev);
        filteredEmployees.forEach(emp => next.add(emp.id));
        return next;
      });
    }
  };

  const handleBulkTransferClick = () => {
    setIsBulkMode(true);
    setFromProject("Multiple Locations");
    setToProject("");
    setTransferDate(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Muscat" }));
    setInitiator(userData?.name || userData?.email || "");
    setAcceptor("");
    setModalOpen(true);
  };

  const handleNewTransfer = () => {
    setIsBulkMode(false);
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
    setIsBulkMode(false);
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
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", backgroundColor: "#f9fafb" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes transferHighlight {
          0% {
            background-color: rgba(79, 70, 229, 0.15);
          }
          100% {
            background-color: transparent;
          }
        }
        .transfer-row-new {
          animation: transferHighlight 3s ease-out forwards;
        }
      `}</style>
      {!embedMode && (
        <Back
          blurBG
          fixed
          title="Transfers"
          extra={
            <RefreshButton
              fetchingData={refreshing || loading}
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
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedEmployeeIds(new Set());
                }}
                style={{
                  height: "1.75rem",
                  width: "1.75rem",
                  padding: 0,
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelectionMode ? "rgba(79, 70, 229, 0.1)" : "transparent"
                }}
                title="Toggle Selection Mode"
              >
                <SquareCheck className={`w-4.5 h-4.5 ${isSelectionMode ? "text-indigo-600" : "text-gray-500"} hover:text-indigo-600 transition-colors`} />
              </Button>
              Employee Master
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>

              <span style={{ fontSize: "0.725rem", fontWeight: 500, backgroundColor: "rgba(100, 100, 100, 0.08)", padding: "0.18rem 0.5rem", borderRadius: "0.25rem" }}>
                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
              </span>
              {isSelectionMode && selectedEmployeeIds.size > 0 && (
                <Button
                  onClick={handleBulkTransferClick}
                  size="sm"
                  style={{
                    height: "1.75rem",
                    padding: "0 0.6rem",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    backgroundColor: "#4f46e5",
                    color: "white"
                  }}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transfer Selected ({selectedEmployeeIds.size})
                </Button>
              )}
            </div>
          </div>

          {/* Employee List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && employees.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Loader2 className="animate-spin w-6 h-6 text-blue-900" />
              </div>
            ) : (
              <table className="w-full text-sm animate-fade-in">
                <thead style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#f9fafb" }}>
                  <tr style={{ backgroundColor: "#f9fafb" }} className="border-b border-gray-100">
                    {isSelectionMode && (
                      <th style={{ width: "40px", padding: "0.5rem 0.25rem", verticalAlign: "middle" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                          <Checkbox
                            checked={allFilteredSelected}
                            onCheckedChange={handleSelectAllToggle}
                            className="w-4 h-4 rounded border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white cursor-pointer"
                          />
                        </div>
                      </th>
                    )}
                    <th style={{ padding: "0.5rem 0.75rem", width: "340px" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                      <div className="flex items-center gap-2 w-full">
                        <div className="relative flex items-center group flex-1" style={{ position: "relative" }}>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger className={`h-8 text-xs border transition-colors px-2 rounded-md font-semibold flex items-center gap-1 outline-none uppercase tracking-wide shrink-0 ${selectedEmpPrefixes.length > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                            <span className="truncate">
                              {selectedEmpPrefixes.length === 0
                                ? 'ID (All)'
                                : selectedEmpPrefixes.length === 1
                                  ? `ID: ${selectedEmpPrefixes[0]}`
                                  : `ID (${selectedEmpPrefixes.length})`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-0.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[180px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedEmpPrefixes(empCodePrefixes);
                                }}
                                className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left border-none bg-transparent"
                                style={{ flex: 1 }}
                              >
                                All
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedEmpPrefixes([]);
                                }}
                                className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right border-none bg-transparent"
                                style={{ flex: 1 }}
                              >
                                Clear
                              </button>
                            </div>
                            <div className="py-1">
                              {empCodePrefixes.map(prefix => {
                                const isChecked = selectedEmpPrefixes.includes(prefix);
                                return (
                                  <DropdownMenuCheckboxItem
                                    key={prefix}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedEmpPrefixes([...selectedEmpPrefixes, prefix]);
                                      } else {
                                        setSelectedEmpPrefixes(selectedEmpPrefixes.filter(item => item !== prefix));
                                      }
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                    className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                  >
                                    {prefix}
                                  </DropdownMenuCheckboxItem>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </th>
                    <th style={{ fontWeight: 600, color: "#374151", verticalAlign: "middle", width: "160px", padding: "0.25rem" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-700 hover:bg-gray-100 transition-colors px-2 rounded-md font-semibold w-full justify-between flex items-center outline-none uppercase tracking-wide">
                          <span className="truncate">
                            {selectedDepartments.length === 0
                              ? 'Dept (All)'
                              : selectedDepartments.length === 1
                                ? selectedDepartments[0]
                                : `Dept (${selectedDepartments.length})`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedDepartments(uniqueDepartments);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedDepartments([]);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              Clear
                            </button>
                          </div>
                          <div className="py-1">
                            {uniqueDepartments.map(dept => {
                              const isChecked = selectedDepartments.includes(dept);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={dept}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedDepartments([...selectedDepartments, dept]);
                                    } else {
                                      setSelectedDepartments(selectedDepartments.filter(item => item !== dept));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                >
                                  {dept}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    <th style={{ fontWeight: 600, color: "#374151", verticalAlign: "middle", width: "160px", padding: "0.25rem" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-700 hover:bg-gray-100 transition-colors px-2 rounded-md font-semibold w-full justify-between flex items-center outline-none uppercase tracking-wide">
                          <span className="truncate">
                            {selectedLocations.length === 0
                              ? 'Loc (All)'
                              : selectedLocations.length === 1
                                ? selectedLocations[0]
                                : `Loc (${selectedLocations.length})`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedLocations(uniqueLocations);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedLocations([]);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              Clear
                            </button>
                          </div>
                          <div className="py-1">
                            {uniqueLocations.map(loc => {
                              const isChecked = selectedLocations.includes(loc);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={loc}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedLocations([...selectedLocations, loc]);
                                    } else {
                                      setSelectedLocations(selectedLocations.filter(item => item !== loc));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                >
                                  {loc}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={isSelectionMode ? 4 : 3} style={{ padding: "3rem 1rem", textAlign: "center", color: "#9ca3af" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                          <User className="w-12 h-12 text-gray-200" />
                          <span style={{ fontSize: "0.85rem" }}>No employees found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, idx) => {
                      const empTrans = transfers.filter(t => t.emp_id === emp.emp_id || t.emp_id === String(emp.id));
                      const hasTransfer = empTrans.length > 0;
                      const loc = employeeLocations[emp.id] || "—";
                      return (
                        <tr
                          key={emp.id}
                          onClick={() => {
                            if (isSelectionMode) {
                              toggleSelectEmployee(emp.id);
                            } else {
                              handleStartTransfer(emp);
                            }
                          }}
                          style={{ transition: "background 0.2s", cursor: "pointer" }}
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          {isSelectionMode && (
                            <td style={{ width: "40px", padding: "0.5rem 0.25rem" }} onClick={(e) => e.stopPropagation()} className="px-4 py-3">
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Checkbox
                                  checked={selectedEmployeeIds.has(emp.id)}
                                  onCheckedChange={() => toggleSelectEmployee(emp.id)}
                                  className="w-4 h-4 rounded border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white cursor-pointer"
                                />
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <Avatar size="md" name={emp.name} index={idx} />
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 500, color: "#111827", textTransform: "capitalize", textAlign: "left" }}>{emp.name.toLowerCase()}</span>
                                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{emp.emp_id || emp.device_user_id}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.85rem", color: "#4b5563" }} className="px-4 py-3">
                            {emp.department || "—"}
                          </td>
                          <td className="px-4 py-3">
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
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
            {loading && transfers.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Loader2 className="animate-spin w-6 h-6 text-blue-900" />
              </div>
            ) : (
              <table className="w-full text-sm animate-fade-in">
                <thead style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#f9fafb" }}>
                  <tr style={{ backgroundColor: "#f9fafb" }} className="border-b border-gray-100">
                    <th style={{ padding: "0.5rem 0.75rem", width: "340px" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                      <div className="flex items-center gap-2 w-full">
                        <div className="relative flex items-center group flex-1" style={{ position: "relative" }}>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger className={`h-8 text-xs border transition-colors px-2 rounded-md font-semibold flex items-center gap-1 outline-none uppercase tracking-wide shrink-0 ${selectedTransferPrefixes.length > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                            <span className="truncate">
                              {selectedTransferPrefixes.length === 0
                                ? 'ID (All)'
                                : selectedTransferPrefixes.length === 1
                                  ? `ID: ${selectedTransferPrefixes[0]}`
                                  : `ID (${selectedTransferPrefixes.length})`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-0.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[180px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedTransferPrefixes(transferPrefixes);
                                }}
                                className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left border-none bg-transparent"
                                style={{ flex: 1 }}
                              >
                                All
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedTransferPrefixes([]);
                                }}
                                className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right border-none bg-transparent"
                                style={{ flex: 1 }}
                              >
                                Clear
                              </button>
                            </div>
                            <div className="py-1">
                              {transferPrefixes.map(prefix => {
                                const isChecked = selectedTransferPrefixes.includes(prefix);
                                return (
                                  <DropdownMenuCheckboxItem
                                    key={prefix}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedTransferPrefixes([...selectedTransferPrefixes, prefix]);
                                      } else {
                                        setSelectedTransferPrefixes(selectedTransferPrefixes.filter(item => item !== prefix));
                                      }
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                    className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                  >
                                    {prefix}
                                  </DropdownMenuCheckboxItem>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </th>
                    <th style={{ fontWeight: 600, color: "#374151", verticalAlign: "middle", width: "150px", padding: "0.25rem" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-700 hover:bg-gray-100 transition-colors px-2 rounded-md font-semibold w-full justify-between flex items-center outline-none uppercase tracking-wide">
                          <span className="truncate">
                            {selectedFromProjects.length === 0
                              ? 'From (All)'
                              : selectedFromProjects.length === 1
                                ? selectedFromProjects[0]
                                : `From (${selectedFromProjects.length})`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedFromProjects(uniqueFromProjects);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedFromProjects([]);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              Clear
                            </button>
                          </div>
                          <div className="py-1">
                            {uniqueFromProjects.map(proj => {
                              const isChecked = selectedFromProjects.includes(proj);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={proj}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedFromProjects([...selectedFromProjects, proj]);
                                    } else {
                                      setSelectedFromProjects(selectedFromProjects.filter(item => item !== proj));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                >
                                  {proj}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    <th style={{ fontWeight: 600, color: "#374151", verticalAlign: "middle", width: "150px", padding: "0.25rem" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-700 hover:bg-gray-100 transition-colors px-2 rounded-md font-semibold w-full justify-between flex items-center outline-none uppercase tracking-wide">
                          <span className="truncate">
                            {selectedToProjects.length === 0
                              ? 'To (All)'
                              : selectedToProjects.length === 1
                                ? selectedToProjects[0]
                                : `To (${selectedToProjects.length})`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedToProjects(uniqueToProjects);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-left border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedToProjects([]);
                              }}
                              className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer text-right border-none bg-transparent"
                              style={{ flex: 1 }}
                            >
                              Clear
                            </button>
                          </div>
                          <div className="py-1">
                            {uniqueToProjects.map(proj => {
                              const isChecked = selectedToProjects.includes(proj);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={proj}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedToProjects([...selectedToProjects, proj]);
                                    } else {
                                      setSelectedToProjects(selectedToProjects.filter(item => item !== proj));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                >
                                  {proj}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    {!employeeMasterVisible && (
                      <>
                        <th style={{ fontWeight: 600, color: "#374151" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide px-4 py-2">Initiator</th>
                        <th style={{ fontWeight: 600, color: "#374151" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide px-4 py-2">Acceptor</th>
                      </>
                    )}
                    <th style={{ fontWeight: 600, color: "#374151", verticalAlign: "middle", width: "200px", padding: "0.25rem" }} className="text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                      <div className="flex items-center gap-1 justify-between w-full px-2">
                        <span className="truncate text-xs font-semibold text-gray-500 uppercase tracking-wide">Created At</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }} onClick={(e) => e.stopPropagation()}>
                          <DatePicker
                            value={filterCreatedDate}
                            onChange={setFilterCreatedDate}
                            placeholder="All Dates"
                            className="h-7 text-[10px] w-[100px] px-1.5 py-0 border border-gray-200 rounded bg-white hover:bg-gray-50 font-semibold"
                          />
                          {filterCreatedDate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFilterCreatedDate('');
                              }}
                              className="text-gray-400 hover:text-gray-600 p-0.5 bg-transparent border-none cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={employeeMasterVisible ? 4 : 6} style={{ padding: "3rem 1rem", textAlign: "center", color: "#9ca3af" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                          <ArrowRightLeft className="w-12 h-12 text-gray-200" />
                          <h4 style={{ fontWeight: 600, color: "#374151", fontSize: "0.85rem" }}>No transfers found</h4>
                          <span style={{ fontSize: "0.8rem" }}>Try adjusting your search query or filters.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {filteredTransfers.slice(0, renderLimit).map((t, idx) => {
                          const emp = employees.find(e => e.emp_id === t.emp_id || String(e.id) === t.emp_id);
                          const isNew = (Date.now() - new Date(t.created_at).getTime()) < 20000; // 20s threshold for highlighting new entry

                          return (
                            <motion.tr
                              key={t.id}
                              initial={{ opacity: 0, y: -12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -12 }}
                              transition={{ duration: 0.35, ease: "easeOut" }}
                              onClick={() => handleShowTransferDetail(t)}
                              style={{ cursor: "pointer" }}
                              className={`${isNew ? "transfer-row-new" : ""} hover:bg-gray-50 border-b border-gray-100`}
                            >
                              <td className="px-4 py-3 text-gray-500">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                  <Avatar size="md" name={emp ? emp.name : "Unknown Employee"} index={idx} />
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontWeight: 500, color: "#111827", textTransform: "capitalize" }}>{emp ? emp.name.toLowerCase() : "Unknown Employee"}</span>
                                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{t.emp_id || "—"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-medium text-gray-700">
                                {t.from_project}
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-medium text-indigo-700">
                                {t.to_project}
                              </td>
                              {!employeeMasterVisible && (
                                <>
                                  <td className="px-4 py-3 text-gray-500">
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                                      <User className="w-3.5 h-3.5 text-gray-400" />
                                      <span>{t.initiator}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-gray-500">
                                    {t.acceptor ? (
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                                        <User className="w-3.5 h-3.5 text-indigo-400" />
                                        <span style={{ color: "#4f46e5", fontWeight: 500 }}>{t.acceptor}</span>
                                      </div>
                                    ) : (
                                      <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.8rem" }}>Pending acceptance</span>
                                    )}
                                  </td>
                                </>
                              )}
                              <td style={{ fontSize: "0.8rem", color: "#6b7280" }} className="px-4 py-3">
                                <ReactTimeAgo date={new Date(t.created_at)} locale="en-US" />
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                      {filteredTransfers.length > renderLimit && (
                        <tr>
                          <td colSpan={employeeMasterVisible ? 4 : 6} style={{ padding: '12px', textAlign: 'center', background: '#ffffff', position: 'sticky', bottom: 0, zIndex: 10, borderTop: '1px solid #f3f4f6', boxShadow: '0 -2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                                Showing {renderLimit} of {filteredTransfers.length} transfers
                              </span>
                              <button
                                type="button"
                                onClick={() => setRenderLimit(prev => prev + 50)}
                                style={{
                                  padding: '5px 12px',
                                  background: '#0f172a',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease'
                                }}
                                className="hover:bg-slate-800"
                              >
                                Load More
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
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
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827" }}>
              {isBulkMode ? `Record Bulk Transfer (${selectedEmployeeIds.size} Employees)` : "Record New Transfer"}
            </h3>
          </div>

          {isBulkMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Selected Employees ({selectedEmployeeIds.size})</label>
              <div style={{
                maxHeight: "100px",
                overflowY: "auto",
                padding: "0.5rem 0.75rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                backgroundColor: "#f9fafb",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem"
              }}>
                {Array.from(selectedEmployeeIds).map(id => {
                  const emp = employees.find(e => e.id === id);
                  return (
                    <div key={id} style={{ fontSize: "0.75rem", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "4px", height: "4px", backgroundColor: "#4f46e5", borderRadius: "50%" }}></span>
                      {emp?.name} <span style={{ color: "#6b7280", fontSize: "0.7rem" }}>({emp?.emp_id || emp?.device_user_id})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
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
          )}

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
                disabled={isBulkMode}
                placeholder={isBulkMode ? "Auto-resolved per employee" : "Select or type..."}
                value={fromProject}
                onChange={(e) => setFromProject(e.target.value)}
                list="from-project-list"
                style={{ fontSize: "0.85rem", backgroundColor: isBulkMode ? "#f3f4f6" : "white" }}
              />
              {!isBulkMode && (
                <datalist id="from-project-list">
                  {projects.map((p, idx) => (
                    <option key={idx} value={p.project_name} />
                  ))}
                </datalist>
              )}
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
