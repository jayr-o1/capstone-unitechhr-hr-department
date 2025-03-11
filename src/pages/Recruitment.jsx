import React, { useState } from "react";
import JobPostList from "../components/RecruitmentComponents/JobPostList";
import Filters from "../components/RecruitmentComponents/Filters";

const Recruitment = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 5; // Adjust as needed

    const handleNextPage = () => {
        setCurrentPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="flex ">
            {/* Left Side (Paginated Job Posts) */}
            <div className="w-2/3 flex flex-col">
                <div className="flex-1">
                    <JobPostList
                        currentPage={currentPage}
                        jobsPerPage={jobsPerPage}
                    />
                </div>
            </div>

            {/* Right Side (Fixed Filters & Button) */}
            <div className="w-1/3 pl-4">
                <div className="bg-white rounded-lg shadow-md p-6 h-fit">
                    <Filters />
                </div>
            </div>
        </div>
    );
};

export default Recruitment;
