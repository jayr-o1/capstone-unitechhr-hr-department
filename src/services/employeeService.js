import { db } from "../firebase";
import { storage } from "../firebase"; // Import storage from firebase.js
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
    arrayUnion,
} from "firebase/firestore";
import { utils, writeFile } from "xlsx";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    getStorage,
} from "firebase/storage";
import { readExcel } from "../utils/excelHelper";

// Function to export employees to Excel
export const exportEmployees = async (universityId) => {
    try {
        if (!universityId) {
            return { success: false, message: "Missing university ID" };
        }

        // Get employees from the university's employees subcollection
        const employeesSnapshot = await getDocs(
            collection(db, "universities", universityId, "employees")
        );
        const employees = employeesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Format dates for Excel
            dateHired:
                doc.data().dateHired?.toDate?.() ||
                (doc.data().dateHired
                    ? new Date(doc.data().dateHired).toLocaleDateString()
                    : ""),
            createdAt:
                doc.data().createdAt?.toDate?.() ||
                (doc.data().createdAt
                    ? new Date(doc.data().createdAt).toLocaleDateString()
                    : ""),
            updatedAt:
                doc.data().updatedAt?.toDate?.() ||
                (doc.data().updatedAt
                    ? new Date(doc.data().updatedAt).toLocaleDateString()
                    : ""),
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
        const wb = utils.book_new();
        const ws = utils.json_to_sheet(exportData);

        // Add worksheet to workbook
        utils.book_append_sheet(wb, ws, "Employees");

        // Generate Excel file
        writeFile(wb, "employees.xlsx");

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

        try {
            // Use our new utility function to read the Excel file
            const jsonData = await readExcel(file);

            // Process and validate each row
            const employeesRef = collection(
                db,
                "universities",
                universityId,
                "employees"
            );
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
                            relationship: row["Emergency Contact Relationship"],
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
                    const employeeDocRef = doc(
                        collection(
                            db,
                            "universities",
                            universityId,
                            "employees"
                        )
                    );
                    await setDoc(employeeDocRef, employeeData);

                    // Also add to main employees collection (for backwards compatibility)
                    await setDoc(doc(db, "employees", employeeDocRef.id), {
                        ...employeeData,
                        id: employeeDocRef.id,
                    });

                    successCount++;
                } catch (error) {
                    console.error("Error importing row:", error);
                    errorCount++;
                }
            }

            return {
                success: true,
                message: `Successfully imported ${successCount} employees. Failed to import ${errorCount} records.`,
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    } catch (error) {
        console.error("Error in import process:", error);
        return { success: false, message: error.message };
    }
};

