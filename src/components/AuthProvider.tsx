// AuthProvider.js
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { auth, db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface FirestoreUserData {
  id: string;
  role: string;
  email: string;
  clearance: "Sohar Star United" | "Vale" | "All" | "none";
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userData: FirestoreUserData | null;
  loading: boolean;
  createUser: (email: string, password: string) => Promise<any>;
  loginUser: (email: string, password: string) => Promise<any>;
  logOut: () => Promise<void>;
}

interface Props {
  children: React.ReactNode;
}

const CACHED_USER_KEY = "cached_user_data";
const CACHED_AUTH_KEY = "cached_auth_state";

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize with cached auth state if available
    try {
      const cached = localStorage.getItem(CACHED_AUTH_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [userData, setUserData] = useState<FirestoreUserData | null>(() => {
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const cacheUserData = (data: FirestoreUserData) => {
    try {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error caching user data:", error);
    }
  };

  const cacheAuthState = (user: User | null) => {
    try {
      if (user) {
        // Only cache necessary user fields, not the entire Firebase User object
        const cachedUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        localStorage.setItem(CACHED_AUTH_KEY, JSON.stringify(cachedUser));
      } else {
        localStorage.removeItem(CACHED_AUTH_KEY);
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
    try {
      // Try to get data from Firestore first
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
        return userData;
      }

      // If no data found in Firestore, try cache
      const cachedData = getCachedUserData();
      if (cachedData && cachedData.email === email) {
        setUserData(cachedData);
        return cachedData;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      // If offline or error, try to get from cache
      const cachedData = getCachedUserData();
      if (cachedData && cachedData.email === email) {
        setUserData(cachedData);
        return cachedData;
      }
      return null;
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      cacheAuthState(result.user);
      const userData = await fetchUserData(email);
      return { result, userData };
    } catch (error) {
      // If offline, try to validate against cached credentials
      const cachedAuth = localStorage.getItem(CACHED_AUTH_KEY);
      const cachedUser = cachedAuth ? JSON.parse(cachedAuth) : null;
      const cachedData = getCachedUserData();

      if (cachedUser?.email === email && cachedData?.email === email) {
        // In offline mode, we can't verify the password against Firebase
        // but we can allow access if they have valid cached credentials
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
      localStorage.removeItem(CACHED_USER_KEY);
      localStorage.removeItem(CACHED_AUTH_KEY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      cacheAuthState(currentUser);

      if (currentUser?.email) {
        // Try to get cached data first while fetching from Firestore
        const cachedData = getCachedUserData();
        if (cachedData && cachedData.email === currentUser.email) {
          setUserData(cachedData);
        }
        // Then try to fetch fresh data
        await fetchUserData(currentUser.email);
      } else {
        setUserData(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_AUTH_KEY);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const authValue: AuthContextType = {
    user,
    userData,
    loading,
    createUser,
    loginUser,
    logOut,
  };

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
