import React from "react";
import { useParams } from "react-router-dom";
import jobDetailsData from "../../data/jobDetailsData"; // Import job details

const ApplicantDetails = () => {
    const { jobId, applicantId } = useParams();

    // Find the job and applicant
    const job = jobDetailsData.find((job) => job.id === Number(jobId));
    const applicant = job?.applicants.find((app) => app.id === Number(applicantId));

    if (!job || !applicant) {
        return <div className="text-gray-500">Applicant not found.</div>;
    }

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {applicant.name}
            </h1>

            {/* Two-column layout */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Section (70% width) */}
                <div className="w-full md:w-7/12 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
                    <div className="space-y-4">
                        <p className="text-gray-800">
                            <strong>Email:</strong> {applicant.email}
                        </p>
                        <p className="text-gray-800">
                            <strong>Application Date:</strong> {applicant.dateApplied}
                        </p>
                        <p className="text-gray-800">
                            <strong>Status:</strong>{" "}
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
                        </p>
                        <a
                            href={applicant.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9AADEA] hover:text-[#7b8edc] transition duration-200"
                        >
                            View Resume
                        </a>
                    </div>
                </div>

                {/* Right Section (30% width) */}
                <div className="w-full md:w-5/12 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        AI Insights
                    </h2>
                    <div className="space-y-4">
                        <p className="text-gray-800">
                            <strong>Skills Match:</strong> 85%
                        </p>
                        <p className="text-gray-800">
                            <strong>Experience:</strong> 3 years
                        </p>
                        <p className="text-gray-800">
                            <strong>Recommendation:</strong> Strong Hire
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="mt-6 space-y-4">
                        <button
                            className="w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200"
                        >
                            Schedule Interview
                        </button>
                        <button
                            className="w-full px-5 py-3 bg-[#4CAF50] text-white text-lg font-semibold rounded-lg hover:bg-[#45a049] transition duration-200"
                        >
                            Hire Applicant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicantDetails;