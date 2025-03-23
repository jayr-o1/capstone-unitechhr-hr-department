import React, { useState, useEffect } from "react";
import ViewInterviewModal from "./ViewInterviewModal"; // Import the modal component

const RecruiterNotes = ({
    scheduledInterviews = [],
    addNotesHandler,
    saveNotesHandler,
    onAddNotes,
    onEditInterview,
}) => {
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [newNote, setNewNote] = useState("");
    const [newStatus, setNewStatus] = useState("");

    // Set first interview as selected by default if available
    useEffect(() => {
        if (scheduledInterviews && scheduledInterviews.length > 0) {
            setSelectedInterview(scheduledInterviews[0]);
        } else {
            setSelectedInterview(null);
        }
    }, [scheduledInterviews]);

    // Handle adding notes to an interview
    const handleAddNotesClick = (interview) => {
        setSelectedInterview(interview);

        // Pre-populate the note field if there are existing notes
        if (hasNotes(interview)) {
            if (Array.isArray(interview.notes) && interview.notes.length > 0) {
                // Get the most recent note if it's an array
                const latestNote = interview.notes[interview.notes.length - 1];
                setNewNote(latestNote.content || "");
            } else if (typeof interview.notes === "string") {
                // If notes is a string, use it directly
                setNewNote(interview.notes);
            }
        } else {
            // Clear the note field if there are no existing notes
            setNewNote("");
        }

        // Set the current status if available
        setNewStatus(interview.status || "");

        // Open the modal
        setIsAddNoteModalOpen(true);

        // Call the handler function if it exists
        if (typeof addNotesHandler === "function") {
            addNotesHandler(interview.id);
        }
    };

    // Handle saving notes and status
    const handleSaveNotesAndStatus = () => {
        if (!selectedInterview) return;

        if (typeof saveNotesHandler === "function") {
            saveNotesHandler(selectedInterview.id, newNote, newStatus);
        } else if (typeof onAddNotes === "function") {
            onAddNotes(selectedInterview.id, newNote, newStatus);
        }

        // Reset modal state
        setIsAddNoteModalOpen(false);
        setNewNote("");
        setNewStatus("");
    };

    // Format date and time for display
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return "N/A";
        try {
            // If it's a timestamp or date object
            const date =
                dateTimeString instanceof Date
                    ? dateTimeString
                    : new Date(dateTimeString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "Invalid date";
            }

            return date.toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            console.error("Date formatting error:", error, dateTimeString);
            return "Invalid date format";
        }
    };

    // Get status color based on status
    const getStatusColor = (status) => {
        if (!status) return "bg-gray-100 text-gray-800";

        const statusMap = {
            Scheduled: "bg-blue-100 text-blue-800", // Upcoming interview
            Completed: "bg-green-100 text-green-800", // Completed interview
            Canceled: "bg-red-100 text-red-800", // Canceled interview
            pending: "bg-yellow-100 text-yellow-800", // Legacy format
            success: "bg-green-100 text-green-800", // Legacy format
        };

        return statusMap[status] || "bg-gray-100 text-gray-800";
    };

    // Get human-readable status
    const getStatusText = (status) => {
        if (!status) return "Unknown";

        const statusMap = {
            Scheduled: "Scheduled",
            Completed: "Completed",
            Canceled: "Canceled",
            pending: "Scheduled", // Legacy mapping
            success: "Completed", // Legacy mapping
        };

        return statusMap[status] || status;
    };

    // Check if interview has notes
    const hasNotes = (interview) => {
        return (
            interview &&
            interview.notes &&
            ((Array.isArray(interview.notes) && interview.notes.length > 0) ||
                (typeof interview.notes === "string" &&
                    interview.notes.trim() !== ""))
        );
    };

    return (
        <div className="w-full border border-gray-300 rounded-lg p-6 bg-white shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Scheduled Interviews
            </h2>

            {/* No Scheduled Interviews Yet */}
            {(!scheduledInterviews || scheduledInterviews.length === 0) && (
                <div className="text-gray-600 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                    <p className="mb-4">No interviews scheduled yet.</p>
                    <p>
                        Schedule an interview to track the applicant's progress.
                    </p>
                </div>
            )}

            {/* Scheduled Interviews */}
            {scheduledInterviews && scheduledInterviews.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    {scheduledInterviews.map((interview) => (
                        <div
                            key={interview.id}
                            className="border border-gray-200 p-4 rounded-lg shadow-sm"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {interview.title}
                                    </h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 mt-1">
                                        <div className="flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                                                />
                                            </svg>
                                            <span>
                                                {formatDateTime(
                                                    interview.dateTime ||
                                                        interview.date
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                                />
                                            </svg>
                                            <span>{interview.interviewer}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                            interview.status
                                        )}`}
                                    >
                                        {getStatusText(interview.status)}
                                    </span>
                                    {interview && (
                                        <ViewInterviewModal
                                            interview={interview}
                                        />
                                    )}
                                    {onEditInterview && (
                                        <button
                                            onClick={() =>
                                                onEditInterview(interview)
                                            }
                                            className="px-3 py-1 text-sm text-blue-500 border border-blue-500 rounded hover:bg-blue-500 hover:text-white transition-all"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() =>
                                            handleAddNotesClick(interview)
                                        }
                                        className="px-3 py-1 text-sm bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition-all"
                                    >
                                        {hasNotes(interview)
                                            ? "View Notes"
                                            : "Add Notes"}
                                    </button>
                                </div>
                            </div>

                            {/* Interview Notes (if available) */}
                            {hasNotes(interview) && (
                                <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                                    <h4 className="font-medium text-gray-700 mb-2">
                                        Notes:
                                    </h4>
                                    <div className="space-y-2">
                                        {Array.isArray(interview.notes) ? (
                                            interview.notes.map(
                                                (note, index) => (
                                                    <div
                                                        key={index}
                                                        className="text-gray-600 whitespace-pre-line"
                                                    >
                                                        <p>{note.content}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {note.timestamp
                                                                ? formatDateTime(
                                                                      note.timestamp
                                                                  )
                                                                : ""}
                                                        </p>
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <p className="text-gray-600 whitespace-pre-line">
                                                {interview.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add/View Note Modal */}
            {isAddNoteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">
                            {hasNotes(selectedInterview)
                                ? "View/Edit Notes"
                                : "Add Note"}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">
                                Note:
                            </label>
                            <textarea
                                className="w-full border border-gray-300 rounded p-2"
                                rows="3"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">
                                Update Status:
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded p-2"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="">No change</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Canceled">Canceled</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded"
                                onClick={() => {
                                    setIsAddNoteModalOpen(false);
                                    setNewNote("");
                                    setNewStatus("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                                onClick={handleSaveNotesAndStatus}
                                disabled={!newNote.trim()}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterNotes;
