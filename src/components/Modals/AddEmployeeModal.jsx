import React, { useState } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import FormField from "./RecruitmentModalComponents/FormField";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp, doc, getDocs, query, where, getDoc, setDoc } from "firebase/firestore";
import { hashPassword } from "../../utils/passwordUtilsFixed";
import toast from "react-hot-toast";

const AddEmployeeModal = ({ isOpen, onClose, onEmployeeAdded, universityId }) => {
    const [formData, setFormData] = useState({
        name: "",
        employeeId: "",
        password: "",
        status: "Active",
    });
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        showWarningAlert(
            "Are you sure you want to reset all fields?",
            () => {
                resetFormFields();
                showSuccessAlert("Fields have been successfully reset!");
            },
            "Yes, reset it!",
            "Cancel"
        );
    };

    const resetFormFields = () => {
        setFormData({
            name: "",
            employeeId: "",
            password: "",
            status: "Active",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Make sure required fields are filled
        if (!formData.name || !formData.employeeId || !formData.password) {
            setFormError("Name, Employee ID, and password are required.");
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            // Check if employee ID already exists in this university
            const employeesRef = collection(db, `universities/${universityId}/employees`);
            const employeeDoc = doc(employeesRef, formData.employeeId);
            const employeeSnapshot = await getDoc(employeeDoc);
            
            if (employeeSnapshot.exists()) {
                setFormError("An employee with this ID already exists.");
                setIsSubmitting(false);
                return;
            }
            
            // Hash the password
            const hashedPassword = await hashPassword(formData.password);
            
            // Prepare employee data
            const employeeData = {
                name: formData.name,
                employeeId: formData.employeeId,
                password: hashedPassword,
                status: "active",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // Save the employee directly in the employees subcollection, using the employeeId as the document ID
            await setDoc(doc(employeesRef, formData.employeeId), employeeData);
            
            console.log("Employee added successfully");
            
            // Reset form and close modal
            resetFormFields();
            onClose();
            
            // Show success message using react-hot-toast
            toast.success("Employee added successfully!");
            
            // Call onEmployeeAdded if provided
            if (typeof onEmployeeAdded === "function") {
                onEmployeeAdded();
            }
        } catch (error) {
            console.error("Error adding employee:", error);
            setFormError("Error adding employee. Please try again.");
            // Show error message using react-hot-toast
            toast.error("Failed to add employee. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
            }}
        >
            <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">Add New Employee</h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300 mb-6" />

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        required
                    />

                    <FormField
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        placeholder="Employee ID"
                        required
                    />

                    <FormField
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        required
                    />

                    {/* Buttons */}
                    <div className="flex justify-center space-x-4 mt-6">
                        <button
                            type="submit"
                            className="cursor-pointer px-6 py-3 bg-[#9AADEA] text-white font-semibold rounded-lg hover:bg-[#7b8edc] transition"
                        >
                            Add Employee
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="cursor-pointer px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                        >
                            Reset Fields
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
