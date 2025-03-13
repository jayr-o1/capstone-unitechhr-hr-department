import React, { useState } from "react";
import AddJobModal from "../Modals/AddJobModal"; // Import the modal component

const AddJobButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Add Job Button */}
            <button
                onClick={handleOpenModal}
                className="cursor-pointer w-full px-5 py-3 bg-[#9AADEA] text-white text-lg font-semibold rounded-lg hover:bg-[#7b8edc] transition duration-200"
            >
                Add Job Post
            </button>

            {/* Render the modal */}
            <AddJobModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </>
    );
};

export default AddJobButton;
