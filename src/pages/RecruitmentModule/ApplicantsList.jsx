import React from "react";

const ApplicantsList = ({ applicants }) => {
    if (!applicants || applicants.length === 0) {
        return <div className="text-gray-500">No applicants yet.</div>;
    }

    const handleView = (resumeUrl) => {
        window.open(resumeUrl, "_blank"); // Open the resume URL in a new tab
    };

    return (
        <div className="flex flex-col space-y-4 w-full">
            <div className="overflow-x-auto w-full">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Applicant Name</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Application Date</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applicants.map((applicant, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition duration-200">
                                <td className="py-3 px-4 text-sm text-gray-800">{applicant.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{applicant.email}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{applicant.dateApplied}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">
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
                                </td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => handleView(applicant.resumeUrl)}
                                        className="cursor-pointer px-6 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplicantsList;