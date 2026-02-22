import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logoutUser: () => Promise<void>;
  userData: {
    clearance?: string;
    role?: string;
    editor?: boolean;
  } | null;
  assignedSite?: string; // Optional field for assigned site
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<AuthContextType['userData']>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Here you can fetch additional user data from your database
        // For example, user roles, clearance, etc.
        // const userDoc = await getDoc(doc(db, 'users', user.uid));
        // setUserData(userDoc.data());
        setUserData({
          clearance: 'All', // Replace with actual data fetch
          role: 'admin',    // Replace with actual data fetch
          editor: true      // Replace with actual data fetch
        });
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const value = {
    user,
    loading,
    logoutUser,
    userData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
