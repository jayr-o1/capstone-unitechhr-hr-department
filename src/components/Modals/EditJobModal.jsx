import React, { useState, useEffect } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import departments from "../../data/departments";
import FormField from "./RecruitmentModalComponents/FormField"; // Reuse FormField
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

const EditJobModal = ({ isOpen, onClose, initialData, onUpdateJob, onJobUpdated }) => {
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

    // Pre-fill the form with initial data when the modal opens
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleReset = () => {
        onClose(); // Close the modal when canceling
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Validate required fields
        if (!formData.title || !formData.department || !formData.summary) {
            showErrorAlert("Please fill all required fields!");
            return;
        }
    
        // Show warning before updating
        showWarningAlert(
            "Are you sure you want to update this job post?",
            async () => {
                try {
                    // Get a reference to the job document
                    const jobRef = doc(db, "jobs", initialData.id);
                    
                    // Create updated job object with ID
                    const updatedJobData = {
                        ...formData,
                        id: initialData.id,
                        lastUpdated: new Date()
                    };
                    
                    // Update the job in Firestore
                    await updateDoc(jobRef, {
                        ...formData,
                        lastUpdated: new Date()
                    });
                    
                    // Show success alert
                    showSuccessAlert("Job updated successfully!");
                    
                    // Call the parent's onUpdateJob function with the updated job data
                    if (typeof onUpdateJob === 'function') {
                        onUpdateJob(updatedJobData);
                    } else {
                        // Wait for the success alert to complete before closing modal
                        setTimeout(() => {
                            onClose(); // Close modal
                            
                            // Call the callback to refresh jobs without page reload
                            if (typeof onJobUpdated === 'function') {
                                onJobUpdated();
                            }
                        }, 2500); // Wait a bit longer than the success alert timer (2000ms)
                    }
                } catch (error) {
                    showErrorAlert(`Failed to update job: ${error.message}`);
                }
            },
            "Update",
            "Cancel"
        );
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
                    <h2 className="font-bold text-2xl">Update Job Post</h2>
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
                            <FormField
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Job Title"
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

                        {/* Single Column Fields */}
                        <div className="space-y-4">
                            <FormField
                                type="textarea"
                                name="summary"
                                value={formData.summary}
                                onChange={handleChange}
                                placeholder="Summary"
                                required
                            />
                            <FormField
                                type="textarea"
                                name="keyDuties"
                                value={formData.keyDuties}
                                onChange={handleChange}
                                placeholder="Key Duties"
                            />
                            <FormField
                                type="textarea"
                                name="essentialSkills"
                                value={formData.essentialSkills}
                                onChange={handleChange}
                                placeholder="Essential Skills"
                            />
                            <FormField
                                type="textarea"
                                name="qualifications"
                                value={formData.qualifications}
                                onChange={handleChange}
                                placeholder="Qualifications"
                            />
                        </div>

                        {/* Last Row: Salary, Work Setup, Available Slots */}
                        <div className="grid grid-cols-3 gap-4 pb-4">
                            <FormField
                                type="text"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                placeholder="Salary (e.g., Up to 20k)"
                                required
                            />
                            <FormField
                                type="select"
                                name="workSetup"
                                value={formData.workSetup}
                                onChange={handleChange}
                                placeholder="Work Setup"
                                options={["On Site", "Remote", "Hybrid"]}
                                required
                            />
                            <FormField
                                type="number"
                                name="availableSlots"
                                value={formData.availableSlots}
                                onChange={handleChange}
                                placeholder="Available Slots"
                                required
                                min="1"
                            />
                        </div>
                        
                        {/* Buttons */}
                        <div className="flex justify-center space-x-4 mt-6">
                            <button
                                type="submit"
                                className="cursor-pointer px-6 py-3 bg-[#9AADEA] text-white font-semibold rounded-lg hover:bg-[#7b8edc] transition"
                            >
                                Update Job Post
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="cursor-pointer px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditJobModal;
