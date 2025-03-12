import React from "react";

const PaginationControls = ({
    currentPage,
    totalJobs,
    jobsPerPage,
    onNextPage,
    onPrevPage,
}) => {
    const isNextDisabled = currentPage * jobsPerPage >= totalJobs;
    const isPrevDisabled = currentPage === 1;

    return (
        <div className="flex justify-between items-center mt-6">
            {/* Previous Button */}
            <button
                onClick={onPrevPage}
                disabled={isPrevDisabled}
                className={`flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200 ${
                    isPrevDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
                Previous
            </button>

            {/* Current Page Indicator */}
            <span className="text-sm text-gray-700">
                Page {currentPage} of {Math.ceil(totalJobs / jobsPerPage)}
            </span>

            {/* Next Button */}
            <button
                onClick={onNextPage}
                disabled={isNextDisabled}
                className={`flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200 ${
                    isNextDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
                Next
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        </div>
    );
};

export default PaginationControls;
