import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { loginUser, registerUser, resetPassword } from "../services/authService";
import { getUserData } from "../services/userService";
import { getUniversityById } from "../services/universityService";

// Create Context
const AuthContext = createContext(null);

// Keys for localStorage
const SYSTEM_ADMIN_KEY = "unitech_system_admin";
const EMPLOYEE_KEY = "unitech_employee";

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

  // Restore saved sessions
  const restoreSavedSessions = () => {
    // Try to restore system admin session
    const savedAdminSession = localStorage.getItem(SYSTEM_ADMIN_KEY);
    if (savedAdminSession) {
      try {
        console.log("Found saved system admin session");
        const adminData = JSON.parse(savedAdminSession);
        setUser(adminData.user);
        setUserDetails(adminData.userDetails);
        console.log("System admin session restored");
        return true;
      } catch (error) {
        console.error("Error restoring system admin session:", error);
        localStorage.removeItem(SYSTEM_ADMIN_KEY);
      }
    }

    // Try to restore employee session if admin session wasn't found
    const savedEmployeeSession = localStorage.getItem(EMPLOYEE_KEY);
    if (savedEmployeeSession) {
      try {
        console.log("Found saved employee session");
        const employeeData = JSON.parse(savedEmployeeSession);
        setUser(employeeData.user);
        setUserDetails(employeeData.userDetails);
        setUniversity(employeeData.university);
        console.log("Employee session restored");
        return true;
      } catch (error) {
        console.error("Error restoring employee session:", error);
        localStorage.removeItem(EMPLOYEE_KEY);
      }
    }

    return false;
  };

  // Listen to the Firebase Auth state and set the local state.
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // First check for saved sessions
    const hasSavedSession = restoreSavedSessions();
    
    // If we found and restored a saved session, we can skip Firebase auth check
    if (hasSavedSession) {
      console.log("Session restored from localStorage, skipping Firebase auth check");
      setLoading(false);
      return () => {}; // No cleanup needed
    }
    
    // Otherwise, proceed with Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log("Auth state changed:", authUser ? "User logged in" : "No user");
      
      // Keep loading true until we fetch user details
      setLoading(true);
      
      if (authUser) {
        console.log("Setting user from Firebase Auth:", authUser.uid);
        setUser(authUser);
        await fetchUserDetails(authUser.uid);
        console.log("User details fetched, setting loading to false");
        setLoading(false);
      } else {
        console.log("No Firebase Auth user, clearing state and setting loading to false");
        setUser(null);
        setUserDetails(null);
        setUniversity(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    console.log("Login attempt started for:", email);
    setLoading(true);
    setError(null);
    
    try {
      const result = await loginUser(email, password);
      console.log("Login result:", result);
      
      if (!result.success) {
        console.log("Login failed:", result.message);
        setError(result.message);
        setLoading(false);
        return result;
      }
      
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
        
        // Save system admin session to localStorage
        localStorage.setItem(SYSTEM_ADMIN_KEY, JSON.stringify({
          user: adminUser,
          userDetails: adminDetails
        }));
        
        console.log("System admin login successful - user object and details set and saved to localStorage");
        setLoading(false);
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
          const employeeDetails = {
            role: "employee",
            universityId: result.universityId,
            ...(result.employeeData || {})
          };
          console.log("Setting employee user details:", employeeDetails);
          setUserDetails(employeeDetails);
          
          // Set university info
          const universityData = {
            id: result.universityId,
            name: result.universityName,
            code: result.universityCode
          };
          setUniversity(universityData);
          
          // Save employee session to localStorage
          localStorage.setItem(EMPLOYEE_KEY, JSON.stringify({
            user: employeeUser,
            userDetails: employeeDetails,
            university: universityData
          }));
          
          console.log("Employee login successful - user object and details set and saved to localStorage");
          setLoading(false);
        } else {
          // If Firebase Auth was used, fetch details as normal
          await fetchUserDetails(auth.currentUser.uid);
          setLoading(false);
        }
      } else if (result.role === 'hr_head' || result.role === 'hr_personnel') {
        // For HR logins, Firebase Auth has already been initialized by the loginUser function
        console.log(`HR ${result.role} login successful - user is set by Firebase Auth`);
        // Don't set loading to false here - let the onAuthStateChanged handler above handle it
        // after it fetches the user details
        console.log("Waiting for Firebase Auth state change to complete user details fetch");
      } else {
        console.error("Login successful but unknown role:", result.role);
        setLoading(false);
      }
      
      return result;
    } catch (error) {
      console.error("Error during login process:", error);
      setError(error.message || "An unexpected error occurred");
      setLoading(false);
      return { 
        success: false, 
        message: error.message || "An unexpected error occurred"
      };
    }
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
      // For system admin or employee logins that didn't use Firebase Auth
      if (userDetails?.role === 'system_admin') {
        console.log("Logging out system admin directly");
        localStorage.removeItem(SYSTEM_ADMIN_KEY);
        setUser(null);
        setUserDetails(null);
      } else if (userDetails?.role === 'employee' && user?.isEmployee) {
        console.log("Logging out employee directly");
        localStorage.removeItem(EMPLOYEE_KEY);
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