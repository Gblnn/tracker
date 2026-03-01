import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Bug, LoaderCircle, LogOut, RefreshCcw, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import DefaultDialog from "./ui/default-dialog";
import emailjs from "@emailjs/browser";
import moment from "moment";
import { auth } from "@/firebase";
import { toast } from "sonner";

interface Props {
  className?: string;
  onLogout: () => void;
  onProfile: () => void;
  onBug?: () => void;
}

export default function IndexDropDown(props:Props) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bugDialog, setBugDialog] = useState(false);
  const [issue, setIssue] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const serviceId = "service_fixajl8";
  const templateId = "template_0f3zy3e";

  useEffect(() => {
    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically check online status (every 2 seconds)
    const checkInterval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, []);

  const handleBugReport = async () => {
    if (!issue.trim()) return;
    
    setLoading(true);
    try {
      await emailjs.init("c8AePKR5BCK8UIn_E"); // Initialize EmailJS with your public key
      
      await emailjs.send(serviceId, templateId, {
        name: auth.currentUser?.email,
        subject: "Bug Report - " + moment().format("ll") + " from " + auth.currentUser?.email,
        recipient: "goblinn688@gmail.com",
        message: issue,
      });
      
      // First close the dialog and reset state
      setBugDialog(false);
      setIssue("");
      
      // Then show the success message in the next tick
      setTimeout(() => {
        toast.success("Bug Report sent");
      }, 0);
      
    } catch (error) {
      // Show error in the next tick
      setTimeout(() => {
        toast.error("Failed to send bug report");
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
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
          background: isOnline 
            ? "linear-gradient(mediumslateblue, midnightblue)"
            : "linear-gradient(indianred, darkred)",
          color: "white",
          borderRadius: "0.375rem",
        }}
      >
        {userData?.email ? (
          <p className="text-sm">{getInitials(userData.name.split("@")[0])}</p>
        ) : (
          <UserX className="opacity-50" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="mr-5 mt-1" style={{display:"flex", justifyContent:"flex-start", alignItems:"flex-start"}}>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={props.onProfile}
            className="p-4 cursor-pointer"
          >
            <div style={{paddingRight:"1.5rem"}} className="flex">
              <Avatar  className="h-12 w-12">
                <AvatarFallback style={{fontWeight:"600", background:"linear-gradient( mediumslateblue, midnightblue)", color:"white"}} className="text-lg">
                  {userData?.name
                    ? getInitials(userData.name.split("@")[0])
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div style={{border:"", alignItems:"flex-start", gap:"0.1rem"}} className="flex flex-col ">
                <p className="text-base font-semibold truncate">
                  {userData?.name?.split("@")[0] || "No name"}
                </p>
                <p className="text-xs text-primary font-semibold opacity-75 truncate">
                  {userData?.email}
                </p>
                {
                  
                }
                {
                  userData?.role=="admin"&&
                  <span
                  style={{ width: "fit-content", background:"crimson", color:"white" }}
                  className="inline-flex items-center rounded-full px-2 py-0.5 mt-1 text-xs font-medium text-primary"
                >
                  
                  {userData?.role=="admin"?userData.role:""}
                </span>
                }
                
              </div>
            </div>
          </DropdownMenuItem>

          <div className="h-px bg-border my-1" />

          <DropdownMenuItem
            onClick={() => window.location.reload()}
            className="cursor-pointer"
            style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}
          >
            <RefreshCcw color="dodgerblue" className="mr-2 h-4 w-4 text-primary" />
            <span>Force Reload</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setBugDialog(true)}
            className="cursor-pointer"
            style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}
          >
            <Bug className="mr-2 h-4 w-4 text-green-500" />
            <span>Report Bug</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={props.onLogout}
            className="cursor-pointer"
            disabled={loading}
            style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}
          >
            {loading ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut color="salmon" className="mr-2 h-4 w-4 " />
            )}
            <span>{loading ? "Logging out..." : "Logout"}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>

    <DefaultDialog
      title={"Report a Bug"}
      titleIcon={<Bug color="lightgreen" />}
      extra={
        <div
          style={{
            display: "flex",
            width: "100%",
            flexFlow: "column",
            gap: "0.75rem",
            paddingBottom: "0.5rem",
          }}
        >
          <textarea
            onChange={(e) => setIssue(e.target.value)}
            value={issue}
            rows={5}
            placeholder="Describe issue"
          />
        </div>
      }
      open={bugDialog}
      onCancel={() => {
        setBugDialog(false);
        setIssue("");
      }}
      OkButtonText="Report"
      disabled={!issue.trim()}
      onOk={handleBugReport}
      updating={loading}
    />
    </>
  );
  
}

