import React, { useState } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import departments from "../../data/departments";
import FormField from "./RecruitmentModalComponents/FormField";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { getUserData } from "../../services/userService";

const AddEmployeeModal = ({ isOpen, onClose, onEmployeeAdded, universityId }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        dateHired: "",
        employeeId: "",
        salary: "",
        status: "Active",
        emergencyContact: {
            name: "",
            relationship: "",
            phone: "",
        },
        bankDetails: {
            bankName: "",
            accountNumber: "",
            accountName: "",
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            // Handle nested objects (emergency contact and bank details)
            const [parent, child] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
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
            email: "",
            phone: "",
            position: "",
            department: "",
            dateHired: "",
            employeeId: "",
            salary: "",
            status: "Active",
            emergencyContact: {
                name: "",
                relationship: "",
                phone: "",
            },
            bankDetails: {
                bankName: "",
                accountNumber: "",
                accountName: "",
            },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !formData.name ||
            !formData.email ||
            !formData.department ||
            !formData.position
        ) {
            showErrorAlert("Please fill all required fields!");
            return;
        }

        // Verify we have a university ID
        let employeeUniversityId = universityId;
        
        // If universityId not provided as prop, try to get from current user
        if (!employeeUniversityId) {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDataResult = await getUserData(user.uid);
                    if (userDataResult.success && userDataResult.data.universityId) {
                        employeeUniversityId = userDataResult.data.universityId;
                    }
                }
            } catch (error) {
                console.error("Error getting university ID:", error);
            }
        }
        
        if (!employeeUniversityId) {
            showErrorAlert("Failed to add employee: University ID not found. Please try again later.");
            return;
        }

        try {
            const employeeData = {
                ...formData,
                universityId: employeeUniversityId, // Store which university this employee belongs to
                dateHired: formData.dateHired
                    ? new Date(formData.dateHired)
                    : serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Add to university's employees subcollection instead of global collection
            const docRef = await addDoc(
                collection(db, "universities", employeeUniversityId, "employees"),
                employeeData
            );

            showSuccessAlert("Employee added successfully!");

            setTimeout(() => {
                resetFormFields();
                onClose();

                if (typeof onEmployeeAdded === "function") {
                    onEmployeeAdded();
                }
            }, 2500);
        } catch (error) {
            console.error("Error adding employee:", error);
            showErrorAlert("Failed to add employee. Please try again.");
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
                    <h2 className="font-bold text-2xl">Add New Employee</h2>
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
                        {/* Basic Information */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <FormField
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full Name"
                                required
                            />
                            <FormField
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number"
                            />
                            <FormField
                                type="text"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                placeholder="Employee ID"
                                required
                            />
                        </div>

                        {/* Job Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                placeholder="Position"
                                required
                            />
                            <FormField
                                type="select"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="Department"
                                options={departments}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                type="date"
                                name="dateHired"
                                value={formData.dateHired}
                                onChange={handleChange}
                                placeholder="Date  Hired"
                            />
                            <FormField
                                type="text"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                placeholder="Salary"
                            />
                        </div>

                        {/* Emergency Contact */}
                        <h3 className="font-semibold text-gray-700 mt-6">
                            Emergency Contact
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                type="text"
                                name="emergencyContact.name"
                                value={formData.emergencyContact.name}
                                onChange={handleChange}
                                placeholder="Contact Name"
                            />
                            <FormField
                                type="text"
                                name="emergencyContact.relationship"
                                value={formData.emergencyContact.relationship}
                                onChange={handleChange}
                                placeholder="Relationship"
                            />
                            <FormField
                                type="tel"
                                name="emergencyContact.phone"
                                value={formData.emergencyContact.phone}
                                onChange={handleChange}
                                placeholder="Contact Phone"
                            />
                        </div>

                        {/* Bank Details */}
                        <h3 className="font-semibold text-gray-700 mt-6">
                            Bank Details
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                type="text"
                                name="bankDetails.bankName"
                                value={formData.bankDetails.bankName}
                                onChange={handleChange}
                                placeholder="Bank Name"
                            />
                            <FormField
                                type="text"
                                name="bankDetails.accountNumber"
                                value={formData.bankDetails.accountNumber}
                                onChange={handleChange}
                                placeholder="Account Number"
                            />
                            <FormField
                                type="text"
                                name="bankDetails.accountName"
                                value={formData.bankDetails.accountName}
                                onChange={handleChange}
                                placeholder="Account Name"
                            />
                        </div>

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
        </div>
    );
};

export default AddEmployeeModal;
