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

TimeAgo.addDefaultLocale(en);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark">
        <App />
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);
