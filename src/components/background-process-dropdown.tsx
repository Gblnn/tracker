import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { CheckCircle2, Cloud, Loader2, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { useBackgroundProcess } from "@/context/BackgroundProcessContext";
import moment from "moment";

interface Props {
  className?: string;
}

export default function BackgroundProcessDropdown(props: Props) {
  const { processes, clearCompleted } = useBackgroundProcess();

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
        return <CheckCircle2 width="1rem" color="lightgreen" />;
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
            : "rgba(100, 100, 100, 0.1)",
          borderRadius: "0.375rem",
          position: "relative",
        }}
      >
        {hasActiveProcesses ? (
          <Loader2 className="animate-spin" width="1.25rem" color="dodgerblue" />
        ) : (
          <Cloud width="1.25rem" color="dodgerblue" />
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
          minWidth: "280px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        <DropdownMenuLabel style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Cloud width="1rem" color="dodgerblue" />
          Background Activity
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {processes.length === 0 ? (
          <div
            style={{
              padding: "1.5rem 1rem",
              textAlign: "center",
              opacity: 0.6,
              fontSize: "0.875rem",
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
                      padding: "0.75rem",
                      cursor: "default",
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                      }}
                    >
                      {getStatusIcon(process.status)}
                      <span style={{ fontWeight: 500 }}>{process.name}</span>
                    </div>
                    {process.message && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.7,
                          marginTop: "0.25rem",
                          marginLeft: "1.5rem",
                        }}
                      >
                        {process.message}
                      </span>
                    )}
                    {process.progress !== undefined && (
                      <div
                        style={{
                          width: "100%",
                          height: "4px",
                          background: "rgba(100, 100, 100, 0.2)",
                          borderRadius: "2px",
                          marginTop: "0.5rem",
                          marginLeft: "1.5rem",
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
                    fontSize: "0.75rem",
                    opacity: 0.6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Recent</span>
                  <button
                    onClick={clearCompleted}
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.25rem 0.5rem",
                      background: "rgba(100, 100, 100, 0.2)",
                      borderRadius: "0.25rem",
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
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "0.75rem",
                      opacity: 0.7,
                      cursor: "default",
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                      }}
                    >
                      {getStatusIcon(process.status)}
                      <span style={{ fontWeight: 500 }}>{process.name}</span>
                    </div>
                    {process.message && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.7,
                          marginTop: "0.25rem",
                          marginLeft: "1.5rem",
                        }}
                      >
                        {process.message}
                      </span>
                    )}
                    {process.endTime && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.5,
                          marginTop: "0.25rem",
                          marginLeft: "1.5rem",
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
