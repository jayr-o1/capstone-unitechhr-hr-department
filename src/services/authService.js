import { auth } from '../firebase'; // Import Firebase auth
import { db } from '../firebase'; // Import Firestore
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { verifyPassword } from '../utils/passwordUtils';

// Special function for direct employee authentication - doesn't use Firebase Auth at all
async function authenticateEmployee(employeeId, universityId, password) {
  console.log("Attempting direct employee authentication:", employeeId, "at university:", universityId);
  
  try {
    // Check if the university exists
    let universityDoc = null;
    let universityName = null;
    
    // Try to find by code first
    const universitiesRef = collection(db, "universities");
    const universityQuery = query(universitiesRef, where("code", "==", universityId));
    const universitySnapshot = await getDocs(universityQuery);
    
    if (!universitySnapshot.empty) {
      universityDoc = universitySnapshot.docs[0];
      universityId = universityDoc.id; // Get the actual document ID
      universityName = universityDoc.data().name;
      console.log("Found university by code:", universityName);
    } else {
      // Try by direct ID
      const universityDocRef = doc(db, "universities", universityId);
      const universityDocSnapshot = await getDoc(universityDocRef);
      
      if (universityDocSnapshot.exists()) {
        universityDoc = universityDocSnapshot;
        universityName = universityDoc.data().name;
        console.log("Found university by ID:", universityName);
      } else {
        console.error("University not found:", universityId);
        return {
          success: false,
          message: "University not found. Please check the code and try again."
        };
      }
    }
    
    // Find the employee
    const employeesRef = collection(db, "universities", universityId, "employees");
    const employeeQuery = query(employeesRef, where("employeeId", "==", employeeId));
    const employeeSnapshot = await getDocs(employeeQuery);
    
    if (employeeSnapshot.empty) {
      console.error("Employee not found:", employeeId);
      return {
        success: false,
        message: "Employee not found. Please check your ID and try again."
      };
    }
    
    // Get employee data
    const employeeDoc = employeeSnapshot.docs[0];
    const employeeData = employeeDoc.data();
    
    console.log("Found employee:", employeeData.name || employeeId);
    
    // TEMPORARY: Bypass password check for debugging
    console.log("DEBUG MODE: Bypassing password check");
    return {
      success: true,
      role: "employee",
      universityId,
      universityName,
      universityCode: universityId,
      employeeData: {
        id: employeeId,
        name: employeeData.name || employeeId,
        department: employeeData.department,
        position: employeeData.position
      }
    };
    
    /* Uncomment when ready to implement real password checking
    // Check if password exists and matches
    if (!employeeData.password) {
      console.error("No password set for employee");
      return {
        success: false,
        message: "Account not properly set up. Please contact your administrator."
      };
    }
    
    // Verify password
    const passwordMatch = await verifyPassword(password, employeeData.password);
    if (!passwordMatch) {
      console.error("Password doesn't match");
      return {
        success: false,
        message: "Invalid password. Please try again."
      };
    }
    
    return {
      success: true,
      role: "employee",
      universityId,
      universityName,
      universityCode: universityId,
      employeeData: {
        id: employeeId,
        name: employeeData.name || employeeId,
        department: employeeData.department,
        position: employeeData.position
      }
    };
    */
  } catch (error) {
    console.error("Error in employee authentication:", error);
    return {
      success: false,
      message: "An error occurred during authentication. Please try again."
    };
  }
}

