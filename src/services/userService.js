import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Fetch user data from Firestore
export const getUserData = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'No user ID provided' };
    }

    // First check in the authMappings collection
    const authMappingRef = doc(db, 'authMappings', userId);
    const authMappingDoc = await getDoc(authMappingRef);

    if (authMappingDoc.exists()) {
      const authMapping = authMappingDoc.data();
      
      // If we have a universityId, get the full user data from university collection
      if (authMapping.universityId) {
        const universityUserRef = doc(db, 'universities', authMapping.universityId, 'users', userId);
        const universityUserDoc = await getDoc(universityUserRef);
        
        if (universityUserDoc.exists()) {
          // Return full user data from university
          return { 
            success: true, 
            data: {
              ...universityUserDoc.data(),
              universityId: authMapping.universityId  // Ensure universityId is included
            }
          };
        } else {
          return { 
            success: false, 
            message: 'University user record not found' 
          };
        }
      } else {
        return { 
          success: false, 
          message: 'User is not associated with any university' 
        };
      }
    } else {
      return { 
        success: false, 
        message: 'User not found in auth mappings' 
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

    // First get the auth mapping to find the university
    const authMappingRef = doc(db, 'authMappings', userId);
    const authMappingDoc = await getDoc(authMappingRef);
    
    if (!authMappingDoc.exists()) {
      return { success: false, message: 'User not found in auth mappings' };
    }
    
    const authMapping = authMappingDoc.data();
    const universityId = authMapping.universityId;
    
    if (!universityId) {
      return { success: false, message: 'User is not associated with any university' };
    }
    
    // Update the user data in the university collection
    const universityUserRef = doc(db, 'universities', universityId, 'users', userId);
    const universityUserDoc = await getDoc(universityUserRef);
    
    if (!universityUserDoc.exists()) {
      return { success: false, message: 'University user record not found' };
    }
    
    // Update with timestamp
    const updateTimestamp = { updatedAt: new Date().toISOString() };
    
    // Update the user data
    await updateDoc(universityUserRef, {
      ...userData,
      ...updateTimestamp
    });
    
    // If email was updated, also update in authMappings
    if (userData.email) {
      await updateDoc(authMappingRef, {
        email: userData.email
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user data:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
}; 