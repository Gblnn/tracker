import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../app/globals.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import "./styles/style.css";
import "./styles/utils.css";
import "./WEB/css/clash-grotesk.css";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import AuthProvider from "./components/AuthProvider.tsx";
import { Toaster } from "sonner";
import { BackgroundProcessProvider } from "./context/BackgroundProcessContext.tsx";

// Hide initial loader IMMEDIATELY as soon as JS starts executing
if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
  (window as any).hideInitialLoader();
}

TimeAgo.addDefaultLocale(en);

// Force light theme on startup by clearing cached theme
localStorage.setItem("vite-ui-theme", "light");

// Prevent any library from setting inert on root element
const rootElement = document.getElementById("root");
if (rootElement) {
  // Override setAttribute to block inert being set on root
  const originalSetAttribute = rootElement.setAttribute.bind(rootElement);
  rootElement.setAttribute = function(name: string, value: string) {
    if (name === 'inert' || name === 'aria-hidden') {
      // Silently ignore attempts to set inert or aria-hidden on root
      return;
    }
    return originalSetAttribute(name, value);
  };

  // Also block direct property assignment for inert
  Object.defineProperty(rootElement, 'inert', {
    get: () => false,
    set: () => {}, // Ignore attempts to set
    configurable: true
  });

  // Watch for style changes and prevent pointer-events: none
  const styleObserver = new MutationObserver(() => {
    if (rootElement.style.pointerEvents === 'none') {
      rootElement.style.pointerEvents = '';
    }
  });

  styleObserver.observe(rootElement, {
    attributes: true,
    attributeFilter: ['style']
  });
}

// Fix for Radix UI and Vaul leaving root element inert/aria-hidden after dialogs/drawers close
let cleanupTimeout: NodeJS.Timeout;

// Comprehensive cleanup function
const cleanupRootAttributes = () => {
  const root = document.getElementById("root");
  if (!root) return;
  
  // Check if any modals/dialogs/drawers are actually open
  const openDialogs = document.querySelectorAll('[data-state="open"]');
  const vaulDrawers = document.querySelectorAll('[vaul-drawer][data-state="open"]');
  const radixOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
  
  // If nothing is open, clean up - FOR DRAWERS, ALWAYS CLEAN UP
  if (openDialogs.length === 0 && vaulDrawers.length === 0 && radixOverlays.length === 0) {
    root.removeAttribute("inert");
    root.removeAttribute("aria-hidden");
    root.style.pointerEvents = "";
  } else {
    // Even if something is open, if root is inert, remove it (for non-modal drawers)
    if (root.hasAttribute("inert")) {
      root.removeAttribute("inert");
    }
    if (root.hasAttribute("aria-hidden")) {
      root.removeAttribute("aria-hidden");
    }
    if (root.style.pointerEvents === "none") {
      root.style.pointerEvents = "";
    }
  }
};

const observer = new MutationObserver(() => {
  clearTimeout(cleanupTimeout);
  cleanupTimeout = setTimeout(cleanupRootAttributes, 50); // Reduced delay for faster response
});

// Also clean up on any dialog/drawer state change in the document
const documentObserver = new MutationObserver(() => {
  cleanupRootAttributes(); // Immediate cleanup for drawer state changes
});

// Start observing root element for attribute changes (reuse rootElement from above)
if (rootElement) {
  observer.observe(rootElement, { 
    attributes: true, 
    attributeFilter: ["inert", "aria-hidden", "style"],
    subtree: false 
  });
}

// Also observe document body for portal changes
documentObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-state"]
});

// Aggressive periodic cleanup check (every 100ms)
setInterval(cleanupRootAttributes, 100);

// Also cleanup on user interactions
document.addEventListener('click', () => {
  setTimeout(cleanupRootAttributes, 50);
});

document.addEventListener('focusin', () => {
  setTimeout(cleanupRootAttributes, 50);
});

// Cleanup on any pointer event
document.addEventListener('pointerdown', () => {
  cleanupRootAttributes();
}, { passive: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <BackgroundProcessProvider>
        <ThemeProvider defaultTheme="light">
          <App />
          <Toaster position="bottom-right" expand={true} richColors />
        </ThemeProvider>
      </BackgroundProcessProvider>
    </AuthProvider>
  </BrowserRouter>
);
