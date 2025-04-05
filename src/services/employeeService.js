import { db } from "../firebase";
import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
    doc,
    query,
    where,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'firebase/storage';

// Function to export employees to Excel
export const exportEmployees = async (universityId) => {
    try {
        if (!universityId) {
            return { success: false, message: "Missing university ID" };
        }
        
        // Get employees from the university's employees subcollection
        const employeesSnapshot = await getDocs(collection(db, "universities", universityId, "employees"));
        const employees = employeesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Format dates for Excel
            dateHired:
                doc.data().dateHired?.toDate?.() || 
                (doc.data().dateHired ? new Date(doc.data().dateHired).toLocaleDateString() : ""),
            createdAt:
                doc.data().createdAt?.toDate?.() || 
                (doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleDateString() : ""),
            updatedAt:
                doc.data().updatedAt?.toDate?.() || 
                (doc.data().updatedAt ? new Date(doc.data().updatedAt).toLocaleDateString() : ""),
        }));

        // Prepare data for export
        const exportData = employees.map((emp) => ({
            "Employee ID": emp.employeeId,
            Name: emp.name,
            Email: emp.email,
            Phone: emp.phone,
            Position: emp.position,
            Department: emp.department,
            "Date Hired": emp.dateHired,
            Status: emp.status,
            Salary: emp.salary,
            "Emergency Contact Name": emp.emergencyContact?.name,
            "Emergency Contact Relationship":
                emp.emergencyContact?.relationship,
            "Emergency Contact Phone": emp.emergencyContact?.phone,
            "Bank Name": emp.bankDetails?.bankName,
            "Account Number": emp.bankDetails?.accountNumber,
            "Account Name": emp.bankDetails?.accountName,
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Employees");

        // Generate Excel file
        XLSX.writeFile(wb, "employees.xlsx");

        return { success: true };
    } catch (error) {
        console.error("Error exporting employees:", error);
        return { success: false, error: error.message };
    }
};

// Function to import employees from Excel
export const importEmployees = async (file, universityId) => {
    try {
        if (!universityId) {
            return { success: false, message: "Missing university ID" };
        }
        
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // Process and validate each row
                    const employeesRef = collection(db, "universities", universityId, "employees");
                    let successCount = 0;
                    let errorCount = 0;

                    for (const row of jsonData) {
                        try {
                            // Transform Excel data to match your Firestore structure
                            const employeeData = {
                                universityId,
                                employeeId: row["Employee ID"],
                                name: row["Name"],
                                email: row["Email"],
                                phone: row["Phone"],
                                position: row["Position"],
                                department: row["Department"],
                                dateHired: row["Date Hired"]
                                    ? new Date(row["Date Hired"])
                                    : serverTimestamp(),
                                status: row["Status"] || "Active",
                                salary: row["Salary"],
                                emergencyContact: {
                                    name: row["Emergency Contact Name"],
                                    relationship:
                                        row["Emergency Contact Relationship"],
                                    phone: row["Emergency Contact Phone"],
                                },
                                bankDetails: {
                                    bankName: row["Bank Name"],
                                    accountNumber: row["Account Number"],
                                    accountName: row["Account Name"],
                                },
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp(),
                            };

                            // Validate required fields
                            if (
                                !employeeData.name ||
                                !employeeData.email ||
                                !employeeData.department ||
                                !employeeData.position
                            ) {
                                throw new Error("Missing required fields");
                            }

                            // Add to university's employees subcollection
                            const employeeDocRef = doc(collection(db, "universities", universityId, "employees"));
                            await setDoc(employeeDocRef, employeeData);
                            
                            // Also add to main employees collection (for backwards compatibility)
                            await setDoc(doc(db, "employees", employeeDocRef.id), {
                                ...employeeData,
                                id: employeeDocRef.id
                            });
                            
                            successCount++;
                        } catch (error) {
                            console.error("Error importing row:", error);
                            errorCount++;
                        }
                    }

                    resolve({
                        success: true,
                        message: `Successfully imported ${successCount} employees. Failed to import ${errorCount} records.`,
                    });
                } catch (error) {
                    reject({ success: false, error: error.message });
                }
            };

            reader.onerror = (error) => {
                reject({ success: false, error: error.message });
            };

            reader.readAsArrayBuffer(file);
        });
    } catch (error) {
        console.error("Error in import process:", error);
        return { success: false, error: error.message };
    }
};

