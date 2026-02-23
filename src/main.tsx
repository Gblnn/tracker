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

// Fix for Radix UI leaving root element inert/aria-hidden after dialogs close
let cleanupTimeout: NodeJS.Timeout;
const observer = new MutationObserver(() => {
  clearTimeout(cleanupTimeout);
  cleanupTimeout = setTimeout(() => {
    const root = document.getElementById("root");
    if (root) {
      // Check if any Radix portals are actually open
      const openDialogs = document.querySelectorAll('[data-state="open"]');
      if (openDialogs.length === 0) {
        root.removeAttribute("inert");
        root.removeAttribute("aria-hidden");
        root.style.pointerEvents = "";
      }
    }
  }, 100); // Small delay to ensure animations complete
});

// Start observing root element for attribute changes
const rootElement = document.getElementById("root");
if (rootElement) {
  observer.observe(rootElement, { 
    attributes: true, 
    attributeFilter: ["inert", "aria-hidden", "style"],
    subtree: false 
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <BackgroundProcessProvider>
        <ThemeProvider defaultTheme="dark">
          <App />
          <Toaster position="top-right" expand={true} richColors />
        </ThemeProvider>
      </BackgroundProcessProvider>
    </AuthProvider>
  </BrowserRouter>
);
