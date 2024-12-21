import emailjs from "@emailjs/browser";
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./components/protectedRoute";
import Index from "./pages";
import AccessControl from "./pages/access-control";
import AccessRequests from "./pages/access-requests";
import AdminPage from "./pages/admin-page";
import Archives from "./pages/archives";
import History from "./pages/history";
import Inbox from "./pages/inbox";
import Login from "./pages/login";
import LPO from "./pages/lpo";
import Medicals from "./pages/medicals";
import NewHire from "./pages/new-hire";
import Openings from "./pages/openings";
import PageNotFound from "./pages/page-not-found";
import Profile from "./pages/profile";
import QRCodeGenerator from "./pages/qr-code";
import RecordList from "./pages/record-list";
import Records from "./pages/records";
import RequestAccess from "./pages/request-access";
import UserPage from "./pages/user";
import UserReset from "./pages/user-reset";
import Users from "./pages/users";
import ValeRecords from "./pages/vale-records";
import Website from "./pages/website";
import ProjectLPO from "./pages/project-lpo";
import MovementRegister from "./pages/movement-register";
import AddRemarks from "./pages/add-remarks";

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
        <Route path="/user-reset" element={<UserReset />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/inbox" element={<Inbox />} />

        <Route element={<ProtectedRoutes user={window.name} />}>
          <Route path="/index" element={<Index />} />
          <Route path="/record-list" element={<RecordList />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/users" element={<Users />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/access-control" element={<AccessControl />} />
          <Route path="access-requests" element={<AccessRequests />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/new-hire" element={<NewHire />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/openings" element={<Openings />} />
          <Route path="/website" element={<Website />} />
          <Route path="/add-remarks" element={<AddRemarks />} />
          <Route path="/lpos" element={<LPO />} />
          <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
          <Route path="/project-lpo" element={<ProjectLPO />} />
          <Route path="/movement-register" element={<MovementRegister />} />
          <Route />

          <Route element={<ProtectedRoutes user={"user"} />}>
            <Route path="/records" element={<Records />} />
            <Route path="/vale-records" element={<ValeRecords />} />
          </Route>

          <Route path="/medicals" element={<Medicals />} />
          <Route path="/history" element={<History />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}
