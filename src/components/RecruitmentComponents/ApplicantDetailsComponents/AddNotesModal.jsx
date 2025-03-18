import React from "react";
import showWarningAlert from "../../Alerts/WarningAlert"; // Import the WarningAlert component
import showSuccessAlert from "../../Alerts/SuccessAlert"; // Import the SuccessAlert component
import showErrorAlert from "../../Alerts/ErrorAlert"; // Import the ErrorAlert component

const AddNotesModal = ({
  selectedInterview,
  newNote,
  setNewNote,
  newStatus,
  setNewStatus,
  handleSaveNotesAndStatus,
  closeModal,
}) => {
  if (!selectedInterview) return null;

  // Function to handle the save action with a warning alert
  const handleSaveWithWarning = () => {
    if (!newNote.trim() || !newStatus.trim()) {
      showErrorAlert("Please fill in both notes and status before saving.");
      return;
    }
    showWarningAlert(
      "Are you sure you want to save these changes?", // Warning message
      () => {
        // Execute the save action if the user confirms
        handleSaveNotesAndStatus();
        // Optionally show a success message
        showSuccessAlert("Notes and status saved successfully!");
      },
      "Yes", // Confirm button text
      "Cancel" // Cancel button text
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
      }}
    >
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Add Notes for {selectedInterview.title}
        </h2>
        <hr className="border-t border-gray-300 mb-6" />

        {/* Notes Input with Floating Label */}
        <div className="relative mb-6">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA] peer"
            placeholder=" " // Add a space to ensure the placeholder is "shown"
          />
          <label
            className={`absolute left-3 transition-all duration-200 pointer-events-none bg-white px-1 z-10 
              ${
                newNote !== ""
                  ? "-top-2 text-sm text-[#9AADEA]"
                  : "top-4 text-gray-500"
              } 
              peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]`}
          >
            Notes
          </label>
        </div>

        {/* Status Input with Floating Label */}
        <div className="relative mb-6">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA] peer appearance-none bg-white"
          >
            <option value="" hidden></option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="rejected">Failed</option>
          </select>
          <label
            className={`absolute left-3 transition-all duration-200 pointer-events-none bg-white px-1 z-10 
              ${
                newStatus !== ""
                  ? "-top-2 text-sm text-[#9AADEA]"
                  : "top-4 text-gray-500"
              } 
              peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA]`}
          >
            Status
          </label>
        </div>

        {/* Save and Close Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={closeModal}
            className="cursor-pointer px-8 py-3 text-gray-700 border border-gray-300 rounded-lg transition duration-200 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveWithWarning} // Use the new handler with warning alert
            className="cursor-pointer px-8 py-3 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNotesModal;