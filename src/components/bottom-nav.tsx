import { Fuel, HardHat, Notebook, Package } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { motion } from "framer-motion";

interface NavItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}

type NavItemId = "modules" | "workers" | "phonebook" | "fuel-log";

interface NavItemConfig {
  id: NavItemId;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, isActive, onClick, isMobile = false }) => {
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        flex: isMobile ? 1 : 'none',
        display: "flex",
        justifyContent: "center",
        background: "transparent",
        color: isActive ? "#f2f8ff" : "black",
        fontSize: "0.9rem",
        borderRadius: "0.9rem",
        alignItems: "center",
        padding: isMobile ? "0.75rem" : "0.5rem 2rem",
        cursor: "pointer",
        transition: "all 220ms ease",
        boxShadow: "none",
        position: "relative",
        overflow: "visible",
        zIndex: 1,
      }}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
    </motion.div>
  );
};

interface NavRowProps {
  navItems: NavItemConfig[];
  activeNav: NavItemId | null;
  isMobile: boolean;
  onItemClick: (item: NavItemConfig) => void;
}

const NavRow: React.FC<NavRowProps> = ({ navItems, activeNav, isMobile, onItemClick }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Partial<Record<NavItemId, HTMLDivElement | null>>>({});
  const [indicator, setIndicator] = useState({ x: 0, width: 0, visible: false });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      if (!activeNav || !rowRef.current) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }

      const activeNode = itemRefs.current[activeNav];
      if (!activeNode) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }

      setIndicator({
        x: activeNode.offsetLeft,
        width: activeNode.offsetWidth,
        visible: true,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeNav, navItems.length, isMobile]);

  return (
    <div
      ref={rowRef}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        gap: "0.5rem",
      }}
    >
      <motion.div
        initial={false}
        animate={{
          x: indicator.x,
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          borderRadius: "0.9rem",
          pointerEvents: "none",
          background:
            "linear-gradient(145deg, rgba(15, 5, 130, 0.96), rgba(25, 12, 170, 0.94) 45%, rgba(12, 3, 105, 0.98))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -10px 16px rgba(8,30,120,0.5), 0 10px 22px rgba(4,16,60,0.4), 0 0 18px rgba(52,110,255,0.24), 0 0 0 1px rgba(160,204,255,0.18)",
          zIndex: 0,
        }}
      />

      <motion.div
        initial={false}
        animate={{
          x: indicator.x,
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
        style={{
          position: "absolute",
          top: "0.08rem",
          bottom: "0.08rem",
          left: 0,
          borderRadius: "0.8rem",
          pointerEvents: "none",
          background:
            "linear-gradient(165deg, rgba(255,255,255,0.45) 0%, rgba(188,222,255,0.2) 18%, rgba(255,255,255,0) 52%), radial-gradient(135% 80% at 14% -10%, rgba(255,255,255,0.65), rgba(255,255,255,0) 58%)",
          zIndex: 0,
        }}
      />

      {navItems.map((item) => (
        <div
          key={item.id}
          ref={(node) => {
            itemRefs.current[item.id] = node;
          }}
          style={{
            flex: isMobile ? 1 : undefined,
            display: "flex",
          }}
        >
          <NavItem
            icon={item.icon}
            isActive={activeNav === item.id}
            onClick={() => onItemClick(item)}
            isMobile={isMobile}
          />
        </div>
      ))}
    </div>
  );
};

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const isSiteAdmin = userData?.role === "site_admin";
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasModuleAccess = (moduleId: string) => {
    try {
      const permissions = JSON.parse(userData?.clearance || '{}');
      return permissions[moduleId] === true;
    } catch {
      return false;
    }
  };

  const hasFuelLogModule = hasModuleAccess('fuel_log');

  const navItems: NavItemConfig[] = [
    {
      id: isSiteAdmin ? "workers" : "modules",
      icon: isSiteAdmin ? <HardHat /> : <Package />,
      label: isSiteAdmin ? "Workers" : "Modules",
      path: isSiteAdmin ? "/site-admin-workers" : "/index",
    },
    { id: "phonebook" as const, icon: <Notebook />, label: "Phonebook", path: "/phonebook" },
    ...(hasFuelLogModule ? [{ id: "fuel-log" as const, icon: <Fuel />, label: "Fuel Log", path: "/fuel-log" }] : []),
  ];

  const getActiveFromPath = (): NavItemId | null => {
    const currentPath = location.pathname;
    if (currentPath === "/index") return isSiteAdmin ? "workers" : "modules";
    if (currentPath === "/site-admin-workers") return "workers";
    if (currentPath === "/phonebook") return "phonebook";
    if (currentPath === "/fuel-log") return "fuel-log";
    return null;
  };

  const routeActiveNav = getActiveFromPath();
  const [visualActiveNav, setVisualActiveNav] = useState<NavItemId | null>(routeActiveNav);

  useEffect(() => {
    if (routeActiveNav !== null) {
      setVisualActiveNav(routeActiveNav);
    }
  }, [routeActiveNav]);

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  const handleNavClick = (item: typeof navItems[0]) => {
    const navigateWithSlide = () => {
      setVisualActiveNav(item.id);
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
      navTimeoutRef.current = setTimeout(() => {
        navigate(item.path);
      }, 130);
    };

    try {
      if (visualActiveNav) {
        window.sessionStorage.setItem("bottom-nav-prev-active-id", visualActiveNav);
      }
    } catch {
      // Ignore storage errors and continue navigation
    }

    if (item.id === "phonebook" && (hasModuleAccess('phonebook') || isSiteAdmin)) {
      navigateWithSlide();
    } else if (item.id === "phonebook") {
      toast.error("No clearance to access Phonebook");
    } else if (item.id === "fuel-log") {
      navigateWithSlide();
    } else if (item.id === "modules") {
      navigateWithSlide();
    } else if (item.id === "workers") {
      navigateWithSlide();
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
          <NavRow
            navItems={navItems}
            activeNav={visualActiveNav}
            isMobile={true}
            onItemClick={handleNavClick}
          />
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
          <NavRow
            navItems={navItems}
            activeNav={visualActiveNav}
            isMobile={false}
            onItemClick={handleNavClick}
          />
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
