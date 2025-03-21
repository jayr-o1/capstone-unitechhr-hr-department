import React, { useState } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import departments from "../../data/departments";
import FormField from "./RecruitmentModalComponents/FormField";
import ActionButtons from "./RecruitmentModalComponents/ActionButtons";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleReset = () => {
        showWarningAlert(
            "Are you sure you want to reset all fields?",
            () => {
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
                showSuccessAlert("Fields have been successfully reset!");
            },
            "Yes, reset it!",
            "Cancel"
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        if (!formData.title || !formData.department || !formData.summary) {
            showErrorAlert("Please fill all required fields!");
            return;
        }

        try {
            // Convert keyDuties, essentialSkills, and qualifications to arrays
            const jobData = {
                title: formData.title,
                summary: formData.summary,
                department: formData.department,
                keyDuties: formData.keyDuties
                    .split(",")
                    .map((duty) => duty.trim()),
                essentialSkills: formData.essentialSkills
                    .split(",")
                    .map((skill) => skill.trim()),
                qualifications: formData.qualifications
                    .split(",")
                    .map((qual) => qual.trim()),
                salary: formData.salary,
                workSetup: formData.workSetup,
                availableSlots: parseInt(formData.availableSlots, 10),
                datePosted: serverTimestamp(),
                newApplicants: false,
                status: "Open",
            };

            const docRef = await addDoc(collection(db, "jobs"), jobData);

            showSuccessAlert("Job added successfully!");
            handleReset(); // Reset the form fields
            
            // Close the modal after a delay
            setTimeout(() => {
                onClose();
                
                // Call the callback to refresh jobs without page reload
                if (typeof onJobAdded === 'function') {
                    onJobAdded();
                }
            }, 2000);
        } catch (error) {
            showErrorAlert("Failed to add job. Please try again.");
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
                                exampleText="e.g., Teach programming, Prepare lesson plans, Conduct assessments, Grade students"
                            />
                            <FormField
                                type="textarea"
                                name="essentialSkills"
                                value={formData.essentialSkills}
                                onChange={handleChange}
                                placeholder="Essential Skills"
                                exampleText="e.g., Python, Java, or C++, Strong understanding of algorithms, Strong understanding of database systems"
                            />
                            <FormField
                                type="textarea"
                                name="qualifications"
                                value={formData.qualifications}
                                onChange={handleChange}
                                placeholder="Qualifications"
                                exampleText="e.g., Bachelor's in CS, Teaching experience preferred, Programming experience preferred"
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
                        <ActionButtons 
                            onSubmit={handleSubmit}
                            onReset={handleReset}
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddJobModal;