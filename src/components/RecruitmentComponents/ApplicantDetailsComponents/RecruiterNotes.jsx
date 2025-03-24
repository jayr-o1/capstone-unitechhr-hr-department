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
        <div>
            {/* No Scheduled Interviews Yet */}
            {(!scheduledInterviews || scheduledInterviews.length === 0) && (
                <div className="text-gray-600 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                    <p className="mb-4">No interviews scheduled yet.</p>
                    <p>
                        Schedule an interview to track the applicant's progress.
                    </p>
                </div>
            )}

            {/* Scheduled Interviews - Table Format */}
            {scheduledInterviews && scheduledInterviews.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Interview Title
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Interviewer
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {scheduledInterviews.map((interview) => (
                                <tr key={interview.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {interview.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDateTime(interview.dateTime || interview.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {interview.interviewer}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                                            {getStatusText(interview.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {interview && (
                                                <ViewInterviewModal interview={interview} />
                                            )}
                                            {onEditInterview && (
                                                <button
                                                    onClick={() => onEditInterview(interview)}
                                                    className="px-3 py-1 text-sm text-blue-500 border border-blue-500 rounded hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAddNotesClick(interview)}
                                                className="px-3 py-1 text-sm bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition-all"
                                            >
                                                {hasNotes(interview) ? "View Notes" : "Add Notes"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Interview Notes Modal */}
            {isAddNoteModalOpen && selectedInterview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-xl">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {hasNotes(selectedInterview)
                                    ? "Interview Notes"
                                    : "Add Interview Notes"}
                            </h3>
                            <div className="mb-4">
                                <label
                                    htmlFor="interviewNotes"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Notes
                                </label>
                                <textarea
                                    id="interviewNotes"
                                    rows={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter notes about this interview..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="mb-6">
                                <label
                                    htmlFor="interviewStatus"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Status
                                </label>
                                <select
                                    id="interviewStatus"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="">Select Status</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Canceled">Canceled</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsAddNoteModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNotesAndStatus}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    disabled={!newNote.trim()}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterNotes;