// Get employees for a specific university
export const getUniversityEmployees = async (universityId) => {
    try {
        if (!universityId) {
            return { success: false, message: "Missing university ID", employees: [] };
        }
        
        const employeesRef = collection(db, "universities", universityId, "employees");
        const querySnapshot = await getDocs(employeesRef);
        
        const employees = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return { success: true, employees };
    } catch (error) {
        console.error("Error getting university employees:", error);
        return { success: false, message: error.message, employees: [] };
    }
};

// Get employee data
export const getEmployeeData = async (userId, universityId) => {
    try {
        if (!userId || !universityId) {
            return { success: false, message: 'User ID or University ID missing' };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        if (userId.startsWith('emp_')) {
            // Extract the employee ID from the mock user ID
            // Format is emp_employeeId_universityId
            const parts = userId.split('_');
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);
            }
        }

        // Check for employees by employeeId field first
        if (employeeId !== userId) {
            // For mock users, we need to query by employeeId field
            const employeesRef = collection(db, 'universities', universityId, 'employees');
            const q = query(employeesRef, where("employeeId", "==", employeeId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // Get the first matching employee
                const employeeDoc = querySnapshot.docs[0];
                return { 
                    success: true, 
                    data: {
                        id: employeeDoc.id,
                        ...employeeDoc.data()
                    }
                };
            }
        }

        // Fallback to direct document lookup by ID
        const employeeRef = doc(db, 'universities', universityId, 'employees', employeeId);
        const employeeDoc = await getDoc(employeeRef);
        
        if (employeeDoc.exists()) {
            return { 
                success: true, 
                data: {
                    id: employeeDoc.id,
                    ...employeeDoc.data()
                }
            };
        } else {
            return { 
                success: false, 
                message: 'Employee not found' 
            };
        }
    } catch (error) {
        console.error('Error fetching employee data:', error);
        return { 
            success: false, 
            message: error.message 
        };
    }
};

// Update employee profile
export const updateEmployeeProfile = async (userId, universityId, profileData) => {
    try {
        if (!userId || !universityId) {
            return { success: false, message: 'User ID or University ID missing' };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;
        
        if (userId.startsWith('emp_')) {
            // Extract the employee ID from the mock user ID
            // Format is emp_employeeId_universityId
            const parts = userId.split('_');
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);
                
                // We need to find the actual document ID by querying with employeeId field
                const employeesRef = collection(db, 'universities', universityId, 'employees');
                const q = query(employeesRef, where("employeeId", "==", employeeId));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    // Get the first matching employee's document ID
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log("Found document ID for employee:", employeeDocId);
                }
            }
        }

        const employeeRef = doc(db, 'universities', universityId, 'employees', employeeDocId);
        
        // Add timestamp
        const dataToUpdate = {
            ...profileData,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(employeeRef, dataToUpdate);
        
        return { success: true };
    } catch (error) {
        console.error('Error updating employee profile:', error);
        return { 
            success: false, 
            message: error.message 
        };
    }
};

// Upload employee document (certifications, etc.)
export const uploadEmployeeDocument = async (userId, universityId, file, documentType) => {
    try {
        if (!userId || !universityId || !file) {
            return { success: false, message: 'Missing required parameters' };
        }
        
        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;
        
        if (userId.startsWith('emp_')) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split('_');
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);
                
                // Find the actual document ID by querying
                const employeesRef = collection(db, 'universities', universityId, 'employees');
                const q = query(employeesRef, where("employeeId", "==", employeeId));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log("Found document ID for employee:", employeeDocId);
                } else {
                    return { success: false, message: 'Employee record not found' };
                }
            }
        }
        
        // Create a reference to storage
        const storage = getStorage();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${employeeId}_${documentType}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `universities/${universityId}/employees/${employeeId}/documents/${fileName}`);
        
        // Upload file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Add document record to Firestore
        const employeeDocumentsRef = collection(db, 'universities', universityId, 'employees', employeeDocId, 'documents');
        await addDoc(employeeDocumentsRef, {
            name: file.name,
            type: documentType,
            url: downloadURL,
            fileName: fileName,
            employeeId: employeeId, // Store original employeeId for reference
            createdAt: serverTimestamp()
        });
        
        return { 
            success: true, 
            url: downloadURL 
        };
    } catch (error) {
        console.error('Error uploading document:', error);
        return { 
            success: false, 
            message: error.message 
        };
    }
};

