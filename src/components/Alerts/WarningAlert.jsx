import React, { useState } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert"; // Import success alert function
import showWarningAlert from "../Alerts/WarningAlert"; // Import warning alert function
import showErrorAlert from "../Alerts/ErrorAlert"; // Import error alert function

const AddJobButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [formData, setFormData] = useState({
        position: "",
        department: "",
        summary: "",
        keyDuties: "",
        skills: "",
        salaryMin: "",
        salaryMax: "",
    });

    // Open the modal
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    // Close the modal and reset form data
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            position: "",
            department: "",
            summary: "",
            keyDuties: "",
            skills: "",
            salaryMin: "",
            salaryMax: "",
        });
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Reset form fields after confirmation
    const handleReset = () => {
        showWarningAlert("Are you sure you want to reset all fields?", () => {
            setFormData({
                position: "",
                department: "",
                summary: "",
                keyDuties: "",
                skills: "",
                salaryMin: "",
                salaryMax: "",
            });
        });
    };

    // Handle form submission
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
            handleCloseModal(); // Close modal after 2 seconds
        }, 2000);
    };

    return (
        <>
            {/* Add Job Button */}
            <button
                onClick={handleOpenModal}
                className="cursor-pointer w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200"
            >
                Add Job Post
            </button>

            {/* Modal for Adding a Job */}
            {isModalOpen && (
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
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>

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
                                    Add Job Post
                                </button>
                                <button
                                    type="button" // Ensure this is not a submit button
                                    onClick={handleReset}
                                    className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                                >
                                    Reset Field
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddJobButton;
