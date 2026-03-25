import { ClipboardList, Fuel, HardHat, Notebook, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";

interface NavItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}

type NavItemId = "modules" | "workers" | "tasks" | "phonebook" | "fuel-log";

interface NavItemConfig {
  id: NavItemId;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, isActive, onClick, isMobile = false }) => {
  return (
    <div
      onClick={onClick}
      style={{
        border:"none",
        flex: isMobile ? 1 : 'none',
        display: "flex",
        justifyContent: "center",
        background: isActive 
          ? (isMobile ? "black" : "black")
          : "none",
        color: isActive ? "white" : "darkslategray",
        fontSize: "0.9rem",
        borderRadius: "0.75rem",
        alignItems: "center",
        padding: isMobile ? "0.75rem" : "0.5rem 2rem",
        cursor: "pointer",
        transition: "all",
        boxShadow:isActive?"1px 1px 5px rgba(0,0,0,0.5)":"none"
      }}
    >
      {icon}
    </div>
  );
};

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const [activeNav, setActiveNav] = useState<"modules" | "workers" | "tasks" | "phonebook" | "fuel-log" | null>(null);
  const isSiteAdmin = userData?.role === "site_admin";

  // Check if user has an allocated vehicle
  const hasAllocatedVehicle = !!userData?.allocated_vehicle;

  const navItems: NavItemConfig[] = [
    {
      id: isSiteAdmin ? "workers" : "modules",
      icon: isSiteAdmin ? <HardHat /> : <Package />,
      label: isSiteAdmin ? "Workers" : "Modules",
      path: isSiteAdmin ? "/site-admin-workers" : "/index",
    },
    { id: "tasks" as const, icon: <ClipboardList />, label: "Tasks", path: "/tasks" },
    { id: "phonebook" as const, icon: <Notebook />, label: "Phonebook", path: "/phonebook" },
    ...(hasAllocatedVehicle ? [{ id: "fuel-log" as const, icon: <Fuel />, label: "Fuel Log", path: "/fuel-log" }] : []),
  ];

  // Update active nav based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === "/index") {
      setActiveNav(isSiteAdmin ? "workers" : "modules");
    } else if (currentPath === "/site-admin-workers") {
      setActiveNav("workers");
    } else if (currentPath === "/phonebook") {
      setActiveNav("phonebook");
    } else if (currentPath === "/tasks") {
      setActiveNav("tasks");
    } else if (currentPath === "/fuel-log") {
      setActiveNav("fuel-log");
    } else {
      // Don't highlight any nav item for other pages
      setActiveNav(null);
    }
  }, [location.pathname, isSiteAdmin]);

  const hasModuleAccess = (moduleId: string) => {
    try {
      const permissions = JSON.parse(userData?.clearance || '{}');
      return permissions[moduleId] === true;
    } catch {
      return false;
    }
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.id === "phonebook" && (hasModuleAccess('phonebook') || isSiteAdmin)) {
      navigate(item.path);
    } else if (item.id === "phonebook") {
      toast.error("No clearance to access Phonebook");
    } else if (item.id === "fuel-log") {
      navigate(item.path);
    } else if (item.id === "modules") {
      navigate(item.path);
    } else if (item.id === "workers") {
      navigate(item.path);
    } else if (item.id === "tasks") {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Responsive Navigation Bar */}
      <div id="nav-container" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 10
      }}>
        {/* Mobile Bottom Nav */}
        <div className="mobile-nav" style={{
          background: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter:"blur(16px)",
          display: "flex",
          padding: "1.5rem 2rem",
          paddingBottom: "2rem",
          borderTopRightRadius: "1rem",
          borderTopLeftRadius: "1rem",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
          gap: "0.5rem",
          zIndex: -1
        }}>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              isActive={activeNav === item.id}
              onClick={() => handleNavClick(item)}
              isMobile={true}
            />
          ))}
        </div>

        {/* Desktop Bottom Nav */}
        <div className="desktop-nav" style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(250, 250, 250, 0.4)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter:"blur(16px)",
          display: "none",
          flexDirection: "row",
          padding: "0.5rem",
          borderRadius: "1.25rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          gap: "0.5rem",
          zIndex: 10,
          border: ""
        }}>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              isActive={activeNav === item.id}
              onClick={() => handleNavClick(item)}
              isMobile={false}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-nav {
            display: none !important;
          }
          .desktop-nav {
            display: flex !important;
          }
        }
        
        @media (max-width: 767px) {
          .mobile-nav {
            display: flex !important;
          }
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
