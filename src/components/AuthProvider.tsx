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
      toast.info("⏰ Cache expired, will refresh");
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
        toast.success("⚡ Loaded from cache - instant auth!");
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
  const startedWithCache = useRef(initialState.isValid);

  const [initialized, setInitialized] = useState(initialState.isValid);
  const [loading, setLoading] = useState(!initialState.isValid); // Only show loading if no valid cache
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
      toast.info("💾 User data cached");
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
        toast.info("💾 Auth state cached");
      } else {
        localStorage.removeItem(CACHED_AUTH_KEY);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.error("Error caching auth state:", error);
    }
  };

  const getCachedUserData = (): FirestoreUserData | null => {
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error reading cached user data:", error);
      return null;
    }
  };

  const fetchUserData = async (email: string) => {
    const fetchStartTime = performance.now();
    toast.info("🔄 Fetching user data for " + email);
    try {
      if (!navigator.onLine) {
        toast.info("📱 Offline mode - using cached data");
        const cachedData = getCachedUserData();
        if (cachedData && cachedData.email === email) {
          setUserData(cachedData);
          toast.success("✅ Loaded cached user data (" + Math.round(performance.now() - fetchStartTime) + "ms)");
          return cachedData;
        }
        throw new Error("No cached data available offline");
      }

      const RecordCollection = collection(db, "users");
      const recordQuery = query(RecordCollection, where("email", "==", email));
      toast.info("🔄 Querying Firestore...");
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreUserData[];

      if (fetchedData.length > 0) {
        const userData = fetchedData[0];
        setUserData(userData);
        cacheUserData(userData);
        toast.success("✅ User data fetched from Firestore (" + Math.round(performance.now() - fetchStartTime) + "ms)");
        return userData;
      }

      const cachedData = getCachedUserData();
      if (cachedData && cachedData.email === email) {
        setUserData(cachedData);
        return cachedData;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      const cachedData = getCachedUserData();
      if (cachedData && cachedData.email === email) {
        setUserData(cachedData);
        return cachedData;
      }
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
    setLoading(true);
    try {
      // Try online login first
      if (navigator.onLine) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        cacheAuthState(result.user);
        const userData = await fetchUserData(email);
        return { result, userData };
      } else {
        // Offline login with cached credentials
        const cachedAuth = localStorage.getItem(CACHED_AUTH_KEY);
        const cachedUser = cachedAuth ? JSON.parse(cachedAuth) : null;
        const cachedData = getCachedUserData();

        if (cachedUser?.email === email && cachedData?.email === email) {
          setUser(cachedUser);
          setUserData(cachedData);
          return { result: { user: cachedUser }, userData: cachedData };
        }
        throw new Error(
          "Cannot login offline without valid cached credentials"
        );
      }
    } catch (error) {
      // If online login fails, try offline login as fallback
      const cachedAuth = localStorage.getItem(CACHED_AUTH_KEY);
      const cachedUser = cachedAuth ? JSON.parse(cachedAuth) : null;
      const cachedData = getCachedUserData();

      if (cachedUser?.email === email && cachedData?.email === email) {
        setUser(cachedUser);
        setUserData(cachedData);
        return { result: { user: cachedUser }, userData: cachedData };
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      // Clear all auth-related data from localStorage
      localStorage.clear(); // This will clear all localStorage items
      window.location.href = "/"; // Force a full page reload and redirect
    } catch (error) {
      console.error("Logout error:", error);
      throw error; // Propagate the error to be handled by the caller
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we already have valid cached state, mark as initialized immediately
    if (startedWithCache.current) {
      toast.success("⚡ Using cached auth - skipping Firebase check");
      setInitialized(true);
      setCachedAuthState(true);
      
      // Hide loader immediately for cached auth
      if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
        setTimeout(() => {
          (window as any).hideInitialLoader();
        }, 100);
      }
    }

    toast.info("🔄 Setting up auth state listener (background sync)...");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const authCheckStart = performance.now();
      
      // If already initialized with cache, do background sync only
      if (startedWithCache.current && initialized) {
        toast.info("🔄 Background sync with Firebase...");
        
        if (currentUser && currentUser.email === initialState.user?.email) {
          // User still valid, just update cache silently
          cacheAuthState(currentUser);
          setUser(currentUser);
          toast.success("✅ Background sync complete");
        } else if (!currentUser) {
          // User logged out on another device
          toast.info("🔄 Session expired, logging out...");
          setUser(null);
          setUserData(null);
          localStorage.clear();
        }
        return;
      }
      
      if (!currentUser) {
        toast.info("👤 No current user - checking cache...");
        // If we have valid cached data, use it for offline mode
        const cachedAuth = localStorage.getItem(CACHED_AUTH_KEY);
        const cachedUser = cachedAuth ? JSON.parse(cachedAuth) : null;
        const cachedData = getCachedUserData();
        if (
          cachedUser?.email &&
          cachedData?.email &&
          cachedUser.email === cachedData.email &&
          isCacheValid()
        ) {
          setUser(cachedUser);
          setUserData(cachedData);
          setCachedAuthState(true);
          setLoading(false);
          setInitialized(true);
          toast.success("✅ Using cached auth state (" + Math.round(performance.now() - authCheckStart) + "ms)");
          // Hide initial loader once auth is ready
          if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
            toast.info("🎉 Hiding initial loader...");
            (window as any).hideInitialLoader();
          }
          return;
        }
        // No valid cache, clear state
        if (user || userData) {
          setUser(null);
          setUserData(null);
          localStorage.removeItem(CACHED_USER_KEY);
          localStorage.removeItem(CACHED_AUTH_KEY);
        }
        setCachedAuthState(false);
        setLoading(false);
        setInitialized(true);
        toast.info("👤 No cached auth - user logged out (" + Math.round(performance.now() - authCheckStart) + "ms)");
        // Hide initial loader once auth is ready
        if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
          toast.info("🎉 Hiding initial loader...");
          (window as any).hideInitialLoader();
        }
        return;
      }
      
      toast.info("👤 Current user found: " + currentUser.email);

      // Only set loading if we need to fetch new data and don't have valid cache
      const cachedData = getCachedUserData();
      const needsFetch = !(
        cachedData?.email &&
        currentUser.email &&
        cachedData.email === currentUser.email
      );

      if (needsFetch && !startedWithCache.current) {
        // Don't show loading if we already have cached state
        if (!initialized) {
          toast.info("🔄 Need to fetch fresh user data...");
          setLoading(true);
        } else {
          toast.info("🔄 Refreshing user data in background...");
        }
        try {
          if (currentUser.email) {
            const userData = await fetchUserData(currentUser.email);
            if (!userData) {
              await signOut(auth);
              setUser(null);
              setUserData(null);
              localStorage.removeItem(CACHED_USER_KEY);
              localStorage.removeItem(CACHED_AUTH_KEY);
              setCachedAuthState(false);
            } else {
              setUser(currentUser);
              setUserData(userData);
              setCachedAuthState(false);
            }
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
        } finally {
          setLoading(false);
          toast.success("✅ Auth check complete (" + Math.round(performance.now() - authCheckStart) + "ms)");
          // Hide initial loader after auth completes
          if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
            toast.info("🎉 Hiding initial loader...");
            (window as any).hideInitialLoader();
          }
        }
      } else {
        // Use cached data immediately
        toast.info("⚡ Using cached user data - fast path");
        setUser(currentUser);
        setUserData(cachedData);
        setCachedAuthState(false);
        setLoading(false);
        toast.success("✅ Auth ready with cache (" + Math.round(performance.now() - authCheckStart) + "ms)");
        // Hide initial loader when using cached data
        if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
          toast.info("🎉 Hiding initial loader...");
          (window as any).hideInitialLoader();
        }
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps intentional - initialState is computed once, initialized is managed internally

  // Only show loading state if we're actually loading and not initialized
  if (loading && !initialized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100svh",
          background: "black",
          
          // background: "linear-gradient(darkslateblue, midnightblue)",
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
