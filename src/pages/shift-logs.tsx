import Back from "@/components/back";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Clock3, Loader2, MapPinned } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ShiftLogItem = {
  id: string;
  employee_name?: string;
  employee_code?: string;
  email?: string;
  shift_start_time?: any;
  shift_start_time_iso?: string;
  shift_end_time?: any;
  shift_end_time_iso?: string;
  shift_start_coordinate?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  shift_end_coordinate?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  created_at?: any;
};

const getDateFromUnknown = (value: any): Date | null => {
  if (!value) return null;

  if (value?.toDate) {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export default function ShiftLogs() {
  const [logs, setLogs] = useState<ShiftLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const fetchShiftLogs = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "shift-logs"));

      const mapped = snap.docs.map((doc) => ({ ...(doc.data() as ShiftLogItem), id: doc.id }));

      mapped.sort((a, b) => {
        const aDate =
          getDateFromUnknown(a.shift_start_time) ||
          getDateFromUnknown(a.shift_start_time_iso) ||
          getDateFromUnknown(a.created_at);
        const bDate =
          getDateFromUnknown(b.shift_start_time) ||
          getDateFromUnknown(b.shift_start_time_iso) ||
          getDateFromUnknown(b.created_at);

        return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
      });

      setLogs(mapped);
    } catch (error) {
      console.error("Error fetching shift logs:", error);
      toast.error("Failed to fetch shift logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftLogs();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const applyMatch = () => setIsDesktop(mediaQuery.matches);
    applyMatch();
    mediaQuery.addEventListener("change", applyMatch);
    return () => mediaQuery.removeEventListener("change", applyMatch);
  }, []);

  const getCoordinateText = (coordinate?: { latitude?: number; longitude?: number; accuracy?: number }) => {
    if (typeof coordinate?.latitude !== "number" || typeof coordinate?.longitude !== "number") {
      return null;
    }

    const lat = coordinate.latitude.toFixed(6);
    const lng = coordinate.longitude.toFixed(6);
    const accuracy =
      typeof coordinate.accuracy === "number" ? ` (±${Math.round(coordinate.accuracy)}m)` : "";

    return `${lat}, ${lng}${accuracy}`;
  };

  const getMapUrl = (coordinate?: { latitude?: number; longitude?: number }) => {
    if (typeof coordinate?.latitude !== "number" || typeof coordinate?.longitude !== "number") {
      return null;
    }

    return `https://www.google.com/maps?q=${coordinate.latitude},${coordinate.longitude}`;
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <div style={{ padding: "", position: "fixed", zIndex: 20 }}>
          <Back
            
            blurBG
            fixed
            title="Shift Logs"
            subtitle={logs.length}
            // icon={<Clock3 color="mediumslateblue" />}
          />
        </div>

        <div
          style={{
            paddingTop: "6rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "8rem",
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Clock3 />
                  </EmptyMedia>
                  <EmptyTitle>No Shift Logs</EmptyTitle>
                  <EmptyDescription>You do not have any shift logs yet.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div
              style={{
                border: "1px solid rgba(100,100,100,0.2)",
                borderRadius: "0.75rem",
                background: "rgba(100,100,100,0.04)",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                flex: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  overflowX: "auto",
                  overflowY: isDesktop ? "auto" : "visible",
                  minHeight: 0,
                  flex: 1,
                }}
              >
              <table style={{ width: "100%", minWidth: "1180px", borderCollapse: "separate", borderSpacing: 0, background: "#fff" }}>
                <thead>
                  <tr style={{ background: "rgba(100,100,100,0.12)" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Employee</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Code</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Start Time</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>End Time</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>Start Coordinates</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, position: isDesktop ? "sticky" : "static", top: 0, zIndex: 5, background: "#f1f3f5", borderBottom: "1px solid rgba(100,100,100,0.2)" }}>End Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const shiftStartTime =
                      getDateFromUnknown(log.shift_start_time) ||
                      getDateFromUnknown(log.shift_start_time_iso) ||
                      getDateFromUnknown(log.created_at);
                    const shiftEndTime =
                      getDateFromUnknown(log.shift_end_time) ||
                      getDateFromUnknown(log.shift_end_time_iso);

                    const startCoordinate = log.shift_start_coordinate || log.location;
                    const endCoordinate = log.shift_end_coordinate;
                    const startCoordinateText = getCoordinateText(startCoordinate);
                    const endCoordinateText = getCoordinateText(endCoordinate);
                    const startMapUrl = getMapUrl(startCoordinate);
                    const endMapUrl = getMapUrl(endCoordinate);

                    return (
                      <tr key={log.id} style={{ borderTop: "1px solid rgba(100,100,100,0.15)" }}>
                        <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                          {log.employee_name || "Unknown Employee"}
                        </td>
                        <td style={{ padding: "0.75rem", verticalAlign: "top", opacity: 0.9 }}>
                          {log.employee_code || "-"}
                        </td>
                        <td style={{ padding: "0.75rem", verticalAlign: "top", opacity: 0.9 }}>
                          {log.email || "-"}
                        </td>
                        <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                          {shiftStartTime ? shiftStartTime.toLocaleString() : "-"}
                        </td>
                        <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                          {shiftEndTime ? shiftEndTime.toLocaleString() : "-"}
                        </td>
                        <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                          {startMapUrl && startCoordinateText ? (
                            <a
                              href={startMapUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                color: "mediumslateblue",
                                textDecoration: "underline",
                                fontSize: "0.9rem",
                              }}
                            >
                              <MapPinned width={14} height={14} />
                              {startCoordinateText}
                            </a>
                          ) : (
                            <span style={{ opacity: 0.7 }}>Location not available</span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                          {endMapUrl && endCoordinateText ? (
                            <a
                              href={endMapUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                color: "mediumslateblue",
                                textDecoration: "underline",
                                fontSize: "0.9rem",
                              }}
                            >
                              <MapPinned width={14} height={14} />
                              {endCoordinateText}
                            </a>
                          ) : (
                            <span style={{ opacity: 0.7 }}>Location not available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
