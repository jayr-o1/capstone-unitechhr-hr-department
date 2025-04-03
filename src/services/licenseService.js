import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  deleteDoc,
  limit,
  orderBy
} from 'firebase/firestore';

// Generate a new license key for a university
export const generateLicense = async (universityName, expiryDate, maxUsers) => {
  try {
    // Generate a random license key
    const licenseKey = generateLicenseKey();
    
    // Create the license document in Firestore
    const licenseRef = collection(db, 'licenses');
    const licenseDoc = await addDoc(licenseRef, {
      licenseKey,
      universityName,
      status: 'active',
      maxUsers: parseInt(maxUsers) || 10,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usedBy: null,
      universityId: null,
      createdAt: serverTimestamp(),
      activatedAt: null
    });
    
    return { 
      success: true, 
      licenseId: licenseDoc.id,
      licenseKey
    };
  } catch (error) {
    console.error('Error generating license:', error);
    return { success: false, message: error.message };
  }
};

// Helper function to generate a license key
const generateLicenseKey = () => {
  // Format: UNITECH-HR-XXXX-XXXX where X is alphanumeric
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segmentLength = 4;
  let licenseKey = 'UNITECH-HR-';
  
  // Generate first segment (xxxx)
  for (let j = 0; j < segmentLength; j++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    licenseKey += characters.charAt(randomIndex);
  }
  
  // Add hyphen
  licenseKey += '-';
  
  // Generate second segment (xxxx)
  for (let j = 0; j < segmentLength; j++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    licenseKey += characters.charAt(randomIndex);
  }
  
  return licenseKey;
};

// Get all licenses
export const getAllLicenses = async () => {
  try {
    const licensesRef = collection(db, 'licenses');
    const licensesQuery = query(licensesRef, orderBy('createdAt', 'desc'));
    const licensesSnapshot = await getDocs(licensesQuery);
    
    const licenses = licensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Format timestamps for easier display
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
      activatedAt: doc.data().activatedAt ? doc.data().activatedAt.toDate() : null,
      expiryDate: doc.data().expiryDate ? doc.data().expiryDate.toDate() : null
    }));
    
    return { success: true, licenses };
  } catch (error) {
    console.error('Error getting licenses:', error);
    return { success: false, message: error.message, licenses: [] };
  }
};

// Validate a license key during registration
export const validateLicense = async (licenseKey) => {
  try {
    // Check if the key matches the development license
    const devLicense = "UNITECH-HR-DEV1-2023";
    if (licenseKey === devLicense) {
      return { 
        success: true, 
        isDevLicense: true,
        message: 'Development license validated'
      };
    }
    
    // Query for the license key in the database
    const licensesRef = collection(db, 'licenses');
    const licenseQuery = query(licensesRef, where('licenseKey', '==', licenseKey));
    const licenseSnapshot = await getDocs(licenseQuery);
    
    if (licenseSnapshot.empty) {
      return { success: false, message: 'Invalid license key' };
    }
    
    // Get the license document
    const licenseDoc = licenseSnapshot.docs[0];
    const licenseData = licenseDoc.data();
    
    // Check if the license is already used
    if (licenseData.usedBy) {
      return { success: false, message: 'License key has already been used' };
    }
    
    // Check if the license is expired
    if (licenseData.expiryDate && new Date(licenseData.expiryDate.toDate()) < new Date()) {
      return { success: false, message: 'License key has expired' };
    }
    
    // Check if the license is active
    if (licenseData.status !== 'active') {
      return { success: false, message: 'License key is not active' };
    }
    
    return { 
      success: true, 
      licenseId: licenseDoc.id,
      licenseData: {
        universityName: licenseData.universityName,
        maxUsers: licenseData.maxUsers,
        expiryDate: licenseData.expiryDate ? licenseData.expiryDate.toDate() : null,
      },
      message: 'License key validated successfully' 
    };
  } catch (error) {
    console.error('Error validating license:', error);
    return { success: false, message: error.message };
  }
};

// Activate a license key when a university is registered
export const activateLicense = async (licenseKey, universityId, universityName) => {
  try {
    // If it's a dev license, no need to activate in the database
    const devLicense = "UNITECH-HR-DEV1-2023";
    if (licenseKey === devLicense) {
      return { 
        success: true, 
        message: 'Development license activated' 
      };
    }
    
    // Query for the license key in the database
    const licensesRef = collection(db, 'licenses');
    const licenseQuery = query(licensesRef, where('licenseKey', '==', licenseKey));
    const licenseSnapshot = await getDocs(licenseQuery);
    
    if (licenseSnapshot.empty) {
      return { success: false, message: 'Invalid license key' };
    }
    
    // Get the license document
    const licenseDoc = licenseSnapshot.docs[0];
    
    // Update the license as used
    await updateDoc(doc(db, 'licenses', licenseDoc.id), {
      status: 'used',
      usedBy: universityId,
      universityName,
      activatedAt: serverTimestamp()
    });
    
    return { success: true, message: 'License key activated successfully' };
  } catch (error) {
    console.error('Error activating license:', error);
    return { success: false, message: error.message };
  }
};

// Deactivate a license
export const deactivateLicense = async (licenseId) => {
  try {
    const licenseRef = doc(db, 'licenses', licenseId);
    
    // Update the license status
    await updateDoc(licenseRef, {
      status: 'inactive',
      updatedAt: serverTimestamp()
    });
    
    return { success: true, message: 'License deactivated successfully' };
  } catch (error) {
    console.error('Error deactivating license:', error);
    return { success: false, message: error.message };
  }
};

// Delete a license
export const deleteLicense = async (licenseId) => {
  try {
    await deleteDoc(doc(db, 'licenses', licenseId));
    return { success: true, message: 'License deleted successfully' };
  } catch (error) {
    console.error('Error deleting license:', error);
    return { success: false, message: error.message };
  }
}; 