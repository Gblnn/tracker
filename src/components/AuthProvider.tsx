// AuthProvider.js
import { auth, db } from "@/firebase";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FirestoreUserData {
  id: string;
  role: string;  // job role/designation
  system_role: "admin" | "user" | "supervisor" | "site_coordinator" | "management" | "profile" | string;
  email: string;
  clearance: "Sohar Star United" | "Vale" | "All" | "none";
  assignedSite?: string;
  assignedProject?: string;
  [key: string]: any;
}

const initialState = {
  user: null,
  userData: null,
  loading: true,
  cachedAuthState: false,
  createUser: async () => {},
  loginUser: async () => {},
  logoutUser: async () => {},
  resetPassword: async () => {},
  updateUserData: async () => {},
};

export const AuthContext = createContext<{
  user: User | null;
  userData: FirestoreUserData | null;
  loading: boolean;
  cachedAuthState: boolean;
  createUser: (email: string, password: string) => Promise<any>;
  loginUser: (email: string, password: string) => Promise<any>;
  logoutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: Partial<FirestoreUserData>) => Promise<void>;
}>(initialState);

interface Props {
  children: React.ReactNode;
}

const CACHED_USER_KEY = "cached_user_data";
const CACHED_AUTH_KEY = "cached_auth_state";
const CACHE_TIMESTAMP_KEY = "cached_timestamp";
const CACHE_EXPIRY_DAYS = 30; // Cache valid for 30 days

// Function to check if cache is still valid
const isCacheValid = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    return cacheAge < maxAge;
  } catch (e) {
    return false;
  }
};

// Function to get initial state from cache
const getInitialState = () => {
  try {
    if (!isCacheValid()) {
      console.log("Cache expired, will require login");
      return { user: null, userData: null, isValid: false };
    }

    const cachedAuth = localStorage.getItem(CACHED_AUTH_KEY);
    const cachedUser = localStorage.getItem(CACHED_USER_KEY);

    if (cachedAuth && cachedUser) {
      const parsedAuth = JSON.parse(cachedAuth);
      const parsedUser = JSON.parse(cachedUser);

      if (
        parsedAuth?.email &&
        parsedUser?.email &&
        parsedAuth.email === parsedUser.email
      ) {
        toast.success("⚡ Instant login from cache!");
        return {
          user: parsedAuth,
          userData: parsedUser,
          isValid: true,
        };
      }
    }
    return { user: null, userData: null, isValid: false };
  } catch (e) {
    console.error("Error reading initial cache:", e);
    return { user: null, userData: null, isValid: false };
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }: Props) => {
  // Get initial state from cache before first render
  const initialState = getInitialState();
  const hasValidCache = useRef(initialState.isValid);
  const [loading, setLoading] = useState(false); // Never show loading if we have cache
  const [user, setUser] = useState<User | null>(initialState.user);
  const [userData, setUserData] = useState<FirestoreUserData | null>(
    initialState.userData
  );
  // Track if we are using cached auth state (offline mode)
  const [cachedAuthState, setCachedAuthState] = useState(initialState.isValid);

  const cacheUserData = (data: FirestoreUserData) => {
    try {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error caching user data:", error);
    }
  };

  const cacheAuthState = (user: User | null) => {
    try {
      if (user) {
        const cachedUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        localStorage.setItem(CACHED_AUTH_KEY, JSON.stringify(cachedUser));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(CACHED_AUTH_KEY);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.error("Error caching auth state:", error);
    }
  };

  const fetchUserData = async (email: string) => {
    const fetchStartTime = performance.now();
    try {
      const RecordCollection = collection(db, "users");
      const recordQuery = query(RecordCollection, where("email", "==", email));
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreUserData[];

      if (fetchedData.length > 0) {
        const userData = fetchedData[0];
        setUserData(userData);
        cacheUserData(userData);
        toast.success("✅ User data loaded (" + Math.round(performance.now() - fetchStartTime) + "ms)");
        return userData;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("❌ Failed to fetch user data");
      throw error;
    }
  };

  const createUser = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      cacheAuthState(result.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, password: string) => {
    toast.info("🔐 Logging in...");
    setLoading(true);
    try {
      // Always try online login first
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(email);
      
      if (userData) {
        // Cache everything for offline use
        setUser(result.user);
        setUserData(userData);
        cacheAuthState(result.user);
        setCachedAuthState(false);
        toast.success("✅ Login successful - cached for offline use!");
        return { result, userData };
      } else {
        throw new Error("User data not found");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("❌ Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    toast.info("🚪 Logging out...");
    setLoading(true);
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear all state
      setUser(null);
      setUserData(null);
      setCachedAuthState(false);
      
      // Clear all cached data
      localStorage.removeItem(CACHED_USER_KEY);
      localStorage.removeItem(CACHED_AUTH_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      
      toast.success("✅ Logged out successfully");
      
      // Force reload to login page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("❌ Logout error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we have valid cached auth, use it immediately and skip Firebase entirely
    if (hasValidCache.current) {
      toast.info("📱 Offline mode - using cached credentials");
      setCachedAuthState(true);
      
      // Hide loader immediately
      if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
        setTimeout(() => {
          (window as any).hideInitialLoader();
        }, 50);
      }
      
      // No Firebase listener needed - auth is purely cache-based until logout
      return;
    }

    // Only set up Firebase listener if no cache (first time or logged out)
    toast.info("🔄 Connecting to Firebase...");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserData(null);
        
        if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
          (window as any).hideInitialLoader();
        }
        return;
      }

      // User is logged in via Firebase
      try {
        if (currentUser.email) {
          const userData = await fetchUserData(currentUser.email);
          if (userData) {
            setUser(currentUser);
            setUserData(userData);
            cacheAuthState(currentUser);
            setCachedAuthState(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
          (window as any).hideInitialLoader();
        }
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Only show loading state during active operations (login/logout), never on initial load
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100svh",
          background: "black",
        }}
      >
        <Loader2 className="animate-spin" style={{ fontSize: 24, color: "white" }} />
      </div>
    );
  }

  const authValue: {
    user: User | null;
    userData: FirestoreUserData | null;
    loading: boolean;
    cachedAuthState: boolean;
    createUser: (email: string, password: string) => Promise<any>;
    loginUser: (email: string, password: string) => Promise<any>;
    logoutUser: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserData: (data: Partial<FirestoreUserData>) => Promise<void>;
  } = {
    user,
    userData,
    loading,
    cachedAuthState,
    createUser,
    loginUser,
    logoutUser: logOut,
    resetPassword: async () => {},
    updateUserData: async () => {},
  };

  // Always provide auth context regardless of state
  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
