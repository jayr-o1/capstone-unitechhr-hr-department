import React, { useState } from "react";
import MoreOptionsIcon from "../../../assets/icons/RecruitmentIcons/MoreOptionsIcon";
import {
    EditScheduleIcon,
    EditNoteIcon,
} from "../../../assets/icons/RecruitmentIcons/DropdownIcons";
import ViewInterviewModal from "./ViewInterviewModal"; // Import the new modal component
import AddNotesModal from "./AddNotesModal"; // Import the new modal component

const RecruiterNotes = ({
    scheduledInterviews,
    onAddNotes,
    onEditInterview,
    selectedInterviewId,
    notes,
    onSaveNotes,
    onNotesChange,
    onEditSchedule,
    onEditNote,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddNotesModalOpen, setIsAddNotesModalOpen] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [dropdownOpenId, setDropdownOpenId] = useState(null);
    const [newNote, setNewNote] = useState("");
    const [newStatus, setNewStatus] = useState("");

    const capitalizeFirstLetter = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const handleViewClick = (interview) => {
        setSelectedInterview(interview);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedInterview(null);
    };

    const toggleDropdown = (id) => {
        setDropdownOpenId(dropdownOpenId === id ? null : id);
    };

    const handleAddNotesClick = (interview) => {
        setSelectedInterview(interview);
        setIsAddNotesModalOpen(true);
    };

    const handleSaveNotesAndStatus = () => {
        onAddNotes(selectedInterview.id, newNote, newStatus);
        setIsAddNotesModalOpen(false);
        setNewNote("");
        setNewStatus("");
    };

    // Format date and time for display
    const formatDateTime = (dateTimeString) => {
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
        const statusMap = {
            Scheduled: "Scheduled",
            Completed: "Completed",
            Canceled: "Canceled",
            pending: "Scheduled", // Legacy mapping
            success: "Completed", // Legacy mapping
        };

        return statusMap[status] || status;
    };

    return (
        <div className="mt-8 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Interviews & Notes
            </h2>

            {/* No Scheduled Interviews Yet */}
            {scheduledInterviews.length === 0 && (
                <div className="text-gray-600 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                    <p className="mb-4">No interviews scheduled yet.</p>
                    <p>
                        Schedule an interview to track the applicant's progress.
                    </p>
                </div>
            )}

            {/* Scheduled Interviews */}
            {scheduledInterviews.length > 0 && (
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
                                                    interview.dateTime
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
                                    <ViewInterviewModal interview={interview} />
                                    <button
                                        onClick={() =>
                                            handleAddNotesClick(interview)
                                        }
                                        className="px-3 py-1 text-sm bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition-all"
                                    >
                                        Add Notes
                                    </button>
                                </div>
                            </div>

                            {/* Interview Notes (if available) */}
                            {interview.notes && (
                                <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                                    <h4 className="font-medium text-gray-700 mb-2">
                                        Notes:
                                    </h4>
                                    <p className="text-gray-600 whitespace-pre-line">
                                        {interview.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Adding Notes (using a custom component) */}
            {selectedInterviewId && (
                <AddNotesModal
                    isOpen={!!selectedInterviewId}
                    onClose={() => onAddNotes(null)}
                    notes={notes}
                    onNotesChange={onNotesChange}
                    onSave={onSaveNotes}
                />
            )}
        </div>
    );
};

export default RecruiterNotes;
