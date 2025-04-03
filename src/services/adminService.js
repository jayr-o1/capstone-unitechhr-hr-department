import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

// Get all pending HR Head approvals
export const getPendingHRHeads = async () => {
  try {
    // Query authMappings collection for pending HR Heads
    const authMappingsRef = collection(db, 'authMappings');
    const pendingQuery = query(
      authMappingsRef, 
      where('role', '==', 'hr_head'), 
      where('status', '==', 'pending')
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);
    
    // Transform the data for easier consumption
    const pendingHRHeads = [];
    
    for (const docSnapshot of pendingSnapshot.docs) {
      const authData = docSnapshot.data();
      
      // Get additional details from the university's hr_head subcollection
      if (authData.universityId) {
        const hrHeadRef = doc(
          db, 
          'universities', 
          authData.universityId, 
          'hr_head', 
          docSnapshot.id
        );
        
        const hrHeadDoc = await getDoc(hrHeadRef);
        
        if (hrHeadDoc.exists()) {
          // Get university name
          const universityRef = doc(db, 'universities', authData.universityId);
          const universityDoc = await getDoc(universityRef);
          const universityName = universityDoc.exists() ? universityDoc.data().name : 'Unknown';
          
          pendingHRHeads.push({
            id: docSnapshot.id,
            universityId: authData.universityId,
            universityName,
            status: authData.status,
            createdAt: authData.createdAt,
            ...hrHeadDoc.data()
          });
        }
      }
    }
    
    return { success: true, pendingHRHeads };
  } catch (error) {
    console.error('Error getting pending HR Heads:', error);
    return { success: false, message: error.message, pendingHRHeads: [] };
  }
};

// Approve an HR Head account
export const approveHRHead = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'No user ID provided' };
    }
    
    // Get the auth mapping document to verify the user exists and is pending
    const authMappingRef = doc(db, 'authMappings', userId);
    const authMappingDoc = await getDoc(authMappingRef);
    
    if (!authMappingDoc.exists()) {
      return { success: false, message: 'User not found in system' };
    }
    
    const authData = authMappingDoc.data();
    
    if (authData.status !== 'pending') {
      return { success: false, message: 'User is not in pending status' };
    }
    
    if (authData.role !== 'hr_head') {
      return { success: false, message: 'User is not an HR Head' };
    }
    
    // Update status to approved
    await updateDoc(authMappingRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update the HR Head record in the university collection if exists
    if (authData.universityId) {
      const hrHeadRef = doc(
        db, 
        'universities', 
        authData.universityId, 
        'hr_head', 
        userId
      );
      
      const hrHeadDoc = await getDoc(hrHeadRef);
      
      if (hrHeadDoc.exists()) {
        await updateDoc(hrHeadRef, {
          status: 'approved',
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error approving HR Head:', error);
    return { success: false, message: error.message };
  }
};

// Reject an HR Head account
export const rejectHRHead = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'No user ID provided' };
    }
    
    // Get the auth mapping document to verify the user exists and is pending
    const authMappingRef = doc(db, 'authMappings', userId);
    const authMappingDoc = await getDoc(authMappingRef);
    
    if (!authMappingDoc.exists()) {
      return { success: false, message: 'User not found in system' };
    }
    
    const authData = authMappingDoc.data();
    
    if (authData.status !== 'pending') {
      return { success: false, message: 'User is not in pending status' };
    }
    
    if (authData.role !== 'hr_head') {
      return { success: false, message: 'User is not an HR Head' };
    }
    
    // Delete the HR Head record from the university collection if exists
    if (authData.universityId) {
      const hrHeadRef = doc(
        db, 
        'universities', 
        authData.universityId, 
        'hr_head', 
        userId
      );
      
      const hrHeadDoc = await getDoc(hrHeadRef);
      
      if (hrHeadDoc.exists()) {
        await deleteDoc(hrHeadRef);
      }
    }
    
    // Delete the auth mapping document
    await deleteDoc(authMappingRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting HR Head:', error);
    return { success: false, message: error.message };
  }
};

// Get system admin by credentials (for login)
export const getSystemAdminByCredentials = async (username, password) => {
  try {
    // Query the system_admins collection for a user with the matching username
    const adminsRef = collection(db, 'system_admins');
    const adminQuery = query(adminsRef, where('username', '==', username));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Get the first (and should be only) result
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    
    // Check password (in a real system, this would use proper password hashing)
    if (adminData.password !== password) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Update last login time
    await updateDoc(doc(db, 'system_admins', adminDoc.id), {
      lastLogin: serverTimestamp()
    });
    
    // Return success with admin user data
    return { 
      success: true, 
      user: {
        id: adminDoc.id,
        username: adminData.username,
        displayName: adminData.displayName || 'System Administrator',
        role: 'system_admin'
      }
    };
  } catch (error) {
    console.error('Error authenticating system admin:', error);
    return { success: false, message: error.message };
  }
};

// Get all universities with basic stats
export const getUniversitiesStats = async () => {
  try {
    const universitiesRef = collection(db, 'universities');
    const querySnapshot = await getDocs(universitiesRef);
    
    const universities = [];
    for (const universityDoc of querySnapshot.docs) {
      const universityData = universityDoc.data();
      
      // Get HR heads count
      const hrHeadsRef = collection(db, 'universities', universityDoc.id, 'hr_head');
      const hrHeadsSnapshot = await getDocs(hrHeadsRef);
      
      // Get employee count
      const employeesRef = collection(db, 'universities', universityDoc.id, 'employees');
      const employeesSnapshot = await getDocs(employeesRef);
      
      universities.push({
        id: universityDoc.id,
        name: universityData.name,
        code: universityData.code,
        createdAt: universityData.createdAt,
        hrHeadsCount: hrHeadsSnapshot.size,
        employeesCount: employeesSnapshot.size
      });
    }
    
    return { success: true, universities };
  } catch (error) {
    console.error('Error getting universities stats:', error);
    return { success: false, message: error.message, universities: [] };
  }
}; 