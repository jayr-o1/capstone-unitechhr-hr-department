import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Fetch user data from Firestore
export const getUserData = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'No user ID provided' };
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return { 
        success: true, 
        data: userDoc.data() 
      };
    } else {
      return { 
        success: false, 
        message: 'User document not found' 
      };
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Update user data in Firestore
export const updateUserData = async (userId, userData) => {
  try {
    if (!userId) {
      return { success: false, message: 'No user ID provided' };
    }

    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user data:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
}; 