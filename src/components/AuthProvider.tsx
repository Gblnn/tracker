// AuthProvider.js
import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "firebase/auth";
import { fetchAndCacheProfile, clearProfileCache } from "@/utils/profileCache";
import { fetchAndCacheVehicle, clearVehicleCache } from "@/utils/vehicleCache";

interface FirestoreUserData {
  id: string;
  role: "admin" | "user" | "supervisor" | "site_coordinator" | "management" | "profile" | string;  // system access role
  designation?: string;  // job title/position (optional)
  email: string;
  clearance: "Sohar Star United" | "Vale" | "All" | "none";
  assignedSite?: string;
  assignedProject?: string;
  editor?: string | boolean;  // editor access permission
  sensitive_data?: string | boolean;  // sensitive data access permission
  allocated_vehicle?: string;  // vehicle number from vehicle_master
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
        console.log("⚡ Cache valid - instant auth loaded");
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
  const [loading, setLoading] = useState(false);
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
      const { getFirebaseDb } = await import("@/firebase");
      const { collection, getDocs, query, where } = await import("firebase/firestore");
      
      const db = getFirebaseDb();
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
      const { getFirebaseAuth } = await import("@/firebase");
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      
      const auth = getFirebaseAuth();
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
      // Import and ensure Firebase is initialized
      const { getFirebaseAuth } = await import("@/firebase");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      
      // Get auth instance (this will trigger initialization if needed)
      const auth = getFirebaseAuth();
      
      // Always try online login first
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(email);
      
      if (userData) {
        // Cache everything for offline use
        setUser(result.user);
        setUserData(userData);
        cacheAuthState(result.user);
        setCachedAuthState(false);
        
        // Cache profile data in background
        fetchAndCacheProfile(email, userData.allocated_vehicle).catch(err => 
          console.error("Failed to cache profile:", err)
        );
        
        // Cache vehicle data in background if allocated
        if (userData.allocated_vehicle) {
          fetchAndCacheVehicle(userData.allocated_vehicle).catch(err =>
            console.error("Failed to cache vehicle:", err)
          );
        }
        
        // toast.success("✅ Login successful - cached for offline use!");
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
      const { getFirebaseAuth } = await import("@/firebase");
      const { signOut } = await import("firebase/auth");
      
      const auth = getFirebaseAuth();
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
      clearProfileCache();
      clearVehicleCache();
      
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
    // Log auth state for debugging
    if (hasValidCache.current) {
      console.log("⚡ Using cached auth - instant access!");
      setCachedAuthState(true);
      
      // Pre-fetch profile data in background if user email is available
      if (userData?.email) {
        fetchAndCacheProfile(userData.email, userData.allocated_vehicle).catch(err => 
          console.error("Failed to pre-cache profile:", err)
        );
      }
    } else {
      console.log("No cached auth - showing login page");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // NEVER block rendering with a loading screen on mount
  // The loading state is only used to disable buttons during operations

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
