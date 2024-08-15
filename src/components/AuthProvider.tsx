// AuthProvider.js
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
  } from "firebase/auth";
  import { createContext, useEffect, useState } from "react";
  import PropTypes from "prop-types";
  import {auth} from "@/firebase";

  interface Props{
    children?:any
  }
  
  export const AuthContext = createContext("");
  
  const AuthProvider = (props:Props) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
  
    const createUser = (email:any, password:any) => {
      setLoading(true);
      return createUserWithEmailAndPassword(auth, email, password);
    };
  
    const loginUser = (email:any, password:any) => {
      setLoading(true);
      return signInWithEmailAndPassword(auth, email, password);
    };
  
    const logOut = () => {
      setLoading(true);
      return signOut(auth);
    };
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser:any) => {
        setUser(currentUser);
        setLoading(false);
      });
  
      return () => {
        unsubscribe();
      };
    }, []);
  
    const authValue = {
      createUser,
      user,
      loginUser,
      logOut,
      loading,
    };
  
    return <AuthContext.Provider value={String(authValue)}>{props.children}</AuthContext.Provider>;
  };
  
  AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  
  export default AuthProvider;