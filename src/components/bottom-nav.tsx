import { Fuel, HardHat, Fingerprint, Notebook, Package } from "lucide-react";
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

type NavItemId = "modules" | "workers" | "phonebook" | "fuel-log" | "mobile-punch";

interface NavItemConfig {
  id: NavItemId;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const LIQUID_GLASS_FS = `
  precision mediump float;

  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec4 iMouse;
  uniform sampler2D iChannel0;

  void mainImage(out vec4 fragColor, in vec2 fragCoord)
  {
    const float NUM_ZERO = 0.0;
    const float NUM_ONE = 1.0;
    const float NUM_HALF = 0.5;
    const float NUM_TWO = 2.0;
    const float POWER_EXPONENT = 6.0;
    const float MASK_MULTIPLIER_1 = 10000.0;
    const float MASK_MULTIPLIER_2 = 9500.0;
    const float MASK_MULTIPLIER_3 = 11000.0;
    const float LENS_MULTIPLIER = 5000.0;
    const float MASK_STRENGTH_1 = 8.0;
    const float MASK_STRENGTH_2 = 16.0;
    const float MASK_STRENGTH_3 = 2.0;
    const float MASK_THRESHOLD_1 = 0.95;
    const float MASK_THRESHOLD_2 = 0.9;
    const float MASK_THRESHOLD_3 = 1.5;
    const float SAMPLE_RANGE = 4.0;
    const float SAMPLE_OFFSET = 0.5;
    const float GRADIENT_RANGE = 0.2;
    const float GRADIENT_OFFSET = 0.1;
    const float GRADIENT_EXTREME = -1000.0;
    const float LIGHTING_INTENSITY = 0.3;

    vec2 uv = fragCoord / iResolution.xy;
    vec2 mouse = iMouse.xy;
    if (length(mouse) < NUM_ONE) {
      mouse = iResolution.xy / NUM_TWO;
    }
    vec2 m2 = (uv - mouse / iResolution.xy);

    float roundedBox = pow(abs(m2.x * iResolution.x / iResolution.y), POWER_EXPONENT) + pow(abs(m2.y), POWER_EXPONENT);
    float rb1 = clamp((NUM_ONE - roundedBox * MASK_MULTIPLIER_1) * MASK_STRENGTH_1, NUM_ZERO, NUM_ONE);
    float rb2 = clamp((MASK_THRESHOLD_1 - roundedBox * MASK_MULTIPLIER_2) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE) -
      clamp(pow(MASK_THRESHOLD_2 - roundedBox * MASK_MULTIPLIER_2, NUM_ONE) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE);
    float rb3 = clamp((MASK_THRESHOLD_3 - roundedBox * MASK_MULTIPLIER_3) * MASK_STRENGTH_3, NUM_ZERO, NUM_ONE) -
      clamp(pow(NUM_ONE - roundedBox * MASK_MULTIPLIER_3, NUM_ONE) * MASK_STRENGTH_3, NUM_ZERO, NUM_ONE);

    fragColor = vec4(NUM_ZERO);
    float transition = smoothstep(NUM_ZERO, NUM_ONE, rb1 + rb2);

    if (transition > NUM_ZERO) {
      vec2 lens = ((uv - NUM_HALF) * NUM_ONE * (NUM_ONE - roundedBox * LENS_MULTIPLIER) + NUM_HALF);
      float total = NUM_ZERO;
      for (float x = -SAMPLE_RANGE; x <= SAMPLE_RANGE; x++) {
        for (float y = -SAMPLE_RANGE; y <= SAMPLE_RANGE; y++) {
          vec2 offset = vec2(x, y) * SAMPLE_OFFSET / iResolution.xy;
          fragColor += texture2D(iChannel0, offset + lens);
          total += NUM_ONE;
        }
      }
      fragColor /= total;

      float gradient = clamp((clamp(m2.y, NUM_ZERO, GRADIENT_RANGE) + GRADIENT_OFFSET) / NUM_TWO, NUM_ZERO, NUM_ONE) +
        clamp((clamp(-m2.y, GRADIENT_EXTREME, GRADIENT_RANGE) * rb3 + GRADIENT_OFFSET) / NUM_TWO, NUM_ZERO, NUM_ONE);
      vec4 lighting = clamp(fragColor + vec4(rb1) * gradient + vec4(rb2) * LIGHTING_INTENSITY, NUM_ZERO, NUM_ONE);

      fragColor = mix(texture2D(iChannel0, uv), lighting, transition);
    } else {
      fragColor = texture2D(iChannel0, uv);
    }
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const LIQUID_GLASS_VS = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

interface LiquidGlassPointer {
  x: number;
  y: number;
  active: boolean;
}

const LiquidGlassLayer: React.FC<{ pointer: LiquidGlassPointer }> = ({ pointer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<LiquidGlassPointer>(pointer);

  useEffect(() => {
    pointerRef.current = pointer;
  }, [pointer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      return;
    }

    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, LIQUID_GLASS_VS);
    const fs = createShader(gl.FRAGMENT_SHADER, LIQUID_GLASS_FS);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    if (!buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "position");
    if (position === -1) return;
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolutionLoc = gl.getUniformLocation(program, "iResolution");
    const timeLoc = gl.getUniformLocation(program, "iTime");
    const mouseLoc = gl.getUniformLocation(program, "iMouse");
    const textureLoc = gl.getUniformLocation(program, "iChannel0");
    if (!resolutionLoc || !timeLoc || !mouseLoc || !textureLoc) return;

    const texture = gl.createTexture();
    if (!texture) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const texCanvas = document.createElement("canvas");
    texCanvas.width = 512;
    texCanvas.height = 512;
    const texCtx = texCanvas.getContext("2d");
    if (!texCtx) return;

    const base = texCtx.createLinearGradient(0, 0, 512, 512);
    base.addColorStop(0, "#2b68ff");
    base.addColorStop(0.5, "#2c4be7");
    base.addColorStop(1, "#160d8b");
    texCtx.fillStyle = base;
    texCtx.fillRect(0, 0, 512, 512);

    const glow = texCtx.createRadialGradient(130, 80, 10, 160, 110, 220);
    glow.addColorStop(0, "rgba(255,255,255,0.75)");
    glow.addColorStop(0.55, "rgba(255,255,255,0.2)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    texCtx.fillStyle = glow;
    texCtx.fillRect(0, 0, 512, 512);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      texCanvas
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let rafId = 0;
    const start = performance.now();

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.floor(rect.width * dpr));
      const targetH = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const t = (performance.now() - start) / 1000;
      const pointerState = pointerRef.current;
      let mouseX = canvas.width * (0.5 + 0.18 * Math.sin(t * 0.9));
      let mouseY = canvas.height * (0.5 + 0.12 * Math.cos(t * 0.7));

      if (pointerState.active) {
        const localX = (pointerState.x - rect.left) * dpr;
        const localY = (rect.bottom - pointerState.y) * dpr;
        mouseX = Math.max(0, Math.min(canvas.width, localX));
        mouseY = Math.max(0, Math.min(canvas.height, localY));
      }

      gl.uniform3f(resolutionLoc, canvas.width, canvas.height, 1.0);
      gl.uniform1f(timeLoc, t);
      gl.uniform4f(mouseLoc, mouseX, mouseY, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureLoc, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        opacity: 0.96,
        borderRadius: "inherit",
      }}
    />
  );
};

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
  const [glassPointer, setGlassPointer] = useState<LiquidGlassPointer>({ x: 0, y: 0, active: false });

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
      onMouseMove={(e) => setGlassPointer({ x: e.clientX, y: e.clientY, active: true })}
      onMouseLeave={() => setGlassPointer((prev) => ({ ...prev, active: false }))}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) {
          setGlassPointer({ x: touch.clientX, y: touch.clientY, active: true });
        }
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) {
          setGlassPointer({ x: touch.clientX, y: touch.clientY, active: true });
        }
      }}
      onTouchEnd={() => setGlassPointer((prev) => ({ ...prev, active: false }))}
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
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <LiquidGlassLayer pointer={glassPointer} />
      </motion.div>

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
            "linear-gradient(165deg, rgba(255,255,255,0.25) 0%, rgba(188,222,255,0.12) 18%, rgba(255,255,255,0) 52%), radial-gradient(135% 80% at 14% -10%, rgba(255,255,255,0.42), rgba(255,255,255,0) 58%)",
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
  const hasMobilePunchModule = hasModuleAccess('mobile_punch');

  const navItems: NavItemConfig[] = [
    {
      id: isSiteAdmin ? "workers" : "modules",
      icon: isSiteAdmin ? <HardHat /> : <Package />,
      label: isSiteAdmin ? "Workers" : "Modules",
      path: isSiteAdmin ? "/site-admin-workers" : "/index",
    },
    { id: "phonebook" as const, icon: <Notebook />, label: "Phonebook", path: "/phonebook" },
    ...(hasMobilePunchModule ? [{ id: "mobile-punch" as const, icon: <Fingerprint />, label: "Clock In", path: "/mobile-punch" }] : []),
    ...(hasFuelLogModule ? [{ id: "fuel-log" as const, icon: <Fuel />, label: "Fuel Log", path: "/fuel-log" }] : []),
  ];

  const getActiveFromPath = (): NavItemId | null => {
    const currentPath = location.pathname;
    if (currentPath === "/index") return isSiteAdmin ? "workers" : "modules";
    if (currentPath === "/site-admin-workers") return "workers";
    if (currentPath === "/phonebook") return "phonebook";
    if (currentPath === "/fuel-log") return "fuel-log";
    if (currentPath === "/mobile-punch") return "mobile-punch";
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
    } else if (item.id === "mobile-punch") {
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
