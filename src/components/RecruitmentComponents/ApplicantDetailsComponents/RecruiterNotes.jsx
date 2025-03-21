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

  return (
    <div className="mt-6 border border-gray-300 rounded-lg p-6 bg-white shadow-md w-full">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Interview Schedule
      </h2>
      <hr className="border-t border-gray-300 mb-6" />
      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-4 text-lg font-semibold">Schedule</th>
              <th className="py-4 text-lg font-semibold">Time</th>
              <th className="py-4 text-lg font-semibold">Title</th>
              <th className="py-4 text-lg font-semibold">Interviewer</th>
              <th className="py-4 text-lg font-semibold">Status</th>
              <th className="py-4 text-lg font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scheduledInterviews.map((interview) => (
              <tr key={interview.id} className="border-b border-gray-200">
                <td className="py-4 text-lg">
                  {new Date(interview.dateTime).toLocaleDateString()}
                </td>
                <td className="py-4 text-lg">
                  {new Date(interview.dateTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </td>
                <td className="py-4 text-lg">{interview.title}</td>
                <td className="py-4 text-lg">{interview.interviewer}</td>
                <td className="py-4 text-lg">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      interview.status.toLowerCase() === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : interview.status.toLowerCase() === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {capitalizeFirstLetter(interview.status)}
                  </span>
                </td>
                <td className="py-4 text-lg flex items-center space-x-4">
                  <button
                    onClick={() => handleAddNotesClick(interview)}
                    className="cursor-pointer px-6 py-3 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => handleViewClick(interview)}
                    className="cursor-pointer px-6 py-3 text-white border border-[#9AADEA] bg-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
                  >
                    View
                  </button>
                  <div className="relative inline-block">
                    <button
                      onClick={() => toggleDropdown(interview.id)}
                      className="cursor-pointer p-3 rounded-full hover:bg-gray-200 transition duration-200"
                    >
                      <MoreOptionsIcon className="h-6 w-6" />
                    </button>
                    {dropdownOpenId === interview.id && (
                      <div className="absolute bottom-0 right-12 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            onEditSchedule(interview.id);
                            setDropdownOpenId(null);
                          }}
                          className="cursor-pointer w-full px-6 py-4 text-lg text-gray-700 hover:bg-gray-100 transition duration-200 text-left flex items-center gap-3"
                        >
                          <EditScheduleIcon className="h-6 w-6" />
                          Edit Schedule
                        </button>
                        <button
                          onClick={() => {
                            onEditNote(interview.id);
                            setDropdownOpenId(null);
                          }}
                          className="cursor-pointer w-full px-6 py-4 text-lg text-gray-700 hover:bg-gray-100 transition duration-200 text-left flex items-center gap-3"
                        >
                          <EditNoteIcon className="h-6 w-6" />
                          Edit Note
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes Editor */}
      {selectedInterviewId && (
        <div className="mt-6">
          <textarea
            value={notes}
            onChange={onNotesChange}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA]"
            placeholder="Add notes for this interview..."
          />
          <button
            onClick={onSaveNotes}
            className="cursor-pointer px-8 py-3 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
          >
            Save Notes
          </button>
        </div>
      )}

      {/* View Interview Modal */}
      {isModalOpen && (
        <ViewInterviewModal
          selectedInterview={selectedInterview}
          closeModal={closeModal}
        />
      )}

      {/* Add Notes Modal */}
      {isAddNotesModalOpen && (
        <AddNotesModal
          selectedInterview={selectedInterview}
          newNote={newNote}
          setNewNote={setNewNote}
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          handleSaveNotesAndStatus={handleSaveNotesAndStatus}
          closeModal={() => setIsAddNotesModalOpen(false)}
        />
      )}
    </div>
  );
};

export default RecruiterNotes;