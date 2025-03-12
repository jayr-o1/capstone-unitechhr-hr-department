import React from "react";
import MoreOptionsIcon from "../../assets/icons/RecruitmentIcons/MoreOptionsIcon";

const JobCard = ({ job }) => {
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
                <p className="text-gray-500 text-sm mt-1">{job.description}</p>
            </div>
            <div className="flex items-center gap-3">
                <button className="cursor-pointer px-6 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white">
                    View
                </button>
                <button className="cursor-pointer px-6 py-2 text-white bg-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#7b8edc]">
                    Edit
                </button>
                <button className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition duration-200">
                    <MoreOptionsIcon />
                </button>
            </div>
        </div>
    );
};

export default JobCard;
