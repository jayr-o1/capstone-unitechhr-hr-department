import { db } from "../firebase";
import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";

// Function to export employees to Excel
export const exportEmployees = async () => {
    try {
        const employeesSnapshot = await getDocs(collection(db, "employees"));
        const employees = employeesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Format dates for Excel
            dateHired:
                doc.data().dateHired?.toDate()?.toLocaleDateString() || "",
            createdAt:
                doc.data().createdAt?.toDate()?.toLocaleDateString() || "",
            updatedAt:
                doc.data().updatedAt?.toDate()?.toLocaleDateString() || "",
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
export const importEmployees = async (file) => {
    try {
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
                    const employeesRef = collection(db, "employees");
                    let successCount = 0;
                    let errorCount = 0;

                    for (const row of jsonData) {
                        try {
                            // Transform Excel data to match your Firestore structure
                            const employeeData = {
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

                            await addDoc(employeesRef, employeeData);
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
