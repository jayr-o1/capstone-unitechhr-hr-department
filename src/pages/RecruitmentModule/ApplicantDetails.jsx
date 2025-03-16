import React, { useState } from "react";
import { useParams } from "react-router-dom"; // Import useParams
import jobDetailsData from "../../data/jobDetailsData";
import showWarningAlert from "../../components/Alerts/WarningAlert";
import showSuccessAlert from "../../components/Alerts/SuccessAlert";
import ApplicantInfo from "../../components/RecruitmentComponents/ApplicantDetailsComponents/ApplicantInfo";
import AIInsights from "../../components/RecruitmentComponents/ApplicantDetailsComponents/AIInsights";
import RecruiterNotes from "../../components/RecruitmentComponents/ApplicantDetailsComponents/RecruiterNotes";
import ScheduleInterviewModal from "../../components/Modals/ScheduleInterviewModal";

const ApplicantDetails = () => {
    const { jobId, applicantId } = useParams(); // Now useParams is defined
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [interviewDateTime, setInterviewDateTime] = useState("");
    const [scheduledInterviews, setScheduledInterviews] = useState([
        {
            id: 1,
            dateTime: "2023-10-25T10:00:00",
            title: "Initial Interview",
            interviewer: "John Doe",
            status: "pending",
        },
        {
            id: 2,
            dateTime: "2023-10-26T14:00:00",
            title: "Final Interview",
            interviewer: "Jane Smith",
            status: "success",
        },
    ]);
    const [notes, setNotes] = useState("");
    const [selectedInterviewId, setSelectedInterviewId] = useState(null);

    // Find the job and applicant
    const job = jobDetailsData.find((job) => job.id === Number(jobId));
    const applicant = job?.applicants.find(
        (app) => app.id === Number(applicantId)
    );

    if (!job || !applicant) {
        return <div className="text-gray-500">Applicant not found.</div>;
    }

    // Handle Hire Applicant
    const handleHireApplicant = () => {
        showWarningAlert(
            "Are you sure you want to hire this applicant?",
            () => {
                showSuccessAlert("The applicant has been successfully hired!");
            },
            "Yes, hire them!",
            "Cancel",
            "The applicant has been successfully hired!"
        );
    };

    // Handle Fail Applicant
    const handleFailApplicant = () => {
        showWarningAlert(
            "Are you sure you want to fail this applicant?",
            () => {
                showSuccessAlert(
                    "The applicant has been successfully marked as failed!"
                );
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
    const handleSubmitInterview = (data) => {
        if (!data.dateTime || !data.title || !data.interviewer) {
            alert("Please fill all fields.");
            return;
        }

        // Add the scheduled interview to the list
        const newInterview = {
            id: Date.now(),
            dateTime: data.dateTime,
            title: data.title,
            interviewer: data.interviewer,
            status: "pending",
            notes: "",
        };
        setScheduledInterviews([...scheduledInterviews, newInterview]);

        // Show success message
        showSuccessAlert("Interview scheduled successfully!");
        handleCloseModal();
    };

    // Handle Add Notes
    const handleAddNotes = (interviewId) => {
        setSelectedInterviewId(interviewId);
        const interview = scheduledInterviews.find((i) => i.id === interviewId);
        setNotes(interview.notes);
    };

    // Handle Save Notes
    const handleSaveNotes = () => {
        const updatedInterviews = scheduledInterviews.map((interview) =>
            interview.id === selectedInterviewId
                ? { ...interview, notes }
                : interview
        );
        setScheduledInterviews(updatedInterviews);
        setSelectedInterviewId(null);
        setNotes("");
    };

    // Handle Notes Change
    const handleNotesChange = (e) => {
        setNotes(e.target.value);
    };

    // Handle Edit Interview
    const handleEditInterview = (interviewId) => {
        console.log("Editing interview with ID:", interviewId);
        // You can open a modal or navigate to an edit page here
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
        <div className="p-6 bg-white shadow-md rounded-lg">
            {/* Two-column layout */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Section (70% width) */}
                <ApplicantInfo applicant={applicant} />

                {/* Right Section (30% width) */}
                <AIInsights
                    onScheduleInterview={handleScheduleInterview}
                    onHire={handleHireApplicant}
                    onFail={handleFailApplicant}
                />
            </div>

            {/* Recruiter's Notes Section */}
            <RecruiterNotes
                scheduledInterviews={scheduledInterviews}
                onAddNotes={handleAddNotes}
                onEditInterview={handleEditInterview} // Pass the edit handler
                selectedInterviewId={selectedInterviewId}
                notes={notes}
                onSaveNotes={handleSaveNotes}
                onNotesChange={handleNotesChange}
            />

            {/* Modal for Scheduling Interview */}
            <ScheduleInterviewModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitInterview}
                interviewDateTime={interviewDateTime}
                onDateTimeChange={(e) => setInterviewDateTime(e.target.value)}
                getCurrentDateTime={getCurrentDateTime}
            />
        </div>
    );
};

export default ApplicantDetails;
