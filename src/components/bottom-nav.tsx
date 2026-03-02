import { Package, ClipboardList, Notebook } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";

interface NavItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, isActive, onClick, isMobile = false }) => {
  return (
    <div
      onClick={onClick}
      style={{
        flex: isMobile ? 1 : 'none',
        display: "flex",
        justifyContent: "center",
        background: isActive 
          ? (isMobile ? "linear-gradient(90deg, mediumslateblue, midnightblue)" : "linear-gradient(90deg, mediumslateblue, midnightblue)")
          : "none",
        color: isActive ? "white" : "inherit",
        fontSize: "0.9rem",
        borderRadius: "0.75rem",
        alignItems: "center",
        padding: isMobile ? "0.75rem" : "0.5rem 2rem",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
  const [activeNav, setActiveNav] = useState<"modules" | "tasks" | "phonebook" | null>(null);

  const navItems = [
    { id: "modules" as const, icon: <Package />, label: "Modules", path: "/index" },
    { id: "tasks" as const, icon: <ClipboardList />, label: "Tasks", path: "/tasks" },
    { id: "phonebook" as const, icon: <Notebook />, label: "Phonebook", path: "/phonebook" },
  ];

  // Update active nav based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === "/index") {
      setActiveNav("modules");
    } else if (currentPath === "/phonebook") {
      setActiveNav("phonebook");
    } else if (currentPath === "/tasks") {
      setActiveNav("tasks");
    } else {
      // Don't highlight any nav item for other pages
      setActiveNav(null);
    }
  }, [location.pathname]);

  const hasModuleAccess = (moduleId: string) => {
    try {
      const permissions = JSON.parse(userData?.clearance || '{}');
      return permissions[moduleId] === true;
    } catch {
      return false;
    }
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.id === "phonebook" && hasModuleAccess('phonebook')) {
      navigate(item.path);
    } else if (item.id === "phonebook") {
      toast.error("No clearance to access Phonebook");
    } else if (item.id === "modules") {
      navigate(item.path);
    } else if (item.id === "tasks") {
      toast.info("Tasks module coming soon");
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
          background: "white",
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
          background: "white",
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
