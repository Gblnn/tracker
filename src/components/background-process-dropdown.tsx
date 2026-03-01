import { useBackgroundProcess } from "@/context/BackgroundProcessContext";
import { getPendingFuelLogsCount } from "@/utils/offlineFuelLogs";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { CheckCircle2, Cloud, CloudOff, Loader2, XCircle } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface Props {
  className?: string;
}

export default function BackgroundProcessDropdown(props: Props) {
  const { processes, clearCompleted } = useBackgroundProcess();
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update pending count on mount and when processes change
    setPendingCount(getPendingFuelLogsCount());
    
    // Set up interval to check for pending logs
    const interval = setInterval(() => {
      setPendingCount(getPendingFuelLogsCount());
    }, 2000);
    
    return () => clearInterval(interval);
  }, [processes]);

  useEffect(() => {
    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeProcesses = processes.filter(
    p => p.status === "pending" || p.status === "in-progress"
  );
  const completedProcesses = processes.filter(
    p => p.status === "completed" || p.status === "error"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "in-progress":
        return <Loader2 className="animate-spin" width="1rem" color="dodgerblue" />;
      case "completed":
        return <CheckCircle2 width="1rem" color="dodgerblue" />;
      case "error":
        return <XCircle width="1rem" color="lightcoral" />;
      default:
        return null;
    }
  };

  const hasActiveProcesses = activeProcesses.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={props.className}
        style={{
          outline: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "none",
          height: "2.5rem",
          width: "2.5rem",
          background: hasActiveProcesses 
            ? "rgba(30, 144, 255, 0.2)" 
            : isOnline 
              ? "rgba(100, 100, 100, 0.1)"
              : "rgba(100, 100, 100, 0.1)",
          borderRadius: "0.375rem",
          position: "relative",
        }}
      >
        {hasActiveProcesses ? (
          <Loader2 className="animate-spin" width="1.25rem" color="dodgerblue" />
        ) : isOnline ? (
          <Cloud width="1.25rem" color="rgb(34, 197, 94)" />
        ) : (
          <CloudOff width="1.25rem" color="rgb(239, 68, 68)" />
        )}
        {/* {hasActiveProcesses && (
          <span
            style={{
              position: "absolute",
              top: "-0.25rem",
              right: "-0.25rem",
              background: "dodgerblue",
              color: "white",
              borderRadius: "50%",
              width: "1.25rem",
              height: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.65rem",
              fontWeight: "bold",
            }}
          >
            {activeProcesses.length}
          </span>
        )} */}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="mr-5 mt-1"
        style={{
          width: "260px",
          
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DropdownMenuLabel style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}>
        
          Background Activity
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {pendingCount > 0 && (
          <>
            <DropdownMenuItem
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.75rem",
                cursor: "default",
                background: "rgba(30, 144, 255, 0.1)",
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <CloudOff width="0.875rem" color="dodgerblue" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: "0.8rem" }}>
                  {pendingCount} Pending Fuel Log{pendingCount > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "0.0625rem" }}>
                  Will sync when online
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {processes.length === 0 && pendingCount === 0 ? (
          <div
            style={{
              padding: "1rem 0.75rem",
              textAlign: "center",
              opacity: 0.6,
              fontSize: "0.8rem",
            }}
          >
            No active background activity.
          </div>
        ) : (
          <DropdownMenuGroup>
            {activeProcesses.length > 0 && (
              <>
                {activeProcesses.map((process) => (
                  <DropdownMenuItem
                    key={process.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "0.25rem 0.75rem",
                      cursor: "default",
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        width: "100%",
                      }}
                    >
                      {getStatusIcon(process.status)}
                      <span style={{ fontWeight: 500, fontSize: "0.8rem" }}>{process.name}</span>
                    </div>
                    {process.message && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.7,
                          marginTop: "0.125rem",
                          marginLeft: "1.25rem",
                        }}
                      >
                        {process.message}
                      </span>
                    )}
                    {process.progress !== undefined && (
                      <div
                        style={{
                          width: "100%",
                          height: "3px",
                          background: "rgba(100, 100, 100, 0.2)",
                          borderRadius: "1.5px",
                          marginTop: "0.375rem",
                          marginLeft: "1.25rem",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${process.progress}%`,
                            height: "100%",
                            background: "dodgerblue",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {completedProcesses.length > 0 && (
              <>
                {activeProcesses.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.375rem 0.5rem",
                  }}
                >
                  <span>Recent</span>
                  <button
                    onClick={clearCompleted}
                    style={{
                      fontSize: "0.65rem",
                      padding: "0.15rem 0.75rem",
                      background: "rgba(100, 100, 100, 0.2)",
                      borderRadius: "0.2rem",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </DropdownMenuLabel>
                {completedProcesses.map((process) => (
                  <DropdownMenuItem
                    key={process.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.4rem 0.5rem",
                      opacity: 0.7,
                      cursor: "default",
                      gap: "0.5rem",
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {getStatusIcon(process.status)}
                      <span style={{ fontWeight: 500, fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{process.name}</span>
                    </div>
                    {process.endTime && (
                      <span
                        style={{
                          fontSize: "0.625rem",
                          opacity: 0.6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {moment(process.endTime).fromNow()}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
