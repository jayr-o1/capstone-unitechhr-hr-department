import React, { useState } from "react";

const ScheduleInterviewModal = ({
    isOpen,
    onClose,
    onSubmit,
    interviewDateTime,
    onDateTimeChange,
    getCurrentDateTime,
}) => {
    const [title, setTitle] = useState(""); // State for interview title
    const [interviewer, setInterviewer] = useState(""); // State for interviewer

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        onSubmit({ dateTime: interviewDateTime, title, interviewer }); // Pass form data to parent
        setTitle(""); // Reset title
        setInterviewer(""); // Reset interviewer
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 min-h-screen"
            style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
                zIndex: 1000,
            }}
        >
            <div className="bg-white p-8 rounded-lg shadow-2xl w-[30rem] transform transition-all duration-300 ease-in-out">
                {/* Modal Header */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">
                    Schedule Interview
                </h2>

                {/* Modal Body */}
                <form onSubmit={handleSubmit}>
                    {/* Date and Time */}
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Select Date and Time:
                        </label>
                        <input
                            type="datetime-local"
                            value={interviewDateTime}
                            onChange={onDateTimeChange}
                            min={getCurrentDateTime()} // Prevent past dates/times
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA] focus:border-[#9AADEA] transition-all"
                            required
                        />
                    </div>

                    {/* Interview Title */}
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Interview Title:
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA] focus:border-[#9AADEA] transition-all"
                            placeholder="e.g., Initial Interview, Final Interview"
                            required
                        />
                    </div>

                    {/* Interviewer */}
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Interviewer:
                        </label>
                        <input
                            type="text"
                            value={interviewer}
                            onChange={(e) => setInterviewer(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA] focus:border-[#9AADEA] transition-all"
                            placeholder="e.g., John Doe"
                            required
                        />
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-all hover:bg-gray-100 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#9AADEA] text-white font-medium rounded-lg hover:bg-[#7b8edc] transition-all cursor-pointer"
                        >
                            Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleInterviewModal;
