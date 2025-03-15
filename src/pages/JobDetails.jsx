// pages/JobDetails.js
import React, { useState, useContext } from "react";
import { useParams } from "react-router-dom";
import EditJobModal from "../components/Modals/EditJobModal";
import { JobContext } from "../contexts/JobContext"; // Import JobContext

const JobDetails = () => {
  const { jobId } = useParams();
  const { jobs, handleUpdateJob } = useContext(JobContext); // Use JobContext
  const jobDetails = jobs.find((job) => job.id === parseInt(jobId)); // Find the job by ID

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

  // Handle case where job is not found
  if (!jobDetails) {
    return <div className="p-6 text-center text-gray-500">Job not found</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg flex flex-col md:flex-row gap-6">
      {/* Left Column - Job Details */}
      <div className="w-full md:w-2/3 relative">
        {/* Border and Content */}
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
                {jobDetails.keyDuties.map((duty, index) => (
                  <li key={index}>{duty}</li>
                ))}
              </ul>
            </div>

            {/* Essential Skills */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Essential Skills
              </h3>
              <ul className="list-disc ml-6 text-gray-700 space-y-2">
                {jobDetails.essentialSkills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            {/* Qualifications */}
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Qualifications
              </h3>
              <ul className="list-disc ml-6 text-gray-700 space-y-2">
                {jobDetails.qualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Job Info */}
      <div className="w-full md:w-1/3 relative">
        {/* Border and Content */}
        <div className="border border-gray-300 rounded-lg p-6">
          {/* Title and Description Format */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Job Info
            </h1>

            {/* Horizontal Divider */}
            <hr className="border-t border-gray-300 mb-6" />
            <div>
              <h4 className="text-black font-semibold">Date Posted</h4>
              <p className="text-gray-600">1 day ago</p>
            </div>
            <div>
              <h4 className="text-black font-semibold">Salary</h4>
              <p className="text-green-600 font-semibold">Up to 20k</p>
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

          {/* Updated Edit Job Post Button */}
          <button
            onClick={handleEditJob}
            className="cursor-pointer w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200 mt-6"
          >
            Edit Job Post
          </button>
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
    </div>
  );
};

export default JobDetails;
