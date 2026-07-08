import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import { ResponsiveModal } from "@/components/responsive-modal";
import { supabase } from "@/lib/supabase";
import { findProjectForCoordinates, parseLocationGeofence } from "@/lib/geofence";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CircleStar,
  Fingerprint,
  Loader2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function MobilePunch() {
  const { userData } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [punchType, setPunchType] = useState<number>(0); // 0 = In, 1 = Out
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [monthlyPoints, setMonthlyPoints] = useState<number>(0);
  const [pointsModalOpen, setPointsModalOpen] = useState<boolean>(false);

  // Press & Hold states
  const [holdPercent, setHoldPercent] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const startTimeRef = useRef<number>(0);

  const fetchMonthlyPoints = async (empUserId: string, devsList: any[]) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonthStr = `${year}-${month}-01T00:00:00`;

      const { data: monthPunches, error } = await supabase
        .from("punches")
        .select("punch_time, device_serial")
        .eq("user_id", empUserId)
        .gte("punch_time", startOfMonthStr)
        .order("punch_time", { ascending: true });

      if (error) throw error;

      const points = calculatePoints(monthPunches || [], devsList || []);
      setMonthlyPoints(points);
    } catch (err) {
      console.error("Error fetching monthly points:", err);
    }
  };

  // Fetch employee, devices, and initial punch status
  useEffect(() => {
    async function loadData() {
      if (!userData?.email) return;
      try {
        setLoadingProfile(true);

        // Find employee in Supabase
        const { data: emp, error: empErr } = await supabase
          .from("employees")
          .select("*")
          .or(`email.eq.${userData.email},emp_id.eq.${userData.employeeCode || ""}`)
          .maybeSingle();

        if (empErr) throw empErr;
        setEmployee(emp);

        // Fetch devices to match locations
        const { data: devs, error: devsErr } = await supabase
          .from("devices")
          .select("serial_no, location, start_time, end_time")
          .not("location", "is", null);

        if (devsErr) throw devsErr;
        setDevices(devs || []);

        // Fetch projects to match geofence config
        const { data: projs, error: projsErr } = await supabase
          .from("projects")
          .select("project_code, project_name, project_location");

        if (projsErr) throw projsErr;
        setProjects(projs || []);

        if (emp) {
          await checkLastPunch(emp.device_user_id);
          await fetchMonthlyPoints(emp.device_user_id, devs || []);
        }
      } catch (err: any) {
        console.error("Error loading mobile punch data:", err);
        toast.error("Failed to load profile details.");
      } finally {
        setLoadingProfile(false);
      }
    }
    loadData();
  }, [userData]);

  // Check last punch of today to determine action (In vs Out)
  const checkLastPunch = async (empUserId: string) => {
    try {
      setCheckingStatus(true);

      // Start of today in Muscat timezone (UTC+4)
      const now = new Date();
      const muscatOffset = 4 * 60 * 60 * 1000;
      const muscatNow = new Date(now.getTime() + muscatOffset);
      const muscatStart = new Date(muscatNow);
      muscatStart.setUTCHours(0, 0, 0, 0);
      // Convert back to UTC date object
      const startOfToday = new Date(muscatStart.getTime() - muscatOffset);

      const { data: punches, error } = await supabase
        .from("punches")
        .select("punch_type, punch_time")
        .eq("user_id", empUserId)
        .gte("punch_time", startOfToday.toISOString())
        .order("punch_time", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (punches && punches.length > 0) {
        // If last punch was Check In (0), offer Check Out (1) next. Otherwise, Check In (0).
        setPunchType(punches[0].punch_type === 0 ? 1 : 0);
      } else {
        // No punches today, default to Check In (0)
        setPunchType(0);
      }
    } catch (err) {
      console.error("Error checking last punch status:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmitPunch = async () => {
    if (!employee) {
      toast.error("No employee profile found. Cannot punch.");
      return;
    }

    setSubmitting(true);
    try {
      // Get GPS Coordinates
      let coordinatesStr = "";
      try {
        coordinatesStr = await new Promise<string>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this device/browser."));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude.toFixed(6);
              const lng = position.coords.longitude.toFixed(6);
              resolve(`${lat}, ${lng}`);
            },
            (error) => {
              let msg = "Failed to retrieve location coordinates.";
              if (error.code === error.PERMISSION_DENIED) {
                msg = "Location permission denied. Please enable location access in your browser settings to punch.";
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = "Location information is unavailable. Please make sure GPS is turned on.";
              } else if (error.code === error.TIMEOUT) {
                msg = "Location request timed out. Please try again.";
              }
              reject(new Error(msg));
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        });
      } catch (geoErr: any) {
        toast.error(geoErr.message || "Failed to get location coordinates.");
        setSubmitting(false);
        return;
      }

      // Find matching device serial by matching employee location
      let selectedDeviceSerial = "MOBILE";

      if (devices && devices.length > 0) {
        const matchedDevice = devices.find(
          d => d.location?.toLowerCase() === employee.location?.toLowerCase()
        );
        if (matchedDevice) {
          selectedDeviceSerial = matchedDevice.serial_no;
        } else {
          // Default to the first device in the table
          selectedDeviceSerial = devices[0].serial_no;
        }
      }

      // Check if coordinates match a project geofence
      let geofenceResult = null;
      let finalMobileLocation = coordinatesStr;
      try {
        const [latStr, lngStr] = coordinatesStr.split(',');
        const latVal = parseFloat(latStr.trim());
        const lngVal = parseFloat(lngStr.trim());
        if (!isNaN(latVal) && !isNaN(lngVal)) {
          geofenceResult = findProjectForCoordinates(latVal, lngVal, projects);
          if (geofenceResult) {
            const { project } = geofenceResult;
            const { name: locName } = parseLocationGeofence(project.project_location);
            finalMobileLocation = `${coordinatesStr} @ ${locName || project.project_name}`;
          }
        }
      } catch (err) {
        console.error("Error matching geofence:", err);
      }

      const now = new Date();

      // Format local Muscat time to match biometric device log format: YYYY-MM-DD HH:mm:ss
      const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Muscat'
      });
      const parts = formatter.formatToParts(now);
      const y = parts.find(p => p.type === 'year')?.value;
      const mo = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      const h = parts.find(p => p.type === 'hour')?.value;
      const mi = parts.find(p => p.type === 'minute')?.value;
      const s = parts.find(p => p.type === 'second')?.value;
      const formattedLocalTime = `${y}-${mo}-${d} ${h}:${mi}:${s}`;

      const rawString = `${employee.device_user_id}\t${formattedLocalTime}\t5\t${punchType}\t0\t\t\t0\t0`;

      const { error } = await supabase
        .from("punches")
        .insert({
          user_id: employee.device_user_id,
          punch_time: now.toISOString(),
          verify_type: 5, // Mobile
          punch_type: punchType,
          device_serial: selectedDeviceSerial,
          mobile_location: finalMobileLocation,
          raw: rawString
        });

      if (error) throw error;

      let displayLoc = coordinatesStr;
      if (geofenceResult) {
        const { name: locName } = parseLocationGeofence(geofenceResult.project.project_location);
        displayLoc = `Within ${locName || geofenceResult.project.project_name}`;
      }

      const locationText = displayLoc;

      toast.success(
        `Successfully clocked ${punchType === 0 ? "IN" : "OUT"}! (${locationText})`
      );

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Re-check status to swap state automatically
      await checkLastPunch(employee.device_user_id);
      await fetchMonthlyPoints(employee.device_user_id, devices);
    } catch (err: any) {
      console.error("Error inserting punch:", err);
      toast.error(err.message || "Failed to submit punch.");
    } finally {
      setSubmitting(false);
    }
  };

  // Press & Hold Logic
  useEffect(() => {
    let intervalId: any;
    if (isPressing) {
      startTimeRef.current = Date.now();
      const duration = 3000; // 3 seconds

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const percent = Math.min(100, (elapsed / duration) * 100);
        setHoldPercent(percent);

        if (elapsed >= duration) {
          setIsPressing(false);
          setHoldPercent(0);
          clearInterval(intervalId);
          handleSubmitPunch();
        }
      }, 30);
    } else {
      setHoldPercent(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPressing, punchType]);

  const handleStartPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!employee || submitting || checkingStatus) return;
    setIsPressing(true);
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  const handleEndPress = () => {
    setIsPressing(false);
  };

  // SVG Circumference calculation for larger button
  // Radius = 130, Circumference = 2 * PI * R = 816.81
  const strokeRadius = 130;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (holdPercent / 100) * strokeCircumference;

  // Accents matching punchType
  const activeColor = punchType === 0 ? "#1e3a8a" : "#9f1239"; // Deep Blue vs Deep Red
  const activeBg = punchType === 0 ? "#eff6ff" : "#fff1f2";
  const activeBorder = punchType === 0 ? "rgba(30, 58, 138, 0.2)" : "rgba(159, 18, 57, 0.2)";

  return (
    <div
      style={{

        height: "100svh",
        overflowY: "auto",
        backgroundColor: "#f9fafb",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Back
        noback
        fixed
        blurBG
        title=""
        extra={
          employee && (
            <div
              onClick={() => setPointsModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(229, 231, 235, 0.6)",
                borderRadius: "9999px",
                padding: "0.3rem 0.35rem",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                cursor: "pointer"
              }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#4b5563", marginLeft: "", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CircleStar className="text-indigo-500" />
                Points
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e3a8a" }}>
                {monthlyPoints}
              </span>
              <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "white", background: "linear-gradient(90deg, darkblue, darkslateblue)", padding: "0.1rem 0.5rem", borderRadius: "9999px", marginRight: "0.25rem" }}>
                {getTierName(monthlyPoints)}
              </span>
            </div>
          )
        }
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", maxWidth: "450px", margin: "0 auto", justifyContent: "center", alignItems: "center", border: "" }}>

        {!employee && !loadingProfile ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "#ef4444", textAlign: "center", padding: "1.5rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
            <AlertCircle className="w-10 h-10" />
            <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#111827" }}>
              Biometric Registration Required
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: "1.4" }}>
              You must be registered in the biometric database to use Mobile Punch. Please contact HR or System Administrator.
            </div>
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              width: "300px",
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {/* Circular SVG Progress Ring */}
            <svg
              width="300"
              height="300"
              style={{
                position: "absolute",
                transform: "rotate(-90deg)",
                pointerEvents: "none"
              }}
            >
              {/* Background Ring */}
              <circle
                cx="150"
                cy="150"
                r={strokeRadius}
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Active Progress Ring */}
              <motion.circle
                cx="150"
                cy="150"
                r={strokeRadius}
                stroke={checkingStatus || loadingProfile ? "#d1d5db" : activeColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={checkingStatus || loadingProfile ? strokeCircumference : strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: isPressing ? "none" : "stroke-dashoffset 0.3s ease-out"
                }}
              />
            </svg>

            {/* Central Trigger Button */}
            <motion.button
              onMouseDown={handleStartPress}
              onMouseUp={handleEndPress}
              onMouseLeave={handleEndPress}
              onTouchStart={handleStartPress}
              onTouchEnd={handleEndPress}
              onContextMenu={(e) => e.preventDefault()}
              animate={{
                scale: isPressing ? 0.94 : 1,
                boxShadow: isPressing
                  ? `0 0 0 10px ${activeBorder}`
                  : "0 4px 20px rgba(0, 0, 0, 0.05)"
              }}
              disabled={submitting || checkingStatus || loadingProfile}
              style={{
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                backgroundColor: isPressing ? activeBg : "#ffffff",
                border: `2px solid ${isPressing ? activeColor : "#e5e7eb"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.8rem",
                cursor: (submitting || checkingStatus || loadingProfile) ? "not-allowed" : "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                outline: "none"
              }}
            >
              {submitting || checkingStatus || loadingProfile ? (
                <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]" />
              ) : (
                <>
                  <Fingerprint
                    className="w-16 h-16"
                    style={{
                      color: activeColor,
                      transition: "color 0.2s"
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1f2937", letterSpacing: "0.02em" }}>
                      {isPressing
                        ? (punchType === 0 ? "CHECKING IN..." : "CHECKING OUT...")
                        : (punchType === 0 ? "CHECK IN" : "CHECK OUT")
                      }
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.15rem" }}>
                      {/* {isPressing
                        ? `${((3000 - (holdPercent * 30)) / 1000).toFixed(1)}s left`
                        : "for 3 seconds"
                      } */}
                      Tap and Hold
                    </span>
                  </div>
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
      <ResponsiveModal
        open={pointsModalOpen}
        onOpenChange={setPointsModalOpen}
        title=""
        description=""
      >
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", color: "#374151" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h4 style={{ fontWeight: 600, fontSize: "1rem", color: "#1f2937", border: '', textAlign: "center" }}>Points</h4>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0.75rem",
              marginTop: "0.5rem"
            }}>
              {/* Tile 1 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.25rem 0.75rem",
                background: "",
                border: "1px solid #e5e7eb",
                borderRadius: "1rem",
                textAlign: "center",
                gap: "0.35rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "" }}>
                  <CircleStar className="w-8 h-8 text-indigo-500" />
                  <span style={{ fontSize: "2.25rem", fontWeight: 600 }}>15</span>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "" }}>Within 5m</span>
                <span style={{ fontSize: "0.8rem", color: "", fontWeight: 500 }}>On-time arrival</span>
              </div>

              {/* Tile 2 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.25rem 0.75rem",
                background: "",
                border: "1px solid #e5e7eb",
                borderRadius: "1rem",
                textAlign: "center",
                gap: "0.35rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "" }}>
                  <CircleStar className="w-8 h-8 text-indigo-500" />
                  <span style={{ fontSize: "2.25rem", fontWeight: 600 }}>10</span>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "" }}>Within 15m</span>
                <span style={{ fontSize: "0.8rem", color: "", fontWeight: 500 }}>Up to 15 mins late</span>
              </div>

              {/* Tile 3 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.25rem 0.75rem",
                background: "",
                border: "1px solid #e5e7eb",
                borderRadius: "1rem",
                textAlign: "center",
                gap: "0.35rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "" }}>
                  <CircleStar className="w-8 h-8 text-indigo-500" />
                  <span style={{ fontSize: "2.25rem", fontWeight: 600 }}>5</span>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "" }}>Within 30m</span>
                <span style={{ fontSize: "0.8rem", color: "", fontWeight: 500 }}>Up to 30 mins late</span>
              </div>

              {/* Tile 4 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.25rem 0.75rem",
                background: "",
                border: "1px solid #e5e7eb",
                borderRadius: "1rem",
                textAlign: "center",
                gap: "0.35rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "" }}>
                  <CircleStar className="w-8 h-8 text-indigo-500" />
                  <span style={{ fontSize: "2.25rem", fontWeight: 600 }}>0</span>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Beyond 30m</span>
                <span style={{ fontSize: "0.8rem", color: "", fontWeight: 500 }}>Over 30 mins late</span>
              </div>
            </div>
          </div>



          <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", marginTop: "0.5rem" }}>
            Points reset on the first day of every month.
          </p>
        </div>
      </ResponsiveModal>
    </div>
  );
}

function getTierName(points: number): string {
  if (points >= 300) return "Platinum";
  if (points >= 200) return "Gold";
  if (points >= 100) return "Silver";
  if (points >= 50) return "Bronze";
  return "New";
}

function getLocalTimeParts(iso: string): { hour: number; minute: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'Asia/Muscat'
    });
    const parts = formatter.formatToParts(new Date(iso));
    const hourPart = parts.find(p => p.type === 'hour')?.value;
    const minutePart = parts.find(p => p.type === 'minute')?.value;
    if (hourPart && minutePart) {
      return {
        hour: parseInt(hourPart, 10),
        minute: parseInt(minutePart, 10)
      };
    }
  } catch (e) {
    console.error('Error parsing local time parts:', e);
  }
  return null;
}

function calculatePoints(punches: any[], devices: any[]): number {
  const devicesMap = Object.fromEntries(
    devices.map(d => [d.serial_no, d])
  );

  const punchesByDate: Record<string, any[]> = {};
  punches.forEach(p => {
    try {
      const dateStr = new Date(p.punch_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
      if (!punchesByDate[dateStr]) {
        punchesByDate[dateStr] = [];
      }
      punchesByDate[dateStr].push(p);
    } catch (e) {
      console.error("Error grouping punch by date:", e);
    }
  });

  let totalPoints = 0;

  Object.values(punchesByDate).forEach(dayPunches => {
    const sorted = [...dayPunches].sort((a, b) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
    if (sorted.length > 0) {
      const firstPunch = sorted[0];
      const dev = devicesMap[firstPunch.device_serial];
      const startTime = dev?.start_time || "08:00";

      const punchTimeParts = getLocalTimeParts(firstPunch.punch_time);
      if (punchTimeParts && startTime.includes(':')) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const punchMins = punchTimeParts.hour * 60 + punchTimeParts.minute;
        const startMins = startHour * 60 + startMin;
        const diff = punchMins - startMins;

        if (diff <= 5) {
          totalPoints += 15;
        } else if (diff <= 15) {
          totalPoints += 10;
        } else if (diff <= 30) {
          totalPoints += 5;
        }
      }
    }
  });

  return totalPoints;
}