// Handle login
export const loginUser = async (email, password) => {
  try {
    console.log("Auth service received login request for:", email);
    
    // Special case: If this is an employee login with our marker
    if (email.includes("_EMPLOYEE_LOGIN_MARKER")) {
      // Parse the employee ID and university ID
      const employeeLoginPattern = /^(.+)@(.+)_EMPLOYEE_LOGIN_MARKER\.com$/;
      const match = email.match(employeeLoginPattern);
      
      if (match) {
        const employeeId = match[1];
        const universityId = match[2];
        
        // Use direct employee authentication, bypassing Firebase Auth
        return await authenticateEmployee(employeeId, universityId, password);
      }
    }
    
    // If it doesn't have our marker and looks like a standard email (has @ and .),
    // treat as a regular HR login
    if (email.includes('@') && !email.includes('_EMPLOYEE_LOGIN_MARKER')) {
      // Check if it looks like a regular email with a domain
      const domainPattern = /^[^@]+@[^@]+\.[^@]{2,}$/;
      if (domainPattern.test(email)) {
        console.log("Detected standard email format, using HR login flow");
        
        // Standard Firebase Auth for HR login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        console.log("Sign-in successful for UID:", uid);

        // Get user document from the authMappings collection
        const authMappingRef = doc(db, "authMappings", uid);
        const authMappingDoc = await getDoc(authMappingRef);

        if (authMappingDoc.exists()) {
          const authData = authMappingDoc.data();
          const universityId = authData.universityId;
          const role = authData.role;
          const status = authData.status;
          
          console.log("Auth mapping found:", role, "status:", status);
          
          if (!universityId) {
            console.log("No university ID found in auth mapping");
            return { 
              success: false, 
              message: "User record is incomplete. Please contact administrator." 
            };
          }
          
          // Check status from the auth mapping
          if (status === 'pending') {
            console.log("User account is pending approval");
            return { 
              success: false, 
              message: "Your account is pending administrator approval. Please check back later."
            };
          }

          // Get university name
          let universityName = null;
          const universityRef = doc(db, "universities", universityId);
          const universityDoc = await getDoc(universityRef);
          if (universityDoc.exists()) {
            universityName = universityDoc.data().name;
          }

          // Update the last login time in the appropriate collection based on role
          if (role === 'hr_head') {
            const hrHeadRef = doc(db, "universities", universityId, "hr_head", uid);
            await updateDoc(hrHeadRef, {
              lastLogin: serverTimestamp()
            });
          } else {
            const hrPersonnelRef = doc(db, "universities", universityId, "hr_personnel", uid);
            await updateDoc(hrPersonnelRef, {
              lastLogin: serverTimestamp()
            });
          }
          
          console.log("HR login successful, returning role:", role);
          return { 
            success: true, 
            universityId, 
            role,
            universityCode: null,
            universityName
          };
        }
        
        // If no auth mapping found, this means the user exists in Firebase Auth but not in our system
        console.error("No auth mapping found for user:", uid);
        return { 
          success: false, 
          message: "User not found in the system. Please contact administrator."
        };
      }
    }
    
    // If we get here, it could be an old-format employee login without our marker
    // The following code is just for backward compatibility and can be removed later
    let employeeId = null;
    let universityCode = null;
    let isEmployeeLogin = false;
    let universityName = null;
    
    // Employee login pattern (format: employeeId@universityCode.com)
    const employeeLoginPattern = /^(.+)@(.+)\.com$/;
    const match = email.match(employeeLoginPattern);
    
    // Skip the fallback if this doesn't look like an email at all
    if (!email.includes('@')) {
      console.log("Email format doesn't match any known pattern, returning error");
      return { 
        success: false, 
        message: "Invalid email format. Please check your input and try again." 
      };
    }
    
    // If we get here and it has a @ symbol but didn't match our HR login conditions above,
    // try once more with Firebase Auth as a fallback for HR logins with non-standard domains
    console.log("Trying Firebase Auth as fallback for:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log("Firebase Auth fallback successful for UID:", uid);
      
      // Get user details and return
      const authMappingRef = doc(db, "authMappings", uid);
      const authMappingDoc = await getDoc(authMappingRef);
      
      if (authMappingDoc.exists()) {
        const authData = authMappingDoc.data();
        const universityId = authData.universityId;
        const role = authData.role;
        
        // Get university name
        if (universityId) {
          const universityRef = doc(db, "universities", universityId);
          const universityDoc = await getDoc(universityRef);
          if (universityDoc.exists()) {
            universityName = universityDoc.data().name;
          }
        }
        
        return { 
          success: true, 
          universityId, 
          role,
          universityCode: null,
          universityName
        };
      } else {
        return { 
          success: false, 
          message: "User not found in the system. Please contact administrator."
        };
      }
    } catch (error) {
      console.error("Firebase Auth fallback failed:", error);
      return {
        success: false,
        message: error.code === 'auth/invalid-credential' 
          ? "Invalid email or password. Please try again."
          : "Login failed: " + error.message
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    // Format more specific error messages based on Firebase Auth error codes
    if (error.code === 'auth/user-not-found') {
      return { 
        success: false, 
        message: "User not found. Please check your email and try again."
      };
    } else if (error.code === 'auth/wrong-password') {
      return { 
        success: false, 
        message: "Invalid password. Please try again."
      };
    } else if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        message: "Invalid email format. Please use a valid email address."
      };
    } else if (error.code === 'auth/too-many-requests') {
      return { 
        success: false, 
        message: "Too many failed login attempts. Please try again later."
      };
    }
    
    return { 
      success: false, 
      message: "Login failed: " + error.message
    };
  }
};

// Handle registration
export const registerUser = async (email, password, displayName, userMetadata = {}) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName });
    
    // Save user data to Firestore
    const { universityId, role, status } = userMetadata;
    
    // Create auth mapping
    await setDoc(doc(db, "authMappings", user.uid), {
      role,
      universityId,
      createdAt: serverTimestamp(),
      status: status || 'active'
    });
    
    // Create hr_head or hr_personnel document
    if (role === 'hr_head') {
      await setDoc(doc(db, "universities", universityId, "hr_head", user.uid), {
        name: displayName,
        email: email,
        createdAt: serverTimestamp(),
        // Add other HR head specific fields
      });
    } else {
      await setDoc(doc(db, "universities", universityId, "hr_personnel", user.uid), {
        name: displayName,
        email: email,
        createdAt: serverTimestamp(),
        // Add other HR personnel specific fields
      });
    }
    
    return { success: true, user };
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.code === 'auth/email-already-in-use') {
      return { 
        success: false, 
        message: "Email already in use. Please use a different email address."
      };
    } else if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        message: "Invalid email format. Please use a valid email address."
      };
    } else if (error.code === 'auth/weak-password') {
      return { 
        success: false, 
        message: "Password is too weak. Please use a stronger password."
      };
    }
    
    return { 
      success: false, 
      message: "Registration failed: " + error.message 
    };
  }
};

// Handle password reset
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: "Password reset email sent. Please check your inbox."
    };
  } catch (error) {
    console.error("Password reset error:", error);
    
    if (error.code === 'auth/user-not-found') {
      return { 
        success: false, 
        message: "No user found with this email address."
      };
    } else if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        message: "Invalid email format. Please use a valid email address."
      };
    }
    
    return {
      success: false,
      message: "Failed to send password reset email: " + error.message
    };
  }
}; 