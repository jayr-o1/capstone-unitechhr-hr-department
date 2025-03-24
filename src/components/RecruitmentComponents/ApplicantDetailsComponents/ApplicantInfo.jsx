import React, { useEffect, useState } from "react";

const ApplicantInfo = ({ applicant }) => {
    const [isPDF, setIsPDF] = useState(false);

    // Debug log to check the resumeUrl and determine file type
    useEffect(() => {
        console.log("Resume URL:", applicant.resumeUrl);
        if (applicant.resumeUrl) {
            const url = applicant.resumeUrl.toLowerCase();
            setIsPDF(
                url.endsWith(".pdf") ||
                    url.includes("/pdf") ||
                    url.includes("application/pdf")
            );
        }
    }, [applicant.resumeUrl]);

    return (
        <div className="w-full border border-gray-300 rounded-lg p-6 bg-white shadow-md h-full flex flex-col">
            <div className="space-y-4 flex-grow">
                {/* Applicant Name */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {applicant.name}
                </h1>

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300 mb-4" />

                {/* Applicant Details */}
                <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-center">
                        <span className="text-gray-600 w-24">Email:</span>
                        <span className="text-gray-800 font-medium">
                            {applicant.email}
                        </span>
                    </div>

                    {/* Applied On with View Resume Button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-gray-600 w-24">
                                Applied On:
                            </span>
                            <span className="text-gray-800 font-medium">
                                {applicant.dateApplied?.toLocaleDateString?.() ||
                                    "N/A"}
                            </span>
                        </div>
                        <a
                            href={applicant.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white cursor-pointer text-sm"
                        >
                            View Resume
                        </a>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                        <span className="text-gray-600 w-24">Status:</span>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                applicant.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : applicant.status === "Approved" ||
                                      applicant.status === "Hired"
                                    ? "bg-green-100 text-green-800"
                                    : applicant.status === "Failed"
                                    ? "bg-red-100 text-red-800"
                                    : applicant.status === "Interviewing"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                        >
                            {applicant.status}
                        </span>
                    </div>

                    {/* Horizontal Divider */}
                    <hr className="border-t border-gray-300 my-3" />

                    {/* Iframe for Resume */}
                    <div className="flex-grow mt-2">
                        <h2 className="text-lg font-semibold mb-3">
                            Resume Preview
                        </h2>
                        {applicant.resumeUrl ? (
                            <div>
                                {isPDF ? (
                                    <object
                                        data={applicant.resumeUrl}
                                        type="application/pdf"
                                        className="w-full h-80 border border-gray-300 rounded-lg"
                                    >
                                        <p>
                                            It appears your browser doesn't
                                            support embedded PDFs. You can{" "}
                                            <a
                                                href={applicant.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                download the PDF
                                            </a>{" "}
                                            instead.
                                        </p>
                                    </object>
                                ) : (
                                    <iframe
                                        src={applicant.resumeUrl}
                                        className="w-full h-80 border border-gray-300 rounded-lg"
                                        title="Applicant Resume"
                                        sandbox="allow-same-origin allow-scripts allow-popups"
                                    />
                                )}
                                <div className="mt-2 text-center">
                                    <p className="text-sm text-gray-500">
                                        If the preview doesn't load correctly,
                                        <a
                                            href={applicant.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-1 text-blue-500 hover:underline"
                                        >
                                            download or view the resume directly
                                        </a>
                                        .
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4 border border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500">
                                    No resume URL available for preview
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicantInfo;