// Get employee documents
export const getEmployeeDocuments = async (userId, universityId) => {
    try {
        if (!userId || !universityId) {
            return { success: false, message: 'User ID or University ID missing' };
        }
        
        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;
        
        if (userId.startsWith('emp_')) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split('_');
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);
                
                // Find the actual document ID by querying
                const employeesRef = collection(db, 'universities', universityId, 'employees');
                const q = query(employeesRef, where("employeeId", "==", employeeId));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log("Found document ID for employee:", employeeDocId);
                }
            }
        }
        
        const documentsRef = collection(db, 'universities', universityId, 'employees', employeeDocId, 'documents');
        const documentsSnapshot = await getDocs(documentsRef);
        
        const documents = [];
        documentsSnapshot.forEach(doc => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return { 
            success: true, 
            documents 
        };
    } catch (error) {
        console.error('Error fetching employee documents:', error);
        return { 
            success: false, 
            message: error.message,
            documents: []
        };
    }
};

// Delete employee document
export const deleteEmployeeDocument = async (userId, universityId, documentId, fileName) => {
    try {
        if (!userId || !universityId || !documentId || !fileName) {
            return { success: false, message: 'Missing required parameters' };
        }
        
        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;
        
        if (userId.startsWith('emp_')) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split('_');
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);
                
                // Find the actual document ID by querying
                const employeesRef = collection(db, 'universities', universityId, 'employees');
                const q = query(employeesRef, where("employeeId", "==", employeeId));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log("Found document ID for employee:", employeeDocId);
                } else {
                    return { success: false, message: 'Employee record not found' };
                }
            }
        }
        
        // Delete from Firestore
        const documentRef = doc(db, 'universities', universityId, 'employees', employeeDocId, 'documents', documentId);
        await deleteDoc(documentRef);
        
        // Delete from Storage
        const storage = getStorage();
        // The storage path uses the original employeeId, not the document ID
        const storageRef = ref(storage, `universities/${universityId}/employees/${employeeId}/documents/${fileName}`);
        await deleteObject(storageRef);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { 
            success: false, 
            message: error.message 
        };
    }
};

// Get employee skills
export const getEmployeeSkills = async (userId, universityId) => {
    try {
        console.log("Fetching skills for employee:", userId, "university:", universityId);
        
        if (!userId || !universityId) {
            console.warn("Missing userId or universityId for getEmployeeSkills");
            return { success: false, message: 'User ID or University ID missing', skills: [] };
        }
        
        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;
        
        if (userId.startsWith('emp_')) {
            // Extract the employee ID from the mock user ID
            // Format is emp_employeeId_universityId
            const parts = userId.split('_');
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);
                
                // Find the actual document ID by querying
                const employeesRef = collection(db, 'universities', universityId, 'employees');
                const q = query(employeesRef, where("employeeId", "==", employeeId));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log("Found document ID for employee:", employeeDocId);
                }
            }
        }

        // Query for employee skills
        const skillsRef = collection(db, 'universities', universityId, 'employees', employeeDocId, 'skills');
        const skillsSnapshot = await getDocs(skillsRef);
        
        if (skillsSnapshot.empty) {
            console.log("No skills found for employee");
            return { success: true, skills: [] };
        }
        
        const skills = skillsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log("Found skills for employee:", skills.length);
        return { success: true, skills };
    } catch (error) {
        console.error('Error fetching employee skills:', error);
        return { 
            success: false, 
            message: error.message,
            skills: []
        };
    }
};

// Get career paths for a department
export const getCareerPaths = async (universityId, departmentId) => {
    try {
        console.log("Fetching career paths for department:", departmentId, "university:", universityId);
        
        if (!universityId || !departmentId) {
            console.warn("Missing universityId or departmentId for getCareerPaths");
            return { success: false, message: 'University ID or Department ID missing', careerPaths: [] };
        }
        
        // Query for career paths for this department
        const careerPathsRef = collection(db, 'universities', universityId, 'careerPaths');
        const careerPathsQuery = query(careerPathsRef, where('departmentId', '==', departmentId));
        const careerPathsSnapshot = await getDocs(careerPathsQuery);
        
        if (careerPathsSnapshot.empty) {
            console.log("No career paths found for department");
            return { success: true, careerPaths: [] };
        }
        
        const careerPaths = careerPathsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Found ${careerPaths.length} career paths for department`);
        return { success: true, careerPaths };
    } catch (error) {
        console.error('Error fetching career paths:', error);
        return { success: false, message: error.message, careerPaths: [] };
    }
};
