import React from "react";

const AIInsights = ({
    applicant,
    onScheduleInterview,
    onHireApplicant,
    onFailApplicant,
    isLoading,
    applicantStatus,
}) => {
    // Default to applicant.status if available, otherwise use provided applicantStatus prop
    const status = applicant?.status || applicantStatus || "Pending";

    return (
        <div className="w-full border border-gray-300 rounded-lg p-6 bg-white shadow-md h-full flex flex-col">
            <div className="space-y-4 flex-grow">
                {/* AI Insights Heading */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    AI Insights
                </h1>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300 mb-4" />

                <div className="space-y-3 flex-grow">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Match Percentage:</span>
                        <span className="text-gray-800 font-medium">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Skills Match:</span>
                        <span className="text-gray-800 font-medium">
                            React, Node.js, MongoDB (3/5)
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Experience:</span>
                        <span className="text-gray-800 font-medium">
                            Required: 5 years | Applicant: 3 years (-10%)
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Education:</span>
                        <span className="text-gray-800 font-medium">
                            Bachelor's in IT (Meets Requirement)
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Certifications:</span>
                        <span className="text-gray-800 font-medium">
                            AWS Certified Developer (+5%)
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Resume Keywords:</span>
                        <span className="text-gray-800 font-medium">
                            Matched 7/10
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Recommendation:</span>
                        <span className="text-green-600 font-medium">
                            Strong Hire ✅
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4">
                    <h2 className="text-lg font-semibold text-gray-800 my-3">
                        Actions
                    </h2>
                    {status !== "Hired" && status !== "Failed" && (
                        <div className="space-y-2">
                            <button
                                onClick={onScheduleInterview}
                                className="w-full px-5 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition duration-200 cursor-pointer"
                                disabled={isLoading}
                            >
                                Schedule Interview
                            </button>
                            <button
                                onClick={onHireApplicant}
                                className="w-full px-5 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition duration-200 cursor-pointer"
                                disabled={isLoading}
                            >
                                Hire Applicant
                            </button>
                            <button
                                onClick={onFailApplicant}
                                className="w-full px-5 py-3 bg-red-500 text-white text-lg font-semibold rounded-lg hover:bg-red-600 transition duration-200 cursor-pointer"
                                disabled={isLoading}
                            >
                                Fail Applicant
                            </button>
                        </div>
                    )}

                    {status === "Hired" && (
                        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">
                            <p className="font-medium mb-2">
                                ✅ Applicant has been hired
                            </p>
                            <p className="text-sm">
                                This applicant has been moved to the Employees
                                section for onboarding.
                            </p>
                        </div>
                    )}

                    {status === "Failed" && (
                        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
                            <p className="font-medium mb-2">
                                ❌ Applicant has been rejected
                            </p>
                            <p className="text-sm">
                                This applicant has been marked as failed and will
                                not proceed further.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
