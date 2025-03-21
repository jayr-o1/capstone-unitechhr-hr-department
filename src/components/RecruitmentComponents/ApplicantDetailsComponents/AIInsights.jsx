import React from "react";

const AIInsights = ({ onScheduleInterview, onHire, onFail }) => {
    return (
        <div className="w-full md:w-5/12 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
            <div className="h-full flex flex-col">
                <div className="space-y-6 flex-1">
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
                </div>

                {/* Buttons */}
                <div className="mt-6 space-y-4">
                    <button
                        onClick={onScheduleInterview}
                        className="w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200 cursor-pointer"
                    >
                        Schedule Interview
                    </button>
                    <button
                        onClick={onHire}
                        className="w-full px-5 py-3 bg-[#4CAF50] text-white text-lg font-semibold rounded-lg hover:bg-[#45a049] transition duration-200 cursor-pointer"
                    >
                        Hire Applicant
                    </button>
                    <button
                        onClick={onFail}
                        className="w-full px-5 py-3 bg-[#FF4500] text-white text-lg font-semibold rounded-lg hover:bg-[#FF6347] transition duration-200 cursor-pointer"
                    >
                        Fail Applicant
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;