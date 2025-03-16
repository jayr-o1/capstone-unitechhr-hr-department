import React, { useState } from "react";
import { useParams } from "react-router-dom";
import jobDetailsData from "../../data/jobDetailsData"; // Import job details
import showWarningAlert from "../../components/Alerts/WarningAlert"; // Import WarningAlert
import showSuccessAlert from "../../components/Alerts/SuccessAlert"; // Import SuccessAlert
import ApplicantInfo from "../../components/RecruitmentComponents/ApplicantDetailsComponents/ApplicantInfo"; // Import ApplicantInfo component
import AIInsights from "../../components/RecruitmentComponents/ApplicantDetailsComponents/AIInsights"; // Import AIInsights component
import RecruiterNotes from "../../components/RecruitmentComponents/ApplicantDetailsComponents/RecruiterNotes"; // Import RecruiterNotes component
import ScheduleInterviewModal from "../../components/Modals/ScheduleInterviewModal"; // Import ScheduleInterviewModal component

const ApplicantDetails = () => {
  const { jobId, applicantId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [interviewDateTime, setInterviewDateTime] = useState(""); // State for selected date-time
  const [scheduledInterviews, setScheduledInterviews] = useState([]); // State for scheduled interviews
  const [notes, setNotes] = useState(""); // State for recruiter's notes
  const [selectedInterviewId, setSelectedInterviewId] = useState(null); // State for selected interview to add notes

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
        // Logic to hire the applicant
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
        // Logic to fail the applicant
        showSuccessAlert("The applicant has been successfully marked as failed!");
      },
      "Yes, fail them!",
      "Cancel",
      "The applicant has been successfully marked as failed!"
    );
  };

  // Handle Schedule Interview
  const handleScheduleInterview = () => {
    setIsModalOpen(true); // Open the modal
  };

  // Handle Modal Close
  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    setInterviewDateTime(""); // Reset the date-time
  };

  // Handle Form Submission
  const handleSubmitInterview = (e) => {
    e.preventDefault();
    if (!interviewDateTime) {
      alert("Please select a valid date and time.");
      return;
    }

    // Add the scheduled interview to the list
    const newInterview = {
      id: Date.now(), // Unique ID for the interview
      dateTime: interviewDateTime,
      notes: "", // Initially empty notes
    };
    setScheduledInterviews([...scheduledInterviews, newInterview]);

    // Show success message
    showSuccessAlert("Interview scheduled successfully!");
    handleCloseModal(); // Close the modal after submission
  };

  // Handle Add Notes
  const handleAddNotes = (interviewId) => {
    setSelectedInterviewId(interviewId); // Set the selected interview ID
    const interview = scheduledInterviews.find((i) => i.id === interviewId);
    setNotes(interview.notes); // Set the current notes for the interview
  };

  // Handle Save Notes
  const handleSaveNotes = () => {
    const updatedInterviews = scheduledInterviews.map((interview) =>
      interview.id === selectedInterviewId
        ? { ...interview, notes } // Update the notes for the selected interview
        : interview
    );
    setScheduledInterviews(updatedInterviews); // Update the state
    setSelectedInterviewId(null); // Close the notes editor
    setNotes(""); // Reset the notes input
  };

  // Handle Notes Change
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
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