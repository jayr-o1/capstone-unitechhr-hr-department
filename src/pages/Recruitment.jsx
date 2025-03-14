import React, { useState } from "react";
import JobList from "../components/RecruitmentComponents/JobList";
import Filters from "../components/RecruitmentComponents/Filters";
import PaginationControls from "../components/RecruitmentComponents/PaginationControls";
import AddJobButton from "../components/RecruitmentComponents/AddJobButton";
import AddJobModal from "../components/Modals/AddJobModal";
import jobPosts from "../data/jobPostsData"; // Import the jobPosts array

const Recruitment = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [showNewApplicants, setShowNewApplicants] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const jobsPerPage = 6;

    // Filter jobs based on selected filters
    const filteredJobs = jobPosts
        .filter((job) => {
            const matchesDepartment =
                selectedDepartments.length === 0 ||
                selectedDepartments.includes(job.department);
            const matchesStatus =
                selectedStatus === "All" ||
                (selectedStatus === "Open" && job.status === "Open") ||
                (selectedStatus === "Closed" && job.status === "Closed");
            const matchesNewApplicants =
                !showNewApplicants || job.newApplicants;
            return matchesDepartment && matchesStatus && matchesNewApplicants;
        })
        .sort((a, b) => {
            // Sort jobs with new applicants first
            if (a.newApplicants && !b.newApplicants) return -1;
            if (!a.newApplicants && b.newApplicants) return 1;
            return 0; // Keep original order if both have or don't have new applicants
        });

    // Pagination logic
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

    // Function to open the modal
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    // Function to close the modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="flex-1 flex">
            {/* Left Side (Job Posts & Pagination) */}
            <div className="w-2/3 flex flex-col justify-between">
                <JobList jobs={currentJobs} />
                <PaginationControls
                    currentPage={currentPage}
                    totalJobs={filteredJobs.length}
                    jobsPerPage={jobsPerPage}
                    onNextPage={() => setCurrentPage((prev) => prev + 1)}
                    onPrevPage={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                />
            </div>

            {/* Right Side (Filters) */}
            <div className="w-1/3 pl-4">
                <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                    {/* Add Job Button */}
                    <div className="mb-6">
                        <AddJobButton onOpenModal={handleOpenModal} />
                    </div>

                    {/* Filters */}
                    <div>
                        <Filters
                            selectedDepartments={selectedDepartments}
                            setSelectedDepartments={setSelectedDepartments}
                            selectedStatus={selectedStatus}
                            setSelectedStatus={setSelectedStatus}
                            showNewApplicants={showNewApplicants}
                            setShowNewApplicants={setShowNewApplicants}
                        />
                    </div>
                </div>
            </div>

            {/* Add Job Modal */}
            <AddJobModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
    );
};

export default Recruitment;
