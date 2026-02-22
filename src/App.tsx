import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import ProtectedRoutes from "./components/protectedRoute";
import { AuthProvider } from "./context/auth-context";

// Eager load critical routes only
import Login from "./pages/login";
import { Loader2 } from "lucide-react";

// Lazy load all other routes
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
const PageNotFound = lazy(() => import("./pages/page-not-found"));
const Profile = lazy(() => import("./pages/profile"));
const ProjectLPO = lazy(() => import("./pages/project-lpo"));
const QRCodeGenerator = lazy(() => import("./pages/qr-code"));
const QuickLinks = lazy(() => import("./pages/quick-links"));
const RecordList = lazy(() => import("./pages/record-list"));
const Records = lazy(() => import("./pages/records"));
const RequestAccess = lazy(() => import("./pages/request-access"));
const Shortlist = lazy(() => import("./pages/shortlist"));
const UserPage = lazy(() => import("./pages/user"));
const UserReset = lazy(() => import("./pages/user-reset"));
const Users = lazy(() => import("./pages/users"));
const ValeRecords = lazy(() => import("./pages/vale-records"));
const Website = lazy(() => import("./pages/website"));
const CreateAccount = lazy(() => import("./pages/create-account"));
const Phonebook = lazy(() => import("./pages/phonebook"));
const Supervisor = lazy(() => import("./pages/supervisor"));
const SiteCoordinator = lazy(() => import("./pages/site-coordinator"));
const Devices = lazy(() => import("./pages/devices"));
const ValeMobilisation = lazy(() => import("./pages/vale-mobilisation"));

// Loading fallback component
function PageLoader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-in-out'
    }}>
      <div style={{ 
        textAlign: 'center', 
        color: 'white',
        animation: 'scaleIn 0.3s ease-out'
      }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
     
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
    </AuthProvider>
  );
}
