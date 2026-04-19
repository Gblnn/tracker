import Back from "@/components/back";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ProcessRow = {
  ProcessDataId?: number;
  emp_code?: string;
  emp_name?: string;
  dept_name?: string;
  name?: string;
  loc_name?: string;
  ProcessDataDate?: string;
  StaffInTime?: string | null;
  StaffOutTime?: string | null;
  WorkDurationMins?: number;
  ScheduledDurationMins?: number;
  UnderTime?: number;
  OverTime?: number;
  StatusCode?: string | null;
  DetailedStatus?: string | null;
  IsInPunchMissed?: number;
  IsOutPunchMissed?: number;
  ShiftCode?: string;
  weekday?: string;
};

type ProcessBucket = {
  list?: ProcessRow[];
  summary?: Record<string, number>;
};

type ProcessApiResponse = {
  status?: boolean;
  code?: number;
  message?: string;
  data?: ProcessBucket[];
  meta?: Record<string, unknown>;
};

const todayISO = () => new Date().toISOString().split("T")[0];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatMinutes = (mins?: number) => {
  if (mins === undefined || mins === null) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const statusBadge = (status?: string | null): { label: string; bg: string; color: string } => {
  const normalized = (status || "-").toUpperCase();
  if (normalized.includes("A")) {
    return {
      label: status || "A",
      bg: "",
      color: "red",
    };
  }
  if (normalized.includes("P")) {
    return {
      label: status || "P",
      bg: "",
      color: "rgb(21, 128, 61)",
    };
  }
  return {
    label: status || "-",
    bg: "",
    color: "rgb(75, 85, 99)",
  };
};



export default function Timetaag() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseData, setResponseData] = useState<ProcessApiResponse | null>(null);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "missed">("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const applyMatch = () => setIsDesktop(mediaQuery.matches);
    applyMatch();
    mediaQuery.addEventListener("change", applyMatch);
    return () => mediaQuery.removeEventListener("change", applyMatch);
  }, []);

  const url = new URL("https://app.timetaag.com/api/v1/GetProcessData");

  const headers = {
    "Authorization": "Bearer 10069_BQT86ki21io3wDpaqwJEGIR0TxhMxuY8icLPfRXacwXendpoux",
    "Content-Type": "application/json",
    "BioTaag-API-Key": "10069_BQT86ki21io3wDpaqwJEGIR0TxhMxuY8icLPfRXacwXendpoux",
    "Accept": "application/json",
  };

  const fetchPage = async (pageNumber: number): Promise<ProcessApiResponse> => {
    const body = {
      "fdate": fromDate,
      "tdate": toDate,
      "calculate": "0",
      "report": "basic",
      "group1": "1",
      "group2": "LocationId",
      "sort_column": "0",
      "client_db_name": "tt_10000",
      "page": String(pageNumber),
      "per_page": "100",
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as ProcessApiResponse;

    if (!response.ok || data?.status === false) {
      throw new Error(data?.message || "Unexpected error while fetching Timetaag data");
    }

    return data;
  };

  const fetchProcessData = async () => {
    setLoading(true);
    setError("");
    setFetchProgress({ current: 0, total: 0 });

    try {
      const firstPage = await fetchPage(1);
      const firstMeta = firstPage.meta as { last_page?: number } | undefined;
      const lastPage = Math.min(25, Math.max(1, Number(firstMeta?.last_page || 1)));
      setFetchProgress({ current: 1, total: lastPage });

      let mergedBuckets: ProcessBucket[] = [...(firstPage.data || [])];

      for (let page = 2; page <= lastPage; page += 1) {
        const nextPage = await fetchPage(page);
        if (nextPage.data?.length) {
          mergedBuckets = mergedBuckets.concat(nextPage.data);
        }
        setFetchProgress({ current: page, total: lastPage });
      }

      setResponseData({
        ...firstPage,
        data: mergedBuckets,
        meta: {
          ...(firstPage.meta || {}),
          current_page: lastPage,
          fetched_pages: lastPage,
          fetched_items: mergedBuckets.length,
        },
      });

      toast.success(`Retrieved Successfully. Loaded ${mergedBuckets.length} items from ${lastPage} page(s).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error while fetching Timetaag data";
      setError(message);
      toast.error(message);
    } finally {
      setFetchProgress((prev) => (prev.total > 0 ? prev : { current: 0, total: 0 }));
      setLoading(false);
    }
  };

  const progressPercent = useMemo(() => {
    if (!fetchProgress.total) return 0;
    return Math.min(100, Math.round((fetchProgress.current / fetchProgress.total) * 100));
  }, [fetchProgress]);

  const flattenedRows = useMemo(() => {
    return (responseData?.data || []).flatMap((bucket) => bucket.list || []);
  }, [responseData]);

  const totals = useMemo(() => {
    const result = {
      total: flattenedRows.length,
      present: 0,
      absent: 0,
      missedPunch: 0,
    };

    for (const row of flattenedRows) {
      if ((row.StatusCode || "").toUpperCase().includes("P")) result.present += 1;
      if ((row.StatusCode || "").toUpperCase().includes("A")) result.absent += 1;
      if ((row.IsInPunchMissed || 0) === 1 || (row.IsOutPunchMissed || 0) === 1) result.missedPunch += 1;
    }

    return result;
  }, [flattenedRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return flattenedRows.filter((row) => {
      if (statusFilter === "present" && !(row.StatusCode || "").toUpperCase().includes("P")) return false;
      if (statusFilter === "absent" && !(row.StatusCode || "").toUpperCase().includes("A")) return false;
      if (statusFilter === "missed" && !((row.IsInPunchMissed || 0) === 1 || (row.IsOutPunchMissed || 0) === 1)) return false;

      if (!q) return true;

      return [
        row.emp_name,
        row.emp_code,
        row.dept_name,
        row.loc_name,
        row.name,
        row.ShiftCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [flattenedRows, search, statusFilter]);

  return (
    <>
      <Back
      extra={<button
            type="button"
            onClick={fetchProcessData}
            disabled={loading}
            style={{
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.65rem 0.95rem",
              background: loading ? "#9ca3af" : "#111827",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading && fetchProgress.total > 0
              ? `${fetchProgress.current}/${fetchProgress.total}`
              : loading
              ? "Fetching..."
              : "Fetch"}
          </button>}
        fixed
        blurBG
        title="Timetaag"
        // subtitle={totals.total ? `${totals.total} records` : null}
        icon={<img src="/timetaag.png" alt="Timetaag" style={{ width: "1.75rem", height: "1.75rem", objectFit: "contain" }} />}
      />
      <div
        style={{
          padding: "1.25rem",
          paddingTop: "5.5rem",
          paddingBottom: "1.5rem",
          minHeight: "100svh",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginTop: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1rem",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            height: isDesktop ? "calc(100svh - 8.5rem)" : "auto",
          }}
        >
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", marginBottom: "0.85rem" }}>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>From Date</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>To Date</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, code, dept, location"
              />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Status Filter</span>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as "all" | "present" | "absent" | "missed")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="missed">Missed Punch</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          {loading && fetchProgress.total > 0 && (
            <div style={{ marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.78rem", opacity: 0.75 }}>
                  Fetching page {fetchProgress.current} of {fetchProgress.total}
                </span>
                <span style={{ fontSize: "0.78rem", opacity: 0.75 }}>{progressPercent}%</span>
              </div>
              <div style={{ width: "100%", height: "0.45rem", background: "rgba(100,100,100,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, rgb(59,130,246), rgb(99,102,241))",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: isDesktop ? "repeat(auto-fit, minmax(150px, 1fr))" : "repeat(2, minmax(0, 1fr))",
              marginBottom: "0.9rem",
            }}
          >
            <div style={{ border: "1px solid rgba(100,100,100,0.15)", borderRadius: "0.6rem", padding: "0.65rem 0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.74rem", opacity: 0.65 }}>Total</p>
              <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{totals.total}</p>
            </div>
            <div style={{ border: "1px solid rgba(100,100,100,0.15)", borderRadius: "0.6rem", padding: "0.65rem 0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.74rem", opacity: 0.75 }}>Present</p>
              <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "rgb(5,150,105)" }}>{totals.present}</p>
            </div>
            <div style={{ border: "1px solid rgba(100,100,100,0.15)", borderRadius: "0.6rem", padding: "0.65rem 0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.74rem", opacity: 0.75 }}>Absent</p>
              <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "rgb(220,38,38)" }}>{totals.absent}</p>
            </div>
            <div style={{ border: "1px solid rgba(100,100,100,0.15)", borderRadius: "0.6rem", padding: "0.65rem 0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.74rem", opacity: 0.75 }}>Missed Punch</p>
              <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "rgb(217,119,6)" }}>{totals.missedPunch}</p>
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(100,100,100,0.15)",
              borderRadius: "0.7rem",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              flex: isDesktop ? 1 : undefined,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                overflowX: "auto",
                overflowY: isDesktop ? "auto" : "visible",
                minHeight: 0,
                flex: isDesktop ? 1 : undefined,
              }}
            >
            <table style={{ width: "100%", minWidth: "1250px", borderCollapse: "separate", borderSpacing: 0, background: "#fff" }}>
              <thead>
                <tr style={{ background: "rgba(100,100,100,0.08)" }}>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Employee</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Code</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Dept</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Designation</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>In Time</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Out Time</th>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontSize: "0.78rem", position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Work</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "1rem", opacity: 0.6 }}>
                      {loading ? "Fetching..." : "No records found"}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const badge = statusBadge(row.DetailedStatus || row.StatusCode);
                    return (
                      <tr key={`${row.ProcessDataId || "row"}-${index}`} style={{ borderTop: "1px solid rgba(100,100,100,0.12)" }}>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem", fontWeight: 600 }}>{row.emp_name || "-"}</td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem", fontFamily: "monospace" }}>{row.emp_code || "-"}</td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem" }}>{row.dept_name || "-"}</td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem" }}>{row.name || "-"}</td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem" }}>{row.loc_name || "-"}</td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem" }}>
                          <span
                            style={{
                              padding: "0.18rem 0.5rem",
                              borderRadius: "999px",
                              fontWeight: 600,
                              background: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem" }}>{formatDateTime(row.StaffInTime)}</td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem" }}>{formatDateTime(row.StaffOutTime)}</td>
                        <td style={{ padding: "0.65rem", fontSize: "0.82rem" }}>{formatMinutes(row.WorkDurationMins)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>

          {error ? (
            <p style={{ marginTop: "0.75rem", color: "#dc2626", fontWeight: 500 }}>{error}</p>
          ) : null}

          <details style={{ marginTop: "0.85rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.84rem" }}>API Meta</summary>
            <pre
              style={{
                marginTop: "0.5rem",
                maxHeight: "20svh",
                overflow: "auto",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                padding: "0.75rem",
                fontSize: "0.78rem",
                lineHeight: 1.45,
              }}
            >
              {JSON.stringify(responseData?.meta || {}, null, 2)}
            </pre>
          </details>

          <div style={{display:"flex", flexFlow:"column", gap:"1rem", paddingTop:"0.5rem", overflowY:"auto", maxHeight:"35svh"}}>
          </div>
        </div>
      </div>
    </>
  );
}
