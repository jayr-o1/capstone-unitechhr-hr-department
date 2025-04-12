import { auth } from '../firebase'; // Import Firebase auth
import { db } from '../firebase'; // Import Firestore
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
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

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs = 15000) => {
  let timeoutId;
  
  // Create a promise that rejects after the specified timeout
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  // Race the original promise against the timeout
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Handle login
export const loginUser = async (email, password) => {
  try {
    console.log("Auth service received login request for:", email);
    
    // Special case: If this is a system admin login
    if (email.includes("_SYSTEM_ADMIN_")) {
      // Parse the username from the email format
      const adminLoginPattern = /^(.+)_SYSTEM_ADMIN_$/;
      const match = email.match(adminLoginPattern);
      
      if (match) {
        const username = match[1];
        
        // Use system admin authentication
        const { getSystemAdminByCredentials } = await import('./adminService');
        const adminResult = await withTimeout(getSystemAdminByCredentials(username, password));
        
        if (adminResult.success) {
          console.log("System admin login successful");
          return { 
            success: true, 
            role: 'system_admin',
            adminUser: adminResult.user
          };
        } else {
          return adminResult; // Return error from admin service
        }
      }
    }
    
    // Special case: If this is an employee login with our marker
    if (email.includes("_EMPLOYEE_LOGIN_MARKER")) {
      // Parse the employee ID and university ID
      const employeeLoginPattern = /^(.+)@(.+)_EMPLOYEE_LOGIN_MARKER\.com$/;
      const match = email.match(employeeLoginPattern);
      
      if (match) {
        const employeeId = match[1];
        const universityId = match[2];
        
        // Use direct employee authentication, bypassing Firebase Auth
        return await withTimeout(authenticateEmployee(employeeId, universityId, password));
      }
    }
    
    // If it doesn't have our marker and looks like a standard email (has @ and .),
    // treat as a regular HR login
    if (email.includes('@') && !email.includes('_EMPLOYEE_LOGIN_MARKER')) {
      console.log("Detected standard email format, using HR login flow");
      
      try {
        // Standard Firebase Auth for HR login
        const userCredential = await withTimeout(signInWithEmailAndPassword(auth, email, password));
        const uid = userCredential.user.uid;
        console.log("Sign-in successful for UID:", uid);

        // Get user document from the authMappings collection
        const authMappingRef = doc(db, "authMappings", uid);
        const authMappingDoc = await withTimeout(getDoc(authMappingRef));

        if (authMappingDoc.exists()) {
          const authData = authMappingDoc.data();
          const universityId = authData.universityId;
          const role = authData.role;
          const status = authData.status;
          
          console.log("Auth mapping found:", role, "status:", status, "universityId:", universityId);
          
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
          const universityDoc = await withTimeout(getDoc(universityRef));
          if (universityDoc.exists()) {
            universityName = universityDoc.data().name;
            console.log("Found university name:", universityName);
          } else {
            console.warn("University document not found for ID:", universityId);
          }

          // Update the last login time in the appropriate collection based on role
          try {
            if (role === 'hr_head') {
              console.log("Updating lastLogin for HR Head in university collection");
              const hrHeadRef = doc(db, "universities", universityId, "hr_head", uid);
              const hrHeadDoc = await withTimeout(getDoc(hrHeadRef));
              
              if (hrHeadDoc.exists()) {
                await withTimeout(updateDoc(hrHeadRef, {
                  lastLogin: serverTimestamp()
                }));
                console.log("HR Head lastLogin updated successfully");
              } else {
                console.warn("HR Head record not found in university collection");
              }
            } else if (role === 'hr_personnel') {
              console.log("Updating lastLogin for HR Personnel in university collection");
              const hrPersonnelRef = doc(db, "universities", universityId, "hr_personnel", uid);
              const hrPersonnelDoc = await withTimeout(getDoc(hrPersonnelRef));
              
              if (hrPersonnelDoc.exists()) {
                await withTimeout(updateDoc(hrPersonnelRef, {
                  lastLogin: serverTimestamp()
                }));
                console.log("HR Personnel lastLogin updated successfully");
              } else {
                console.warn("HR Personnel record not found in university collection");
              }
            }
          } catch (updateError) {
            // Just log this error but continue - it's not critical enough to fail the login
            console.warn("Error updating lastLogin:", updateError.message);
          }

          // Return success with role and university info
          return {
            success: true,
            role,
            universityId,
            universityName
          };
        } else {
          // No auth mapping found
          console.error("No auth mapping found for user with UID:", uid);
          
          // Sign out the user to clean up the Auth state
          await signOut(auth);
          
          return { 
            success: false, 
            message: "Your account is not properly configured. Please contact administrator." 
          };
        }
      } catch (error) {
        console.error("Firebase Auth login error:", error);
        
        // Format the error message
        let errorMessage = "Login failed. Please check your credentials and try again.";
        
        // Convert Firebase error code to user-friendly message
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = "Invalid email or password.";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "Invalid email format.";
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = "This account has been disabled.";
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = "Too many unsuccessful login attempts. Please try again later.";
        } else if (error.message.includes('timed out')) {
          errorMessage = "Login timed out. Please check your connection and try again.";
        }
        
        return { 
          success: false, 
          message: errorMessage 
        };
      }
    }
    
    // If no matching login flow was found
    return { 
      success: false, 
      message: "Invalid login attempt. Please check your credentials." 
    };
  } catch (error) {
    console.error("Error in loginUser:", error);
    
    let errorMessage = "An unexpected error occurred during login.";
    if (error.message.includes('timed out')) {
      errorMessage = "Login request timed out. Please check your connection and try again.";
    }
    
    return { 
      success: false, 
      message: errorMessage
    };
  }
};

