import React, { useState, useRef, useEffect } from "react";
import MoreOptionsIcon from "../../assets/icons/RecruitmentIcons/MoreOptionsIcon";
import CloseJobIcon from "../../assets/icons/RecruitmentIcons/CloseJobIcon";
import DeleteJobIcon from "../../assets/icons/RecruitmentIcons/DeleteJobIcon";

const JobCard = ({ job }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); // Ref for the dropdown container

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    // Handle close action
    const handleClose = () => {
        console.log("Close job:", job.title); // Replace with actual close logic
        setIsDropdownOpen(false); // Close the dropdown
    };

    // Handle delete action
    const handleDelete = () => {
        console.log("Delete job:", job.title); // Replace with actual delete logic
        setIsDropdownOpen(false); // Close the dropdown
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-white rounded-lg p-5 shadow-md flex justify-between items-center gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{job.title}</h3>
                    {job.newApplicants && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            New Applicants
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <p className="text-green-500 font-semibold">{job.salary}</p>
                    <span>•</span>
                    <p>{job.department}</p>
                    <span>•</span>
                    <p>{job.daysAgo}</p>
                </div>
                <p className="text-gray-500 text-sm mt-3">{job.description}</p>
            </div>
            <div className="flex items-center gap-3 relative" ref={dropdownRef}>
                <button className="cursor-pointer px-6 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white">
                    View
                </button>
                <button className="cursor-pointer px-6 py-2 text-white bg-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#7b8edc]">
                    Edit
                </button>
                <button
                    onClick={toggleDropdown}
                    className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition duration-200"
                >
                    <MoreOptionsIcon />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                            onClick={handleClose}
                            className="cursor-pointer w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-200 text-left flex items-center gap-2"
                        >
                            <CloseJobIcon className="text-gray-700 hover:text-gray-900" />{" "}
                            Close
                        </button>
                        <button
                            onClick={handleDelete}
                            className="cursor-pointer w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition duration-200 text-left flex items-center gap-2"
                        >
                            <DeleteJobIcon className="text-red-500 hover:text-red-700" />{" "}
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobCard;
