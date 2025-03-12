import React, { useState } from "react";
import SuccessAlert from "../Alerts/SuccessAlert"; // Import your success alert component
import WarningAlert from "../Alerts/WarningAlert"; // Import your warning alert component
import ErrorAlert from "../Alerts/ErrorAlert"; // Import your error alert component

const AddJobModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        position: "",
        department: "",
        summary: "",
        keyDuties: "",
        skills: "",
        salaryMin: "",
        salaryMax: "",
    });
    const [alert, setAlert] = useState(null); // Store alert type

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleReset = () => {
        setAlert("warning"); // Show warning alert first

        setTimeout(() => {
            setFormData({
                position: "",
                department: "",
                summary: "",
                keyDuties: "",
                skills: "",
                salaryMin: "",
                salaryMax: "",
            });

            setAlert("success"); // Show success alert after clearing
        }, 1000); // Wait 1 second before resetting the fields
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Simulated validation: Check if required fields are filled
        if (!formData.position || !formData.department || !formData.summary) {
            setAlert("error"); // Show error alert if fields are missing
            return;
        }

        // If no errors, show success alert and close the modal after 2 seconds
        setAlert("success");
        setTimeout(() => {
            onClose(); // Close modal after 2 seconds
            setAlert(null);
        }, 2000);
    };

    if (!isOpen) return null; // Don't render the modal if it's not open

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 min-h-screen"
            style={{
                background: "rgba(0, 0, 0, 0.6)", // Semi-transparent black overlay
                backdropFilter: "blur(8px)", // Blur effect
            }}
        >
            <div className="bg-white rounded-lg p-8 w-3/5 max-w-3xl shadow-lg">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">Add Job Post</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Alert Messages */}
                {alert === "success" && (
                    <SuccessAlert message="Job added successfully!" />
                )}
                {alert === "warning" && (
                    <WarningAlert message="Fields have been reset!" />
                )}
                {alert === "error" && (
                    <ErrorAlert message="Please fill all required fields!" />
                )}

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Position & Department */}
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            name="position"
                            placeholder="Position"
                            value={formData.position}
                            onChange={handleChange}
                            className="w-1/2 p-3 border border-gray-300 rounded-md"
                            required
                        />
                        <input
                            type="text"
                            name="department"
                            placeholder="Department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-1/2 p-3 border border-gray-300 rounded-md"
                            required
                        />
                    </div>

                    {/* Summary */}
                    <textarea
                        name="summary"
                        placeholder="Summary"
                        value={formData.summary}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md h-auto min-h-[100px]"
                        required
                    ></textarea>

                    {/* Key Duties */}
                    <textarea
                        name="keyDuties"
                        placeholder="Key Duties"
                        value={formData.keyDuties}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md h-auto min-h-[100px]"
                    ></textarea>

                    {/* Skills and Experience */}
                    <textarea
                        name="skills"
                        placeholder="Skills and Experience"
                        value={formData.skills}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md h-auto min-h-[100px]"
                    ></textarea>

                    {/* Salary Range */}
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            name="salaryMin"
                            placeholder="Salary Range Min"
                            value={formData.salaryMin}
                            onChange={handleChange}
                            className="w-1/2 p-3 border border-gray-300 rounded-md"
                        />
                        <input
                            type="text"
                            name="salaryMax"
                            placeholder="Salary Range Max"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            className="w-1/2 p-3 border border-gray-300 rounded-md"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-center space-x-4 mt-6">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-[#9AADEA] text-white font-semibold rounded-lg hover:bg-[#7b8edc] transition"
                        >
                            Add
                        </button>
                        <button
                            type="button" // Prevent form submission
                            onClick={handleReset}
                            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddJobModal;
