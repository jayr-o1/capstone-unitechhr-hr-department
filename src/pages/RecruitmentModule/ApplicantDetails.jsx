import React from "react";
import { useParams } from "react-router-dom";
import jobDetailsData from "../../data/jobDetailsData"; // Import job details

const ApplicantDetails = () => {
  const { jobId, applicantId } = useParams();

  // Find the job and applicant
  const job = jobDetailsData.find((job) => job.id === Number(jobId));
  const applicant = job?.applicants.find(
    (app) => app.id === Number(applicantId)
  );

  if (!job || !applicant) {
    return <div className="text-gray-500">Applicant not found.</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Section (70% width) */}
        <div className="w-full md:w-7/12 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
          <div className="space-y-6">
            {/* Applicant Name */}
            <h1 className="text-3xl font-bold text-gray-900">
              {applicant.name}
            </h1>

            {/* Horizontal Divider */}
            <hr className="border-t border-gray-300" />

            {/* Applicant Details */}
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center">
                <span className="text-gray-600 w-32">Email:</span>
                <span className="text-gray-800 font-medium">
                  {applicant.email}
                </span>
              </div>

              {/* Applied On with View Resume Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-600 w-32">Applied On:</span>
                  <span className="text-gray-800 font-medium">
                    {applicant.dateApplied}
                  </span>
                </div>
                <a
                  href={applicant.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
                >
                  View Resume
                </a>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <span className="text-gray-600 w-32">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    applicant.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : applicant.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {applicant.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (30% width) */}
        <div className="w-full md:w-5/12 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
          <div className="space-y-6">
            {/* AI Insights Heading */}
            <h2 className="text-3xl font-bold text-gray-900">AI Insights</h2>

            {/* Horizontal Divider */}
            <hr className="border-t border-gray-300" />

            {/* AI Insights Details */}
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-gray-600 w-40">Match Percentage:</span>
                <span className="text-gray-800 font-medium">85%</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-40">Skills Match:</span>
                <span className="text-gray-800 font-medium">
                  React, Node.js, MongoDB (3/5)
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-40">Experience:</span>
                <span className="text-gray-800 font-medium">
                  Required: 5 years | Applicant: 3 years (-10%)
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-40">Education:</span>
                <span className="text-gray-800 font-medium">
                  Bachelor's in IT (Meets Requirement)
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-40">Certifications:</span>
                <span className="text-gray-800 font-medium">
                  AWS Certified Developer (+5%)
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-40">Resume Keywords:</span>
                <span className="text-gray-800 font-medium">Matched 7/10</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-40">Recommendation:</span>
                <span className="text-green-600 font-medium">Strong Hire ✅</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 space-y-4">
              <button className="w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200">
                Schedule Interview
              </button>
              <button className="w-full px-5 py-3 bg-[#4CAF50] text-white text-lg font-semibold rounded-lg hover:bg-[#45a049] transition duration-200">
                Hire Applicant
              </button>
              <button className="w-full px-5 py-3 bg-[#FF4500] text-white text-lg font-semibold rounded-lg hover:bg-[#FF6347] transition duration-200">
                Fail Applicant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter's Notes Section */}
      <div className="mt-6 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recruiter's Notes</h2>
        <textarea
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA]"
          placeholder="Add your notes here..."
        />
      </div>
    </div>
  );
};

export default ApplicantDetails;