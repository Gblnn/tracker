import emailjs from "@emailjs/browser";
import { Route, Routes } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import ProtectedRoutes from "./components/protectedRoute";
import Index from "./pages";
import AccessControl from "./pages/access-control";
import AccessRequests from "./pages/access-requests";
import AddRemarks from "./pages/add-remarks";
import AdminPage from "./pages/admin-page";
import Archives from "./pages/archives";
import History from "./pages/history";
import Inbox from "./pages/inbox";
import Login from "./pages/login";
import LPO from "./pages/lpo";
import Medicals from "./pages/medicals";
import MovementRegister from "./pages/movement-register";
import NewHire from "./pages/new-hire";
import Openings from "./pages/openings";
import PageNotFound from "./pages/page-not-found";
import Profile from "./pages/profile";
import ProjectLPO from "./pages/project-lpo";
import QRCodeGenerator from "./pages/qr-code";
import RecordList from "./pages/record-list";
import Records from "./pages/records";
import RequestAccess from "./pages/request-access";
import UserPage from "./pages/user";
import UserReset from "./pages/user-reset";
import Users from "./pages/users";
import ValeRecords from "./pages/vale-records";
import Website from "./pages/website";
import OfferLetters from "./pages/offer-letters";
import Shortlist from "./pages/shortlist";
import Agreements from "./pages/agreements";

// Initialize emailjs once outside of component
emailjs.init("c8AePKR5BCK8UIn_E");

export default function App() {
  return (
    <AuthGuard>
      {/* <Header updateInbox/> */}
      <div style={{ height: "" }}></div>

      <div style={{ display: "flex", paddingLeft: "1.5rem" }}></div>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/user-reset" element={<UserReset />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/inbox" element={<Inbox />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/index" element={<Index />} />
          <Route path="/record-list" element={<RecordList />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/users" element={<Users />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/access-control" element={<AccessControl />} />
          <Route path="access-requests" element={<AccessRequests />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/new-hire" element={<NewHire />} />
          <Route path="/offer-letters" element={<OfferLetters />} />
          <Route path="/agreements" element={<Agreements />} />
          <Route path="/shortlist" element={<Shortlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/openings" element={<Openings />} />
          <Route path="/website" element={<Website />} />
          <Route path="/add-remarks" element={<AddRemarks />} />
          <Route path="/lpos" element={<LPO />} />
          <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
          <Route path="/project-lpo" element={<ProjectLPO />} />
          <Route path="/movement-register" element={<MovementRegister />} />
          <Route path="/records" element={<Records />} />
          <Route path="/vale-records" element={<ValeRecords />} />
          <Route path="/medicals" element={<Medicals />} />
          <Route path="/history" element={<History />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AuthGuard>
  );
}
