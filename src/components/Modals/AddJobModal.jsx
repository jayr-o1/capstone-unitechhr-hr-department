import React, { useState } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert"; // Import success alert function
import showWarningAlert from "../Alerts/WarningAlert"; // Import warning alert function
import showErrorAlert from "../Alerts/ErrorAlert"; // Import error alert function
import departments from "../../data/departments"; // Import departments data

const AddJobModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        title: "",
        department: "",
        summary: "",
        keyDuties: "",
        essentialSkills: "",
        qualifications: "",
        salary: "",
        workSetup: "",
        availableSlots: 1,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleReset = () => {
        showWarningAlert(
            "Are you sure you want to reset all fields?",
            () => {
                // Reset form fields
                setFormData({
                    title: "",
                    department: "",
                    summary: "",
                    keyDuties: "",
                    essentialSkills: "",
                    qualifications: "",
                    salary: "",
                    workSetup: "",
                    availableSlots: 1,
                });
            },
            "Yes, reset it!",
            "Cancel",
            "Fields have been successfully reset!" // Success message passed to showWarningAlert
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Validate required fields
        if (!formData.title || !formData.department || !formData.summary) {
            showErrorAlert("Please fill all required fields!"); // Show error alert
            return;
        }

        // Simulate successful submission
        showSuccessAlert("Job added successfully!"); // Show success alert
        setTimeout(() => {
            onClose(); // Close modal after 2 seconds
        }, 2000);
    };

    if (!isOpen) return null; // Don't render the modal if it's not open

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 min-h-screen"
            style={{
                background: "rgba(0, 0, 0, 0.6)", // Semi-transparent black overlay
                backdropFilter: "blur(8px)", // Blur effect
                zIndex: 1000, // Ensure this is higher than other elements
            }}
        >
            <div className="bg-white rounded-lg p-8 w-3/5 max-w-5xl shadow-lg relative z-50 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">Add Job Post</h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* First Row: Job Title and Department */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            {/* Job Title */}
                            <div className="relative">
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                    placeholder=""
                                    required
                                />
                                <label
                                    className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                               peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                               bg-white px-1 z-10"
                                >
                                    Job Title
                                </label>
                            </div>

                            {/* Department */}
                            <div className="relative">
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="cursor-pointer w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer appearance-none bg-white"
                                    required
                                >
                                    <option value="" hidden></option>
                                    {departments.map((dept, index) => (
                                        <option key={index} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                                <label
                                    className={`absolute left-3 transition-all duration-200 pointer-events-none 
                    bg-white px-1 z-10 
                    ${
                        formData.department
                            ? "-top-2 text-sm text-[#9AADEA]"
                            : "top-3 text-gray-500"
                    }`}
                                >
                                    Department
                                </label>
                            </div>
                        </div>

                        {/* Single Column Fields */}
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="relative">
                                <textarea
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                    placeholder=""
                                    required
                                ></textarea>
                                <label
                                    className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                               peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                               bg-white px-1 z-10"
                                >
                                    Summary
                                </label>
                            </div>

                            {/* Key Duties */}
                            <div className="relative">
                                <textarea
                                    name="keyDuties"
                                    value={formData.keyDuties}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                    placeholder=""
                                ></textarea>
                                <label
                                    className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                               peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                               bg-white px-1 z-10"
                                >
                                    Key Duties
                                </label>
                            </div>

                            {/* Essential Skills */}
                            <div className="relative">
                                <textarea
                                    name="essentialSkills"
                                    value={formData.essentialSkills}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                    placeholder=""
                                ></textarea>
                                <label
                                    className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                               peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                               bg-white px-1 z-10"
                                >
                                    Essential Skills
                                </label>
                            </div>

                            {/* Qualifications */}
                            <div className="relative">
                                <textarea
                                    name="qualifications"
                                    value={formData.qualifications}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                    placeholder=""
                                ></textarea>
                                <label
                                    className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                               peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                               bg-white px-1 z-10"
                                >
                                    Qualifications
                                </label>
                            </div>
                        </div>

                        {/* Last Row: Salary, Work Setup, Available Slots */}
                        <div className="grid grid-cols-3 gap-4 pb-4">
                            {/* Salary */}
                            <div className="relative">
                                <input
                                    type="text"
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                    placeholder=""
                                    required
                                />
                                <label
                                    className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                               peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                               bg-white px-1 z-10"
                                >
                                    Salary (e.g., Up to 20k)
                                </label>
                            </div>

                            {/* Work Setup */}
                            <div className="relative">
                                <select
                                    name="workSetup"
                                    value={formData.workSetup}
                                    onChange={handleChange}
                                    className="cursor-pointer w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer appearance-none bg-white"
                                    required
                                >
                                    <option value="" hidden></option>
                                    <option value="On Site">On Site</option>
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                                <label
                                    className={`absolute left-3 transition-all duration-200 pointer-events-none bg-white px-1 z-10 
            ${
                formData.workSetup && formData.workSetup !== ""
                    ? "-top-2 text-sm text-[#9AADEA]"
                    : "top-3 text-gray-500"
            }`}
                                >
                                    Work Setup
                                </label>
                            </div>

                            {/* Available Slots */}
                            <div className="relative">
                                <input
                                    type="number"
                                    name="availableSlots"
                                    value={formData.availableSlots}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                    min="1"
                                    required
                                />
                                <label
                                    className={`absolute left-3 transition-all duration-200 pointer-events-none bg-white px-1 z-10 
                    ${
                        formData.availableSlots
                            ? "-top-2 text-sm text-[#9AADEA]"
                            : "top-3 text-gray-500"
                    }`}
                                >
                                    Available Slots
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Buttons */}
                <div className="flex justify-center space-x-4 mt-6">
                    <button
                        type="submit"
                        className="cursor-pointer px-6 py-3 bg-[#9AADEA] text-white font-semibold rounded-lg hover:bg-[#7b8edc] transition"
                    >
                        Add Job Post
                    </button>
                    <button
                        type="button" // Prevent form submission
                        onClick={handleReset}
                        className="cursor-pointer px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                    >
                        Reset Fields
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddJobModal;
