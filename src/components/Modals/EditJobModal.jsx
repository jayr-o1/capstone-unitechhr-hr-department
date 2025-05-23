import React, { useState, useEffect } from "react";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showWarningAlert from "../Alerts/WarningAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import departments from "../../data/departments";
import FormField from "./RecruitmentModalComponents/FormField"; // Reuse FormField
import { updateJob } from "../../services/jobService";

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
        experienceWeight: "",
        skillsWeight: "",
        educationWeight: "",
    });
    const [loading, setLoading] = useState(false);
    const [weightError, setWeightError] = useState("");

    // Pre-fill the form with initial data when the modal opens
    useEffect(() => {
        if (initialData) {
            // Convert arrays to strings for the form display
            // Remove the applicants array to avoid it being included in the form data
            const { applicants, ...dataWithoutApplicants } = initialData;
            
            const processedData = {
                ...dataWithoutApplicants,
                keyDuties: Array.isArray(initialData.keyDuties) 
                    ? initialData.keyDuties.join('\n') 
                    : initialData.keyDuties || '',
                essentialSkills: Array.isArray(initialData.essentialSkills) 
                    ? initialData.essentialSkills.join('\n') 
                    : initialData.essentialSkills || '',
                qualifications: Array.isArray(initialData.qualifications) 
                    ? initialData.qualifications.join('\n') 
                    : initialData.qualifications || '',
                // Set weights from initialData if available
                experienceWeight: initialData.criteriaWeights?.experience ?? "",
                skillsWeight: initialData.criteriaWeights?.skills ?? "",
                educationWeight: initialData.criteriaWeights?.education ?? "",
            };
            setFormData(processedData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // For weight fields, ensure they're numbers and handle validation
        if (name === "experienceWeight" || name === "skillsWeight" || name === "educationWeight") {
            const numValue = value === "" ? "" : parseInt(value) || 0;
            
            // Update the form data with the new weight value
            const updatedFormData = { 
                ...formData, 
                [name]: numValue 
            };
            
            // Calculate the sum of all weights - convert empty strings to 0 for calculation
            const expWeight = updatedFormData.experienceWeight === "" ? 0 : updatedFormData.experienceWeight;
            const skillWeight = updatedFormData.skillsWeight === "" ? 0 : updatedFormData.skillsWeight;
            const eduWeight = updatedFormData.educationWeight === "" ? 0 : updatedFormData.educationWeight;
            
            const totalWeight = expWeight + skillWeight + eduWeight;
            
            // Set error message if total is not 100
            if (totalWeight !== 100) {
                setWeightError(`Total weight must be 100. Current total: ${totalWeight}`);
            } else {
                setWeightError("");
            }
            
            setFormData(updatedFormData);
        } else {
            // Handle non-weight fields normally
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleReset = () => {
        onClose(); // Close the modal when canceling
    };

    // Helper function to process the form data for Firestore
    const prepareDataForFirestore = (data) => {
        // Convert string fields to arrays by splitting on newlines and filtering empty items
        // Create a new object without the applicants property
        const { applicants, experienceWeight, skillsWeight, educationWeight, ...dataWithoutApplicants } = data;
        
        return {
            ...dataWithoutApplicants,
            keyDuties: data.keyDuties ? data.keyDuties.split('\n').filter(item => item.trim()) : [],
            essentialSkills: data.essentialSkills ? data.essentialSkills.split('\n').filter(item => item.trim()) : [],
            qualifications: data.qualifications ? data.qualifications.split('\n').filter(item => item.trim()) : [],
            criteriaWeights: {
                experience: experienceWeight,
                skills: skillsWeight,
                education: educationWeight
            }
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Validate required fields
        if (!formData.title || !formData.department || !formData.summary) {
            showErrorAlert("Please fill all required fields!");
            return;
        }
        
        // Check if weights are filled
        if (formData.experienceWeight === "" || formData.skillsWeight === "" || formData.educationWeight === "") {
            showErrorAlert("Please fill all criteria weights!");
            return;
        }
        
        // Check if weights sum to 100
        const totalWeight = formData.experienceWeight + formData.skillsWeight + formData.educationWeight;
        if (totalWeight !== 100) {
            showErrorAlert(`Weight distribution must equal 100. Current total: ${totalWeight}`);
            return;
        }
    
        // Show warning before updating
        showWarningAlert(
            "Are you sure you want to update this job post?",
            async () => {
                setLoading(true);
                try {
                    // Prepare the data for Firestore (convert strings to arrays)
                    const processedData = prepareDataForFirestore(formData);
                    
                    // Use the updateJob service to update the job in both collections
                    const result = await updateJob(initialData.id, processedData);
                    
                    if (result.success) {
                        // Create updated job object with ID for the context
                        const updatedJobData = {
                            ...processedData,
                            id: initialData.id,
                            // Keep the existing universityId
                            universityId: initialData.universityId
                        };
                        
                        // Show success alert
                        showSuccessAlert("Job updated successfully!");
                        
                        // Call the parent's onUpdateJob function with the updated job data
                        if (typeof onUpdateJob === 'function') {
                            onUpdateJob(updatedJobData);
                        
                            // Wait for the success alert to complete before closing modal
                            setTimeout(() => {
                                onClose(); // Close modal
                                
                                // Call the callback to refresh jobs without page reload
                                if (typeof onJobUpdated === 'function') {
                                    onJobUpdated();
                                }
                            }, 2500); // Wait a bit longer than the success alert timer (2000ms)
                        }
                    } else {
                        showErrorAlert(`Failed to update job: ${result.message}`);
                    }
                } catch (error) {
                    console.error("Error updating job:", error);
                    showErrorAlert(`Failed to update job: ${error.message}`);
                } finally {
                    setLoading(false);
                }
            },
            "Update",
            "Cancel"
        );
    };
    

    if (!isOpen) return null;

    // Calculate the sum of all weights - convert empty strings to 0 for calculation
    const expWeight = formData.experienceWeight === "" ? 0 : formData.experienceWeight;
    const skillWeight = formData.skillsWeight === "" ? 0 : formData.skillsWeight;
    const eduWeight = formData.educationWeight === "" ? 0 : formData.educationWeight;
    const totalWeight = expWeight + skillWeight + eduWeight;

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

                        {/* Criteria Weights Section */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-700">Criteria Weights</h3>
                            <p className="text-sm text-gray-500 mb-2">
                                Set the importance of each criteria for candidate evaluation. Total must equal 100%.
                            </p>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    type="number"
                                    name="experienceWeight"
                                    value={formData.experienceWeight}
                                    onChange={handleChange}
                                    placeholder="Experience Weight"
                                    exampleText="Weight for experience (0-100)"
                                    min="0"
                                    max="100"
                                />
                                <FormField
                                    type="number"
                                    name="skillsWeight"
                                    value={formData.skillsWeight}
                                    onChange={handleChange}
                                    placeholder="Skills Weight"
                                    exampleText="Weight for skills (0-100)"
                                    min="0"
                                    max="100"
                                />
                                <FormField
                                    type="number"
                                    name="educationWeight"
                                    value={formData.educationWeight}
                                    onChange={handleChange}
                                    placeholder="Education Weight"
                                    exampleText="Weight for education (0-100)"
                                    min="0"
                                    max="100"
                                />
                            </div>
                            
                            {/* Weight summary and error message */}
                            <div className="flex justify-between items-center">
                                <div className="text-sm">
                                    <span className="font-semibold">Total: </span>
                                    <span className={`${
                                        totalWeight === 100
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                        {totalWeight}%
                                    </span>
                                    <span className="text-gray-500"> (must equal 100%)</span>
                                </div>
                                {weightError && (
                                    <p className="text-red-500 text-sm">{weightError}</p>
                                )}
                            </div>
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
                                className={`cursor-pointer px-6 py-3 bg-[#9AADEA] text-white font-semibold rounded-lg hover:bg-[#7b8edc] transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Update Job Post"}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="cursor-pointer px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
                                disabled={loading}
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
