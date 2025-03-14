import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MoreOptionsIcon from "../../assets/icons/RecruitmentIcons/MoreOptionsIcon";
import CloseJobIcon from "../../assets/icons/RecruitmentIcons/CloseJobIcon";
import DeleteJobIcon from "../../assets/icons/RecruitmentIcons/DeleteJobIcon";
import showWarningAlert from "../Alerts/WarningAlert";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showDeleteConfirmation from "../Alerts/DeleteAlert";

const JobCard = ({ job, onCloseJob, onOpenJob, onEditJob }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    // Handle close/open action
    const handleCloseOrOpen = () => {
        const isOpening = job.status === "Closed"; // If job is closed, we are opening it
        const action = isOpening ? "open" : "close";
        const pastTenseAction = isOpening ? "opened" : "closed"; // Manually define past tense

        showWarningAlert(
            `Are you sure you want to ${action} this job?`,
            () => {
                if (isOpening) {
                    onOpenJob(job.id); // Call onOpenJob if the job is closed
                } else {
                    onCloseJob(job.id); // Call onCloseJob if the job is open
                }
                setIsDropdownOpen(false);
                showSuccessAlert(
                    `The job has been successfully ${pastTenseAction}!`
                );
            },
            `Yes, ${action} it!`,
            "Cancel",
            `The job has been successfully ${pastTenseAction}!` // Success message passed to showWarningAlert
        );
    };

    // Handle delete action
    const handleDelete = () => {
        showDeleteConfirmation(
            job.title,
            () => {
                console.log("Deleting job:", job.title);
                setIsDropdownOpen(false);
                // Add delete logic here
            },
            "Job title does not match!", // Custom error message
            "The job has been successfully deleted!" // Success message
        );
    };

    // Handle view action
    const handleView = () => {
        navigate(`/recruitment/${job.id}`);
    };

    // Handle edit action
    const handleEdit = () => {
        onEditJob(job); // Call the onEditJob function with the job data
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
                    {/* Conditionally render the "New Applicants" tag */}
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
                    <p>{job.datePosted}</p>
                </div>
                <p className="text-gray-500 text-sm mt-3">{job.summary}</p>
            </div>
            <div className="flex items-center gap-3 relative" ref={dropdownRef}>
                <button
                    onClick={handleView}
                    className="cursor-pointer px-6 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
                >
                    View
                </button>
                <button
                    onClick={handleEdit} // Call handleEdit when clicked
                    className="cursor-pointer px-6 py-2 text-white bg-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#7b8edc]"
                >
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
                            onClick={handleCloseOrOpen}
                            className="cursor-pointer w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-200 text-left flex items-center gap-2"
                        >
                            <CloseJobIcon className="text-gray-700 hover:text-gray-900" />{" "}
                            {job.status === "Open" ? "Close" : "Open"}
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
