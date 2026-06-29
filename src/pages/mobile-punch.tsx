import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Fingerprint,
  Loader2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function MobilePunch() {
  const { userData } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [punchType, setPunchType] = useState<number>(0); // 0 = In, 1 = Out
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Press & Hold states
  const [holdPercent, setHoldPercent] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const startTimeRef = useRef<number>(0);

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
          .select("serial_no, location")
          .not("location", "is", null);

        if (devsErr) throw devsErr;
        setDevices(devs || []);

        if (emp) {
          await checkLastPunch(emp.device_user_id);
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
      // Find matching device serial by matching employee location
      let selectedDeviceSerial = "MOBILE";
      let resolvedLocation = employee.location || "Mobile";

      if (devices && devices.length > 0) {
        const matchedDevice = devices.find(
          d => d.location?.toLowerCase() === employee.location?.toLowerCase()
        );
        if (matchedDevice) {
          selectedDeviceSerial = matchedDevice.serial_no;
          resolvedLocation = matchedDevice.location;
        } else {
          // Default to the first device in the table
          selectedDeviceSerial = devices[0].serial_no;
          resolvedLocation = devices[0].location;
        }
      }

      const now = new Date();

      const { error } = await supabase
        .from("punches")
        .insert({
          user_id: employee.device_user_id,
          punch_time: now.toISOString(),
          verify_type: 3, // Password/Mobile Code
          punch_type: punchType,
          device_serial: selectedDeviceSerial,
          location: resolvedLocation,
          raw: `MOBILE_CLOCK_IN_BY_${userData?.email || "WEB"}`
        });

      if (error) throw error;

      toast.success(
        `Successfully clocked ${punchType === 0 ? "IN" : "OUT"} at ${resolvedLocation}!`
      );

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Re-check status to swap state automatically
      await checkLastPunch(employee.device_user_id);
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
        fixed
        blurBG
        title="Punch"
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
    </div>
  );
}
