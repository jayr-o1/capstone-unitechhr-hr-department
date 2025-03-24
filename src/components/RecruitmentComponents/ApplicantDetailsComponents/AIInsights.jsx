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
        <div className="w-full border border-gray-300 rounded-lg p-6 bg-white shadow-md">
            <div className="space-y-6">
                {/* AI Insights Heading */}
                <h1 className="text-3xl font-bold text-gray-900">
                    AI Insights
                </h1>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300 mb-6" />

                <div className="space-y-4">
                    <div className="grid grid-cols-[180px_1fr] items-center">
                        <span className="text-gray-600 font-medium">Match Percentage:</span>
                        <span className="text-gray-800 font-medium">85%</span>
                    </div>
                    <div className="grid grid-cols-[180px_1fr] items-center">
                        <span className="text-gray-600 font-medium">Skills Match:</span>
                        <span className="text-gray-800 font-medium">
                            React, Node.js, MongoDB (3/5)
                        </span>
                    </div>
                    <div className="grid grid-cols-[180px_1fr] items-center">
                        <span className="text-gray-600 font-medium">Experience:</span>
                        <span className="text-gray-800 font-medium">
                            Required: 5 years | Applicant: 3 years (-10%)
                        </span>
                    </div>
                    <div className="grid grid-cols-[180px_1fr] items-center">
                        <span className="text-gray-600 font-medium">Education:</span>
                        <span className="text-gray-800 font-medium">
                            Bachelor's in IT (Meets Requirement)
                        </span>
                    </div>
                    <div className="grid grid-cols-[180px_1fr] items-center">
                        <span className="text-gray-600 font-medium">Certifications:</span>
                        <span className="text-gray-800 font-medium">
                            AWS Certified Developer (+5%)
                        </span>
                    </div>
                    <div className="grid grid-cols-[180px_1fr] items-center">
                        <span className="text-gray-600 font-medium">Resume Keywords:</span>
                        <span className="text-gray-800 font-medium">
                            Matched 7/10
                        </span>
                    </div>
                    <div className="grid grid-cols-[180px_1fr] items-center">
                        <span className="text-gray-600 font-medium">Recommendation:</span>
                        <span className="text-green-600 font-medium">
                            Strong Hire ✅
                        </span>
                    </div>

                    {/* Horizontal Divider */}
                    <hr className="border-t border-gray-300" />

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Actions
                        </h2>
                        {status !== "Hired" && status !== "Failed" && (
                            <>
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
                            </>
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
        </div>
    );
};

export default AIInsights;