// Handle registration
export const registerUser = async (email, password, displayName, userMetadata = {}) => {
  try {
    console.log("Registering user with metadata:", userMetadata);
    
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user profile with displayName
    await updateProfile(user, { displayName });
    
    // Determine what kind of registration this is
    const isHRHead = userMetadata.position === 'HR Head';
    
    // Generate a university ID if not provided
    let universityId = userMetadata.universityId;
    let universityCode = null;
    
    if (isHRHead && !universityId && userMetadata.universityName) {
      // Generate a unique university ID based on the name
      const sanitizedName = userMetadata.universityName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10);
      
      // Add a timestamp to ensure uniqueness
      const timestamp = Date.now().toString().substring(7);
      universityId = `${sanitizedName}_${timestamp}`;
      
      // Create a shorter code for employees to use
      universityCode = sanitizedName.substring(0, 5).toUpperCase();
      
      console.log("Generated university ID:", universityId, "and code:", universityCode);
      
      // Create the university document
      const universityRef = doc(db, 'universities', universityId);
      await setDoc(universityRef, {
        name: userMetadata.universityName,
        code: universityCode,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      
      console.log("Created university document:", universityId);
    }
    
    // No approval needed (temporary change) - all accounts are approved automatically
    const status = 'approved';
    
    // Create auth mapping in Firestore
    const authMappingRef = doc(db, 'authMappings', user.uid);
    await setDoc(authMappingRef, {
      email: email,
      displayName: displayName,
      role: isHRHead ? 'hr_head' : 'hr_personnel', // Set role based on position
      universityId: universityId,
      status: status,
      createdAt: serverTimestamp()
    });
    
    console.log("Created auth mapping for user:", user.uid);
    
    // Store additional information in the appropriate collection
    if (universityId) {
      // Choose collection based on role
      const collectionName = isHRHead ? 'hr_head' : 'hr_personnel';
      
      const userDocRef = doc(db, 'universities', universityId, collectionName, user.uid);
      
      await setDoc(userDocRef, {
        email: email,
        name: displayName,
        position: userMetadata.position || 'HR Manager',
        department: userMetadata.department || 'Human Resources',
        status: status,
        // Include other metadata as needed
        permissions: collectionName === 'hr_personnel' 
          ? { // Default permissions for HR personnel
              recruitment: true,
              onboarding: true,
              employees: true,
              clusters: false,
              notifications: false
            } 
          : null, // HR Heads don't need permissions
        createdAt: serverTimestamp()
      });
      
      console.log("Created user document in university collection:", collectionName);
    }
    
    // Sign out the user to ensure they must log in manually after registration
    await signOut(auth);
    console.log("User signed out after registration to require manual login");
    
    return { 
      success: true, 
      user: user,
      status: status, 
      isHRHead: isHRHead,
      universityId: universityId,
      universityCode: universityCode,
      message: "Registration successful! Your account has been created."
    };
  } catch (error) {
    console.error("Registration failed:", error);
    let message = "Registration failed.";
    if (error.code === 'auth/email-already-in-use') {
      message = "Email is already in use.";
    } else if (error.code === 'auth/invalid-email') {
      message = "Invalid email format.";
    } else if (error.code === 'auth/weak-password') {
      message = "Password is too weak.";
    }
    return { success: false, message };
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