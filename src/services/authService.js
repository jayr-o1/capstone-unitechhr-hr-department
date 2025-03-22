import { auth } from '../firebase'; // Import Firebase auth
import { db } from '../firebase'; // Import Firestore
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Handle login
export const loginUser = async (email, password) => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Get user document from Firestore to check status
    const userDoc = await getDoc(doc(db, "users", uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // If account is pending approval
      if (userData.status === 'pending') {
        return { 
          success: false, 
          message: "Your account is pending administrator approval. Please check back later."
        };
      }
      
      // Update last login time
      await updateDoc(doc(db, "users", uid), {
        lastLogin: new Date().toISOString()
      });
      
      return { success: true };
    } else {
      // If user has no document in Firestore, create one
      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        displayName: userCredential.user.displayName || '',
        status: 'active',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      
      return { success: true };
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
    
    // Create user document in Firestore with additional metadata
    // Default to "pending" status for admin approval
    const userDoc = {
      uid,
      email,
      displayName,
      employeeId: userData.employeeId || '',
      position: userData.position || '',
      status: 'pending', // Require admin approval
      role: 'hr_admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    // Save to Firestore
    await setDoc(doc(db, "users", uid), userDoc);
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}; 