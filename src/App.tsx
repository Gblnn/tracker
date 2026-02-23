import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthGuard from "./components/AuthGuard";
import ProtectedRoutes from "./components/protectedRoute";
import { refreshPhonebookCache } from "./utils/phonebookCache";
import { useBackgroundProcess } from "./context/BackgroundProcessContext";

// Import critical startup pages immediately (no lazy loading)
import Login from "./pages/login";
import UserReset from "./pages/user-reset";
import RequestAccess from "./pages/request-access";
import CreateAccount from "./pages/create-account";
import PageNotFound from "./pages/page-not-found";

// Lazy load protected pages only (loaded after authentication)
const Index = lazy(() => import("./pages"));
const AccessControl = lazy(() => import("./pages/access-control"));
const AccessRequests = lazy(() => import("./pages/access-requests"));
const AddRemarks = lazy(() => import("./pages/add-remarks"));
const AdminPage = lazy(() => import("./pages/admin-page"));
const Agreements = lazy(() => import("./pages/agreements"));
const Archives = lazy(() => import("./pages/archives"));
const History = lazy(() => import("./pages/history"));
const Inbox = lazy(() => import("./pages/inbox"));
const LPO = lazy(() => import("./pages/lpo"));
const Medicals = lazy(() => import("./pages/medicals"));
const MovementRegister = lazy(() => import("./pages/movement-register"));
const NewHire = lazy(() => import("./pages/new-hire"));
const OfferLetters = lazy(() => import("./pages/offer-letters"));
const Openings = lazy(() => import("./pages/openings"));
const Profile = lazy(() => import("./pages/profile"));
const ProjectLPO = lazy(() => import("./pages/project-lpo"));
const QRCodeGenerator = lazy(() => import("./pages/qr-code"));
const QuickLinks = lazy(() => import("./pages/quick-links"));
const RecordList = lazy(() => import("./pages/record-list"));
const Records = lazy(() => import("./pages/records"));
const Shortlist = lazy(() => import("./pages/shortlist"));
const UserPage = lazy(() => import("./pages/user"));
const Users = lazy(() => import("./pages/users"));
const ValeRecords = lazy(() => import("./pages/vale-records"));
const Website = lazy(() => import("./pages/website"));
const Phonebook = lazy(() => import("./pages/phonebook"));
const Supervisor = lazy(() => import("./pages/supervisor"));
const SiteCoordinator = lazy(() => import("./pages/site-coordinator"));
const Devices = lazy(() => import("./pages/devices"));
const ValeMobilisation = lazy(() => import("./pages/vale-mobilisation"));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    height: "100svh",
    background: "black"
  }}>
    <Loader2 className="animate-spin" style={{ fontSize: 24, color: "white" }} />
  </div>
);

export default function App() {
  const { addProcess, updateProcess } = useBackgroundProcess();
  
  // Initialize phonebook cache in the background on app launch
  useEffect(() => {
    const processId = "phonebook-cache-init";
    addProcess(processId, "Phonebook Sync");
    
    refreshPhonebookCache((status, message) => {
      updateProcess(processId, { status, message });
    });
  }, [addProcess, updateProcess]);

  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/user-reset" element={<UserReset />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/supervisor" element={<Supervisor />} />
        <Route path="/quick-links" element={<QuickLinks />} />

        {/* Protected routes */}
        <Route
          element={
            <AuthGuard>
              <ProtectedRoutes />
            </AuthGuard>
          }
        >
          <Route path="/index" element={<Index />} />
          
          <Route path="/record-list" element={<RecordList />} />
          <Route path="/mobilizacao" element={<ValeMobilisation />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/users" element={<Users />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/site-coordinator" element={<SiteCoordinator />} />
          <Route path="/access-control" element={<AccessControl />} />
          <Route path="access-requests" element={<AccessRequests />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/new-hire" element={<NewHire />} />
          <Route path="/offer-letters" element={<OfferLetters />} />
          <Route path="/phonebook" element={<Phonebook />} />
          <Route path="/devices" element={<Devices />} />
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
      </Suspense>
    </AuthGuard>
  );
}
