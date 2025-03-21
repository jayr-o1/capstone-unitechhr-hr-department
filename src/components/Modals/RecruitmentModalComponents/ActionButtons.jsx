import React from "react";

const ActionButtons = ({ onReset, isEditing = false }) => {
    return (
        <div className="flex justify-center space-x-4 mt-6">
            <button
                type="submit" // This button will submit the form
                className="cursor-pointer px-6 py-3 bg-[#9AADEA] text-white font-semibold rounded-lg hover:bg-[#7b8edc] transition"
            >
                {isEditing ? "Update Job Post" : "Add Job Post"}
            </button>
            <button
                type="button" // This button will reset the form
                onClick={onReset}
                className="cursor-pointer px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
            >
                {isEditing ? "Cancel" : "Reset Fields"}
            </button>
        </div>
    );
};

export default ActionButtons;