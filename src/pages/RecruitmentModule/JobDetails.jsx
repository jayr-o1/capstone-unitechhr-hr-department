import React, { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditJobModal from "../../components/Modals/EditJobModal";
import { JobContext } from "../../contexts/JobContext"; // Import JobContext
import showWarningAlert from "../../components/Alerts/WarningAlert"; // Import WarningAlert
import showSuccessAlert from "../../components/Alerts/SuccessAlert"; // Import SuccessAlert
import showDeleteConfirmation from "../../components/Alerts/DeleteAlert"; // Import DeleteAlert
import showErrorAlert from "../../components/Alerts/ErrorAlert"; // Import ErrorAlert
import ApplicantsList from "../../components/RecruitmentComponents/ApplicantDetailsComponents/ApplicantsList"; // Import ApplicantsList
import { doc, updateDoc, deleteDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "../../firebase"; // Import Firebase database

const JobDetails = () => {
  const { jobId } = useParams();
  const { jobs, handleUpdateJob: updateJobInContext, removeJob, loading, error } = useContext(JobContext);
  const jobDetails = jobs.find((job) => job.id === jobId); // Find the job by ID
  const navigate = useNavigate();

  // State to manage modal visibility
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Function to open the edit modal
  const handleEditJob = () => {
    setIsEditModalOpen(true);
  };

  // Function to close the edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // Function to update a job in Firestore
  const handleUpdateJob = async (updatedJob) => {
    try {
      const jobRef = doc(db, "jobs", jobId);
      
      // Remove applicants before updating Firestore
      const { applicants, ...jobDataWithoutApplicants } = updatedJob;
      
      // Update the job in Firestore
      await updateDoc(jobRef, {
        ...jobDataWithoutApplicants,
        lastUpdated: new Date()
      });
      
      // Update the job in context (keep applicants in context)
      updateJobInContext(updatedJob);
      
      // Close the modal if it's open
      setIsEditModalOpen(false);
      
      return true; // Return success
    } catch (error) {
      showErrorAlert(`Failed to update job: ${error.message}`);
      return false; // Return failure
    }
  };

  // Handle close/open action
  const handleCloseOrOpen = async () => {
    const isOpening = jobDetails.status === "Closed"; // If job is closed, we are opening it
    const action = isOpening ? "open" : "close";
    const pastTenseAction = isOpening ? "opened" : "closed"; // Manually define past tense
    const newStatus = isOpening ? "Open" : "Closed";

    showWarningAlert(
      `Are you sure you want to ${action} this job?`,
      async () => {
        try {
          // Update the job status in Firestore - only update the status field
          const jobRef = doc(db, "jobs", jobId);
          await updateDoc(jobRef, { 
            status: newStatus,
            lastUpdated: new Date()
          });
          
          // Create updated job object for context (keep applicants in the context object)
          const updatedJob = {
            ...jobDetails,
            status: newStatus,
            lastUpdated: new Date()
          };
          
          // Update job in context
          updateJobInContext(updatedJob);
          
          // Show success message
          showSuccessAlert(`The job has been successfully ${pastTenseAction}!`);
        } catch (error) {
          showErrorAlert(`Failed to ${action} job: ${error.message}`);
        }
      },
      `Yes, ${action} it!`,
      "Cancel"
    );
  };

  // Handle delete action
  const handleDelete = () => {
    showDeleteConfirmation(
      jobDetails.title,
      async () => {
        try {
          // Delete the job from Firestore
          const jobRef = doc(db, "jobs", jobId);
          await deleteDoc(jobRef);
          
          // Remove the job from context
          removeJob(jobId);
          
          // Show success message
          showSuccessAlert("The job has been successfully deleted!");
          
          // Redirect to the recruitment page after deletion
          setTimeout(() => {
            navigate("/recruitment");
          }, 1500);
        } catch (error) {
          showErrorAlert(`Failed to delete job: ${error.message}`);
        }
      },
      "Job title does not match!", // Custom error message
      "" // Empty success message since we'll show it manually
    );
  };

  // Handle case where job is not found
  if (!jobDetails) {
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
        <h2 className="text-xl font-semibold text-gray-700">Job Not Found</h2>
        <p className="text-gray-500 mt-2">
          Sorry, the job you're looking for doesn't exist or has been removed.
        </p>
        <a
          href="/recruitment"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Job Listings
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Main Container */}
      <div className="p-6 bg-white shadow-md rounded-lg">
        {/* Job Details and Applicants in a Single Container */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Job Details */}
          <div className="w-full md:w-2/3">
            <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-md">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {jobDetails.title}
              </h1>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300 mb-6" />

              <p className="text-gray-800 mb-4">
                <strong>Job Title:</strong> {jobDetails.title}
              </p>
              <p className="text-gray-800 mb-6">
                <strong>Summary:</strong> {jobDetails.summary}
              </p>

              {/* About the Job Section */}
              <div className="rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  About the Job
                </h2>

                {/* Key Duties */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    Key Duties
                  </h3>
                  <ul className="list-disc ml-6 text-gray-700 space-y-2">
                    {Array.isArray(jobDetails.keyDuties) 
                      ? jobDetails.keyDuties.map((duty, index) => (
                          <li key={index}>{duty}</li>
                        ))
                      : typeof jobDetails.keyDuties === 'string'
                        ? jobDetails.keyDuties.split('\n').filter(item => item.trim()).map((duty, index) => (
                            <li key={index}>{duty}</li>
                          ))
                        : <li>{jobDetails.keyDuties || 'No key duties specified'}</li>
                    }
                  </ul>
                </div>

                {/* Essential Skills */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    Essential Skills
                  </h3>
                  <ul className="list-disc ml-6 text-gray-700 space-y-2">
                    {Array.isArray(jobDetails.essentialSkills)
                      ? jobDetails.essentialSkills.map((skill, index) => (
                          <li key={index}>{skill}</li>
                        ))
                      : typeof jobDetails.essentialSkills === 'string'
                        ? jobDetails.essentialSkills.split('\n').filter(item => item.trim()).map((skill, index) => (
                            <li key={index}>{skill}</li>
                          ))
                        : <li>{jobDetails.essentialSkills || 'No essential skills specified'}</li>
                    }
                  </ul>
                </div>

                {/* Qualifications */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    Qualifications
                  </h3>
                  <ul className="list-disc ml-6 text-gray-700 space-y-2">
                    {Array.isArray(jobDetails.qualifications)
                      ? jobDetails.qualifications.map((qual, index) => (
                          <li key={index}>{qual}</li>
                        ))
                      : typeof jobDetails.qualifications === 'string'
                        ? jobDetails.qualifications.split('\n').filter(item => item.trim()).map((qual, index) => (
                            <li key={index}>{qual}</li>
                          ))
                        : <li>{jobDetails.qualifications || 'No qualifications specified'}</li>
                    }
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Job Info */}
          <div className="w-full md:w-1/3 flex flex-col">
            <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-md flex flex-col h-full">
              {/* Title and Description Format */}
              <div className="space-y-4 flex-grow">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Job Info
                </h1>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300 mb-6" />
                <div>
                  <h4 className="text-black font-semibold">Date Posted</h4>
                  <p className="text-gray-600">
                    {jobDetails.datePosted || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-black font-semibold">Salary</h4>
                  <p className="text-green-600 font-semibold">
                    {jobDetails.salary}
                  </p>
                </div>
                <div>
                  <h4 className="text-black font-semibold">Work Set-up</h4>
                  <p className="text-gray-600">{jobDetails.workSetup}</p>
                </div>
                <div>
                  <h4 className="text-black font-semibold">Available Slots</h4>
                  <p className="text-gray-600">{jobDetails.availableSlots}</p>
                </div>
                <div>
                  <h4 className="text-black font-semibold">Status</h4>
                  <p
                    className={`font-semibold ${
                      jobDetails.status === "Closed"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {jobDetails.status}
                  </p>
                </div>
              </div>

              {/* Buttons Container */}
              <div className="mt-6">
                <button
                  onClick={handleEditJob}
                  className="cursor-pointer w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200"
                >
                  Edit Job Post
                </button>

                <button
                  onClick={handleCloseOrOpen}
                  className="cursor-pointer w-full px-5 py-3 bg-[#FFA500] text-white text-lg font-semibold rounded-lg hover:bg-[#FF8C00] transition duration-200 mt-4 flex items-center justify-center gap-2"
                >
                  {jobDetails.status === "Open"
                    ? "Close Job Post"
                    : "Open Job Post"}
                </button>

                <button
                  onClick={handleDelete}
                  className="cursor-pointer w-full px-5 py-3 bg-[#FF4500] text-white text-lg font-semibold rounded-lg hover:bg-[#FF6347] transition duration-200 mt-4 flex items-center justify-center gap-2"
                >
                  {" "}
                  Delete Job Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Section */}
        <div className="mt-6">
          <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Applicants
            </h2>
            {/* Horizontal Divider */}
            <hr className="border-t border-gray-300 mb-6" />
            {/* Pass jobId to ApplicantsList */}
            <ApplicantsList
              applicants={jobDetails.applicants}
              jobId={jobId}
              loading={loading}
              error={error}
            />{" "}
          </div>
        </div>
      </div>

      {/* Edit Job Modal */}
      {isEditModalOpen && (
        <EditJobModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          initialData={jobDetails}
          onUpdateJob={handleUpdateJob} // Pass the update function
        />
      )}
    </>
  );
};

export default JobDetails;
