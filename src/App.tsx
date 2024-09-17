import emailjs from "@emailjs/browser";
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./components/protectedRoute";
import Index from "./pages";
import AccessControl from "./pages/access-control";
import Archives from "./pages/archives";
import History from "./pages/history";
import Inbox from "./pages/inbox";
import Login from "./pages/login";
import Medicals from "./pages/medicals";
import PageNotFound from "./pages/page-not-found";
import Records from "./pages/records";
import UserPage from "./pages/user";
import ValeRecords from "./pages/vale-records";
import AdminPage from "./pages/admin-page";

export default function App() {
  useEffect(() => {
    emailjs.init("c8AePKR5BCK8UIn_E");
  }, []);
  return (
    <>
      {/* <Header updateInbox/> */}
      <div style={{ height: "" }}></div>

      <div style={{ display: "flex", paddingLeft: "1.5rem" }}></div>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inbox" element={<Inbox />} />

        <Route element={<ProtectedRoutes user={window.name} />}>
          <Route path="/index" element={<Index />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/access-control" element={<AccessControl />} />
          <Route path="/user" element={<UserPage />} />

          <Route element={<ProtectedRoutes user={"user"} />}>
            <Route path="/records" element={<Records />} />
            <Route path="/vale-records" element={<ValeRecords />} />
          </Route>

          <Route path="/user" element={<UserPage />} />
          <Route path="/medicals" element={<Medicals />} />
          <Route path="/history" element={<History />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}
