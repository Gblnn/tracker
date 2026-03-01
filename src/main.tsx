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
