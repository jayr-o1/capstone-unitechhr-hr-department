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
    
    // Get auth mapping to find the user's university
    const authMappingRef = doc(db, "authMappings", uid);
    const authMappingDoc = await getDoc(authMappingRef);
    
    if (authMappingDoc.exists()) {
      const authData = authMappingDoc.data();
      const universityId = authData.universityId;
      
      if (!universityId) {
        return { 
          success: false, 
          message: "User record is incomplete. Please contact administrator." 
        };
      }
      
      // Get the full user record from the university collection
      const universityUserRef = doc(db, "universities", universityId, "users", uid);
      const universityUserDoc = await getDoc(universityUserRef);
      
      if (universityUserDoc.exists()) {
        const userData = universityUserDoc.data();
        
        // If account is pending approval
        if (userData.status === 'pending') {
          return { 
            success: false, 
            message: "Your account is pending administrator approval. Please check back later."
          };
        }
        
        // Update the last login time
        await updateDoc(universityUserRef, {
          lastLogin: new Date().toISOString()
        });
        
        return { success: true, universityId };
      } else {
        // If user has mapping but no university record, something is wrong
        return { 
          success: false, 
          message: "User record is incomplete. Please contact administrator." 
        };
      }
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
      } else {
        // University already exists, use its ID
        universityId = universitySnapshot.docs[0].id;
      }
    }
    
    // Create user document in Firestore with additional metadata
    // Default to "pending" status for admin approval
    const userDoc = {
      uid,
      email,
      displayName,
      employeeId: userData.employeeId || '',
      position: userData.position || '',
      universityId,
      universityName,
      status: 'pending', // Require admin approval
      role: 'hr_admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    if (universityId) {
      // Add user to university's users subcollection - this is the primary user record
      await setDoc(doc(db, "universities", universityId, "users", uid), userDoc);
      
      // Instead of creating a user in the root collection, only store auth mapping data
      // This will only contain the minimum data needed for auth purposes
      await setDoc(doc(db, "authMappings", uid), {
        uid,
        email,
        universityId,
        role: 'hr_admin'
      });
    } else {
      // If no university, raise an error - all users must belong to a university
      throw new Error("University name is required for registration");
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}; 