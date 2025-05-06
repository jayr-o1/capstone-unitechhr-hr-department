import React, { useState } from "react";

const AddInterviewNotesModal = ({ isOpen, onClose, interview, onSave }) => {
    const [notes, setNotes] = useState(interview?.notes || "");
    const [status, setStatus] = useState(interview?.status || "Completed");

    if (!isOpen) return null;

    // Format date for display
    const formatDate = (dateTime) => {
        try {
            return new Date(dateTime).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(interview.id, notes, status);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
                zIndex: 1000,
            }}
        >
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Add Interview Feedback
                </h2>

                <div className="mb-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">
                        Interview Details:
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-medium">{interview.title}</p>
                        <p className="text-sm text-gray-500">
                            {formatDate(interview.dateTime)}
                        </p>
                        <p className="text-sm text-gray-500">
                            Interviewer: {interview.interviewer}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="interviewNotes"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Feedback Notes{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="interviewNotes"
                            rows="6"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your feedback about this interview..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-5">
                        <label
                            htmlFor="interviewStatus"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Interview Status
                        </label>
                        <select
                            id="interviewStatus"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="Completed">Completed</option>
                            <option value="Canceled">Canceled</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Save Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInterviewNotesModal;
