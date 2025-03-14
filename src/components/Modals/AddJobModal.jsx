import React, { useState } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert"; // Import success alert function
import showWarningAlert from "../Alerts/WarningAlert"; // Import warning alert function
import showErrorAlert from "../Alerts/ErrorAlert"; // Import error alert function
import departments from "../../data/departments"; // Import departments data

const AddJobModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        position: "",
        department: "", // Department will now be a dropdown value
        summary: "",
        keyDuties: "",
        skills: "",
        salaryMin: "",
        salaryMax: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleReset = () => {
        showWarningAlert("Are you sure you want to reset all fields?", () => {
            // Reset form fields
            setFormData({
                position: "",
                department: "",
                summary: "",
                keyDuties: "",
                skills: "",
                salaryMin: "",
                salaryMax: "",
            });

            // Show success alert after resetting
            showSuccessAlert("Fields have been reset!");
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Validate required fields
        if (!formData.position || !formData.department || !formData.summary) {
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
            <div className="bg-white rounded-lg p-8 w-3/5 max-w-3xl shadow-lg relative z-50">
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

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Position & Department */}
                    <div className="flex space-x-2">
                        <div className="relative w-1/2">
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                                required
                            />
                            <label
                                className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                           peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                           peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                           bg-white px-1 z-10" // Added bg-white and z-10
                            >
                                Position
                            </label>
                        </div>
                        <div className="relative w-1/2">
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="cursor-pointer w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer appearance-none"
                                required
                            >
                                <option value="" disabled>
                                    Select Department
                                </option>
                                {departments.map((dept, index) => (
                                    <option key={index} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                            <label
                                className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                           peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                           peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                           bg-white px-1 z-10" // Added bg-white and z-10
                            >
                                Department
                            </label>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="relative">
                        <textarea
                            name="summary"
                            value={formData.summary}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                            required
                        ></textarea>
                        <label
                            className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                       peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                       peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                       bg-white px-1 z-10" // Added bg-white and z-10
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
                        ></textarea>
                        <label
                            className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                       peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                       peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                       bg-white px-1 z-10" // Added bg-white and z-10
                        >
                            Key Duties
                        </label>
                    </div>

                    {/* Skills and Experience */}
                    <div className="relative">
                        <textarea
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                        ></textarea>
                        <label
                            className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                       peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                       peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                       bg-white px-1 z-10" // Added bg-white and z-10
                        >
                            Skills and Experience
                        </label>
                    </div>

                    {/* Salary Range */}
                    <div className="flex space-x-2">
                        <div className="relative w-1/2">
                            <input
                                type="text"
                                name="salaryMin"
                                value={formData.salaryMin}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                            />
                            <label
                                className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                           peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                           peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                           bg-white px-1 z-10" // Added bg-white and z-10
                            >
                                Salary Range Min
                            </label>
                        </div>
                        <div className="relative w-1/2">
                            <input
                                type="text"
                                name="salaryMax"
                                value={formData.salaryMax}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#9AADEA] peer"
                            />
                            <label
                                className="absolute left-3 top-3 text-gray-500 transition-all duration-200 pointer-events-none
                                           peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]
                                           peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm
                                           bg-white px-1 z-10" // Added bg-white and z-10
                            >
                                Salary Range Max
                            </label>
                        </div>
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
                </form>
            </div>
        </div>
    );
};

export default AddJobModal;
