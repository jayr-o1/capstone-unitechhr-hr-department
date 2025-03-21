import React from "react";

const ApplicantInfo = ({ applicant }) => {
    return (
        <div className="w-full md:w-7/12 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
            <div className="space-y-6">
                {/* Applicant Name */}
                <h1 className="text-3xl font-bold text-gray-900">{applicant.name}</h1>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300" />

                {/* Applicant Details */}
                <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center">
                        <span className="text-gray-600 w-32">Email:</span>
                        <span className="text-gray-800 font-medium">{applicant.email}</span>
                    </div>

                    {/* Applied On with View Resume Button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-gray-600 w-32">Applied On:</span>
                            <span className="text-gray-800 font-medium">
                                {applicant.dateApplied?.toLocaleDateString?.() || "N/A"}
                            </span>
                        </div>
                        <a
                            href={applicant.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-6 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white cursor-pointer"
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

                    {/* Horizontal Divider */}
                    <hr className="border-t border-gray-300" />

                    {/* Iframe for Resume */}
                    {applicant.resumeUrl && (
                        <iframe
                            src={applicant.resumeUrl}
                            className="w-full h-96 border border-gray-300 rounded-lg"
                            title="Applicant Resume"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicantInfo;