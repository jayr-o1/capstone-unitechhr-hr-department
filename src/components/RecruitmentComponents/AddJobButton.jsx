import React from "react";

const AddJobButton = ({ onOpenModal }) => {
    return (
        <button
            onClick={onOpenModal}
            className="cursor-pointer w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200"
        >
            Add Job Post
        </button>
    );
};

export default AddJobButton;