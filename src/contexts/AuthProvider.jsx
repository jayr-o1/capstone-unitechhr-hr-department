import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, resetPassword, registerUser } from "../services/authService";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Create Context
const AuthContext = createContext();

// Custom Hook for accessing the context
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to the Firebase Auth state and set the local state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    const result = await loginUser(email, password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
    return result;
  };

  const register = async (email, password, displayName, userMetadata = {}) => {
    setLoading(true);
    setError(null);
    const result = await registerUser(email, password, displayName, userMetadata);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // Auth state listener will update the user state
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const resetPasswordHandler = async (email) => {
    setLoading(true);
    setError(null);
    const result = await resetPassword(email);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
    return result;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login,
      register, 
      logout,
      loading, 
      error, 
      resetPasswordHandler 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 