// Get employees for a specific university
export const getUniversityEmployees = async (universityId) => {
    try {
        if (!universityId) {
            return {
                success: false,
                message: "Missing university ID",
                employees: [],
            };
        }

        let employees = [];

        // Get employees from university subcollection
        const employeesRef = collection(
            db,
            "universities",
            universityId,
            "employees"
        );
        const querySnapshot = await getDocs(employeesRef);

        employees = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Get employees from no-id-employees collection that belong to this university
        const noIdEmployeesRef = collection(db, "no-id-employees");
        const noIdQuery = query(
            noIdEmployeesRef,
            where("universityId", "==", universityId)
        );
        const noIdSnapshot = await getDocs(noIdQuery);

        const noIdEmployees = noIdSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            fromNoIdCollection: true, // Flag to identify these employees
        }));

        // Combine both sets of employees
        employees = [...employees, ...noIdEmployees];

        console.log(
            `Found ${employees.length} total employees (${noIdEmployees.length} from no-id-employees)`
        );

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
            return {
                success: false,
                message: "User ID or University ID missing",
            };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            // Format is emp_employeeId_universityId
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);
            }
        }

        // First check in university's employees collection
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (employeeDoc.exists()) {
            return {
                success: true,
                data: {
                    id: employeeDoc.id,
                    ...employeeDoc.data(),
                },
            };
        }

        // If not found in university collection, check no-id-employees collection
        const noIdEmployeeRef = doc(db, "no-id-employees", employeeId);
        const noIdEmployeeDoc = await getDoc(noIdEmployeeRef);

        if (noIdEmployeeDoc.exists()) {
            const employeeData = noIdEmployeeDoc.data();
            // Verify this employee belongs to the requested university
            if (employeeData.universityId === universityId) {
                return {
                    success: true,
                    data: {
                        id: noIdEmployeeDoc.id,
                        ...employeeData,
                        fromNoIdCollection: true, // Flag to identify these employees
                    },
                };
            }
        }

        return {
            success: false,
            message: "Employee not found",
        };
    } catch (error) {
        console.error("Error getting employee data:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

// Update employee profile
export const updateEmployeeProfile = async (
    userId,
    universityId,
    profileData
) => {
    try {
        if (!userId || !universityId) {
            return {
                success: false,
                message: "User ID or University ID missing",
            };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            // Format is emp_employeeId_universityId
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // We need to find the actual document ID by querying with employeeId field
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Get the first matching employee's document ID
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                }
            }
        }

        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );

        // Add timestamp
        const dataToUpdate = {
            ...profileData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(employeeRef, dataToUpdate);

        return { success: true };
    } catch (error) {
        console.error("Error updating employee profile:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

// Upload employee document (certifications, etc.)
export const uploadEmployeeDocument = async (
    userId,
    universityId,
    file,
    documentType,
    description = ""
) => {
    try {
        if (!userId || !universityId || !file) {
            return { success: false, message: "Missing required parameters" };
        }

        console.log(
            "[uploadEmployeeDocument] Starting document upload to Firebase Storage..."
        );
        console.log("[uploadEmployeeDocument] Parameters:", {
            userId,
            universityId,
            fileName: file.name,
            documentType,
        });
        console.log(
            "[uploadEmployeeDocument] Firebase Storage instance:",
            storage
        );

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // Find the actual document ID by querying
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                    };
                }
            }
        }

        try {
            // Use a custom file extension handling to avoid issues
            const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
            console.log(
                "[uploadEmployeeDocument] Using sanitized filename:",
                fileName
            );

            // Create storage reference
            const fullPath = `universities/${universityId}/employees/${employeeId}/documents/${fileName}`;
            console.log(
                "[uploadEmployeeDocument] Full storage path:",
                fullPath
            );

            const storageRef = ref(storage, fullPath);
            console.log(
                "[uploadEmployeeDocument] Storage reference created:",
                storageRef
            );

            console.log(
                "[uploadEmployeeDocument] Starting upload with uploadBytes..."
            );
            const snapshot = await uploadBytes(storageRef, file);
            console.log(
                "[uploadEmployeeDocument] Upload successful:",
                snapshot
            );

            // Get the download URL
            console.log("[uploadEmployeeDocument] Getting download URL...");
            const fileURL = await getDownloadURL(storageRef);
            console.log("[uploadEmployeeDocument] Download URL:", fileURL);

            // Create the document object
            const newDocument = {
                name: fileName,
                url: fileURL,
                referenceLocator: description || "",
            };

            // Add to employee documents array
            const employeeRef = doc(
                db,
                "universities",
                universityId,
                "employees",
                employeeDocId
            );
            const employeeDoc = await getDoc(employeeRef);

            if (employeeDoc.exists()) {
                const employeeData = employeeDoc.data();
                const currentDocuments = employeeData.documents || [];

                await updateDoc(employeeRef, {
                    documents: [...currentDocuments, newDocument],
                });

                console.log(
                    "[uploadEmployeeDocument] Document added to employee record"
                );
            }

            return {
                success: true,
                url: fileURL,
                document: newDocument,
            };
        } catch (error) {
            console.error(
                "[uploadEmployeeDocument] Error in Firebase Storage upload:",
                error
            );
            console.error("[uploadEmployeeDocument] Error code:", error.code);
            console.error(
                "[uploadEmployeeDocument] Error message:",
                error.message
            );
            throw error; // Re-throw for the outer catch
        }
    } catch (error) {
        console.error(
            "[uploadEmployeeDocument] Error uploading document:",
            error
        );
        console.error("[uploadEmployeeDocument] Error details:", {
            code: error.code,
            name: error.name,
            message: error.message,
            stack: error.stack,
        });

        return {
            success: false,
            message: error.message,
        };
    }
};

