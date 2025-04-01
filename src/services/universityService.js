import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// Get all universities
export const getAllUniversities = async () => {
  try {
    const universitiesRef = collection(db, "universities");
    const querySnapshot = await getDocs(universitiesRef);
    
    const universities = [];
    for (const universityDoc of querySnapshot.docs) {
      universities.push({
        id: universityDoc.id,
        ...universityDoc.data()
      });
    }
    
    return { success: true, universities };
  } catch (error) {
    console.error("Error getting universities:", error);
    return { success: false, message: error.message, universities: [] };
  }
};

// Get university by ID
export const getUniversityById = async (universityId) => {
  try {
    if (!universityId) {
      return { success: false, message: "No university ID provided" };
    }
    
    const universityDocRef = doc(db, "universities", universityId);
    const universityDoc = await getDoc(universityDocRef);
    
    if (universityDoc.exists()) {
      // Get users count
      const usersRef = collection(db, "universities", universityId, "hr_head");
      const usersSnapshot = await getDocs(usersRef);
      
      // Get jobs count
      const jobsRef = collection(db, "universities", universityId, "jobs");
      const jobsSnapshot = await getDocs(jobsRef);
      
      return { 
        success: true, 
        university: {
          id: universityDoc.id,
          ...universityDoc.data(),
          usersCount: usersSnapshot.size,
          jobsCount: jobsSnapshot.size
        }
      };
    } else {
      return { success: false, message: "University not found" };
    }
  } catch (error) {
    console.error("Error getting university:", error);
    return { success: false, message: error.message };
  }
};

// Get university users
export const getUniversityUsers = async (universityId) => {
  try {
    if (!universityId) {
      return { success: false, message: "No university ID provided" };
    }
    
    const usersRef = collection(db, "universities", universityId, "hr_head");
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    for (const userDoc of querySnapshot.docs) {
      users.push({
        id: userDoc.id,
        ...userDoc.data()
      });
    }
    
    return { success: true, users };
  } catch (error) {
    console.error("Error getting university users:", error);
    return { success: false, message: error.message, users: [] };
  }
};

// Create or update university
export const createOrUpdateUniversity = async (universityData) => {
  try {
    let universityId = universityData.id;
    const isNewUniversity = !universityId;
    
    // If no ID provided, create a new university doc
    if (isNewUniversity) {
      universityId = doc(collection(db, "universities")).id;
    }
    
    const universityRef = doc(db, "universities", universityId);
    
    // Prepare university data with timestamps
    const dataToSave = {
      ...universityData,
      updatedAt: serverTimestamp(),
    };
    
    // Add createdAt for new universities
    if (isNewUniversity) {
      dataToSave.createdAt = serverTimestamp();
    }
    
    // Remove id from data to avoid duplication
    if (dataToSave.id) {
      delete dataToSave.id;
    }
    
    // Create or update university
    if (isNewUniversity) {
      await setDoc(universityRef, dataToSave);
    } else {
      await updateDoc(universityRef, dataToSave);
    }
    
    return { success: true, universityId };
  } catch (error) {
    console.error("Error creating/updating university:", error);
    return { success: false, message: error.message };
  }
};

// Add user to university
export const addUserToUniversity = async (universityId, userId, userData) => {
  try {
    if (!universityId || !userId) {
      return { success: false, message: "Missing university ID or user ID" };
    }
    
    // Check if university exists
    const universityRef = doc(db, "universities", universityId);
    const universityDoc = await getDoc(universityRef);
    
    if (!universityDoc.exists()) {
      return { success: false, message: "University not found" };
    }
    
    // Add user to university's hr_head subcollection
    const userRef = doc(db, "universities", universityId, "hr_head", userId);
    await setDoc(userRef, {
      ...userData,
      universityId,
      addedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error adding user to university:", error);
    return { success: false, message: error.message };
  }
};

// Remove user from university
export const removeUserFromUniversity = async (universityId, userId) => {
  try {
    if (!universityId || !userId) {
      return { success: false, message: "Missing university ID or user ID" };
    }
    
    // Remove user from university's hr_head subcollection
    const userRef = doc(db, "universities", universityId, "hr_head", userId);
    await deleteDoc(userRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error removing user from university:", error);
    return { success: false, message: error.message };
  }
};

// Get the current user's university
export const getCurrentUserUniversity = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: "No user ID provided" };
    }
    
    // First get the user to find university ID
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: "User not found" };
    }
    
    const userData = userDoc.data();
    
    if (!userData.universityId) {
      return { success: false, message: "User is not associated with any university" };
    }
    
    // Get the university details
    return getUniversityById(userData.universityId);
  } catch (error) {
    console.error("Error getting user's university:", error);
    return { success: false, message: error.message };
  }
};

// Search universities by name
export const searchUniversitiesByName = async (searchTerm = "") => {
  try {
    const universitiesRef = collection(db, "universities");
    let universitiesQuery;
    
    if (searchTerm) {
      // Firebase doesn't support full text search, so we use startsWith
      // This will find universities where the name starts with the search term
      const searchTermLower = searchTerm.toLowerCase();
      const searchTermUpper = searchTerm.toUpperCase();
      
      // First search for exact match
      const exactMatchQuery = query(
        universitiesRef,
        where("name", "==", searchTerm)
      );
      const exactMatchSnapshot = await getDocs(exactMatchQuery);
      
      // Then search for case-insensitive starts with
      const startsWithQueryLower = query(
        universitiesRef,
        where("name", ">=", searchTermLower),
        where("name", "<=", searchTermLower + "\uf8ff")
      );
      const startsWithSnapshotLower = await getDocs(startsWithQueryLower);
      
      const startsWithQueryUpper = query(
        universitiesRef,
        where("name", ">=", searchTermUpper),
        where("name", "<=", searchTermUpper + "\uf8ff")
      );
      const startsWithSnapshotUpper = await getDocs(startsWithQueryUpper);
      
      // Combine results, avoiding duplicates
      const universities = [];
      const universitiesIds = new Set();
      
      // Add exact matches first
      exactMatchSnapshot.forEach(doc => {
        universities.push({
          id: doc.id,
          ...doc.data()
        });
        universitiesIds.add(doc.id);
      });
      
      // Add startsWith matches, avoiding duplicates
      startsWithSnapshotLower.forEach(doc => {
        if (!universitiesIds.has(doc.id)) {
          universities.push({
            id: doc.id,
            ...doc.data()
          });
          universitiesIds.add(doc.id);
        }
      });
      
      startsWithSnapshotUpper.forEach(doc => {
        if (!universitiesIds.has(doc.id)) {
          universities.push({
            id: doc.id,
            ...doc.data()
          });
          universitiesIds.add(doc.id);
        }
      });
      
      return { success: true, universities };
    } else {
      // If no search term, get all universities
      const querySnapshot = await getDocs(universitiesRef);
      const universities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, universities };
    }
  } catch (error) {
    console.error("Error searching universities:", error);
    return { success: false, message: error.message, universities: [] };
  }
}; 