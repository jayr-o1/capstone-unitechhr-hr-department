import React, { useState, useEffect } from "react";
import {
    doc,
    updateDoc,
    serverTimestamp,
    getDoc,
    setDoc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import FormField from "./RecruitmentModalComponents/FormField";
import { hashPassword } from "../../utils/passwordUtilsFixed";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const EditCredentialsModal = ({
    isOpen,
    onClose,
    employee,
    universityId,
    onEmployeeUpdated,
}) => {
    const [formData, setFormData] = useState({
        employeeId: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load employee data when the employee prop changes
    useEffect(() => {
        if (employee) {
            setFormData({
                employeeId: employee.employeeId || "",
                password: "",
            });
        }
    }, [employee]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleReset = () => {
        showWarningAlert(
            "Are you sure you want to reset all changes?",
            () => {
                // Reset form to original employee data
                if (employee) {
                    setFormData({
                        employeeId: employee.employeeId || "",
                        password: "",
                    });
                    setShowPassword(false);
                }
                showSuccessAlert("Changes have been reset!");
            },
            "Yes, reset it!",
            "Cancel"
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setIsSubmitting(true);

            // Check if this is a no-id employee first
            const noIdEmployeeRef = doc(db, "no-id-employees", employee.id);
            const noIdEmployeeDoc = await getDoc(noIdEmployeeRef);

            if (noIdEmployeeDoc.exists()) {
                // This is a no-id employee, move them to university collection
                const employeeData = noIdEmployeeDoc.data();

                // Create in university collection with the employeeId as the document ID
                const universityEmployeesRef = doc(
                    db,
                    "universities",
                    universityId,
                    "employees",
                    formData.employeeId // Using employeeId (e.g., UNT-00001) as the document ID
                );

                // Move the employee data to university collection
                await setDoc(universityEmployeesRef, {
                    ...employeeData,
                    id: formData.employeeId, // Set the id field to match document ID
                    employeeId: formData.employeeId,
                    password: formData.password
                        ? await hashPassword(formData.password)
                        : employeeData.password,
                    updatedAt: serverTimestamp(),
                    pendingIdAssignment: false,
                });

                // Delete from no-id-employees collection
                await deleteDoc(noIdEmployeeRef);

                console.log(
                    "Moved employee to university collection with ID:",
                    formData.employeeId
                );
            } else {
                // Regular employee update
                const employeeRef = doc(
                    db,
                    `universities/${universityId}/employees/${employee.id}`
                );

                // Update only what has changed
                const updates = {
                    employeeId: formData.employeeId,
                    updatedAt: serverTimestamp(),
                };

                if (formData.password) {
                    updates.password = await hashPassword(formData.password);
                }

                await updateDoc(employeeRef, updates);
            }

            showSuccessAlert("Employee credentials updated successfully!");
            onClose();

            // Refresh the page to reflect changes
            window.location.reload();
        } catch (error) {
            console.error("Error updating employee credentials:", error);
            showErrorAlert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 min-h-screen"
            style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
                zIndex: 1000,
            }}
        >
            <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative z-50 flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">
                        Edit Employee Credentials
                    </h2>
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
                    {/* Employee ID Field */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Employee ID<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Employee ID"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            The unique identifier for this employee
                        </p>
                    </div>

                    {/* Password Field with Toggle Visibility */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10"
                                placeholder="New Password"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                            >
                                <FontAwesomeIcon
                                    icon={showPassword ? faEyeSlash : faEye}
                                />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Leave blank to keep current password
                        </p>
                    </div>
                </form>

                {/* Modal Footer with Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-300">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        type="button"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-[#9AADEA] text-white rounded-md hover:bg-[#7b8edc] transition-colors"
                        type="button"
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update Credentials"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCredentialsModal;
