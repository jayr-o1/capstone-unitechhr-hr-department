import React, { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import departments from "../../data/departments";
import FormField from "./RecruitmentModalComponents/FormField";

const EditEmployeeModal = ({ isOpen, onClose, employee, universityId, onEmployeeUpdated }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        employeeId: "",
        address: "",
        bio: "",
        status: "",
        dateHired: "",
    });
    const [loading, setLoading] = useState(false);

    // Load employee data when the employee prop changes
    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name || "",
                email: employee.email || "",
                phone: employee.phone || "",
                position: employee.position || "",
                department: employee.department || "",
                employeeId: employee.employeeId || "",
                address: employee.address || "",
                bio: employee.bio || "",
                status: employee.status || "Active",
                dateHired: employee.dateHired instanceof Date 
                    ? employee.dateHired.toISOString().split('T')[0] 
                    : "",
            });
        }
    }, [employee]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleReset = () => {
        showWarningAlert(
            "Are you sure you want to reset all changes?",
            () => {
                // Reset form to original employee data
                if (employee) {
                    setFormData({
                        name: employee.name || "",
                        email: employee.email || "",
                        phone: employee.phone || "",
                        position: employee.position || "",
                        department: employee.department || "",
                        employeeId: employee.employeeId || "",
                        address: employee.address || "",
                        bio: employee.bio || "",
                        status: employee.status || "Active",
                        dateHired: employee.dateHired instanceof Date 
                            ? employee.dateHired.toISOString().split('T')[0] 
                            : "",
                    });
                }
                showSuccessAlert("Changes have been reset!");
            },
            "Yes, reset it!",
            "Cancel"
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.position || !formData.department) {
            showErrorAlert("Please fill all required fields!");
            return;
        }

        if (!universityId || !employee?.id) {
            showErrorAlert("Missing required information to update employee.");
            return;
        }

        setLoading(true);
        
        try {
            const employeeRef = doc(db, "universities", universityId, "employees", employee.id);
            
            // Format dateHired back to a Date object if it's a string
            const dateHired = formData.dateHired 
                ? new Date(formData.dateHired) 
                : employee.dateHired;
            
            // Prepare update data
            const updateData = {
                ...formData,
                dateHired: dateHired,
                updatedAt: serverTimestamp(),
            };

            // Update the employee document
            await updateDoc(employeeRef, updateData);

            // Show success alert
            showSuccessAlert("Employee updated successfully!");
            
            // Wait a bit before closing and refreshing
            setTimeout(() => {
                onClose(); // Close the modal
                
                // Call the callback to refresh employee data
                if (typeof onEmployeeUpdated === 'function') {
                    onEmployeeUpdated();
                }
            }, 2000);
        } catch (error) {
            console.error("Error updating employee:", error);
            showErrorAlert("Failed to update employee. Please try again.");
        } finally {
            setLoading(false);
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
            <div className="bg-white rounded-lg p-8 w-3/5 max-w-5xl shadow-lg relative z-50 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">Edit Employee</h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300" />

                {/* Scrollable Form Content */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* First Row */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <FormField
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full Name"
                                exampleText="e.g., John Doe"
                                required
                            />
                            <FormField
                                type="text"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                placeholder="Employee ID"
                                exampleText="e.g., EMP001"
                                required
                            />
                        </div>

                        {/* Second Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                exampleText="e.g., john.doe@example.com"
                                required
                            />
                            <FormField
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone"
                                exampleText="e.g., +1 234 567 8901"
                            />
                        </div>

                        {/* Third Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                type="select"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="Department"
                                options={departments}
                                required
                            />
                            <FormField
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                placeholder="Position"
                                exampleText="e.g., Associate Professor"
                                required
                            />
                        </div>

                        {/* Fourth Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                type="select"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                placeholder="Status"
                                options={["Active", "Inactive", "On Leave", "Terminated"]}
                            />
                            <FormField
                                type="date"
                                name="dateHired"
                                value={formData.dateHired}
                                onChange={handleChange}
                                placeholder="Date Hired"
                            />
                        </div>

                        {/* Address */}
                        <FormField
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Address"
                            exampleText="Full address including city and postal code"
                        />

                        {/* Bio */}
                        <FormField
                            type="textarea"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Bio"
                            exampleText="Brief bio or additional information about the employee"
                        />
                    </form>
                </div>

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
                        {loading ? "Updating..." : "Update Employee"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditEmployeeModal; 