import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useParams and useNavigate
import { JobContext } from "../../contexts/JobContext"; // Import JobContext
import showWarningAlert from "../../components/Alerts/WarningAlert";
import showSuccessAlert from "../../components/Alerts/SuccessAlert";
import showErrorAlert from "../../components/Alerts/ErrorAlert";
import ApplicantInfo from "../../components/RecruitmentComponents/ApplicantDetailsComponents/ApplicantInfo";
import AIInsights from "../../components/RecruitmentComponents/ApplicantDetailsComponents/AIInsights";
import RecruiterNotes from "../../components/RecruitmentComponents/ApplicantDetailsComponents/RecruiterNotes";
import ScheduleInterviewModal from "../../components/Modals/ScheduleInterviewModal";
import EditInterviewModal from "../../components/Modals/EditInterviewModal";
import {
    updateApplicantStatus,
    scheduleInterview,
    getApplicantInterviews,
    updateApplicantNotes,
    updateInterview,
    updateInterviewNotes,
} from "../../services/applicantService";

const ApplicantDetails = () => {
    const { jobId, applicantId } = useParams(); // Get jobId and applicantId from URL
    const { jobs, refreshJobs } = useContext(JobContext); // Use JobContext to access jobs and refreshJobs
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [interviewDateTime, setInterviewDateTime] = useState("");
    const [scheduledInterviews, setScheduledInterviews] = useState([]);
    const [notes, setNotes] = useState("");
    const [selectedInterviewId, setSelectedInterviewId] = useState(null);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Find the job and applicant
    const job = jobs.find((job) => job.id === jobId); // Find job by ID
    const applicant = job?.applicants.find(
        (app) => app.id === applicantId // Find applicant by ID
    );

    // Handle Add Notes
    const handleAddNotes = (interviewId) => {
        setSelectedInterviewId(interviewId);
        const interview = scheduledInterviews.find((i) => i.id === interviewId);
        setNotes(interview?.notes || "");
    };

    // Handle Save Notes
    const handleSaveNotes = async (interviewId, notes, status) => {
        if (!interviewId) return;

        setIsLoading(true);
        try {
            // Update notes in the interview document
            const result = await updateInterviewNotes(
                jobId,
                applicantId,
                interviewId,
                notes,
                status
            );

            if (result.success) {
                // Refresh interviews list to get updated data from Firestore
                const interviewsResult = await getApplicantInterviews(
                    jobId,
                    applicantId
                );

                if (interviewsResult.success) {
                    setScheduledInterviews(interviewsResult.interviews || []);
                    showSuccessAlert("Notes saved successfully!");
                }
            } else {
                throw new Error(result.message || "Failed to save notes");
            }
        } catch (error) {
            showErrorAlert(`Error saving notes: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle editing an interview
    const handleEditInterview = (interview) => {
        setSelectedInterview(interview);
        setIsEditModalOpen(true);
    };

    // Fetch applicant interviews on component mount
    useEffect(() => {
        const fetchInterviews = async () => {
            if (jobId && applicantId) {
                try {
                    const result = await getApplicantInterviews(
                        jobId,
                        applicantId
                    );
                    if (result.success) {
                        setScheduledInterviews(result.interviews || []);
                    }
                } catch (error) {
                    console.error("Error fetching interviews:", error);
                }
            }
        };

        fetchInterviews();
    }, [jobId, applicantId]);

    if (!job || !applicant) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6 text-gray-600">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-16 h-16 text-gray-400 mb-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4.5a9 9 0 1112.765 0M9.75 9h4.5m-2.25-3v6"
                    />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700">
                    Applicant Not Found
                </h2>
                <p className="text-gray-500 mt-2">
                    Sorry, the applicant you're looking for doesn't exist or has
                    been removed.
                </p>
                <button
                    onClick={() => navigate(-1)} // Go back to the previous page
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Back to Job Listings
                </button>
            </div>
        );
    }

    // Handle Hire Applicant
    const handleHireApplicant = () => {
        showWarningAlert(
            "Are you sure you want to hire this applicant?",
            async () => {
                setIsLoading(true);
                try {
                    const result = await updateApplicantStatus(
                        jobId,
                        applicantId,
                        "Hired"
                    );

                    if (result.success) {
                        // Set page refresh flag to show fullscreen loader on redirect
                        sessionStorage.setItem("isPageRefresh", "true");

                        showSuccessAlert(
                            "The applicant has been moved to onboarding!"
                        );

                        // Refresh jobs data to update UI
                        await refreshJobs();

                        // Navigate to onboarding page after a brief delay
                        setTimeout(() => {
                            // Navigate to onboarding page with the applicant's data
                            navigate("/onboarding", {
                                state: {
                                    newOnboarding: true,
                                    jobId: jobId,
                                    applicantId: applicantId,
                                    applicantData: result.applicantData,
                                },
                            });
                        }, 2000);
                    } else {
                        setIsLoading(false);
                        showErrorAlert(
                            `Failed to move applicant to onboarding: ${result.message}`
                        );
                    }
                } catch (error) {
                    setIsLoading(false);
                    showErrorAlert(`Error: ${error.message}`);
                }
                // Don't set isLoading to false here, it will stay loading during the transition
            },
            "Yes, move to onboarding!",
            "Cancel",
            "The applicant has been moved to onboarding!"
        );
    };

    // Handle Fail Applicant
    const handleFailApplicant = () => {
        showWarningAlert(
            "Are you sure you want to fail this applicant?",
            async () => {
                setIsLoading(true);
                try {
                    const result = await updateApplicantStatus(
                        jobId,
                        applicantId,
                        "Failed"
                    );

                    if (result.success) {
                        showSuccessAlert(
                            "The applicant has been successfully marked as failed!"
                        );

                        // Refresh jobs data to update UI
                        await refreshJobs();
                    } else {
                        showErrorAlert(
                            `Failed to update applicant: ${result.message}`
                        );
                    }
                } catch (error) {
                    showErrorAlert(`Error: ${error.message}`);
                } finally {
                    setIsLoading(false);
                }
            },
            "Yes, fail them!",
            "Cancel",
            "The applicant has been successfully marked as failed!"
        );
    };

    // Handle Schedule Interview
    const handleScheduleInterview = () => {
        setIsModalOpen(true);
    };

    // Handle Modal Close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setInterviewDateTime("");
    };

    // Handle Form Submission
    const handleSubmitInterview = async (data) => {
        if (!data.dateTime || !data.title || !data.interviewer) {
            showErrorAlert("Please fill all fields.");
            return;
        }

        setIsLoading(true);
        try {
            // First close the modal to prevent background becoming black
            handleCloseModal();

            const result = await scheduleInterview(jobId, applicantId, {
                dateTime: data.dateTime,
                title: data.title,
                interviewer: data.interviewer,
            });

            if (result.success) {
                // Refresh interviews list
                const interviewsResult = await getApplicantInterviews(
                    jobId,
                    applicantId
                );
                if (interviewsResult.success) {
                    setScheduledInterviews(interviewsResult.interviews || []);
                }

                // Refresh jobs data to update UI
                await refreshJobs();

                // Show success message
                showSuccessAlert("Interview scheduled successfully!");
            } else {
                showErrorAlert(
                    `Failed to schedule interview: ${result.message}`
                );
            }
        } catch (error) {
            showErrorAlert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Notes Change
    const handleNotesChange = (e) => {
        setNotes(e.target.value);
    };

    // Handle updating an interview
    const handleUpdateInterview = async (data) => {
        if (!data.dateTime || !data.title || !data.interviewer || !data.id) {
            showErrorAlert("Please fill all fields.");
            return;
        }

        setIsLoading(true);
        try {
            // First close the modal to prevent background becoming black
            setIsEditModalOpen(false);

            const result = await updateInterview(jobId, applicantId, data.id, {
                dateTime: data.dateTime,
                title: data.title,
                interviewer: data.interviewer,
            });

            if (result.success) {
                // Refresh interviews list
                const interviewsResult = await getApplicantInterviews(
                    jobId,
                    applicantId
                );
                if (interviewsResult.success) {
                    setScheduledInterviews(interviewsResult.interviews || []);
                }

                // Refresh jobs data to update UI
                await refreshJobs();

                // Show success message
                showSuccessAlert("Interview updated successfully!");
            } else {
                showErrorAlert(`Failed to update interview: ${result.message}`);
            }
        } catch (error) {
            showErrorAlert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
            setSelectedInterview(null);
        }
    };

    // Handle closing the edit modal
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedInterview(null);
    };

    // Get current date and time in the required format (YYYY-MM-DDTHH:MM)
    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <>
            {/* Main Container */}
            <div className="p-6 bg-white shadow-md rounded-lg">
                {/* Applicant Details and Insights in a Single Container */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column - Applicant Info */}
                    <div className="w-full md:w-2/3">
                        <ApplicantInfo applicant={applicant} />
                    </div>

                    {/* Right Column - AI Insights */}
                    <div className="w-full md:w-1/3">
                        <AIInsights
                            applicant={applicant}
                            onScheduleInterview={handleScheduleInterview}
                            onHireApplicant={handleHireApplicant}
                            onFailApplicant={handleFailApplicant}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {/* Recruiter Notes Section */}
                <div className="mt-6">
                    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-md">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Interview History
                        </h2>
                        {/* Horizontal Divider */}
                        <hr className="border-t border-gray-300 mb-6" />
                        <RecruiterNotes
                            scheduledInterviews={scheduledInterviews}
                            addNotesHandler={handleAddNotes}
                            saveNotesHandler={handleSaveNotes}
                            onAddNotes={handleAddNotes}
                            onEditInterview={handleEditInterview}
                        />
                    </div>
                </div>
            </div>

            {/* Schedule Interview Modal */}
            {isModalOpen && (
                <ScheduleInterviewModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitInterview}
                    interviewDateTime={interviewDateTime}
                    onDateTimeChange={(e) =>
                        setInterviewDateTime(e.target.value)
                    }
                    getCurrentDateTime={getCurrentDateTime}
                />
            )}

            {/* Edit Interview Modal */}
            {isEditModalOpen && selectedInterview && (
                <EditInterviewModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleUpdateInterview}
                    initialData={selectedInterview}
                    getCurrentDateTime={getCurrentDateTime}
                />
            )}
        </>
    );
};

export default ApplicantDetails;
