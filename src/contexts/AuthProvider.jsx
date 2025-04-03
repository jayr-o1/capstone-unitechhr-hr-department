import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { loginUser, registerUser, resetPassword } from "../services/authService";
import { getUserData } from "../services/userService";
import { getUniversityById } from "../services/universityService";

// Create Context
const AuthContext = createContext(null);

// Custom Hook for accessing the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch additional user details and university info
  const fetchUserDetails = async (userId) => {
    try {
      console.log("Fetching user details for:", userId);
      // Get user data from Firestore
      const userData = await getUserData(userId);
      
      if (userData.success) {
        console.log("User data fetched successfully:", userData.data);
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
    console.log("Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log("Auth state changed:", authUser ? "User logged in" : "No user");
      
      if (authUser) {
        console.log("Setting user:", authUser.uid);
        setUser(authUser);
        await fetchUserDetails(authUser.uid);
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
      // For system admin logins, set up user details differently
      if (result.role === 'system_admin') {
        console.log("Setting system admin user details");
        
        // Create a user object for the system admin
        const adminUser = {
          uid: result.adminUser?.id || `system_admin_${Date.now()}`,
          displayName: result.adminUser?.displayName || "System Administrator",
          email: `${result.adminUser?.username || "admin"}@system.admin`
        };
        
        console.log("Created system admin user:", adminUser);
        setUser(adminUser);
        
        // Set detailed user info
        const adminDetails = {
          role: "system_admin",
          ...result.adminUser
        };
        console.log("Setting system admin user details:", adminDetails);
        setUserDetails(adminDetails);
        
        console.log("System admin login successful - user object and details set");
      }
      // For employee logins, we need to set up user details differently
      else if (result.role === 'employee') {
        console.log("Setting employee user details");
        
        // If employee login was successful but we didn't use Firebase Auth (debug mode)
        if (!auth.currentUser) {
          // Create a mock user object for the employee
          const employeeUser = {
            uid: `emp_${result.employeeData?.id || ""}_${result.universityId}`,
            isEmployee: true,
            universityId: result.universityId,
            employeeId: result.employeeData?.id || "",
            displayName: result.employeeData?.name || "",
            email: `${result.employeeData?.id || ""}@${result.universityId}.com`
          };
          
          console.log("Created mock employee user:", employeeUser);
          setUser(employeeUser);
          
          // Set detailed user info
          const userDetails = {
            role: "employee",
            universityId: result.universityId,
            ...(result.employeeData || {})
          };
          console.log("Setting employee user details:", userDetails);
          setUserDetails(userDetails);
          
          // Set university info
          setUniversity({
            id: result.universityId,
            name: result.universityName,
            code: result.universityCode
          });
          
          console.log("Employee login successful - user object and details set");
        } else {
          // If Firebase Auth was used, fetch details as normal
          await fetchUserDetails(auth.currentUser.uid);
        }
      } else if (auth.currentUser) {
        // For HR logins, use Firebase Auth as before
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
      // For employee logins that didn't use Firebase Auth, just clear the state
      if (userDetails?.role === 'employee' && user?.isEmployee) {
        console.log("Logging out employee directly");
        setUser(null);
        setUserDetails(null);
        setUniversity(null);
      } else {
        // For HR logins, sign out from Firebase Auth
        await signOut(auth);
        // Auth state listener will update the user state
      }
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

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider; 