// Get employee documents
export const getEmployeeDocuments = async (userId, universityId) => {
    try {
        if (!userId || !universityId) {
            return {
                success: false,
                message: "User ID or University ID missing",
            };
        }

        console.log(
            "[getEmployeeDocuments] Fetching documents for",
            userId,
            "in university",
            universityId
        );

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // Find the actual document ID by querying
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                }
            }
        }

        // First, get documents from the employee record's documents array
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        let documents = [];

        if (employeeDoc.exists()) {
            const employeeData = employeeDoc.data();
            // If there's a documents array in the employee record, use it
            if (Array.isArray(employeeData.documents)) {
                console.log(
                    "[getEmployeeDocuments] Found",
                    employeeData.documents.length,
                    "documents in employee record"
                );
                // Add an ID to each document if it doesn't have one
                documents = employeeData.documents.map((doc, index) => ({
                    id: doc.id || `inline_doc_${index}`,
                    ...doc,
                }));
            }
        }

        // Also get documents from the subcollection for backward compatibility
        const documentsRef = collection(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId,
            "documents"
        );
        const documentsSnapshot = await getDocs(documentsRef);

        if (!documentsSnapshot.empty) {
            console.log(
                "[getEmployeeDocuments] Found",
                documentsSnapshot.size,
                "documents in subcollection"
            );
            // Add documents from subcollection
            documentsSnapshot.forEach((doc) => {
                documents.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
        }

        console.log(
            "[getEmployeeDocuments] Returning",
            documents.length,
            "total documents"
        );
        return {
            success: true,
            documents,
        };
    } catch (error) {
        console.error("Error fetching employee documents:", error);
        return {
            success: false,
            message: error.message,
            documents: [],
        };
    }
};

// Delete employee document
export const deleteEmployeeDocument = async (
    userId,
    universityId,
    documentId,
    fileName
) => {
    try {
        if (!userId || !universityId || !fileName) {
            return { success: false, message: "Missing required parameters" };
        }

        console.log("[deleteEmployeeDocument] Starting document deletion...");
        console.log("[deleteEmployeeDocument] Parameters:", {
            userId,
            universityId,
            documentId,
            fileName,
        });

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // Find the actual document ID by querying
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                    };
                }
            }
        }

        // IDENTICAL to EmployeeDetail component
        const storageRef = ref(
            storage,
            `universities/${universityId}/employees/${employeeId}/documents/${fileName}`
        );
        await deleteObject(storageRef);

        // Get current documents
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (employeeDoc.exists()) {
            const updatedDocuments = employeeDoc
                .data()
                .documents.filter((doc) => doc.name !== fileName);

            // Update the document with the filtered array
            await updateDoc(employeeRef, {
                documents: updatedDocuments,
            });
        }

        return { success: true };
    } catch (error) {
        console.error(
            "[deleteEmployeeDocument] Error deleting document:",
            error
        );
        console.error("[deleteEmployeeDocument] Error details:", {
            code: error.code,
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
        return {
            success: false,
            message: error.message,
        };
    }
};

// Get employee skills
export const getEmployeeSkills = async (userId, universityId) => {
    try {
        console.log(
            "Fetching skills for employee:",
            userId,
            "university:",
            universityId
        );

        if (!userId || !universityId) {
            console.warn(
                "Missing userId or universityId for getEmployeeSkills"
            );
            return {
                success: false,
                message: "User ID or University ID missing",
                skills: [],
            };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            // Format is emp_employeeId_universityId
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // Find the actual document ID by querying
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                }
            }
        }

        // Get the employee document directly
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            console.log("Employee document not found");
            return {
                success: false,
                message: "Employee not found",
                skills: [],
            };
        }

        const employeeData = employeeDoc.data();
        const skills = employeeData.skills || [];

        console.log("Found skills for employee:", skills.length);
        return { success: true, skills };
    } catch (error) {
        console.error("Error fetching employee skills:", error);
        return {
            success: false,
            message: error.message,
            skills: [],
        };
    }
};

// Get career paths for a department
export const getCareerPaths = async (universityId, departmentId) => {
    try {
        console.log(
            "Fetching career paths for department:",
            departmentId,
            "university:",
            universityId
        );

        if (!universityId || !departmentId) {
            console.warn(
                "Missing universityId or departmentId for getCareerPaths"
            );
            return {
                success: false,
                message: "University ID or Department ID missing",
                careerPaths: [],
            };
        }

        // Query for career paths for this department
        const careerPathsRef = collection(
            db,
            "universities",
            universityId,
            "careerPaths"
        );
        const careerPathsQuery = query(
            careerPathsRef,
            where("departmentId", "==", departmentId)
        );
        const careerPathsSnapshot = await getDocs(careerPathsQuery);

        if (careerPathsSnapshot.empty) {
            console.log("No career paths found for department");
            return { success: true, careerPaths: [] };
        }

        const careerPaths = careerPathsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log(`Found ${careerPaths.length} career paths for department`);
        return { success: true, careerPaths };
    } catch (error) {
        console.error("Error fetching career paths:", error);
        return { success: false, message: error.message, careerPaths: [] };
    }
};

