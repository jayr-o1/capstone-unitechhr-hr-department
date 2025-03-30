import React, { useState } from "react";

const ViewInterviewModal = ({ interview }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    // Function to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid date";

            return date.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (error) {
            return "Invalid date format";
        }
    };

    // Function to format time
    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid time";

            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            return "Invalid time format";
        }
    };

    // Get status display
    const getStatusDisplay = (status) => {
        if (!status)
            return { text: "Unknown", className: "bg-gray-100 text-gray-800" };

        const statusMap = {
            Scheduled: {
                text: "Scheduled",
                className: "bg-blue-100 text-blue-800",
            },
            Completed: {
                text: "Completed",
                className: "bg-green-100 text-green-800",
            },
            Canceled: {
                text: "Canceled",
                className: "bg-red-100 text-red-800",
            },
            pending: {
                text: "Scheduled",
                className: "bg-blue-100 text-blue-800",
            },
            success: {
                text: "Completed",
                className: "bg-green-100 text-green-800",
            },
        };

        return (
            statusMap[status] || {
                text: status,
                className: "bg-gray-100 text-gray-800",
            }
        );
    };

    const statusInfo = getStatusDisplay(interview?.status);

    return (
        <>
            <button
                onClick={openModal}
                className="px-4 py-2 text-sm text-[#9AADEA] border border-[#9AADEA] rounded-lg hover:bg-[#9AADEA] hover:text-white transition-all cursor-pointer"
            >
                View
            </button>

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center min-h-screen"
                    style={{ 
                        background: "rgba(0, 0, 0, 0.6)",
                        backdropFilter: "blur(8px)",
                        zIndex: 1000 
                    }}
                >
                    <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl transform transition-all duration-300 ease-in-out">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-left">
                                {interview.title}
                            </h2>
                            <hr className="border-t border-gray-300 mb-6" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Date
                                    </p>
                                    <p className="font-medium">
                                        {formatDate(
                                            interview.dateTime || interview.date
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Time
                                    </p>
                                    <p className="font-medium">
                                        {formatTime(
                                            interview.dateTime || interview.date
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Interviewer
                                    </p>
                                    <p className="font-medium">
                                        {interview.interviewer ||
                                            "Not specified"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Status
                                    </p>
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}
                                    >
                                        {statusInfo.text}
                                    </span>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="mb-6 text-left">
                                <p className="text-sm text-gray-500 mb-2">
                                    Notes
                                </p>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px] max-h-[200px] overflow-y-auto text-left">
                                    {interview.notes ? (
                                        <p className="whitespace-pre-wrap">
                                            {interview.notes}
                                        </p>
                                    ) : (
                                        <p className="text-gray-400 italic">
                                            No notes available for this
                                            interview.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-all hover:bg-gray-100 cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ViewInterviewModal;
