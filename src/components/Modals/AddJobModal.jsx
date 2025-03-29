import React, { useState, useEffect } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import departments from "../../data/departments";
import FormField from "./RecruitmentModalComponents/FormField";
import { auth } from "../../firebase";
import { serverTimestamp } from "firebase/firestore";
import { createJob } from "../../services/jobService";
import { getUserData } from "../../services/userService";

const AddJobModal = ({ isOpen, onClose, onJobAdded }) => {
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
    const [universityId, setUniversityId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found");
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    setUniversityId(userDataResult.data.universityId);
                    console.log("User belongs to university:", userDataResult.data.universityId);
                } else {
                    console.error("User doesn't have a university association");
                    showErrorAlert("Unable to determine your university. Please contact support.");
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                showErrorAlert("Error retrieving your university information");
            }
        };
        
        getCurrentUserUniversity();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
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

    // New function to reset form fields without confirmation
    const resetFormFields = () => {
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        if (!formData.title || !formData.department || !formData.summary) {
            showErrorAlert("Please fill all required fields!");
            return;
        }

        if (!universityId) {
            showErrorAlert("No university associated with your account. Cannot create job post.");
            return;
        }

        setLoading(true);
        
        try {
            // Convert keyDuties, essentialSkills, and qualifications to arrays
            const jobData = {
                title: formData.title,
                summary: formData.summary,
                department: formData.department,
                keyDuties: formData.keyDuties
                    ? formData.keyDuties.split('\n').filter(item => item.trim())
                    : [],
                essentialSkills: formData.essentialSkills
                    ? formData.essentialSkills.split('\n').filter(item => item.trim())
                    : [],
                qualifications: formData.qualifications
                    ? formData.qualifications.split('\n').filter(item => item.trim())
                    : [],
                salary: formData.salary,
                workSetup: formData.workSetup,
                availableSlots: parseInt(formData.availableSlots, 10),
                datePosted: serverTimestamp(),
                newApplicants: false,
                status: "Open",
            };

            console.log("Creating job with universityId:", universityId);
            console.log("Job data:", jobData);

            // Use the createJob function from jobService
            const result = await createJob(jobData, universityId);

            if (result.success) {
                // Show success alert
                showSuccessAlert("Job added successfully!");
                
                // Wait for the success alert to complete before closing modal and resetting
                setTimeout(() => {
                    resetFormFields(); // Reset form fields
                    onClose(); // Close the modal
                    
                    // Call the callback to refresh jobs without page reload
                    if (typeof onJobAdded === 'function') {
                        onJobAdded();
                    }
                }, 2500); // Wait a bit longer than the success alert timer (2000ms)
            } else {
                showErrorAlert(`Failed to add job: ${result.message}`);
            }
        } catch (error) {
            console.error("Error adding job:", error);
            showErrorAlert("Failed to add job. Please try again.");
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
                    <h2 className="font-bold text-2xl">Add Job Post</h2>
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
                        {/* First Row: Job Title and Department */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <FormField
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Job Title"
                                exampleText="e.g., Computer Science Instructor"
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
                                exampleText="e.g., Responsible for teaching programming, algorithms, and data structures."
                                required
                            />
                            <FormField
                                type="textarea"
                                name="keyDuties"
                                value={formData.keyDuties}
                                onChange={handleChange}
                                placeholder="Key Duties"
                                exampleText="IMPORTANT: Enter each item on a separate line."
                            />
                            <FormField
                                type="textarea"
                                name="essentialSkills"
                                value={formData.essentialSkills}
                                onChange={handleChange}
                                placeholder="Essential Skills"
                                exampleText="IMPORTANT: Enter each item on a separate line."
                            />
                            <FormField
                                type="textarea"
                                name="qualifications"
                                value={formData.qualifications}
                                onChange={handleChange}
                                placeholder="Qualifications"
                                exampleText="IMPORTANT: Enter each item on a separate line."
                            />
                        </div>

                        {/* Last Row: Salary, Work Setup, Available Slots */}
                        <div className="grid grid-cols-3 gap-4 pb-4">
                            <FormField
                                type="text"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                placeholder="Salary"
                                exampleText="e.g., Up to 20k"
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
                                className={`cursor-pointer px-6 py-3 bg-[#9AADEA] text-white font-semibold rounded-lg hover:bg-[#7b8edc] transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={loading}
                            >
                                {loading ? "Adding..." : "Add Job Post"}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="cursor-pointer px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                                disabled={loading}
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

export default AddJobModal;