// Add employee skill
export const addEmployeeSkill = async (userId, universityId, skillData) => {
    try {
        if (!userId || !universityId || !skillData.name) {
            return { success: false, message: "Missing required parameters" };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // Find the actual document ID by querying
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                    };
                }
            }
        }

        // Get the current employee document to access existing skills
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            return { success: false, message: "Employee record not found" };
        }

        const employeeData = employeeDoc.data();
        const currentSkills = employeeData.skills || [];

        // Create new skill with ID and timestamp
        const newSkill = {
            id: Date.now().toString(),
            name: skillData.name,
            category: skillData.category || "technical",
            // Ensure proficiency is stored as a string if it's a string, otherwise convert numeric to appropriate string
            proficiency:
                typeof skillData.proficiency === "string"
                    ? skillData.proficiency
                    : typeof skillData.proficiency === "number"
                    ? skillData.proficiency <= 25
                        ? "Beginner"
                        : skillData.proficiency <= 50
                        ? "Intermediate"
                        : skillData.proficiency <= 75
                        ? "Advanced"
                        : "Expert"
                    : "Beginner", // Default to Beginner if undefined
            notes: skillData.notes || "",
            createdAt: new Date(),
        };

        // Add the new skill to the array
        const updatedSkills = [...currentSkills, newSkill];

        // Update the employee document
        await updateDoc(employeeRef, {
            skills: updatedSkills,
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            skill: newSkill,
        };
    } catch (error) {
        console.error("Error adding employee skill:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

// Update employee skill
export const updateEmployeeSkill = async (
    userId,
    universityId,
    skillId,
    skillData
) => {
    try {
        if (!userId || !universityId || !skillId) {
            return { success: false, message: "Missing required parameters" };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // Find the actual document ID by querying
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                    };
                }
            }
        }

        // Get the current employee document to access existing skills
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            return { success: false, message: "Employee record not found" };
        }

        const employeeData = employeeDoc.data();
        const currentSkills = employeeData.skills || [];

        // Find the skill to update
        const skillIndex = currentSkills.findIndex(
            (skill) => skill.id === skillId
        );

        if (skillIndex === -1) {
            return { success: false, message: "Skill not found" };
        }

        // Process proficiency to ensure it's in string format
        let processedSkillData = { ...skillData };

        if ("proficiency" in skillData) {
            // Convert numeric proficiency to string if needed
            if (typeof skillData.proficiency === "number") {
                processedSkillData.proficiency =
                    skillData.proficiency <= 25
                        ? "Beginner"
                        : skillData.proficiency <= 50
                        ? "Intermediate"
                        : skillData.proficiency <= 75
                        ? "Advanced"
                        : "Expert";
                console.log(
                    `Converting numeric proficiency ${skillData.proficiency} to "${processedSkillData.proficiency}"`
                );
            }
            // If it's already a string, keep it as is
        }

        console.log(
            `Updating skill "${
                currentSkills[skillIndex].name
            }" proficiency from "${
                currentSkills[skillIndex].proficiency
            }" to "${
                processedSkillData.proficiency ||
                currentSkills[skillIndex].proficiency
            }"`
        );

        // Update the skill with new data
        const updatedSkills = [...currentSkills];
        updatedSkills[skillIndex] = {
            ...updatedSkills[skillIndex],
            ...processedSkillData,
            updatedAt: new Date(),
        };

        // Update the employee document
        await updateDoc(employeeRef, {
            skills: updatedSkills,
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            skill: updatedSkills[skillIndex],
        };
    } catch (error) {
        console.error("Error updating employee skill:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

// Delete employee skill
export const deleteEmployeeSkill = async (userId, universityId, skillId) => {
    try {
        if (!userId || !universityId || !skillId) {
            return { success: false, message: "Missing required parameters" };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Extract the employee ID from the mock user ID
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];
                console.log("Extracted employeeId from mock user:", employeeId);

                // Find the actual document ID by querying
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                    console.log(
                        "Found document ID for employee:",
                        employeeDocId
                    );
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                    };
                }
            }
        }

        // Get the current employee document to access existing skills
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            return { success: false, message: "Employee record not found" };
        }

        const employeeData = employeeDoc.data();
        const currentSkills = employeeData.skills || [];

        // Filter out the skill to delete
        const updatedSkills = currentSkills.filter(
            (skill) => skill.id !== skillId
        );

        // Check if any skill was removed
        if (updatedSkills.length === currentSkills.length) {
            return { success: false, message: "Skill not found" };
        }

        // Update the employee document
        await updateDoc(employeeRef, {
            skills: updatedSkills,
            updatedAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting employee skill:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};
