import { auth } from '../firebase'; // Import Firebase auth
import { db } from '../firebase'; // Import Firestore
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

// Handle login
export const loginUser = async (email, password) => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Get user document directly from the authMappings collection
    const authMappingRef = doc(db, "authMappings", uid);
    const authMappingDoc = await getDoc(authMappingRef);
    
    if (authMappingDoc.exists()) {
      const authData = authMappingDoc.data();
      const universityId = authData.universityId;
      const role = authData.role;
      const status = authData.status;
      
      if (!universityId) {
        return { 
          success: false, 
          message: "User record is incomplete. Please contact administrator." 
        };
      }
      
      // Check status from the auth mapping
      if (status === 'pending') {
        return { 
          success: false, 
          message: "Your account is pending administrator approval. Please check back later."
        };
      }
      
      // Update the last login time in the appropriate collection based on role
      if (role === 'hr_head') {
        const hrHeadRef = doc(db, "universities", universityId, "hr_head", uid);
        await updateDoc(hrHeadRef, {
          lastLogin: new Date().toISOString()
        });
      } else {
        const hrPersonnelRef = doc(db, "universities", universityId, "hr_personnel", uid);
        await updateDoc(hrPersonnelRef, {
          lastLogin: new Date().toISOString()
        });
      }
      
      return { success: true, universityId, role };
    } else {
      // No auth mapping found, user doesn't exist
      return { success: false, message: "User not found. Please register first." };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Handle password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Handle user registration
export const registerUser = async (email, password, displayName, userData = {}) => {
  try {
    // Create the user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Extract user ID
    const uid = userCredential.user.uid;
    
    // Check if university exists, if not create it
    let universityId = userData.universityId || '';
    let universityName = userData.universityName || '';
    let isFirstUser = false;
    
    if (universityName && !universityId) {
      // Create a new university document
      const universitiesRef = collection(db, "universities");
      const universityQuery = query(universitiesRef, where("name", "==", universityName));
      const universitySnapshot = await getDocs(universityQuery);
      
      if (universitySnapshot.empty) {
        // Create a new university doc
        const newUniversityRef = doc(collection(db, "universities"));
        await setDoc(newUniversityRef, {
          name: universityName,
          createdAt: new Date().toISOString(),
          createdBy: uid
        });
        universityId = newUniversityRef.id;
        isFirstUser = true; // This is the first user creating this university
      } else {
        // University already exists, use its ID
        universityId = universitySnapshot.docs[0].id;
      }
    }
    
    // Determine user status and role
    const userStatus = isFirstUser ? 'active' : 'pending';
    const userRole = isFirstUser ? 'hr_head' : 'hr_personnel';
    
    // Create detailed user document
    const userDoc = {
      uid,
      email,
      displayName,
      employeeId: userData.employeeId || '',
      position: userData.position || '',
      universityId,
      universityName,
      status: userStatus,
      role: userRole,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    if (universityId) {
      // Store user in the appropriate collection based on their role
      if (userRole === 'hr_head') {
        // HR Heads go in the hr_head subcollection
        await setDoc(doc(db, "universities", universityId, "hr_head", uid), userDoc);
      } else {
        // HR Personnel go in the hr_personnel subcollection
        await setDoc(doc(db, "universities", universityId, "hr_personnel", uid), userDoc);
      }
      
      // Create auth mapping document with essential authentication data
      // This will be used for fast authentication lookups
      await setDoc(doc(db, "authMappings", uid), {
        uid,
        email,
        displayName,
        universityId,
        role: userRole,
        status: userStatus,
        lastUpdated: new Date().toISOString()
      });
      
    } else {
      // If no university, raise an error - all users must belong to a university
      throw new Error("University name is required for registration");
    }
    
    return { success: true, isHRHead: isFirstUser };
  } catch (error) {
    return { success: false, message: error.message };
  }
}; 