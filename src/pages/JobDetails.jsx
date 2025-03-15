import React, { useState } from "react";
import { useParams } from "react-router-dom";
import jobDetailsData from "../data/jobDetailsData";
import EditJobModal from "../components/Modals/EditJobModal"; // Import your EditJobModal component

const JobDetails = () => {
  const { jobId } = useParams();
  const jobDetails = jobDetailsData.find((job) => job.id === parseInt(jobId));

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

  return (
    <div className="p-6 bg-white shadow-md rounded-lg flex flex-col md:flex-row gap-6">
      {/* Left Column - Job Details */}
      <div className="w-full md:w-2/3 relative">
        {/* Label for Job Details */}
        <h3 className="absolute left-3 -top-3 bg-white px-2 text-gray-400 text-sm font-semibold">
          Job Details
        </h3>
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
        {/* Label for Job Info */}
        <h3 className="absolute left-3 -top-3 bg-white px-2 text-gray-400 text-sm font-semibold">
          Job Info
        </h3>
        {/* Border and Content */}
        <div className="border border-gray-300 rounded-lg p-6">
          {/* Title and Description Format */}
          <div className="space-y-4">
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
                  jobDetails.status === "Closed" ? "text-red-600" : "text-green-600"
                }`}
              >
                {jobDetails.status}
              </p>
            </div>
          </div>

          {/* Updated Edit Job Post Button */}
          <button
            onClick={handleEditJob} // Open the modal when clicked
            className="cursor-pointer w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200 mt-6"
          >
            Edit Job Post
          </button>
        </div>
      </div>

      {/* Edit Job Modal */}
      {isEditModalOpen && (
        <EditJobModal
          job={jobDetails} // Pass the job details to the modal
          onClose={handleCloseEditModal} // Close the modal
        />
      )}
    </div>
  );
};

export default JobDetails;