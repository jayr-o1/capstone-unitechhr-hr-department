import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, resetPassword, registerUser } from "../services/authService";
import { getUserData } from "../services/userService";
import { getUniversityById } from "../services/universityService";
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
  const [userDetails, setUserDetails] = useState(null);
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch additional user details and university info
  const fetchUserDetails = async (userId) => {
    try {
      // Get user data from Firestore
      const userData = await getUserData(userId);
      
      if (userData.success) {
        setUserDetails(userData.data);
        
        // If user has a university, fetch university details
        if (userData.data.universityId) {
          const universityData = await getUniversityById(userData.data.universityId);
          if (universityData.success) {
            setUniversity(universityData.university);
          }
        }
      } else {
        console.error("Error fetching user details:", userData.message);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  // Listen to the Firebase Auth state and set the local state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchUserDetails(user.uid);
      } else {
        setUser(null);
        setUserDetails(null);
        setUniversity(null);
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
    } else {
      // Fetch user details after successful login
      if (auth.currentUser) {
        await fetchUserDetails(auth.currentUser.uid);
      }
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

  // Refresh user details
  const refreshUserData = async () => {
    if (user) {
      await fetchUserDetails(user.uid);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userDetails,
      university,
      login,
      register, 
      logout,
      loading, 
      error, 
      resetPasswordHandler,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 