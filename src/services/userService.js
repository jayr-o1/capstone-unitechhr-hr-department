import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Fetch user data from Firestore
export const getUserData = async (userId) => {
  try {
    console.log('getUserData called for userId:', userId);
    if (!userId) {
      console.log('getUserData: No user ID provided');
      return { success: false, message: 'No user ID provided' };
    }

    // First check in the authMappings collection
    const authMappingRef = doc(db, 'authMappings', userId);
    const authMappingDoc = await getDoc(authMappingRef);

    if (authMappingDoc.exists()) {
      const authMapping = authMappingDoc.data();
      console.log('getUserData: Found auth mapping:', authMapping);
      
      // If we have a universityId, get the full user data from university collection
      if (authMapping.universityId) {
        // Choose the appropriate collection based on user role
        let collectionName;
        if (authMapping.role === 'hr_head') {
          collectionName = 'hr_head';
        } else if (authMapping.role === 'employee') {
          collectionName = 'employees';
        } else {
          collectionName = 'hr_personnel';
        }
        
        console.log(`getUserData: Looking in '${collectionName}' collection for this user`);
        
        const universityUserRef = doc(db, 'universities', authMapping.universityId, collectionName, userId);
        const universityUserDoc = await getDoc(universityUserRef);
        
        if (universityUserDoc.exists()) {
          // Return full user data from university
          const userData = {
            ...universityUserDoc.data(),
            universityId: authMapping.universityId,  // Ensure universityId is included
            role: authMapping.role // Ensure role is included
          };
          
          console.log('getUserData: Success, returning user data');
          return { 
            success: true, 
            data: userData
          };
        } else {
          console.log(`getUserData: University user record not found in ${collectionName}`);
          return { 
            success: false, 
            message: 'University user record not found' 
          };
        }
      } else {
        console.log('getUserData: User is not associated with any university');
        return { 
          success: false, 
          message: 'User is not associated with any university' 
        };
      }
    } else {
      console.log('getUserData: User not found in auth mappings');
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
    const role = authMapping.role;
    
    if (!universityId) {
      return { success: false, message: 'User is not associated with any university' };
    }
    
    // Choose the appropriate collection based on user role
    let collectionName;
    if (role === 'hr_head') {
      collectionName = 'hr_head';
    } else if (role === 'employee') {
      collectionName = 'employees';
    } else {
      collectionName = 'hr_personnel';
    }
    
    // Update the user data in the appropriate university collection
    const universityUserRef = doc(db, 'universities', universityId, collectionName, userId);
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